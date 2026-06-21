# Contributing to plot-lobby-starter

Thanks for your interest in improving this project! Issues and pull requests are
welcome.

## Getting started

You'll need [Node.js](https://nodejs.org) 20+.

```bash
git clone https://github.com/plot-ws/plot-lobby-starter
cd plot-lobby-starter
npm install
npm run dev      # start the dev server
```

Before opening a PR, make sure these all pass — CI runs the same checks:

```bash
npm run typecheck
npm run build
npm test
```

## Pull requests

1. Fork the repo and create a branch from `main` (e.g. `feat/my-change`).
2. Keep changes focused; add or update tests where it makes sense.
3. Use [Conventional Commits](https://www.conventionalcommits.org/) for your PR
   title (e.g. `feat:`, `fix:`, `docs:`).
4. Open the PR and fill in the template.

## Connecting to Plot

This project talks to a Plot backend. Grab a publishable app key from the
[Plot dashboard](https://app.plot.ws), or run Plot locally and point the app at
it with `VITE_PLOT_API_URL`. See the [docs](https://docs.plot.ws).

## Code of conduct

This project follows the Plot
[Code of Conduct](https://github.com/plot-ws/.github/blob/main/CODE_OF_CONDUCT.md).
By participating, you agree to uphold it.

## Questions?

Usage questions are best asked in [Discord](https://discord.gg/plot). Use issues
for bugs and feature requests.
