# Mergify

Raycast extension to monitor a repository's Mergify merge queue.

## What it does

- Shows waiting pull requests and active batches from Mergify.
- Displays merge ETA with both relative and local absolute time.
- Provides a menu bar command with a queue count and quick access to each PR.

## Commands

- `Queue Status` (view): detailed list with sections for waiting PRs and batches.
- `Queue Status Menu Bar` (menu bar): queue size in the menu bar, refreshed every 10 minutes.

## Preferences

Configure these extension preferences in Raycast:

- `Mergify Token`: personal token used to call the Mergify API.
- `Repository Owner`: GitHub owner or organization.
- `Repository Name`: target repository name.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start local development in Raycast:

```bash
npm run dev
```

3. Open extension preferences in Raycast and set your token/owner/repository values.

## Development

- Build: `npm run build`
- Lint: `npm run lint`
- Fix lint issues: `npm run fix-lint`

## API

The extension reads merge queue status from:

- `GET https://api.mergify.com/v1/repos/{owner}/{repository}/merge-queue/status`
