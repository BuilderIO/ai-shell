{dream2nix, ...}: {
  imports = [
    dream2nix.modules.dream2nix.nodejs-package-json-v3
    dream2nix.modules.dream2nix.nodejs-package-lock-v3
    dream2nix.modules.dream2nix.nodejs-granular-v3
  ];

  name = "ai-shell";
  version = "1.0.10";

  mkDerivation = {
    src = ./.;
  };

  deps = {nixpkgs, ...}: {
    inherit
      (nixpkgs)
      gnugrep
      stdenv
      ;

    npm = nixpkgs.nodejs_18.pkgs.npm;
  };

  nodejs-package-lock-v3 = {
    packageLockFile = ./package-lock.json;
  };

  #    nodejs-granular-v3 = {
  #      buildScript = ''
  #        npm run pkgroll
  #      '';
  #    };
}
