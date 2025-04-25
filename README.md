# Cardographer platform components

A web platform for creating, using and analysing pre-defined concept cards, e.g. ideation cards. 
Developed at the University of Nottingham and supported by UKRI-funded Horizon projects [Grant Numbers EP/T022493/1 and EP/V00784X/1].

Copyright © The University of Nottingham, 2021-2024. [MIT License](LICENSE)

See [the wiki](https://github.com/MixedRealityLab/cardographer-platform/wiki)
for user documentation, and [examples](). 

Can be used with
- [miro](docs/miro.md) - working
- simple built-in web app view of cards

(A prototype [unity](docs/unity.md) client exists but is not integrated or supported: [cardographer virtual tabletop](https://github.com/MixedRealityLab/cardographer-tabletop))

There is a public instance currently (December 2024) hosted at [https://cardographer.cs.nott.ac.uk/platform]() for interested researchers, but we would encourage you to set up your own instance for long-term use.

## Build

Note, requires [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/).
(e.g. `vagrant up` - see [Vagrantfile](Vagrantfile))

See `Dockerfile` or `src/docker/dev/Dockerfile`.

## Configuration

Copy `server.env` to `server.env.local` (or whatever location you will use for environment vars).

- Set `SMTP_...` (email) sending settings (unless you are going to check the logs for password reset URLs).
- Set `ADMIN_USERS` to email address(es) of initial/default admin users.
- Set `REGISTER_CODE` if you want new users to have to provide this code in order to register (rather than just validate their email).

You may also need to set `ORIGIN` to the external server URL to avoid CSRF errors,
e.g. `ORIGIN=http://localhost:3000`.

## Run

### Running Server Locally

Dev build/run (with default docker-compose.yml):
```
sudo docker-compose up -d --build
```
Open [http://localhost:3000](http://localhost:3000).
Configuration is loaded from `server.env` as per [docker-compose.yaml](docker-compose.yaml)

Note, the server needs to be able to send (forward) email for password recovery.
See SMTP_... config in `server.env`

If you start it from the default [docker-compose.yml]() then mongo-express is accessible on [http://localhost:8081]();
authenticated with username & password 'mongo'. 

See information on user accounts/types below.

### Running production build

With the websocket support, the production build and the dev build integrate
websockets differently.
If you want/need to test the production integration version then you can
build it:
```
sudo docker build --tag cardographer .
```
And run it for local use (on port 3000):
```
sudo docker run --rm --name platform --network cardographer-platform_default -p 3000:3000 --env-file server.env.local -v cardographer-platform_uploads:/app/uploads -e ORIGIN=http://localhost:3000 cardographer
```
Or if using via Nginx,
```
sudo docker run --rm --name platform --network cardographer-platform_default -p 3000:3000 --env-file server.env.local -v cardographer-platform_uploads:/app/uploads -e ORIGIN=http://localhost cardographer
```
and `http://localhost`

### Testing with Miro locally

In your chosen miro team, open your profile settings, select "your apps" tab,
and "+Create new app" and give it a name (e.g. "cardographer local dev"). 
Give it permission `board:read` and `board:write`
and set the "App URL" to [http://localhost:3000/miro.html](http://localhost:3000/miro.html),
or [http://localhost/miro.html](http://localhost/miro.html) if using nginx/port 80.

Then "Install app and get OAuth token", or copy and paste the 
Share app "Installation URL", and agree.

Note, this probably won't work from an Incognito browser because of cookies 
being blocked (often).

It is also not possible to add cards to the board from the locally hosted plugin
(because the public miro server cannot access the local URLs to access the card images).
As a workaround you can copy the image onto the board and manually change the miro image name to the card ID.

## Users

### Admins

Note, the pre-configured emails (in `ADMIN_USERS`) will always automatically be assigned admin status.
An admin can set/clear the admin status of other users. 

But note that being admin does to automatically give you "deck builder" and/or "publisher" status (see below).
But as an admin you can change these settings for yourself:
- log in & go to the "Users" tab; 
- select a user (or your highlighted) entry; 
- enable deck builder/publisher/admin options as appropriate and Save.

Note, you can also disable users, i.e. prevent them from logging in.

### Deck Builders

By default users cannot create decks, only sessions & analyses.
An admin needs to enable "deck builder" for a user before they can create (new) decks.

### Publishers

By default users cannot make decks, sessions or analyses public (i.e. visible to other users).
An admin needs to enable "publisher" for the user before they can make things public. 

Also note that all users - including Admins - have quotas for numbers of decks, sessions, etc.
Admin users can increase quotas for any user in the corresponding user's settings page (from the "Users" tab).
