# Squib worker

Using [squib](https://github.com/andymeneely/squib/)

Meant to be handle running squib to generate cards from a squib
plugin in cardographer-platform.

Built/run from ../../docker-compose.yml

## design notes

quick hack - TCP server, port 3001.
Reads 1 line with "rundeck/1" directory (in uploads/)
tries to run ruby <dir>/deck.rb and return output.
Returns output.
