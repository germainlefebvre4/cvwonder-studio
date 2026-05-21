package repository

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// RunMigrations applies all pending SQL migrations from the given source path.
// sourceURL example: "file://db/migrations"
// databaseURL example: "postgres://user:pass@host:5432/dbname?sslmode=disable"
func RunMigrations(_ context.Context, databaseURL, sourceURL string) error {
	m, err := migrate.New(sourceURL, databaseURL)
	if err != nil {
		return fmt.Errorf("migrate.New: %w", err)
	}
	defer func() {
		srcErr, dbErr := m.Close()
		if srcErr != nil {
			slog.Error("migrate source close error", "error", srcErr)
		}
		if dbErr != nil {
			slog.Error("migrate db close error", "error", dbErr)
		}
	}()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrate.Up: %w", err)
	}

	slog.Info("database migrations applied")
	return nil
}
