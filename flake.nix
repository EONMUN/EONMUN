{
  description = "KS Systems Web development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    deepwork.url = "github:Unsupervisedcom/deepwork";
  };

  outputs = { self, nixpkgs, deepwork, ... }: let
    systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
    forAllSystems = nixpkgs.lib.genAttrs systems;
  in {
    formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.nixfmt-rfc-style);

    devShells = forAllSystems (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      default = pkgs.mkShell {
        name = "ks-systems-web";

        packages = with pkgs; [
          nodejs_22
          pnpm
          sqld
          playwright-mcp
          playwright-driver
          deepwork.packages.${system}.default
        ];

        shellHook = ''
          export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
          export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
          export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=$(find $PLAYWRIGHT_BROWSERS_PATH -name chrome | head -n 1)
          echo "KS Systems Web development shell"
          echo ""
          echo "Service Ports (Defaults):"
          echo "  Next.js App: http://localhost:''${WEB_PORT:-6789}"
          echo "  libSQL DB:   http://localhost:''${DB_PORT:-8080}"
          echo "  Storybook:   http://localhost:6006"
          echo ""
          echo "Commands:"
          echo "  make up          - Start libSQL + Next.js dev server"
          echo "  pnpm dev         - Start Next.js only"
          echo "  pnpm storybook   - Start Storybook"
          echo ""
        '';
      };
    });
  };
}
