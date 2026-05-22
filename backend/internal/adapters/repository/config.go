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
