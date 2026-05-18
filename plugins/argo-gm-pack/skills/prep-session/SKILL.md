---
name: prep-session
description: Produce a pre-session prep document for the GM, drawing on the campaign's last session summary, active quests, and relevant NPCs and locations from Argo. Use when the user says "prep my session", "prep tonight's session", "what should I prepare for next session", "session prep", or otherwise asks for help getting ready to run their next Argo session. Requires the Argo MCP to be connected. Does not modify any data.
---

# Pre-Session Prep

You are helping a GM prepare to run their next session. Pull the relevant state from Argo and produce a focused prep document. **This skill does not write anything to Argo — read-only.**

## Step 1 — pick the campaign

Call `list_campaigns`.

- 0 results → tell the GM they need to create a campaign in the Argo WebApp first; stop.
- 1 result → use it. Mention which campaign you're prepping for in your reply.
- >1 results → list them and ask the GM which one to prep. Remember the choice for the rest of this conversation; do **not** ask again.

Hold the chosen `campaignId` in working memory for every subsequent call below.

## Step 2 — gather context

Call these in parallel where possible:

1. `get_campaign` for high-level setting, tone, party composition.
2. `list_sessions` for this campaign; identify the most recent past session and the next planned session (if any).
3. For the most recent past session, call `get_session` and then `list_mnemons` filtered to `type=SessionSummary` for that session, fetching the summary's content.
4. `list_mnemons` for active quests (`type=Quest`, `questStatus=active`). Read their content with `get_mnemon` if the summaries are thin.
5. `list_mnemons` for NPCs that appear in the last session summary or in active quests. Pull the ones whose names/IDs show up; don't fetch the world.
6. `list_mnemons` for Locations referenced by the active quests or the next session's stated hook.

If at any point the GM has told you in this conversation what next session is about (a hook, a planned scene, "we're going to the temple"), prioritize entities relevant to that hook over everything else.

## Step 3 — produce the prep doc

Write a Markdown document with these sections, omitting any that have no content:

- **Recap of last session** — 3-6 bullet points from the most recent SessionSummary. End with the cliffhanger or open thread.
- **Open hooks & threads** — quests in `active` status, unresolved promises from the last summary.
- **NPCs likely to appear** — for each: name, role, current goal, voice/mannerism note, and one specific thing they want from the party this session.
- **Locations** — for each: a one-line vibe, two or three sensory details, and one interactive element (something to investigate, a hazard, a faction presence).
- **Possible complications** — 2-4 things you (the GM) could throw at the party if the session goes flat.
- **Prep checklist** — physical/digital prep items: maps to load, music to queue, handouts.

Keep it scannable. The GM will read this 15 minutes before play.

## Step 4 — offer next steps

After delivering the prep doc, offer:

- "Want me to generate a new NPC for tonight?" → suggests `generate-npc`.
- "After the session, I can write the recap and update mnemons." → suggests `recap-session`.
