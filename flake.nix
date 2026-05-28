{
  description = "EONMUN Astro development environment";

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
          bun
          sqld
          playwright-mcp
          playwright-driver
          deepwork.packages.${system}.default
        ];

        shellHook = ''
          export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
          export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
          export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=$(find $PLAYWRIGHT_BROWSERS_PATH -name chrome | head -n 1)
          echo "EONMUN Astro development shell"
          echo ""
          echo "Common paths:"
          echo "  Astro app: code/"
          echo "  Dev server: http://localhost:4321"
          echo ""
          echo "Commands:"
          echo "  cd code && bun install --frozen-lockfile"
          echo "  cd code && bun run dev"
          echo "  cd code && bun run build"
          echo ""
        '';
      };
    });
  };
}
