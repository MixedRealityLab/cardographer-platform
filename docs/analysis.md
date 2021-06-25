# Analysis

Old vuforia apps just have a snapshot for each design/session, which lists
the IDs of the cards used.

Basic visualisations are something like:
- card, weighted by use count; arcs = count of co-occurance
- design, weighted by no.cards; acrs = fraction (no?) of cards co-occurring

Some of the miro sessions have multiple multiple separate activities
each with their own board and set of cards.
The policy cards are used with a sequence of different boards.

## Standard Data

Analysing a snaphot will give an array of `BoardInfo`, one for each
(apparent) board, and/or one default if there are no boards or cards 
outside boards.

`BoardInfo` has:
- `id` (string) - may need canonicalising, blank/null for default
- `cards` (CardInfo[]) - info about each card used on the board 
  (if the same card appears twice there will be one entry for each use)
- `comments` (CommentInfo[]) - infor about each comment, e.g. sticky note
- ?? more about board or board type

`CardInfo` has:
- `id` (string) - may need canonicalising
- `zones` (CardZone[]) - zones/regions that card is in
- `scales` (CardScale[]) - scales/axes that card is valued on
- ?? `comments` (string[] or? CommentInfo[]) - comments associated with this card
- ?? `inPlay` (boolean) - e.g. not discarded

`CommentInfo` has:
- `text` (string)
- `zones` (CardZone[]) - zones/regions that card is in
- `scales` (CardScale[]) - scales/axes that card is valued on

`CardZone` has:
- `zoneId` (string) zone id
- ?? more about zone

`CardScale` has:
- `scaleId` (string)
- `value` (number) typically normalised 0-1 (but may be beyond that range)

## Gephy

### CSV/spreadsheet Imports

To set up nodes (e.g. cards or designs/boards) Spreadsheet, node table
import expects one node per row with columns:
- `Id`
- `Label`
- other user-defined attributes

The spreadsheet edge table import expects one edge per row with:
- `Source`
- `Target`
- `Label`
- `Type` (optional), “Directed”, “Undirected” or “Mixed”
- `Weight` (number)
- other user-defined attributes

The CSV import has some basic edge options or an adjacency table,
with node IDs as row/column labels and value = weight.

Historically it looks like card master spreadsheet (or variant thereof)
has been used to creat card nodes, a separate design master spreadsheet
(often with the complete card use counts) to create design nodes, and
adjacency matrices for the edges.

Card-major seems like a better place to start.

