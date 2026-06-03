# PR Merge Conflicts

Arguments: "$ARGUMENTS"

Resolve merge conflicts on a GitHub pull request branch. Fetches the latest base branch, identifies conflicting files, resolves each conflict, then commits and pushes.

Arguments: `<PR_NUMBER>` (uses current repo), `<owner/repo> <PR_NUMBER>`, or a full GitHub PR URL.

## Steps

1. **Resolve repo and PR number.** Same logic as `pr-review` step 1.

2. **Fetch PR metadata.**
   - `pull_request_read` method `get` — head branch, base branch, author, merge status.
   - If the PR is already merged or closed, stop and inform the user.

3. **Check current branch.**
   - Run `git branch --show-current`.
   - If not on the PR's head branch, ask the user to confirm before running `gh pr checkout <PR_NUMBER>`.

4. **Fetch and attempt merge.**
   - `git fetch origin` — update all remote refs.
   - `git merge origin/<BASE_BRANCH>` — merge the latest base into the head branch.
   - If the merge exits cleanly (no conflicts), report "already up to date / no conflicts" and skip to step 10 (push).

5. **Identify conflicting files.**
   - Run `git diff --name-only --diff-filter=U` to list all files with unresolved conflicts.
   - Also run `git status --short` to catch deleted-by-us / deleted-by-them cases.
   - If there are no conflicting files, run `GIT_EDITOR=true git merge --continue` to complete the merge and go to step 10.

6. **For each conflicting file, understand both sides.**
   - `Read` the file — it contains conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>> origin/<BASE>`).
   - Parse the three regions:
     - **Ours** (`HEAD`): the PR branch's version.
     - **Theirs** (`origin/<BASE>`): the incoming base branch version.
     - **Base** (the common ancestor, if available via `git show :1:<file>`).
   - Understand the intent of each side: what feature or fix does each region represent?

7. **Classify each conflict.**

   | Class | Condition | Action |
   |-------|-----------|--------|
   | **Additive** | Both sides add distinct code that doesn't overlap (imports, new functions, new keys) | Auto-merge: keep both |
   | **Divergent edits** | Both sides modified the same lines differently | Show both sides to the user, state your interpretation, and ask for confirmation before resolving |
   | **Deleted-modified** | One side deleted the file/block, the other modified it | Ask the user whether to keep the modification or the deletion |
   | **Identical** | Both sides made the same change | Accept either side (they're equivalent) |

8. **Resolve each conflict.**
   - `Edit` the file to remove all conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) and produce the correct merged content.
   - For divergent/deleted conflicts: wait for user confirmation (step 7) before editing.
   - After editing, verify no conflict markers remain: run `grep -n "<<<<<<\|=======\|>>>>>>>" <file>` — if any remain, fix them before continuing.
   - Run `git add <file>` to mark each resolved file individually (never `git add .`).

9. **Complete the merge.**
   - Once all files are staged, run `GIT_EDITOR=true git merge --continue` to complete the merge without opening an editor, or `git commit --no-edit` if already in merge state with all files staged.
   - Verify with `git status` that the working tree is clean.

10. **Push.**
    - Ask the user to confirm before running `git push origin <HEAD_BRANCH>`.

11. **Report back.**
    - Files with auto-resolved conflicts (count + names).
    - Files that needed user confirmation (count + names + which side was chosen).
    - Merge commit SHA.
    - Any files that could not be resolved (e.g. binary conflicts) — list them with instructions for manual resolution.

## Rules

- Never auto-resolve a divergent edit without showing the user both sides and stating the intended resolution.
- Never use `git add .` or `git add -A`; stage each resolved file explicitly.
- After editing a conflict, always verify zero conflict markers remain in that file before staging it.
- If a conflict is in a binary file (image, font, lockfile), do not attempt to merge — report it to the user and explain which version to keep.
- Do not rebase unless the user explicitly asks — prefer `git merge` to preserve PR history.
- If `git merge --continue` requires a commit message, use: `merge: resolve conflicts merging origin/<BASE_BRANCH> into <HEAD_BRANCH>`.
- Push only after user confirmation.
