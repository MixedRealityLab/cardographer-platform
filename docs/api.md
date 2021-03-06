# Cardographer API

## User 

Note, user API methods typically require authentication with
a JWT bearer token in the Authorization header. 
Currently this is generated by the server via `api/user/login`, 
and must include `email`.

### Card authoring

Authentication (placeholder):

- [x] `api/user/login` POST LoginRequest -> LoginResponse 
  (should change to OAuth or OpenID Connect at some point).
  Note, also sets the cookie used for browser access control.
- [x] `api/user/logout` POST () -> (). 

Deck authoring:

- [x] `api/user/decks.json` GET (auth. JWT email) -> 
  {decks:CardDeckSummary[]} with email in owners.
- [x] `api/user/decks/[deckId]/revisions.json` GET (auth. JWT email) ->
  {revisions:CardDeckRevisionSummary[],deck:CardDeckSummary} 
- [x] `api/user/decks/[deckId]/revisions/[revId].json` GET (auth. JWT email
  or revision isPublic) -> CardDeckRevision
- [x] `api/user/decks` POST CardDeckRevision (auth) -> {deckId,revId=1}
- [x] `api/user/decks/[deckId]/revisions` POST CardDeckRevision (auth.)
  -> {revId}
- [ ] `api/user/decks/[deckId]` POST CardDeckSummary {owners, isPublic}
  (auth.) -> ()
- [x] `api/user/decks/[deckId]/revisions/[revId]` POST CardDeckRevision
  (auth.) -> ()
- [x] `api/user/decks/[deckId]/revisions/[revId]/cards.csv` GET 
  ?allColumns&withRowTypes (auth) -> .CSV file of card metadata
- [x] `api/user/decks/[deckId]/revisions/[revId]/cards` PUT (auth.) 
  PutCardsRequest {addColumns, .CSV file of card metadata} -> 
  () or CardDeckRevision?
- [x] `api/user/decks/[deckId]/revisions/[revId]/build` POST (auth.)
  () -> BuildResponse

Files:

- [x] `api/user/decks/[deckId]/revisions/[revId]/files/[...file]` GET 
  (auth) -> file info [] (for dir)
- [x] `api/user/decks/[deckId]/revisions/[revId]/files/[...file]`       
  POST (auth) (form-ish) PostFilesRequest -> upload/mkdir
- [ ] `api/user/decks/[deckId]/revisions/[revId]/files/[...file]`
  DELETE (auth) -> ()

Public decks & templates:
- [x] `api/public/templates.json` GET -> 
  {values:CardDeckRevisionSummary[]} with isPublic & isTemplate
- [ ] `api/public/decks.json` GET -> CardDeckSummary[] with isPublic
- [ ] `api/public/decks/[deckId]/revisions.json` GET ->
  CardDeckRevisionSummary[] (if deck isPublic and revision isPublic)
- [x] `api/public/decks/[deckId]/revisions/[revId].json` GET 
  (revision isPublic) -> CardDeckRevision

Deck use:
- [ ] `api/client/decks/[deckId]/revisions/[revId].json` GET (auth
  or isPublic) -> subset? of CardDeckRevision
- [ ] `api/client/decks/[deckId]/revisions/[revId]/outputfiles/[filename]`
  GET (auth or isPublic) -> file content

Images - Deprecated - switching to direct URLs:
- [x] `api/cards/images/[deckId]/[revId]/[...file]` GET -> file
  from _output (only application/octet-stream atm - sveltekit issue)

## Sessions

Public templates:
- [x] `api/public/sessionTemplates.json` GET -> 
  {values:Session[]} with isPublic & isTemplate

Session authoring:
- [x] `api/user/sessions.json` GET (auth) -> {values:Session[]} with
  email in owners
- [x] `api/user/sessions/[sessid].json` GET (auth) -> Session
- [x] `api/user/sessions/copy` POST {sessid} (auth) -> {sessid}
- [x] `api/user/sessions/[sessid]` PUT Session (auth) -> (), note allow
  partial updates, e.g. for stages/decks?
- [x] `api/user/sessions/import` POST array of old-dumps (auth) -> {message}

Session scheduling:
- [ ] `api/user/scheduled.json` GET (auth) -> 
  {values:ScheduledSession[]} with email in Session owners
- [ ] `api/user/scheduled` POST ScheduledSession (auth) ->
  {ssid}
- [ ] `api/user/scheduled/[ssid].json` GET (auth) -> ScheduledSession
- [ ] `api/user/scheduled/[ssid]` POST ScheduledSession (auth) -> ()

Session play:
- [ ] `api/client/sessions/[sessid]/stage/[stage]/deckInfo.json` GET 
  (auth or public) -> DeckInfo[] for unity
- [x] `api/client/decks/[deckId]/revision/[revId]/deckInfo.json` GET
  (auth or public) -> DeckInfo[] for unity (Note, just for testing/dev)

Session snapshots:
- [ ] `api/user/sessions/[sessid]/snapshots.json` GET (auth) -> 
  {values:SessionSnapshot[]}
- [ ] `api/user/sessions/[sessid]/snapshots/[snapid]` PUT {snapshotDescription,
  sessionStage,isPublic,isNotForAnalysis} -> () note, partial update
- [x] `api/user/snapshots.json` GET (auth) -> {values:SessionSnapshotSummary}
  available for analysis (and owned or public)

Analysis:
- [x] `api/user/analyses.json` GET (auth) -> {values:Analysis[]}
- [x] `api/user/analyses` POST Analysis (auth) -> {analid}
- [x] `api/user/analyses/[analid].json` GET () (auth) -> Analysis
- [x] `api/user/analyses/[analid]` POST Analysis -> () partial?!
- [x] `api/user/analyses/[analid]/gephy.csv` query param 'type' 
  card_use|card_adjacency|... & includeDetail & splitByBoard & boards GET 
  (auth) -> basic gephy CSV 

TODO: ...??
