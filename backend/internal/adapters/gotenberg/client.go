package gotenberg

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// GotenbergClient implements ports.PDFRenderer by pushing a generated CV directory
// to Gotenberg's /forms/chromium/convert/html endpoint as multipart/form-data.
// index.html is uploaded as the root document; all other files in the directory
// are uploaded with their relative paths so Chromium can resolve local assets.
type GotenbergClient struct {
	baseURL string
	timeout time.Duration
	client  *http.Client
}

// NewGotenbergClient creates a GotenbergClient.
// baseURL should be the root URL of the Gotenberg service (e.g. "http://gotenberg:3000").
// timeout is the maximum duration for a single RenderPDF call; defaults to 30s when zero.
func NewGotenbergClient(baseURL string, timeout time.Duration) *GotenbergClient {
	if timeout == 0 {
		timeout = 30 * time.Second
	}
	// Trim trailing slash so URL joining is predictable.
	baseURL = strings.TrimRight(baseURL, "/")
	return &GotenbergClient{
		baseURL: baseURL,
		timeout: timeout,
		client:  &http.Client{Timeout: timeout},
	}
}

// RenderPDF walks generatedDir, uploads index.html and all associated asset files
// to Gotenberg, and returns the resulting PDF bytes.
//
// index.html is always the first part so Gotenberg treats it as the root document.
// All other files (CSS, images, etc.) are uploaded with their relative paths
// so Chromium can resolve relative URL references in the HTML.
func (c *GotenbergClient) RenderPDF(ctx context.Context, generatedDir string) ([]byte, error) {
	endpoint := c.baseURL + "/forms/chromium/convert/html"

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)

	// Always add index.html first (Gotenberg treats the first part as the root document).
	if err := c.addFile(mw, generatedDir, "index.html"); err != nil {
		return nil, fmt.Errorf("gotenberg: add index.html: %w", err)
	}

	// Walk the directory and add remaining files (CSS, images, etc.).
	err := filepath.Walk(generatedDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		relPath, err := filepath.Rel(generatedDir, path)
		if err != nil {
			return err
		}
		// Skip index.html — already added above.
		if relPath == "index.html" {
			return nil
		}
		// Skip cvwonder-*.html (source files, not assets).
		if strings.HasSuffix(relPath, ".html") {
			return nil
		}
		return c.addFile(mw, generatedDir, relPath)
	})
	if err != nil {
		return nil, fmt.Errorf("gotenberg: walk generated dir: %w", err)
	}

	if err := mw.Close(); err != nil {
		return nil, fmt.Errorf("gotenberg: close multipart writer: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, &body)
	if err != nil {
		return nil, fmt.Errorf("gotenberg: build request: %w", err)
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gotenberg: request failed: %w", err)
	}
	defer resp.Body.Close() //nolint:errcheck

	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return nil, fmt.Errorf("gotenberg: unexpected status %d: %s", resp.StatusCode, strings.TrimSpace(string(errBody)))
	}

	pdf, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("gotenberg: read PDF response: %w", err)
	}

	return pdf, nil
}

// addFile reads a file from baseDir at relPath and adds it to the multipart writer.
// The filename in the part header matches relPath so Gotenberg places it at the
// correct relative location when Chromium loads the page.
func (c *GotenbergClient) addFile(mw *multipart.Writer, baseDir, relPath string) error {
	absPath := filepath.Join(baseDir, relPath)
	content, err := os.ReadFile(absPath) //nolint:gosec — path constructed from server-controlled dir
	if err != nil {
		return fmt.Errorf("read %s: %w", relPath, err)
	}

	fw, err := mw.CreateFormFile("files", relPath)
	if err != nil {
		return fmt.Errorf("create form file %s: %w", relPath, err)
	}
	if _, err := fw.Write(content); err != nil {
		return fmt.Errorf("write %s: %w", relPath, err)
	}
	return nil
}
