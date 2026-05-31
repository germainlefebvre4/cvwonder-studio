#
.PHONY: help run dev dev-themes build-frontend build-backend build sqlc-gen migrate lint test test-int test-frontend test-ci
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

# Load environment variables from .env file if it exists
ifneq (,$(wildcard .env))
include .env
export $(shell grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | sed 's/=.*//')
endif


%:
    @:

# ── Development ──────────────────────────────────────────────────────────────
dev: ## Start full dev stack (docker-compose)
	docker-compose up --build

dev-backend: ## Start Go backend with air hot-reload
	cd backend && go run ./cmd/api

dev-frontend: ## Start Vite dev server
	cd frontend && npm run dev

dev-themes: ## Install built-in themes into themes/ (run when themes/ is missing)
	bin/cvwonder themes install https://github.com/germainlefebvre4/cvwonder-theme-basic
	bin/cvwonder themes install https://github.com/germainlefebvre4/cvwonder-theme-default

# ── Build ─────────────────────────────────────────────────────────────────────
build-frontend: ## Build Vite SPA into frontend/dist/
	cd frontend && pnpm install && pnpm build

build-backend: ## Build Go binary (without embedded frontend)
	cd backend && go build -o ../bin/cvwonder-studio ./cmd/api

build: build-frontend ## Full production build (frontend embedded in Go binary)
	mkdir -p backend/cmd/api/dist
	cp -r frontend/dist/. backend/cmd/api/dist/
	cd backend && go build -o ../bin/cvwonder-studio ./cmd/api

# ── Database ──────────────────────────────────────────────────────────────────
sqlc-gen: ## Run sqlc generate
	cd backend && sqlc generate

migrate: ## Run database migrations
	cd backend && go run ./cmd/api -migrate-only

# ── Lint ──────────────────────────────────────────────────────────────────────
lint: ## Lint backend and frontend
	cd backend && go vet ./...
	cd frontend && pnpm lint

# ── Tests ─────────────────────────────────────────────────────────────────────
test: ## Run backend unit tests
	cd backend && go test ./...

test-int: ## Run backend integration tests (requires Docker)
	cd backend && go test -tags=integration ./...

test-frontend: ## Run frontend Vitest tests
	cd frontend && pnpm vitest run

test-ci: test test-frontend ## Run all non-integration tests (CI)

# ── Docs ──────────────────────────────────────────────────────────────────────
doc-install:
	cd docs/github-pages/; \
	pnpm install;

doc-build:
	cd docs/github-pages/; \
	pnpm build;

doc-serve:
	cd docs/github-pages/; \
	pnpm start;

docker-build:
	docker build -f docker-compose.yml -t germainlefebvre4/cvwonder-studio:dev .
