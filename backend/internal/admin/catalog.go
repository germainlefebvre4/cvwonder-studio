package admin

import (
	_ "embed"

	"github.com/goccy/go-yaml"
)

//go:embed catalog.yaml
var catalogYAML []byte

// CatalogEntry describes a curated theme available for installation.
type CatalogEntry struct {
	Slug string `yaml:"slug"`
	Name string `yaml:"name"`
	Repo string `yaml:"repo"`
}

type catalogFile struct {
	Themes []CatalogEntry `yaml:"themes"`
}

var catalogEntries []CatalogEntry

func init() {
	var f catalogFile
	if err := yaml.Unmarshal(catalogYAML, &f); err != nil {
		panic("admin: failed to parse catalog.yaml: " + err.Error())
	}
	catalogEntries = f.Themes
}

// GetCatalog returns all curated catalog entries.
func GetCatalog() []CatalogEntry {
	return catalogEntries
}

// GetCatalogEntry returns the catalog entry for slug, or nil if not found.
func GetCatalogEntry(slug string) *CatalogEntry {
	for i := range catalogEntries {
		if catalogEntries[i].Slug == slug {
			return &catalogEntries[i]
		}
	}
	return nil
}
