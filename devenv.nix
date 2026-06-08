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

  tasks."db:migrate".exec = ''
    if [ ! -d node_modules ]; then
      echo "Installing root legacy dependencies for Drizzle migration tooling..."
      bun install
    fi

    exec bun run db:migrate
  '';

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
    echo "  cd code && bun run build"
    echo "  devenv tasks run db:migrate"
    echo ""
  '';

  processes.web = {
    cwd = "code";
    exec = ''exec bun run dev -- --host 0.0.0.0 --port "''${WEB_PORT:-4321}"'';
  };
}
