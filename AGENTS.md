# Repository workflow

These rules apply to all work in this repository.

## Branches

- Never commit directly to `main`. Start from an up-to-date `main` and use one focused branch per change.
- For agent-created branches, use `codex/<short-kebab-case-topic>`.
- For issue-linked product work, existing `feat/<issue>-<topic>` and `fix/<issue>-<topic>` names are also valid.
- Keep follow-up concerns in separate branches and pull requests.

## Commits

- Use a short, imperative, sentence-case subject without a trailing period, for example `Bundle event artwork with portable archives`.
- Keep each commit focused and leave unrelated working-tree changes untouched.
- Do not add tool attribution or generated co-author trailers.

## Pull requests

- Open every change against `main`; do not push changes directly to `main`.
- Use an imperative, sentence-case title that describes the user-visible outcome.
- Include a concise summary and the exact verification performed.
- Do not merge until the branch is mergeable and required checks pass.
- Use a merge commit unless the user requests another strategy.
- After merging, delete the feature branch, return to `main`, update it, and prune stale remote branches.

## Verification

- Run the narrowest relevant tests while developing, then the affected workspace checks and production build before opening a pull request.
- For frontend changes, verify the live route when an authenticated local session is available and state any verification boundary clearly.
- Record commands and meaningful limitations in the pull request body.
