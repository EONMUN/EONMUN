{ pkgs ? import (fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/979daf34c8cacebcd917d540070b52a3c2b9b16e.tar.gz";
  }) {} }:
  pkgs.mkShell {
    nativeBuildInputs = with pkgs; [
      playwright-driver.browsers
    ];

    shellHook = ''
      export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
      export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
    '';
}