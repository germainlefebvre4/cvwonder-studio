package templates_test

import (
	"strings"
	"testing"

	"github.com/germainlefebvre4/cvwonder-studio/internal/templates"
)

func TestGetCatalog_NonEmpty(t *testing.T) {
	entries := templates.GetCatalog()
	if len(entries) == 0 {
		t.Fatal("expected at least one catalog entry")
	}
	for _, e := range entries {
		if e.Slug == "" {
			t.Errorf("entry has empty Slug: %+v", e)
		}
		if e.Name == "" {
			t.Errorf("entry %q has empty Name", e.Slug)
		}
		if e.File == "" {
			t.Errorf("entry %q has empty File", e.Slug)
		}
	}
}

func TestGetContent_KnownSlugReturnsYAML(t *testing.T) {
	content := templates.GetContent("minimal")
	if content == "" {
		t.Fatal("expected non-empty content for slug 'minimal'")
	}
	// Basic sanity: should look like YAML (at least one colon).
	if !strings.Contains(content, ":") {
		t.Errorf("content for 'minimal' does not look like YAML: %q", content[:min(len(content), 80)])
	}
}

func TestGetContent_UnknownSlugReturnsEmpty(t *testing.T) {
	content := templates.GetContent("this-slug-does-not-exist")
	if content != "" {
		t.Errorf("expected empty string for unknown slug, got %q", content)
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
