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
	@WEB_PORT=$$(call find_available_port,3000); \
	echo "Available port: WEB=$$WEB_PORT"; \
	export WEB_PORT=$$WEB_PORT

init: check-ports ## Initialize the project
	[ -f .env ] || cp .env.example .env
	$(DC) up --detach

build: ## Build all services
	$(DC) build

up: check-ports ## Start all services
	@echo "Starting services..."
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📍 Web server:    http://localhost:3000"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	$(DC) up

down: ## Stop all services
	$(DC) down --remove-orphans

destroy: ## Clean all services
	$(DC) down --remove-orphans --volumes

install-web: ## Install web dependencies
	$(DC) run --rm --no-deps web npm install

build-web: ## Build web application
	$(DC) run --rm --no-deps web npm run build

lint: ## Run linting and type checking
	$(DC) run --rm --no-deps web npm run lint
	$(DC) run --rm --no-deps web npm run typecheck

test-hardhat: ## Run Hardhat tests
	$(DC) run --rm --no-deps hardhat npm test

e2e: ## Run Playwright e2e tests
	npx playwright test
