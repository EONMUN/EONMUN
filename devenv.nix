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
    pkgs.iproute2
    pkgs.curl
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
    after = [ "devenv:processes:db" ];
    showOutput = true;
    exec = ''
      set -euo pipefail

      db_port=$(code/scripts/dev-port 8080 "${config.devenv.root}")
      export DATABASE_URL="http://127.0.0.1:$db_port"
      unset TURSO_DATABASE_URL TURSO_AUTH_TOKEN

      mkdir -p "${config.devenv.root}/.devenv/state"
	  for attempt in $(seq 1 100); do
	    if curl -sS -o /dev/null --connect-timeout 1 "$DATABASE_URL" 2>/dev/null; then break; fi
	    sleep 0.1
	  done

      echo "Setting up local development database at $DATABASE_URL"
      cd code
      if [ ! -d node_modules ]; then bun install --frozen-lockfile; fi
      bun run db:migrate
      bun run db:seed

      if [ ! -e .dev.vars ] || grep -q '^# EONMUN devenv local database$' .dev.vars; then
        cat > .dev.vars <<EOF
# EONMUN devenv local database
TURSO_DATABASE_URL="$DATABASE_URL"
AUTH_SECRET="local-dev-only-secret-replace-before-deploy"
EOF
      fi
    '';
  };

  enterShell = ''
    export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=$(find -L "$PLAYWRIGHT_BROWSERS_PATH" -path '*/chromium-*/chrome-linux64/chrome' | head -n 1)
    echo "EONMUN Astro devenv shell"
    echo ""
    echo "Common paths:"
    echo "  Astro app: code/"
    echo "  Dev server: see code/.env.local after devenv up"
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
    exec = ''
      port=$(scripts/dev-port "''${WEB_PORT:-4321}" "${config.devenv.root}/code")
      exec bun run dev -- --port "$port"
    '';
    ready = {
      exec = ''
        url=$(sed -n 's/^DEV_URL=//p' "${config.devenv.root}/code/.env.local" | tail -1)
        curl -fsS -o /dev/null --connect-timeout 1 "$url/artworks"
      '';
      period = 1;
    };
  };

  processes.db = {
    exec = ''
      port=$(code/scripts/dev-port 8080 "${config.devenv.root}")
      exec sqld --db-path "${config.devenv.root}/.devenv/state/eonmun-dev.sqld" --http-listen-addr "127.0.0.1:$port" --no-welcome
    '';
    ready = {
      exec = ''
        port=$(sed -n 's/^DEV_PORT=//p' "${config.devenv.root}/.env.local" | tail -1)
        curl -sS -o /dev/null --connect-timeout 1 "http://127.0.0.1:$port"
      '';
      period = 1;
    };
  };
}
