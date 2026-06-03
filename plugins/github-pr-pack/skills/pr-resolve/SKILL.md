# PR Resolve

Arguments: "$ARGUMENTS"

Resolve open comments on a GitHub pull request by making the requested code changes, replying to each thread, and marking threads resolved. Arguments: `<PR_NUMBER>` (uses current repo), `<owner/repo> <PR_NUMBER>`, `<owner/repo>#<PR_NUMBER>`, or a full GitHub PR URL. Optionally append `--comment <ID>` to target a single comment.

## Steps

1. **Resolve repo and PR number.** Same logic as `pr-review` step 1.

2. **Check current branch.**
   - Run `git branch --show-current` and compare to the PR's head branch (from `pull_request_read get`).
   - If not on the PR branch, ask the user to confirm before running `gh pr checkout <PR_NUMBER>`.
   - If `--comment <ID>` was passed, note it — only process threads/comments matching that ID in step 4.

3. **Fetch open threads and metadata.** In parallel:
   - `pull_request_read` method `get` — head branch, head SHA, author.
   - `pull_request_read` method `get_review_comments` — all review threads; extract those with `isResolved: false`.
   - `pull_request_read` method `get_comments` — general (non-inline) PR-level comments.

4. **Triage each comment.** Classify before touching any code:

   | Class | Condition | Action |
   |-------|-----------|--------|
   | **Auto-resolvable** | Specific, unambiguous code change requested | Apply fix → reply → resolve thread |
   | **Already addressed** | The requested change exists in a later commit (stale thread) | Reply noting it's already done → resolve thread |
   | **Needs human decision** | Design question, open-ended suggestion, or breaking/API change | Skip — include in final report |
   | **Conflicting comments** | Two comments contradict each other | Skip both — flag to user |

5. **Apply code changes.**
   - `Read` the current working-tree file (not the diff).
   - `Edit` with minimal, targeted changes scoped to what the comment asks — do not refactor beyond it.
   - Re-read the edited block to confirm coherence with surrounding code.
   - Record `(commentId, threadId, filePath, changeDescription)` for step 6.

6. **Reply to each addressed comment.**
   - Call `add_reply_to_pull_request_comment` with a 1–2 sentence body describing the change made.
   - For stale/already-addressed threads, note explicitly that it was already fixed in a prior commit.

7. **Resolve threads.**
   - Call `pull_request_review_write` method `resolve_thread` with the `threadId` (node ID from `get_review_comments`).
   - Only resolve threads whose concern is **fully** addressed — leave partial fixes unresolved.

8. **Commit.**
   - Stage only modified files explicitly: `git add <file1> <file2> …` — never `git add .` or `git add -A`.
   - Commit message: `fix: address PR review comments — <brief summary of changes>`.

9. **Push.**
   - Confirm with the user before pushing unless `--auto-push` was passed in `$ARGUMENTS`.
   - Run `git push origin <branch>`.

10. **Report back.**
    - Resolved threads: thread ID, comment summary, change applied.
    - Skipped threads: thread ID, reason (needs decision / conflict / not found).
    - Files modified.
    - Commit SHA (after push).

## Rules

- Never resolve a thread without either making the requested code change or confirming it was already addressed in a prior commit.
- Changes must be minimal — a rename request is not an invitation to refactor the surrounding function.
- If a comment requests a breaking change (public API rename, endpoint removal), flag it for human review rather than auto-applying.
- If two comments conflict, resolve neither — report the conflict explicitly.
- Never use `git add .` or `git add -A`; stage files explicitly.
- Push only after user confirmation (or explicit `--auto-push` flag).
- Do not modify files outside the scope of the comment being addressed.
