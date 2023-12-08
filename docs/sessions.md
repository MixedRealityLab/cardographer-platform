# Sessions

Documenting current state (2023-12-08) and working out how to progress...

## Miro

### Plugin

The miro cardographer plugin is `routes/(main)/miro/[id]`, where `id` is
the miro board ID (also present as `.id` in each miro board state).

The plugin looks for a `Session` with `url` `"https://miro.com/app/board/" + params.id`
i.e. the (presumed) miro board url. This is (now) irrespective of whether the session
is owned by the user or 'public' ('public' session flag is probably going to 
indicate the /data/ is available).

If none is found it returns a list of owned sessions which DON'T have `url` set,
and which are either new (defined as having sessionType '') or have previously
been based on this Miro board (based on `sessionType` and the
newly set session parameter `miroId`).

When a session is selected from the plugin it sets `url`, `sessionType` and `miroId`.
When it is unselected it clears `url` only, i.e. retains miro type and board association,
but is no longer the (single global) live cardographer session for that board. 

Plugin upload finds session based on `url` (checking it is owned),
and looks for existing snapshot based on "data.id": snapshotData.id (board id)
and "data.updatedAt": snapshotData.updatedAt (board last modified).
If not present it creates a snapshot with `makeSessionSnapshot(data, session)`
and adds it.

### download/upload

A miro board state can be exported/downloaded from the Cardographer plugin.
The Cardographer miro plugin adds _id to each export/upload as 
`"download:" + board.id + ":" + Date.now()`, i.e. each time the 
button is pressed it will change.

Note: `lib/clients/miro.ts` and `...appv1.ts` `getExistingSessionQuery`
are used on Upload Session, but will (currently) never match an existing
session. (For miro that at least means people uploading snapshots won't
clash with linked plugin-based Sessions.)
The export _id is checked against SessionSnapshot's `legacyId`
(for that user's snapshots), and won't be re-imported if found.
Otherwise a new session & snapshot is created.

### Multiple snapshot handling

Snapshot `created` should reflect time of last change, not time of import.

