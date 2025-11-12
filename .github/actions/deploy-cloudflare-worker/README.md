# Deploy Cloudflare Worker Action

Reusable GitHub composite action that builds and deploys a Next.js application to Cloudflare Workers using OpenNext.

**IMPORTANT**: Changes to this action should be reflected in:
- `docs/conventions/cloudflare-workers-turso.md` (Custom Action section)
- `bin/README.md` (if affecting secrets workflow)

## Features

- Builds Next.js app with `opennextjs-cloudflare build`
- Deploys to Cloudflare Workers using `opennextjs-cloudflare deploy`
- Supports production, next, and preview environment deployments
- Configurable Node.js version
- Works from `web/` directory
- Uses npm caching for faster builds

## Inputs

| Input                   | Description                                                   | Required | Default |
| ----------------------- | ------------------------------------------------------------- | -------- | ------- |
| `environment`           | Environment to deploy to (`production` or `preview`)          | Yes      | -       |
| `cloudflare-api-token`  | Cloudflare API token for deployment                           | Yes      | -       |
| `cloudflare-account-id` | Cloudflare account ID                                         | Yes      | -       |
| `node-version`          | Node.js version to use                                        | No       | `22`    |
| `wrangler-environment`  | Wrangler environment name (e.g., `next`, `preview`)           | No       | `''`    |

## Usage

### Production Deployment

```yaml
- name: Deploy to Cloudflare Workers
  uses: ./.github/actions/deploy-cloudflare-worker
  with:
    environment: production
    cloudflare-api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare-account-id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Next Deployment

```yaml
- name: Deploy to Next
  uses: ./.github/actions/deploy-cloudflare-worker
  with:
    environment: production
    cloudflare-api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare-account-id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    wrangler-environment: next
```

### Preview Deployment

```yaml
- name: Deploy preview to Cloudflare Workers
  uses: ./.github/actions/deploy-cloudflare-worker
  with:
    environment: preview
    cloudflare-api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare-account-id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    wrangler-environment: preview
```

## Used By

This action is used in:

- `.github/workflows/deploy-web.yml` - Production and next deployments
- `.github/workflows/web.test.yml` - Preview deployments for PRs

## What It Does

1. **Setup Node.js**: Configures Node.js with npm caching (uses `web/package-lock.json`)
2. **Install Dependencies**: Runs `npm ci` in the `web/` directory
3. **Build**: Executes `opennextjs-cloudflare build` to create Cloudflare-compatible output in `.open-next/`
4. **Deploy**: Runs `opennextjs-cloudflare deploy` with appropriate environment flags

## Notes

- **Runtime secrets** (TURSO_AUTH_TOKEN, TURSO_DATABASE_URL) must be uploaded separately by the calling workflow
- Build output is stored in `web/.open-next/`
- Uses OpenNext.js Cloudflare adapter for Next.js compatibility
- All steps run from the `web/` directory

## Requirements

- Repository must have `opennextjs-cloudflare` in `web/package.json`
- Repository must have a valid `web/wrangler.jsonc` configuration
- Cloudflare API token and account ID must be configured as GitHub secrets
- Environment-specific secrets must be configured using `bin/gh-secrets`

## Related Documentation

- [Cloudflare Workers & Turso Documentation](../../../docs/conventions/cloudflare-workers-turso.md)
- [GitHub Secrets Management](../../../bin/README.md)
- [OpenNext.js Cloudflare Guide](https://opennext.js.org/cloudflare/overview)
- [Wrangler Configuration](../../../web/wrangler.jsonc)

