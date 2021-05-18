# Authoring Cards

## Spreadsheets

Card metadata is typically provided by a .CSV file which can be 
exported from most spreadsheets. 
It should be in UTF-8 character encoding.

The first row is the header row and should always be included.

There are two versions: with and with row type information.
With row type information the first column contains the type of 
data in the row (!). 
The row types are (NB lower case and including the ":"):
- "title:" - must be the first cell on the first row - the rest of the row
  is the normal column titles
- "use:" - the "use" or purpose of the values in the respective column.
  See the [data model](datamodel.md)
- "export:" - whether to include the respective column in the default 
  export (unless blank, "0", "n..." or "f...")
- "default:" - row values are defaults for all cards
- "card:" - row represents a normal card.

A regular (non-typed) spreadsheet always has the title row first, then
all remaining rows are considered to be card rows.


