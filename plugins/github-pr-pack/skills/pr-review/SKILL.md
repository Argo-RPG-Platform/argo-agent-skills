# PR Review

Arguments: "$ARGUMENTS"

Review a GitHub pull request and post findings as a structured review with inline comments via the GitHub MCP. Arguments: `<PR_NUMBER>` (uses current repo), `<owner/repo> <PR_NUMBER>`, `<owner/repo>#<PR_NUMBER>`, or a full GitHub PR URL.

## Steps

1. **Resolve repo and PR number.**
   - If `$ARGUMENTS` is a full GitHub URL (`https://github.com/<owner>/<repo>/pull/<number>`), extract `owner`, `repo`, and `PR_NUMBER` from it.
   - If `$ARGUMENTS` matches `<owner>/<repo>#<number>` or `<owner>/<repo> <number>`, split accordingly.
   - If `$ARGUMENTS` is just a number, run `gh repo view --json owner,name -q '"\(.owner.login)/\(.name)"'` to derive `OWNER/REPO`.

2. **Gather PR context.** In parallel:
   - `pull_request_read` method `get` — title, description, author, base branch, head SHA.
   - `pull_request_read` method `get_diff` — raw unified diff.
   - `pull_request_read` method `get_files` — changed file list with addition/deletion counts.
   - `pull_request_read` method `get_check_runs` — CI status of the head commit.
   - `pull_request_read` method `get_review_comments` — existing review threads (to avoid duplicating).

3. **Read full file context.** For each changed file (skip deletions, binary files, and generated/vendored paths):
   - Call `get_file_contents` with `ref: refs/pull/<PR_NUMBER>/head` and the file path.
   - Prioritise files with the most net changes; cap at 20 files if the PR is very large.

4. **Analyse the diff.** Evaluate every changed file against:
   - **Correctness** — logic errors, null/undefined access, missing `await`, wrong type casts, off-by-one.
   - **Security** — injection vulnerabilities, exposed secrets, insecure direct object references, XSS.
   - **Performance** — N+1 queries, unnecessary re-renders, missing memoisation where measurable.
   - **Project conventions** — read `CLAUDE.md` (or `AGENTS.md` / `CONTRIBUTING.md` if present) at the repo root for project-specific rules; flag violations.
   - **Accessibility** — missing ARIA attributes, non-semantic HTML, keyboard navigation gaps.
   - **Test coverage** — non-trivial logic lacking unit tests.
   - **Dead code / debug artifacts** — `console.log`, untracked TODOs, commented-out code.

5. **Create a pending review.**
   - Call `pull_request_review_write` method `create` — omit the `event` field so the review is pending, not yet submitted.

6. **Post inline comments.**
   - For each finding that maps to a specific file and line, call `add_comment_to_pending_review`:
     - `path`: relative file path from repo root.
     - `line`: line number on the relevant side of the diff.
     - `side`: `RIGHT` for new/added code, `LEFT` for removed code.
     - `subjectType`: `LINE` for line-specific issues, `FILE` for file-level concerns.
     - `body`: state the problem → explain why it matters → suggest a fix. Use markdown ` ```suggestion ``` ` blocks for one-line fixes.
   - Skip findings already covered by an existing thread in `get_review_comments`.
   - Do not post comments that are pure style preferences not codified in the project docs.

7. **Determine verdict.**
   - `REQUEST_CHANGES`: any correctness bug, security vulnerability, broken project convention, or failing CI check run.
   - `APPROVE`: no issues found, all CI checks passing, only praise or optional suggestions.
   - `COMMENT`: suggestions only — no blocking issues, CI may have warnings but no failures.

8. **Submit the review.**
   - Call `pull_request_review_write` method `submit_pending` with:
     - `event`: verdict from step 7.
     - `body`: ≤300-word summary — files reviewed, findings by category (counts), CI status, overall rationale.

9. **Report back.** State: verdict, number of inline comments posted, key findings. If CI is failing, highlight which checks.

## Rules

- Never post a comment on a thread that already exists for the same concern.
- Inline comment `line` must be a line that appears in the diff — do not invent line numbers.
- Do not `APPROVE` a PR with failing CI check runs.
- If the diff exceeds 500 changed files, focus on the highest-risk files and note the scope limit in the summary body.
- Keep comment bodies focused: problem → why → fix. Do not lecture.
