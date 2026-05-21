package domain

// GenerationResult holds the outcome of an HTML generation run.
type GenerationResult struct {
	// OutputDir is the directory containing generated files.
	OutputDir string
}

// ValidationError represents a single schema validation failure.
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}
