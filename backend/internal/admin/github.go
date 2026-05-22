package admin

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const githubAPIBase = "https://api.github.com"

// VersionInfo describes a single version (release or tag) of a GitHub repo.
type VersionInfo struct {
	Ref         string     `json:"ref"`
	Name        string     `json:"name"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
}

var githubHTTPClient = &http.Client{Timeout: 30 * time.Second}

func githubGet(url string) (*http.Response, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "cvwonder-studio")
	req.Header.Set("Accept", "application/vnd.github+json")
	return githubHTTPClient.Do(req)
}

// ListVersions returns the available versions (releases then tags fallback) for
// the given GitHub owner/repo.
func ListVersions(owner, repo string) ([]VersionInfo, error) {
	versions, err := listReleases(owner, repo)
	if err != nil {
		return nil, err
	}
	if len(versions) > 0 {
		return versions, nil
	}
	return listTags(owner, repo)
}

func listReleases(owner, repo string) ([]VersionInfo, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/releases", githubAPIBase, owner, repo)
	resp, err := githubGet(url)
	if err != nil {
		return nil, fmt.Errorf("github releases: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github releases: unexpected status %d", resp.StatusCode)
	}

	var releases []struct {
		TagName     string    `json:"tag_name"`
		Name        string    `json:"name"`
		PublishedAt time.Time `json:"published_at"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&releases); err != nil {
		return nil, fmt.Errorf("github releases decode: %w", err)
	}

	out := make([]VersionInfo, len(releases))
	for i, r := range releases {
		t := r.PublishedAt
		out[i] = VersionInfo{Ref: r.TagName, Name: r.Name, PublishedAt: &t}
	}
	return out, nil
}

func listTags(owner, repo string) ([]VersionInfo, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/tags", githubAPIBase, owner, repo)
	resp, err := githubGet(url)
	if err != nil {
		return nil, fmt.Errorf("github tags: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github tags: unexpected status %d", resp.StatusCode)
	}

	var tags []struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tags); err != nil {
		return nil, fmt.Errorf("github tags decode: %w", err)
	}

	out := make([]VersionInfo, len(tags))
	for i, t := range tags {
		out[i] = VersionInfo{Ref: t.Name, Name: t.Name}
	}
	return out, nil
}

// ErrPathTraversal is returned when a ZIP archive contains a path traversal entry.
var ErrPathTraversal = fmt.Errorf("zip contains path traversal entry")

// DownloadAndExtract downloads the GitHub zipball for owner/repo at ref,
// validates no path traversal, and extracts contents into destDir.
// The top-level directory inside the ZIP is stripped.
func DownloadAndExtract(owner, repo, ref, destDir string) error {
	url := fmt.Sprintf("%s/repos/%s/%s/zipball/%s", githubAPIBase, owner, repo, ref)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("User-Agent", "cvwonder-studio")
	req.Header.Set("Accept", "application/vnd.github+json")

	// Use a client that follows redirects (GitHub zipball redirects to CDN).
	resp, err := githubHTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("download zipball: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("github zipball: unexpected status %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read zipball: %w", err)
	}

	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return fmt.Errorf("open zip: %w", err)
	}

	// Determine the common top-level prefix to strip (e.g., "owner-repo-abc123/").
	topLevel := ""
	if len(zr.File) > 0 {
		parts := strings.SplitN(zr.File[0].Name, "/", 2)
		if len(parts) > 0 {
			topLevel = parts[0] + "/"
		}
	}

	// Validate all paths before extraction.
	absDestDir, err := filepath.Abs(destDir)
	if err != nil {
		return fmt.Errorf("resolve destDir: %w", err)
	}

	for _, f := range zr.File {
		name := strings.TrimPrefix(f.Name, topLevel)
		if name == "" || strings.HasSuffix(name, "/") {
			continue // skip directories and the top-level entry itself
		}
		target := filepath.Join(absDestDir, filepath.FromSlash(name))
		if !strings.HasPrefix(target, absDestDir+string(os.PathSeparator)) {
			return ErrPathTraversal
		}
	}

	// Extract files.
	if err := os.MkdirAll(absDestDir, 0o755); err != nil {
		return fmt.Errorf("create destDir: %w", err)
	}

	for _, f := range zr.File {
		name := strings.TrimPrefix(f.Name, topLevel)
		if name == "" {
			continue
		}
		target := filepath.Join(absDestDir, filepath.FromSlash(name))

		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(target, 0o755); err != nil {
				return fmt.Errorf("mkdir %s: %w", target, err)
			}
			continue
		}

		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return fmt.Errorf("mkdir parent %s: %w", target, err)
		}

		rc, err := f.Open()
		if err != nil {
			return fmt.Errorf("open zip entry %s: %w", f.Name, err)
		}
		out, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, f.Mode())
		if err != nil {
			rc.Close()
			return fmt.Errorf("create file %s: %w", target, err)
		}
		_, copyErr := io.Copy(out, rc)
		rc.Close()
		out.Close()
		if copyErr != nil {
			return fmt.Errorf("write file %s: %w", target, copyErr)
		}
	}
	return nil
}
