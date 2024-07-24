{

  description = "@builder.io/ai-shell";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    snow-blower.url = "github:use-the-fork/snow-blower";
    dream2nix.url = "github:nix-community/dream2nix";
  };

  outputs = inputs @ {
    flake-parts,
    dream2nix,
    nixpkgs,
    ...
  }:
    flake-parts.lib.mkFlake {inherit inputs;} {
      imports = [
        inputs.snow-blower.flakeModule
      ];
      systems = nixpkgs.lib.systems.flakeExposed;

      perSystem = {
        config,
        self',
        inputs',
        pkgs,
        system,
        lib,
        ...
      }: {

      packages = {
        # To build the package with nix use ` nix build .#ai-shell`
        # this will place the resulting package in the /results folder.
        #
        # This also allows us to use ai-shell as an input src and install on other systems
        ai-shell = dream2nix.lib.evalModules {
          packageSets.nixpkgs = dream2nix.inputs.nixpkgs.legacyPackages.${system};
          modules = [
            ./default.nix
            {
              paths.projectRoot = ./.;
              paths.projectRootFile = "flake.nix";
              paths.package = ./.;
            }
          ];
        };
        default = self'.packages.ai-shell;
      };
        snow-blower = {
          languages = {
            #set up JS and node 18 as required by nvmrc
            javascript.enable = true;
            javascript.npm = {
              enable = true;
              package = pkgs.nodejs_18;
            };
          };

         integrations = {
            # tree formater
            treefmt = {
              programs = {
                #formater for nix
                alejandra.enable = true;
                #as suggested by docs
                prettier.enable = true;
              };
            };

            # pre-commit hooks
            git-hooks.hooks = {
              treefmt.enable = true;
              eslint.enable = true;
            };

         };

         # Just runner scripts to mirror package.json
         scripts = {
           "start" = {
             just.enable = true;
             description = "starts the dev envirment.";
             exec = ''
               npm run start
             '';
           };
           "lint" = {
             just.enable = true;
             description = "runs prettier and eslint.";
             exec = ''
               npm run lint
             '';
           };
           "lint-fix" = {
             just.enable = true;
             description = "runs prettier and eslint with `--fix`.";
             exec = ''
               npm run lint:fix
             '';
           };
         };

         # Auto runs NPM install if 'node_modules' dosent
         # exsist when entering the shell.
         shell.startup = [
           ''
             if [[ ! -d node_modules ]]; then
                 npm install
             fi
           ''
         ];

        };
      };
    };
}
