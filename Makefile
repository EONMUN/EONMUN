# DC normally is docker compose, but podman compose is used if available
DC:=docker-compose $(DC_ARGS)


init: ## Initialize the project
	[ -f strapi/.env ] || cp strapi/.env.example strapi/.env
	[ -f web/.env ] || cp web/.env.example web/.env
	$(DC) run  --rm strapi npx strapi admin:create-user --firstname=John --lastname=Doe --email=username@test.com --password=1Password || true
	make up

build: ## Build all services
	$(DC) build

up: ## Start all services
	$(DC) up

down: ## Stop all services
	$(DC) down --remove-orphans

seed: ## Seed the database
	$(DC) exec strapi node scripts/seed.js

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
