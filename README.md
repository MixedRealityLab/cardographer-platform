# Cardographer platform components

Cardographer server stuff. Deck editing and session analysis. Currently hosted at [https://cardographer.cs.nott.ac.uk/platform]() for University of Nottingham staff.

© The University of Nottingham, 2021-2022.

See [the wiki](https://github.com/MixedRealityLab/cardographer-platform/wiki)
for user documentation, and [examples](). 

Can be used with
- [miro](docs/miro.md) - working
- [unity](docs/unity.md) - soon, in particular [cardographer virtual tabletop](https://github.com/MixedRealityLab/cardographer-tabletop)

## Build

Note, requires [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/).
(e.g. `vagrant up` - see [Vagrantfile](Vagrantfile))

### Running Server Locally

```
sudo docker-compose up -d --build
```
Open [http://localhost:3000](http://localhost:3000).
Registration code is 1234, but can be changed in [docker-compose.yaml](docker-compose.yaml)

Note, the server needs to be able to send (forward) email for password recovery.