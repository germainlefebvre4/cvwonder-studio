package cvwonder

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
)

// BinaryAdapter implements ports.Generator by exec-ing the cvwonder binary.
// YAML is always written to a temp file — never passed as a CLI argument —
// to prevent command injection.
type BinaryAdapter struct {
	// binaryPath is the absolute path to the cvwonder executable.
	binaryPath string
}

// NewBinaryAdapter creates a BinaryAdapter.
// binaryPath defaults to /usr/local/bin/cvwonder when empty.
// The path is resolved to absolute at creation time so it remains valid
// even when the subprocess changes its working directory.
func NewBinaryAdapter(binaryPath string) *BinaryAdapter {
	if binaryPath == "" {
		binaryPath = "/usr/local/bin/cvwonder"
	}
	// Resolve relative paths to absolute so cmd.Dir changes don't break the lookup.
	if abs, err := filepath.Abs(binaryPath); err == nil {
		binaryPath = abs
	}
	return &BinaryAdapter{binaryPath: binaryPath}
}

// GenerateHTML writes YAML to a temp file, invokes the cvwonder binary to
// produce an HTML CV in outputDir, and cleans up the temp file.
//
// The cvwonder binary resolves themes as "themes/<slug>" relative to its
// working directory. This method sets cmd.Dir to the parent of the themes
// directory (filepath.Dir(filepath.Dir(themePath))) and passes only the slug
// as --theme, so the binary can find the theme correctly.
func (a *BinaryAdapter) GenerateHTML(ctx context.Context, yamlContent, themePath, outputDir string) (*domain.GenerationResult, error) {
	tmpFile, err := writeTempYAML(yamlContent)
	if err != nil {
		return nil, err
	}
	defer os.Remove(tmpFile)

	// Resolve paths to absolute so they are unaffected by cmd.Dir.
	absOutputDir, err := filepath.Abs(outputDir)
	if err != nil {
		return nil, fmt.Errorf("resolve output dir: %w", err)
	}
	absThemePath, err := filepath.Abs(themePath)
	if err != nil {
		return nil, fmt.Errorf("resolve theme path: %w", err)
	}

	if err := os.MkdirAll(absOutputDir, 0o750); err != nil {
		return nil, fmt.Errorf("create output dir: %w", err)
	}

	// Remove stale cvwonder-*.html files so only the freshly generated one remains.
	stale, _ := filepath.Glob(filepath.Join(absOutputDir, "cvwonder-*.html"))
	for _, f := range stale {
		os.Remove(f) //nolint:errcheck
	}

	// Derive the theme slug and the directory that contains the "themes/" folder.
	// e.g. themePath=/app/themes/basic → slug=basic, themesBaseDir=/app
	themeSlug := filepath.Base(absThemePath)
	themesBaseDir := filepath.Dir(filepath.Dir(absThemePath))

	// #nosec G204 — binary path comes from trusted config; YAML is in a temp file.
	cmd := exec.CommandContext(ctx, a.binaryPath,
		"generate",
		"--input", tmpFile,
		"--theme", themeSlug,
		"--format", "html",
		"--output", absOutputDir,
	)
	cmd.Dir = themesBaseDir

	out, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("cvwonder generate failed: %w\noutput: %s", err, out)
	}

	// cvwonder generates cvwonder-{hash}.html; copy the result to index.html so
	// the preview handler can serve it at a stable URL.
	generated, _ := filepath.Glob(filepath.Join(absOutputDir, "cvwonder-*.html"))
	if len(generated) == 0 {
		return nil, fmt.Errorf("cvwonder produced no HTML file in %s", absOutputDir)
	}
	if err := copyFile(generated[0], filepath.Join(absOutputDir, "index.html")); err != nil {
		return nil, fmt.Errorf("write index.html: %w", err)
	}

	return &domain.GenerationResult{OutputDir: absOutputDir}, nil
}

