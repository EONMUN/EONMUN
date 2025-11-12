# Deploy Cloudflare Worker Action

This is a reusable GitHub composite action that builds and deploys a Next.js application to Cloudflare Workers using OpenNext.

## Features

- Builds Next.js app with `opennextjs-cloudflare build`
- Deploys to Cloudflare Workers using `opennextjs-cloudflare deploy`
- Supports both production and preview environment deployments
- Configurable Node.js version
- Optional Wrangler environment specification for preview deployments

## Inputs

| Input                   | Description                                                   | Required | Default |
| ----------------------- | ------------------------------------------------------------- | -------- | ------- |
| `environment`           | Environment to deploy to (production or preview)              | Yes      | -       |
| `cloudflare-api-token`  | Cloudflare API token for deployment                           | Yes      | -       |
| `cloudflare-account-id` | Cloudflare account ID                                         | Yes      | -       |
| `node-version`          | Node.js version to use                                        | No       | `22`    |
| `wrangler-environment`  | Wrangler environment name (optional, for preview deployments) | No       | `''`    |

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

### Preview Deployment

```yaml
- name: Deploy preview to Cloudflare Workers
  uses: ./.github/actions/deploy-cloudflare-worker
  with:
    environment: preview
    cloudflare-api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare-account-id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    wrangler-environment: preview-pr-${{ github.event.pull_request.number }}
```

## Examples

This action is used in:

- `.github/workflows/deploy.yml` - Production deployments on push to main
- `.github/workflows/web.tests.yml` - Preview deployments after tests pass on PRs

## Requirements

- Repository must have `opennextjs-cloudflare` in dependencies
- Repository must have a valid `wrangler.jsonc` configuration
- Cloudflare API token and account ID must be configured as secrets
