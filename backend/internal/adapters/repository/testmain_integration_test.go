//go:build integration

package repository_test

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go/modules/postgres"

	"github.com/germainlefebvre4/cvwonder-studio/internal/adapters/repository"
)

// testPool is the shared pgxpool for all integration tests in this package.
var testPool *pgxpool.Pool

func TestMain(m *testing.M) {
	ctx := context.Background()

	// Start a postgres:16-alpine container.
	pgContainer, err := postgres.Run(ctx,
		"postgres:16-alpine",
		postgres.WithDatabase("cvwonder_test"),
		postgres.WithUsername("cvwonder"),
		postgres.WithPassword("cvwonder"),
		postgres.BasicWaitStrategies(),
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "testcontainers: failed to start postgres: %v\n", err)
		os.Exit(1)
	}
	defer func() {
		if err := pgContainer.Terminate(ctx); err != nil {
			fmt.Fprintf(os.Stderr, "testcontainers: failed to terminate postgres: %v\n", err)
		}
	}()

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		fmt.Fprintf(os.Stderr, "testcontainers: failed to get connection string: %v\n", err)
		os.Exit(1)
	}

	// Run migrations using the file source relative to this package.
	_, file, _, _ := runtime.Caller(0)
	migrationsDir := filepath.Join(filepath.Dir(file), "..", "..", "..", "db", "migrations")
	sourceURL := "file://" + filepath.ToSlash(migrationsDir)

	if err := repository.RunMigrations(ctx, connStr, sourceURL); err != nil {
		fmt.Fprintf(os.Stderr, "RunMigrations: %v\n", err)
		os.Exit(1)
	}

	// Build connection pool for tests.
	pool, err := pgxpool.New(ctx, connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "pgxpool.New: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()
	testPool = pool

	os.Exit(m.Run())
}
