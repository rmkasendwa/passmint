# Repository workflow

These rules apply to all work in this repository.

## Branches

- Never commit directly to `main`. Start from an up-to-date `main` and use one focused branch per change.
- Name branches `<type>/<short-kebab-case-topic>`, using an appropriate type such as `feat`, `fix`, `chore`, `docs`, `refactor`, or `test`.
- An issue number may follow the type when the work is issue-linked, for example `feat/24-ticket-activity-timeline`.
- Keep follow-up concerns in separate branches and pull requests.
- Do not include tool names, automation attribution, or similar references in branch names or other repository artifacts.

## Commits

- Use exactly one line in conventional format: `<type>: <description>`.
- Use an appropriate lowercase type such as `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `perf`, `style`, or `revert`.
- Keep the description concise, lowercase, and without a trailing period, for example `feat: bundle event artwork with portable archives`.
- Prefer a series of small, logically complete commits over one broad commit whenever the work can be separated cleanly.
- Keep each commit simple enough for a human to review independently and keep the repository working at commit boundaries wherever practical.
- Leave unrelated working-tree changes untouched.
- Do not add commit bodies, tool or automation attribution, or co-author trailers.

## Pull requests

- Open every change against `main`; do not push changes directly to `main`.
- Use an imperative, sentence-case title that describes the user-visible outcome.
- Include a concise summary and the exact verification performed.
- Do not mention tools used to create the change or include automation attribution in titles, descriptions, comments, or review replies.
- Do not merge until the branch is mergeable and required checks pass.
- Use a merge commit unless the user requests another strategy.
- After every merge, delete the source branch both remotely and locally, return to `main`, update it, and prune stale remote branches.

## Verification

- Run the narrowest relevant tests while developing, then the affected workspace checks and production build before opening a pull request.
- For frontend changes, verify the live route when an authenticated local session is available and state any verification boundary clearly.
- Record commands and meaningful limitations in the pull request body.
