---
name: recap-session
description: Turn the GM's raw post-session notes into a structured SessionSummary mnemon in Argo, update affected NPC/quest/location mnemons, and optionally post a player-facing recap to the campaign forum. Use when the user says "recap last session", "write up the session", "post the recap", "log tonight's session", or shares raw session notes and wants them turned into Argo state. Requires the Argo MCP to be connected. Writes to Argo — confirm each write with the GM unless they tell you to "just do it".
---

# Post-Session Recap

You are helping a GM commit a session's outcomes to Argo: a structured summary mnemon, plus updates to any NPCs, quests, and locations the session affected. Optionally, a player-facing forum post.

This skill **writes to Argo**. Default behavior is to confirm each write with the GM. If the GM says "just do it", "go ahead", "don't ask", or similar, switch to auto-confirm mode for the rest of this conversation.

## Step 1 — pick the campaign

Call `list_campaigns`.

- 0 → tell them to create a campaign first; stop.
- 1 → use it; mention which.
- >1 → ask the GM which one; remember the choice for the rest of this conversation.

## Step 2 — gather raw notes

If the GM hasn't already pasted their notes in the conversation, ask for them. Acceptable forms: bullet points, stream-of-consciousness, voice-transcribed audio, "we did X then Y then Z". Don't make them format anything.

Also ask (only what's missing):

- Which `sessionId` this recap is for. If unclear, call `list_sessions` and offer the most recent unrecapped session.
- A title for the session (or propose one based on the notes).
- The date the session was played, if not in the metadata.

## Step 3 — draft the SessionSummary

Produce a draft with:

- A short narrative recap (4-8 paragraphs, past tense, third person).
- A bulleted list of key events.
- A bulleted list of NPCs encountered, with one line each about what they did/wanted.
- A bulleted list of locations visited.
- Quests touched (and their new status: still active / completed / failed / new).
- Loot, rewards, level-ups, or other mechanical outcomes.
- The cliffhanger or open thread for next time.

Show the draft to the GM. Ask if they want edits before you commit it.

## Step 4 — write the SessionSummary mnemon

Once the GM approves the draft, call `create_session_summary_mnemons` with one item containing the draft. Capture the returned entry ID — you'll reference it for relationships.

## Step 5 — update affected entities

For each NPC mentioned that already exists in Argo:

- Look it up with `list_mnemons` + `get_mnemon`.
- If anything material changed (new info, relationship shift, status), call `update_npc_mnemons` for typed/meta fields and/or `update_mnemons_content` for narrative content.

Same loop for **Locations** (`update_location_mnemons` / `update_mnemons_content`) and **Quests** (`update_quest_mnemons` — especially `questStatus` if a quest completed or failed).

For NPCs/locations newly introduced this session that don't exist yet in Argo, ask the GM if they want you to create them now (`create_npc_mnemons`, `create_location_mnemons`). If yes, do it and link them via `create_mnemon_relationship` to the SessionSummary.

In confirm mode, group writes by entity and ask once per entity ("update Mira to mark her hostile to the party — ok?"). In auto-confirm mode, just do them and report what you did.

## Step 6 — optional player-facing forum post

Ask the GM: "Want me to post a player-facing recap to the campaign forum?" Default to **no** unless they say yes.

If yes:

1. Call `forum_list_categories` to find the campaign's recap category (often called "Session Recaps" or similar; if unclear, ask the GM).
2. Rewrite the SessionSummary into a player-friendly version (second person plural, "you" the party, no GM-secret information — strip anything the players don't know yet).
3. Show the rewrite for approval.
4. Call `forum_create_topic` with the approved text.

## Step 7 — wrap up

Report back to the GM:

- SessionSummary entry ID created.
- Each entity updated (count + names).
- Forum post URL if one was made.
- Anything you noticed but didn't do (e.g. "I noticed Renn might warrant a level-up via `update_player_mnemons` — want me to handle that?").
