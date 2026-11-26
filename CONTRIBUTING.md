# Contributing to Hosanna

Thanks for considering a contribution. This repository contains the Hosanna web suite and shared packages. The Flutter app and blog are maintained in separate repositories.

## Development

- Use Node.js 24 or newer and pnpm 11.24.
- Install dependencies with `pnpm install`.
- Follow the repository's `AGENTS.md` guidance and the relevant architecture docs under `docs/`.
- Keep changes focused, add or update coverage where the package has an established test setup, and run the relevant typecheck, lint, and tests before opening a pull request.
- Do not include secrets, production data, or unrelated formatting changes.

## Pull requests

Use a focused branch and open a pull request against `develop`. Explain the user or system problem, summarize the change, and include any relevant screenshots for UI changes. Complete the pull request checklist.

Every commit must include a DCO sign-off from its author. Add it with `git commit -s`; for an existing local commit, amend it with `git commit --amend -s` before opening the pull request. The CI workflow checks each commit in the pull request.

By submitting a contribution, you certify that you have the right to submit it and agree that it is offered under the repository's AGPL-3.0-only license.

## License

Hosanna is free software under AGPL-3.0-only. Churches may run and modify a copy under that license. If they modify the program and let people use it over a network, the license requires those users to be offered the corresponding source code. See [LICENSE.md](LICENSE.md).
