# Cardographer platform components

Cardographer server stuff. Deck editing and session analysis. 
© The University of Nottingham, 2021.

See
- [docs/authoring.md](docs/authoring.md)
- [docs/datamodel.md](docs/datamodel.md)
- [docs/todo.md](docs/todo.md)
- [docs/api.md](docs/api.md)

potentially used with
- [miro](docs/miro.md)
- [unity](docs/unity.md)

## Build

Note, requires [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/).
(e.g. `vagrant up` - see [Vagrantfile](Vagrantfile))

### Running Server Locally

```
sudo docker-compose up -d --build
```
Open [http://localhost:3000](http://localhost:3000).
Registration code is 1234, but can be changed in [docker-compose.yaml](docker-compose.yaml)

Notes:
- had trouble with Mongodb client using node:alpine base (error
  about require of mongodb-client-encryption; tried to install but
  that failed).
