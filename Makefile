# DC normally is docker compose, but podman compose is used if available
DC:=docker compose $(DC_ARGS)

# If podman is available, use it
ifeq ($(which podman),)
	DC:=podman compose $(DC_ARGS)
endif

build: ## Build all services
	$(DC) build

up: ## Start all services
	$(DC) up

down: ## Stop all services
	$(DC) down --remove-orphans

seed: ## Seed the database
	$(DC) exec strapi npx strapi admin:create-user --firstname=John --lastname=Doe --email=username@test.com --password=1Password || true
	$(DC) exec strapi npm run seed:example

destroy: ## Clean all services
	$(DC) down --remove-orphans --volumes

dbshell: ## Open a shell to the database
	$(DC) exec db psql -U strapi
