---
name: pr-resolve-comment
description: Resolve a single review comment on a GitHub pull request. Reads the comment, confirms the interpretation with the user, applies a targeted code fix, replies to the thread, and marks it resolved. Use when the user says "resolve comment <ID>", "fix this review comment", or provides a direct GitHub comment URL (https://github.com/<owner>/<repo>/pull/<N>#discussion_r<ID>). Modifies one file — confirms before pushing.
---

# PR Resolve Comment

Arguments: "$ARGUMENTS"

Resolve a single comment on a GitHub pull request. Read the comment, confirm the interpretation, apply the code fix, reply to the thread, and resolve it.

Arguments: `<PR_NUMBER> <COMMENT_ID>` (uses current repo), or `<owner/repo> <PR_NUMBER> <COMMENT_ID>`, or a direct GitHub comment URL (`https://github.com/<owner>/<repo>/pull/<N>#discussion_r<ID>`).

## Steps

1. **Resolve repo, PR number, and comment ID.**
   - If `$ARGUMENTS` is a GitHub comment URL, extract `owner`, `repo`, `PR_NUMBER`, and `COMMENT_ID` (the number after `discussion_r` or `issuecomment-`).
   - If `$ARGUMENTS` is `<owner>/<repo> <PR_NUMBER> <COMMENT_ID>`, split accordingly.
   - If `$ARGUMENTS` is `<PR_NUMBER> <COMMENT_ID>`, run `gh repo view --json owner,name -q '"\(.owner.login)/\(.name)"'` to derive `OWNER/REPO`.

2. **Fetch the comment.** In parallel:
   - `pull_request_read` method `get` — head branch, head SHA.
   - `pull_request_read` method **get_review_comments** — all review threads; find the thread whose comments include `COMMENT_ID`. Note the thread's `threadId` (node ID, e.g. `PRRT_kwDO…`) and `isResolved` status.
   - If not found in review threads, try `pull_request_read` method **get_comments** (general PR comments).

3. **Display the comment to the user.** Show:
   - Author, file path, line number (if inline), and the full comment body.
   - Any existing replies in the same thread.
   - Whether the thread is already resolved.
   - If already resolved, confirm with the user whether to proceed anyway.

4. **Check current branch.**
   - Run `git branch --show-current` and compare to the PR's head branch.
   - If not on the PR branch, ask the user to confirm before running `gh pr checkout <PR_NUMBER>`.

5. **Read the target file.**
   - Call **get_file_contents** with `ref: refs/pull/<PR_NUMBER>/head` and the comment's file path for the version the comment was made on.
   - Also `Read` the current working-tree version of the file to understand live state.

6. **Confirm the interpretation.**
   - State in one sentence what code change you plan to make.
   - Wait for the user to confirm before proceeding.
   - If the comment is ambiguous or requests a breaking change, say so and ask for clarification rather than guessing.

7. **Apply the fix.**
   - `Edit` with a minimal, targeted change — scoped exactly to what the comment asks.
   - Do not refactor, rename, or change anything outside the scope of this comment.

8. **Reply to the comment.**
   - Call **add_reply_to_pull_request_comment** with a 1–2 sentence body describing what was changed.

9. **Resolve the thread.**
   - Call `pull_request_review_write` method `resolve_thread` with the `threadId`.

10. **Commit.**
    - Stage the modified file explicitly: `git add <file>`.
    - Commit message: `fix: address review comment — <one-line summary>`.

11. **Push.**
    - Ask the user to confirm before running `git push origin <branch>`.

## Rules

- Always show the comment content and confirm the interpretation (step 6) before editing any file.
- Never resolve the thread before the code change is applied.
- Changes must be minimal — this skill resolves one comment, not the whole PR.
- If the comment is a question (not a change request), reply to it and do not touch the code.
- If the comment references a line that no longer exists in the current file (stale), note it, reply explaining the code has since changed, and ask the user whether to resolve it.
- Never use `git add .` or `git add -A`; stage only the modified file.
