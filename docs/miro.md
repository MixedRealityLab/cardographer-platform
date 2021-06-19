# Miro

Notes on use with [miro](https://miro.com).

## Background

A Miro board has a URL like
`https://miro.com/app/board/o9J_lBChv3M=/`
which will open the view in a browser (after login).

There are options in the Miro web interface to create a new
board or duplicate an existing board.

Miro has an HTTP API and uses oauth2. 
An app created in Miro can be shared directly with users (via an
authorization link).
Apparently it is installed in their team, but each user needs to
authorize it independently.

The HTTP API allows a board to be created, but probably only 
empty. And since you can't add images via the HTTP API you can't pre-
populate it. However with the Javascript
API (i.e. board plugin) can create images from a URL at least.
(Possibly equivalent to the Upload... Upload via URL command.)

The browser and http APIs allow all widgets to be listed but don't
make visible the link from image widget to image file. The HTTP API also 
don't allow image widgets to be added or edited.

Note, sort order isn't visible in board export. 
Although js API has send to front/back operations.

## Integration Options

- Miro HTTP API - requires Oauth; could pull board state from miro; 
  cannot create images; could create (empty) boards.
- Web plugin - could push board state to cardographer (auth??); could
  create images? (TBC); could read deck info from cardographer.

A web plugin will be needed to create/manipulate images for boards
and cards.
Cardographer should host the web plugin.
Will need to enter board ID/URL manually for existing boards or boards
which are duplicated or without HTTP API integration.

