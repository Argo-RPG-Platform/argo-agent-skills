---
name: generate-npc
description: Interview the GM about a new NPC, generate a richly-detailed character, save it to Argo as an NPC mnemon, and wire up relationships to existing characters, factions, and locations. Use when the user says "create an NPC", "generate an NPC", "I need a new NPC", "make me a shopkeeper", "give me a villain", or otherwise asks for help inventing a non-player character for their Argo campaign. Requires the Argo MCP to be connected. Writes to Argo — confirm before saving.
---

# Generate NPC

You are helping a GM design a new NPC and commit it to Argo as a mnemon, with relationships to the rest of the world.

## Step 1 — pick the campaign

Call `list_campaigns`.

- 0 → tell them to create a campaign first; stop.
- 1 → use it; mention which.
- >1 → ask which one; remember the choice for the rest of this conversation.

## Step 2 — interview the GM

Ask, in one batched message (so the GM can answer all at once):

1. **Role / purpose** — what does this NPC do in the story? (shopkeeper, antagonist, quest-giver, faction lieutenant, comic relief, etc.)
2. **Location** — where will the party meet them? (Use a location they already know if possible; offer to look up existing locations with `list_mnemons` if the GM is unsure.)
3. **Ties** — who do they know, work for, oppose? Name existing NPCs, factions, parties if any. ("none, totally fresh" is a valid answer.)
4. **Tone** — comedic, sinister, tragic, mysterious, mundane?
5. **NPC type** — `INDIVIDUAL` (a person) or `FACTION` (an organization)?
6. **Visibility** — `HIDDEN` (GM only), `INTERNAL` (party can see; default), or `PUBLIC` (requires a published campaign).

Don't grill if they don't want to be grilled — if they say "just make something up", invent reasonable defaults and proceed.

## Step 3 — look up referenced entities (if any)

If the GM named existing NPCs, factions, or locations in step 2, look them up:

- Locations: `list_mnemons` filtered to `type=Location`, then `get_mnemon` for the match.
- Existing NPCs/factions: `list_mnemons` filtered to `type=NPC`, then `get_mnemon`.

You'll need their entry IDs to wire relationships in step 5.

## Step 4 — draft the NPC

Produce a draft with:

- **Name** (offer 2-3 if the GM didn't supply one).
- **Pronouns / species / age range / appearance** (2-3 sentences).
- **Voice & mannerism** — one thing the GM can do at the table to make this NPC distinctive.
- **Goal & motivation** — what they want, why.
- **Secret** — one thing they're hiding (only the GM sees this; will live in mnemon content).
- **Stat block hook** — a one-line cue for the GM about how this NPC handles conflict (e.g. "tries to talk first; if combat: agile melee, 2 attacks/round").
- **Ties** — bullet list of who they know and how.

Show the draft. Ask if the GM wants edits before saving.

## Step 5 — save to Argo

Once approved:

1. Call `create_npc_mnemons` with one item:
   - `npcType`: `INDIVIDUAL` or `FACTION` (from step 2).
   - `visibility`: from step 2.
   - For `INDIVIDUAL` with faction affiliations: `affiliationEntryIds`: faction entry IDs from step 3.
   - For `FACTION` with named members: `memberNpcEntryIds`: NPC entry IDs from step 3.
   - Content: name, description, voice, goal, secret, stat hook. Format the secret distinctly so the GM can find it later.
   - `tags`: short keyword list from the role/tone.
2. Capture the returned NPC entry ID.
3. For each tie that isn't already covered by `affiliationEntryIds`/`memberNpcEntryIds` (e.g. a location they live in, an enemy NPC, a quest they're tied to), call `create_mnemon_relationship` with a sensible relationship type. If you're not sure which relationship type to use, ask the GM rather than guess.

## Step 6 — report and offer follow-ups

Tell the GM:

- The new NPC's name and entry ID.
- Each relationship you created.
- Offer next steps:
  - "Want me to add them to an active quest?" (use `update_quest_mnemons`).
  - "Want to generate another NPC tied to this one?" (re-run this skill).
  - "Want to draft tonight's prep that includes them?" (suggest `prep-session`).
