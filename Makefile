# DC normally is docker compose, but podman compose is used if available
DC:=docker-compose $(DC_ARGS)

# Port checking and auto-increment functions
check_port = $(shell lsof -ti:$(1) > /dev/null 2>&1 && echo "1" || echo "0")
find_available_port = $(shell port=$(1); while [ "$$(lsof -ti:$$port > /dev/null 2>&1 && echo 1 || echo 0)" = "1" ]; do port=$$((port + 1)); done; echo $$port)

.DEFAULT_GOAL := help

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

check-ports: ## Check and set available ports
	@echo "Checking port availability..."
	@WEB_PORT=$$(call find_available_port,3002); \
	STRAPI_PORT=$$(call find_available_port,1337); \
	DB_PORT=$$(call find_available_port,5432); \
	echo "Available ports: WEB=$$WEB_PORT STRAPI=$$STRAPI_PORT DB=$$DB_PORT"; \
	export WEB_PORT=$$WEB_PORT STRAPI_PORT=$$STRAPI_PORT DB_PORT=$$DB_PORT

init: check-ports ## Initialize the project
	[ -f strapi/.env ] || cp strapi/.env.example strapi/.env
	[ -f web/.env ] || cp web/.env.example web/.env
	$(DC) run  --rm strapi npx strapi admin:create-user --firstname=John --lastname=Doe --email=username@test.com --password=1Password || true
	$(DC) up --detach
	make enable-public
	make sync

build: ## Build all services
	$(DC) build

up: check-ports ## Start all services
	@echo "Starting services..."
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📍 Web server:    http://localhost:3002"
	@echo "📍 Strapi admin:  http://localhost:1337/admin"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	$(DC) up

down: ## Stop all services
	$(DC) down --remove-orphans

seed: ## Seed the database
	$(DC) exec strapi node scripts/seed.js

sync-remote: ## Sync data from remote Strapi using transfer command
	@if [ -z "$$PROD_STRAPI_URL" ]; then \
		echo "❌ PROD_STRAPI_URL environment variable is required"; \
		echo "Add it to strapi/.env"; \
		exit 1; \
	fi; \
	if [ -z "$$STRAPI_TRANSFER_TOKEN" ]; then \
		echo "❌ STRAPI_TRANSFER_TOKEN environment variable is required"; \
		echo "Create a transfer token in Strapi admin (Settings → Transfer Tokens)"; \
		echo "Add it to strapi/.env"; \
		exit 1; \
	fi; \
	echo "🔄 Syncing data from $$PROD_STRAPI_URL to local..."; \
	$(DC) exec strapi npx strapi transfer \
		--from $$PROD_STRAPI_URL \
		--to http://localhost:1337 \
		--from-token $$STRAPI_TRANSFER_TOKEN \
		--to-token $$STRAPI_TRANSFER_TOKEN \
		--force

enable-public: ## Enable public permissions for local development
	$(DC) exec strapi node scripts/enable-public-permissions.js

create-token: ## Create API token for frontend (for production use)
	$(DC) exec strapi node scripts/create-api-token.js

sync-clean: ## Clear local database before sync
	$(DC) down
	$(DC) up -d db
	sleep 5
	$(DC) exec db psql -U postgres -c "DROP DATABASE IF EXISTS strapi;"
	$(DC) exec db psql -U postgres -c "CREATE DATABASE strapi;"
	$(DC) exec db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE strapi TO strapi;"
	$(DC) up -d

sync: sync-remote enable-public ## Sync data from production and enable public access

sync-fresh: sync-clean sync-remote enable-public ## Fresh sync (clear DB, sync from remote, enable public access)

destroy: ## Clean all services
	$(DC) down --remove-orphans --volumes

dbshell: ## Open a shell to the database
	$(DC) exec db psql -U strapi

install-web: ## Install web dependencies
	$(DC) run --rm --no-deps web npm install

build-web: ## Build web application
	$(DC) run --rm --no-deps web npm run build

build-strapi: ## Build Strapi application
	$(DC) run --rm --no-deps strapi npm run build

test-hardhat: ## Run Hardhat tests
	$(DC) run --rm --no-deps hardhat npm test

e2e: ## Run Playwright e2e tests
	cd web && npx playwright test
