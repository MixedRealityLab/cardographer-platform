# Unity client

## Background

Unity client, inspired by table top simulator.

## Approach

Planning to run a (initially) single headless server instance on
the cardographer host, within a docker container.
The webgl client will be served from the same machine (web frontend).
It connects to the server using Websockets (via the reverse proxy).

The server will support multiple visibility-scoped "rooms". Each
session will be a different room.
Room state will be persisted in a server file (probably JSON).
This will include board and card state.

To manage server load, access control will use a version of the 
[timed ticket authorisation](https://github.com/cgreenhalgh/unity-timed-ticket-authenticator).
Hmm, but that would mean a new URL for each scheduled session. 
So you'd always have to go in via the web portal. 
But I guess that would be OK...
Otherwise the unity server will need to check the current schedule
each time a client connects.

The unity server would still need to know room capacity, to handle kicking
users with unallocated seats with lower-priority tickets and to limit 
maximum load/occupancy with unallocated seats.
(Unless it is in the ticket.)

A specific seat or group (0?) could correspond to room owner permission.

The ticket system requires a shared secret between the unity server
and the web server (for signing).

From a room's ID the unity server will need to be able to:
- load an existing state snapshot (=file ?!), and 
- determine what decks (and boards?) to allow loading of (=URL path el.?)

To duplicate a room the web server will need to be able to copy 
the persistence file.

The web server would like to know when a session changes phase, or ends,
so that a snapshot can be made. 
Presumably the snapshot be based on the unity server persistent file
(as long as it isn't being changed at the time!).

The client will get the room ID and ticket in the scheduled session URL.
Maybe the user will just enter temporary name/initials when joining?

## Integration Options

Maybe (like squib) the unity server will share a file volume with the web
server, which will give the web server access to persistence files
(to duplicate rooms, configure rooms (e.g. capacity, title, other metadata)
and read snapshots).

And the unity server could host a simple TCP server if more timely
interaction was required, e.g. timely notifications.

The unity client can read deckinfo based on room ID (from web server).
The unity client can also have a 'snapshot' command/option.

## Ticket info

- ticket version
- room ID
- seat/group number (0=owner?)
- seat/group size (max)
- start time
- duration
- signature