// Validate writes YAML to a temp file, invokes the cvwonder binary in
// validation mode, and parses the human-readable text output into ValidationError structs.
//
// cvwonder ≥ 0.10.0 emits a structured plain-text report (not JSON). Exit 0
// means valid; exit 1 means validation errors are present in the output.
func (a *BinaryAdapter) Validate(ctx context.Context, yamlContent string) ([]domain.ValidationError, error) {
	tmpFile, err := writeTempYAML(yamlContent)
	if err != nil {
		return nil, err
	}
	defer os.Remove(tmpFile)

	// #nosec G204 — binary path comes from trusted config; YAML is in a temp file.
	cmd := exec.CommandContext(ctx, a.binaryPath,
		"validate",
		"--input", tmpFile,
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			// Non-zero exit means validation errors; parse the text output.
			return parseValidateTextOutput(string(out)), nil
		}
		return nil, fmt.Errorf("cvwonder validate failed: %w\noutput: %s", err, out)
	}
	// Exit 0 → valid; no errors.
	return nil, nil
}

// parseValidateTextOutput parses the human-readable output of `cvwonder validate`
// and returns the extracted errors.
//
// Error blocks look like:
//
//	Error 1:
//	  Field: (root)
//	  Issue: person is required
//	  Suggestion: ...
func parseValidateTextOutput(output string) []domain.ValidationError {
	var errs []domain.ValidationError
	var currentField, currentMessage string
	inErrorBlock := false

	for _, line := range strings.Split(output, "\n") {
		trimmed := strings.TrimSpace(line)

		// Detect start of a numbered error block ("Error N:").
		if isValidationErrorBlockStart(trimmed) {
			if inErrorBlock && currentMessage != "" {
				errs = append(errs, domain.ValidationError{Field: currentField, Message: currentMessage})
				currentField = ""
				currentMessage = ""
			}
			inErrorBlock = true
			continue
		}

		if !inErrorBlock {
			continue
		}

		// Leaving error section when hitting warnings or the summary line.
		if strings.HasPrefix(trimmed, "Warning ") || strings.HasPrefix(trimmed, "Validation") {
			if currentMessage != "" {
				errs = append(errs, domain.ValidationError{Field: currentField, Message: currentMessage})
				currentField = ""
				currentMessage = ""
			}
			inErrorBlock = false
			continue
		}

		if key, val, ok := strings.Cut(trimmed, ": "); ok {
			switch key {
			case "Field":
				currentField = val
			case "Issue":
				currentMessage = val
			}
		}
	}
	// Flush the last collected error.
	if inErrorBlock && currentMessage != "" {
		errs = append(errs, domain.ValidationError{Field: currentField, Message: currentMessage})
	}
	return errs
}

// isValidationErrorBlockStart returns true when line matches the "Error N:" pattern
// used as a validation error block header in cvwonder's validate text output.
func isValidationErrorBlockStart(line string) bool {
	if !strings.HasPrefix(line, "Error ") || !strings.HasSuffix(line, ":") {
		return false
	}
	inner := line[len("Error ") : len(line)-1]
	if len(inner) == 0 {
		return false
	}
	for _, c := range inner {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

// copyFile copies src to dst, overwriting dst if it exists.
func copyFile(src, dst string) error {
	in, err := os.Open(src) //#nosec G304 — src is a path within the controlled output dir
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst) //#nosec G304 — dst is index.html inside the controlled output dir
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

// writeTempYAML writes yamlContent to a secure temporary file and returns its path.
func writeTempYAML(yamlContent string) (string, error) {
	tmp, err := os.CreateTemp("", "cvwonder-*.yaml")
	if err != nil {
		return "", fmt.Errorf("create temp file: %w", err)
	}
	defer tmp.Close()

	if _, err := tmp.WriteString(yamlContent); err != nil {
		os.Remove(tmp.Name())
		return "", fmt.Errorf("write temp file: %w", err)
	}

	return filepath.Clean(tmp.Name()), nil
}
