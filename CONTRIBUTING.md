# Contribution Guide

## Setting up the project

Use [nvm](https://nvm.sh) to use the appropriate Node.js version from `.nvmrc`:

```sh
nvm i
```

Install the dependencies using npm:

```sh
npm i
```

## Building the project

Run the `build` script:

```sh
npm build
```

The package is bundled using [pkgroll](https://github.com/privatenumber/pkgroll) (Rollup). It infers the entry-points from `package.json` so there are no build configurations.

### Development (watch) mode

During development, you can use the watch flag (`--watch, -w`) to automatically rebuild the package on file changes:

```sh
npm build -w
```

## Running the package locally

Since pkgroll knows the entry-point is a binary (being in `package.json#bin`), it automatically adds the Node.js hashbang to the top of the file, and chmods it so it's executable.

You can run the distribution file in any directory:

```sh
./dist/cli.mjs
```

Or in non-UNIX environments, you can use Node.js to run the file:

```sh
node ./dist/cli.mjs
```

## Check the lint in order to pass

First, install prettier.

```sh
npm install -g prettier
```

Once Prettier is installed, you can run it on a single file or multiple files using the following commands:

1. For a single file:

```sh
prettier --write path/to/your/file.js
```

2. For a multiple file:

```sh
prettier --write "src/**/*.js"
```

If you use Vscode, It is recommended to use [prettier-vscode](https://github.com/prettier/prettier-vscode)
