# DC normally is docker compose, but podman compose is used if available
DC:=docker compose $(DC_ARGS)

# If podman is available, use it
ifeq ($(which podman),)
	DC:=podman compose $(DC_ARGS)
endif

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
