package templates

import (
	"embed"

	"github.com/goccy/go-yaml"
)

//go:embed catalog.yaml
var catalogYAML []byte

//go:embed templates/*
var templateFiles embed.FS

// TemplateEntry describes a starter template available at session creation.
type TemplateEntry struct {
	Slug        string `yaml:"slug"`
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
	File        string `yaml:"file"`
}

type catalogFile struct {
	Templates []TemplateEntry `yaml:"templates"`
}

var catalogEntries []TemplateEntry

func init() {
	var f catalogFile
	if err := yaml.Unmarshal(catalogYAML, &f); err != nil {
		panic("templates: failed to parse catalog.yaml: " + err.Error())
	}
	catalogEntries = f.Templates
}

// GetCatalog returns all available template entries.
func GetCatalog() []TemplateEntry {
	return catalogEntries
}

// GetContent returns the YAML content for the given template slug.
// Returns an empty string if the slug is not found.
func GetContent(slug string) string {
	for _, e := range catalogEntries {
		if e.Slug == slug {
			data, err := templateFiles.ReadFile(e.File)
			if err != nil {
				return ""
			}
			return string(data)
		}
	}
	return ""
}
