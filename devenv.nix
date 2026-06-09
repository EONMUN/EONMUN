{ pkgs, inputs, config, ... }:
let
  system = pkgs.stdenv.hostPlatform.system;
in
{
  packages = [
    pkgs.nodejs_22
    pkgs.bun
    pkgs.sqld
    pkgs.playwright-mcp
    pkgs.playwright-driver
    inputs.deepwork.packages.${system}.default
  ];

  env = {
    EONMUN_ROOT = config.devenv.root;
    PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
    SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
    NIX_SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
  };

  tasks."db:setup" = {
    description = "Prepare the local development database with migrations and seeded fixture data.";
    before = [ "devenv:processes:web" ];
    showOutput = true;
    exec = ''
      set -euo pipefail

      export DATABASE_URL="file:${config.devenv.root}/.devenv/state/eonmun-dev.db"
      unset TURSO_DATABASE_URL TURSO_AUTH_TOKEN

      mkdir -p "${config.devenv.root}/.devenv/state"

      if [ ! -d node_modules ]; then
        had_bun_lock=0
        [ -f bun.lock ] && had_bun_lock=1
        echo "Installing root legacy dependencies for local Drizzle setup..."
        bun install --no-save
        if [ "$had_bun_lock" -eq 0 ]; then
          rm -f bun.lock
        fi
      fi

      echo "Setting up local development database at $DATABASE_URL"
      bun run db:migrate
      bun run db:seed
    '';
  };

  enterShell = ''
    export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=$(find "$PLAYWRIGHT_BROWSERS_PATH" -name chrome | head -n 1)
    echo "EONMUN Astro devenv shell"
    echo ""
    echo "Common paths:"
    echo "  Astro app: code/"
    echo "  Dev server: http://localhost:4321"
    echo ""
    echo "Commands:"
    echo "  cd code && bun install --frozen-lockfile"
    echo "  cd code && bun run dev"
    echo "  devenv up              # runs db:setup, then starts Astro"
    echo "  devenv processes down"
    echo "  devenv tasks run db:setup"
    echo "  cd code && bun run build"
    echo ""
  '';

  processes.web = {
    cwd = "code";
    exec = ''exec bun run dev -- --port "''${WEB_PORT:-4321}"'';
  };
}
