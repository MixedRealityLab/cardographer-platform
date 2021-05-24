# Cardographer platform components

Cardographer version 2 server stuff.
Will supercede [cardographer-web](https://github.com/ktg/cardographer-web).
That's the theory, anyway.

The University of Nottingham, 2021.

Status: deck and revision editing and initial card generation

See
- [docs/authoring.md](docs/authoring.md)
- [docs/datamodel.md](docs/datamodel.md)
- [docs/todo.md](docs/todo.md)
- [docs/api.md](docs/api.md)

## Build

Note, requires docker and docker-compose.
(e.g. `vagrant up` - see [Vagrantfile](Vagrantfile))

Copy server.env to server.env.local and change REGISTER_CODE
(for site sign-up).

### Dev

```
sudo docker-compose build server
sudo docker-compose up -d mongo
sudo docker-compose up -d squib
sudo docker-compose up server
```
Open [http://localhost:3000](http://localhost:3000)

Notes:
- had trouble with Mongodb client using node:alpine base (error
  about require of mongodb-client-encryption; tried to install but
  that failed).

### Bootstrap Data

see [docs/test.md](docs/test.md)

### Production

Note, set PRODUCTION_BASE to '' in svelte.config.js
for direct use.

```
sudo docker-compose build prod
sudo docker-compose up -d prod
```
(or equivalent)

Still runs on :3000 by default.

### With nginx

Note, set PRODUCTION_USE to 'cardographer2' (or whatever)
in svelte.config.js (note, nginx config has to match).
```
sudo docker-compose up -d nginx
```

try localhost:8080/cardographer2/

Note, there seem to be problems with base handling, at least with the 
node adapter.
I've hacked in a fix in src/lib/paths.ts which works atm for running
the built server directly.
But I've seen different outcomes running it via preview.
Generally the issue(s) are 404s in the client navigation and/or
server vs client fetches.
Having troube with '.' and '..' paths in node-adapter version 
(losing base).
Also, built verion won't serve new files from static - configure front-end
to serve .../uploads/... directly!
Having any base set with sveltekit dev doesn't seem to work atm (1.0.0).

