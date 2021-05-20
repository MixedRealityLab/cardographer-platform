# Cardographer platform components

Cardographer version 2 server stuff.
Will supercede [cardographer-web](https://github.com/ktg/cardographer-web).
That's the theory, anyway.

The University of Nottingham, 2021.

Status: revision editing and initial card generation

See
- [docs/authoring.md](docs/authoring.md)
- [docs/datamodel.md](docs/datamodel.md)
- [docs/todo.md](docs/todo.md)
- [docs/api.md](docs/api.md)

## Build

Note, requires docker and docker-compose.
(e.g. `vagrant up` - see [Vagrantfile](Vagrantfile))

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

### Test Data

see [docs/test.md](docs/test.md)
