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
	echo "Available ports: WEB=$$WEB_PORT STRAPI=$$STRAPI_PORT"; \
	export WEB_PORT=$$WEB_PORT STRAPI_PORT=$$STRAPI_PORT

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
	@if [ ! -f strapi/.env ]; then \
		echo "❌ strapi/.env file not found"; \
		echo "Copy strapi/.env.example to strapi/.env and configure production settings"; \
		exit 1; \
	fi
	$(DC) run --rm  strapi sh -c '\
		if [ -z "$$PROD_STRAPI_URL" ]; then \
			echo "❌ PROD_STRAPI_URL is not set"; \
			echo "   Set PROD_STRAPI_URL in strapi/.env"; \
			exit 1; \
		fi; \
		if [ -z "$$PROD_STRAPI_TRANSFER_TOKEN" ]; then \
			echo "❌ PROD_STRAPI_TRANSFER_TOKEN is not set"; \
			echo "   Create a transfer token in Strapi admin (Settings → Transfer Tokens)"; \
			echo "   Set PROD_STRAPI_TRANSFER_TOKEN in strapi/.env"; \
			exit 1; \
		fi; \
		export STRAPI_TRANSFER_URL=$$PROD_STRAPI_URL; \
		export STRAPI_TRANSFER_TOKEN=$$PROD_STRAPI_TRANSFER_TOKEN; \
		echo "🔄 Syncing data from $$PROD_STRAPI_URL to local..."; \
		npx strapi transfer --force --from $${STRAPI_TRANSFER_URL}/admin --from-token $$STRAPI_TRANSFER_TOKEN'

enable-public: ## Enable public permissions for local development
	$(DC) exec strapi node scripts/enable-public-permissions.js

create-token: ## Create API token for frontend (for production use)
	$(DC) exec strapi node scripts/create-api-token.js

sync: sync-remote enable-public ## Sync data from production and enable public access

destroy: ## Clean all services
	$(DC) down --remove-orphans --volumes

install-web: ## Install web dependencies
	$(DC) run --rm --no-deps web npm install

build-web: ## Build web application
	$(DC) run --rm --no-deps web npm run build

lint: ## Run linting and type checking
	$(DC) run --rm --no-deps web npm run lint
	$(DC) run --rm --no-deps web npm run typecheck

build-strapi: ## Build Strapi application
	$(DC) run --rm --no-deps strapi npm run build

test-hardhat: ## Run Hardhat tests
	$(DC) run --rm --no-deps hardhat npm test

e2e: ## Run Playwright e2e tests
	cd web && npx playwright test
