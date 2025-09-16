# DC normally is docker compose, but podman compose is used if available
DC:=docker-compose $(DC_ARGS)


init: ## Initialize the project
	[ -f strapi/.env ] || cp strapi/.env.example strapi/.env
	[ -f web/.env ] || cp web/.env.example web/.env
	$(DC) run  --rm strapi npx strapi admin:create-user --firstname=John --lastname=Doe --email=username@test.com --password=1Password || true
	$(DC) up --detach
	make enable-public
	make sync

build: ## Build all services
	$(DC) build

up: ## Start all services
	$(DC) up

down: ## Stop all services
	$(DC) down --remove-orphans

seed: ## Seed the database
	$(DC) exec strapi node scripts/seed.js

sync-export: ## Export production data
	$(DC) run --rm --no-deps strapi node scripts/sync-from-api.js

sync-import: ## Import production data to local
	$(DC) exec strapi node scripts/import-from-api.js

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

sync: sync-export sync-import enable-public ## Full production sync (export then import)

sync-fresh: sync-export sync-clean sync-import enable-public ## Fresh sync (clear DB, export, import)

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
