# Project Context for spec_driven_development

## Codebase Structure

- Project overview: See `CLAUDE.md` for architecture and stack details
- Database schema: See `src/database/` for Drizzle ORM definitions
- Server actions: See `src/actions/` for business logic

## Conventions

### Documentation Location

- This project does not have a dedicated `docs/` folder yet
- The `[docs_folder]` placeholder in job files has NOT been replaced — must be customized before first run
- Candidate locations: `docs/` (to be created) or project root

### Testing

- E2E: Playwright (run via `make e2e`)
- Unit: Vitest (run via `npm run test`)
- Playwright browsers provided by Nix — never run `playwright install`

## Job-Specific Context

### spec_driven_development

#### Installation from Upstream

- Source: `Unsupervisedcom/deepwork` repo at `library/jobs/spec_driven_development`
- Upstream includes `hidden: true` on all steps — removed during install (not supported by local schema)
- See `readme.md` for full list of required customizations

#### Pending Customization

- `[docs_folder]` placeholder must be replaced in `job.yml` and all `steps/*.md` files before running any steps
- Specs output directory (`specs/[feature-name]/`) does not exist yet — will be created on first run

## Known Issues and Workarounds

- `hidden: true` in upstream job.yml causes `deepwork sync` to fail. Fix: remove all `hidden: true` lines from steps.
- `directory` is not a valid output type in DeepWork schema. Fix: use `file` instead of `directory`.
- Output objects only support `file` and `doc_spec` properties — `description` on outputs is not allowed.
- Input objects must be either `{name, description}` (user param) or `{file, from_step}` (file ref). `{file, description}` without `from_step` is invalid.
- Every `from_step` reference in inputs requires that step to be listed in `dependencies`. The upstream job had transitive dependencies (e.g., tasks depends on plan which depends on clarify) but DeepWork requires explicit listing.
- Prettier hook runs on markdown files and may reformat step instruction files on write. This is cosmetic and does not affect functionality.

## Last Updated

- Date: 2026-02-02
- From conversation about: Initial installation of spec_driven_development job from upstream library
