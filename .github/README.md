# GitHub Workflows

This repository contains GitHub Actions workflows for building and releasing Docker images to GitHub Container Registry (GHCR).

## Available Workflows

### 1. Build and Release (`build-and-release.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch  
- Release published

**Features:**
- Builds both `web` and `strapi` Docker images
- Pushes images to GHCR with proper tagging
- Multi-platform builds (linux/amd64, linux/arm64)
- Security scanning with Trivy
- Artifact attestation for supply chain security
- Build caching for faster builds

**Image Tags:**
- `latest` - Latest build from main branch
- `<branch-name>` - Branch-specific builds
- `<tag-name>` - Release tags
- `<branch>-<sha>` - Commit-specific builds

### 2. Simple Docker Build (`build-simple.yml`)

**Triggers:**
- Manual trigger via GitHub Actions UI

**Features:**
- Build individual services (web or strapi)
- Custom tag specification
- Multi-platform builds
- Build caching

**Usage:**
1. Go to Actions tab in GitHub
2. Select "Simple Docker Build"
3. Click "Run workflow"
4. Choose service and tag
5. Run the workflow

## Image Registry

Images are published to: `ghcr.io/<username>/<repository>/<service>:<tag>`

Examples:
- `ghcr.io/username/eonmun/web:latest`
- `ghcr.io/username/eonmun/strapi:latest`

## Usage in Production

### Using Docker Compose

```yaml
version: '3.8'
services:
  web:
    image: ghcr.io/username/eonmun/web:latest
    ports:
      - "3000:3000"
    
  strapi:
    image: ghcr.io/username/eonmun/strapi:latest
    ports:
      - "1337:1337"
```

### Using Docker CLI

```bash
# Pull and run web service
docker pull ghcr.io/username/eonmun/web:latest
docker run -p 3000:3000 ghcr.io/username/eonmun/web:latest

# Pull and run strapi service
docker pull ghcr.io/username/eonmun/strapi:latest
docker run -p 1337:1337 ghcr.io/username/eonmun/strapi:latest
```

## Security

- Images are scanned for vulnerabilities using Trivy
- Build provenance is generated and attached to images
- SARIF reports are uploaded to GitHub Security tab
- Multi-platform builds ensure compatibility

## Permissions

The workflows require the following permissions:
- `contents: read` - To read repository contents
- `packages: write` - To push images to GHCR

These permissions are automatically granted when using `GITHUB_TOKEN`.

## Troubleshooting

### Authentication Issues
- Ensure `GITHUB_TOKEN` has proper permissions
- Check that the repository allows GitHub Actions to access packages

### Build Failures
- Check Dockerfile syntax and build context
- Ensure all dependencies are properly specified
- Review build logs for specific error messages

### Image Pull Issues
- Verify image exists in GHCR
- Check image visibility settings (public/private)
- Ensure proper authentication for private images 