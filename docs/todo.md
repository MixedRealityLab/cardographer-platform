# To do

basic
- [x] tailwind support
- [x] mongodb db
- [x] dummy authentication (user email)
- [x] base url (proxy deployment)
- [x] real authentication

deck
- [x] list decks
- [x] decks filter by user
- [x] edit revision
- [x] download cards spreadsheet
- [x] upoad cards spreadsheet
- [ ] edit deck (public, owners)
- [x] new revison of deck
- [x] list templates
- [x] template -> new deck
- [x] upload deck assets
- [ ] delete deck assets
- [ ] mkdir for assets
- [x] run card generator
- [x] deck build error reporting
- [ ] multi-back support - see below
- [ ] deck build output (atlas) metadata
- [ ] deck url/export for unity client

session
- [ ] templates
- [ ] template -> new session
- [ ] list sessions
- [ ] edit session
- [ ] session -> template
- [ ] edit session stage/decks
- [ ] deck info url/export for unity client
- [ ] schedule session
- [ ] unity session support... (schedule, config, save state, continue)
- [ ] miro session support... (link, add state, export??)
- [ ] add session state
- [ ] board + region support

analytics
- [ ] basic card use export
- [ ] gephy-compatible basic output
- [ ] card suggestion

## multi-back support

some quick notes...

often a deck has several 'categories' (or similar) and often each
has a different back design.

For the unity client, each category will have to be in its own atlas
(as each atlas has a single back). So a single deck will have several
atlases.

So:
- add a new column type 'back', unique values indicating different backs
  (also potentially used elsewhere as metadata/content control)
- card ids starting 'back:' define backs, and can be included in the 
  main CSV export/import (and 'back:' is the default back)
- probably a hidden column/value 'isBack' (and remove singleton .back)
- deck.rb will need to handle each 'back' separately; do the worker
  run it separately with different output filenames or does it do it
  itself? May be easier to run it separately with different filename
  prefixes for each... (new parameter for run and deck.rb)

questions:
- what about category slugs or equivalent?


