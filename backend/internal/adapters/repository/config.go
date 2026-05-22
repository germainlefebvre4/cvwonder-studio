package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	db "github.com/germainlefebvre4/cvwonder-studio/db/generated"
)

// ConfigRepository implements ports.ConfigRepository using sqlc + pgx.
type ConfigRepository struct {
	q *db.Queries
}

func NewConfigRepository(pool *pgxpool.Pool) *ConfigRepository {
	return &ConfigRepository{q: db.New(pool)}
}

func (r *ConfigRepository) Get(ctx context.Context, key string) (string, error) {
	row, err := r.q.GetConfigByKey(ctx, key)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil
		}
		return "", fmt.Errorf("GetConfigByKey: %w", err)
	}
	return row.Value, nil
}

func (r *ConfigRepository) Upsert(ctx context.Context, key, value string) error {
	_, err := r.q.UpsertConfig(ctx, db.UpsertConfigParams{Key: key, Value: value})
	if err != nil {
		return fmt.Errorf("UpsertConfig: %w", err)
	}
	return nil
}

// SeedDefaults inserts system_config defaults if not already present.
func (r *ConfigRepository) SeedDefaults(ctx context.Context) error {
	defaults := map[string]string{
		"max_sessions_per_user":                   "10",
		"anon_session_ttl_hours":                  "24",
		"anon_expiry_warn_1_hours":                "2",
		"anon_expiry_warn_2_hours":                "0.5",
		"session_creation_rate_limit_per_hour":    "3",
		"max_yaml_size_kb":                        "100",
		"anon_generation_rate_limit_seconds":      "5",
		"connected_generation_rate_limit_seconds": "2",
		"pdf_export_enabled":                      "false",
	}
	for key, value := range defaults {
		if err := r.q.InsertConfigIfAbsent(ctx, db.InsertConfigIfAbsentParams{Key: key, Value: value}); err != nil {
			return fmt.Errorf("SeedDefaults key=%s: %w", key, err)
		}
	}
	return nil
}
