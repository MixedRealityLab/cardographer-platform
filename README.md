# Cardographer platform components

Cardographer server stuff. Deck editing and session analysis. Currently hosted at [https://cardographer.cs.nott.ac.uk/platform]() 

© The University of Nottingham, 2021.

See
- [docs/authoring.md](docs/authoring.md)

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
