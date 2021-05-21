# Tests

## test data

(change server name as required)
```
sudo docker exec -it vagrant_mongo_1 mongo
```

A card deck summary:
```
use cardographer-platform-1
db.CardDeckSummaries.insertOne({
  _id:"609d13dfd045c0786d2557bf",
  name:"Databox", description: "chris test cards",
  isPublic: true, owners:["testuser"],
  currentRevision: 1
});
db.CardDeckRevisions.insertOne({
  _id:"609d13dfd045c0786d2557bf:1", deckId:"609d13dfd045c0786d2557bf",
  revision:1, deckName:"Databox", deckDescription:"chris test cards",
  deckCredits:"Chris Greenhalgh", created:"2021-05-14T14:48:00Z",
  lastModified: "2021-05-14T14:48:00Z", revisionName:"initial",
  revisionDescription:"first version", isUsable:false, isPublic:true,
  isLocked:true, isTemplate:true, cardCount: 0,
  propertyDefs:[
    {use:"id",title:"ID",sortBy:0},
    {use:"name",title:"title",sortBy:1},
    {use:"content",title:"description",sortBy:2},
    {use:"assetFile",title:"icon",sortBy:3},
    {use:"category",title:"group",sortBy:4},
    {use:"width"},
    {use:"height"}
  ],
  cards:[]
});
db.CardDeckRevisions.updateOne({_id:"609d13dfd045c0786d2557bf:1"},{$set:{
  build: {
    builderId:"squib", builderName:"Squib", config: {}, status: "unbuilt",
    isDisabled: false
  }
}})
```

You need to register "testuser" - make sure `REGISTER_CODE` is
set in `server.env`.

See test data, [data/databox-health.csv](data/databox-health.csv).

Select Deck & Revision, 
Upload sample CSV file to set/update propertyDefs, defaults and create cards.

See also [authoring.md](authoring.md) for spreadsheet format.

## Squib worker test

```
sudo docker-compose up squib
```
(change name(s) 'vagrant_...' as appropriate)
```
sudo docker exec -it vagrant_squib_1 /bin/sh
```
```
cd uploads
mkdir -p 609d13dfd045c0786d2557bf/1
cd 609d13dfd045c0786d2557bf/1
wget https://github.com/cgreenhalgh/databox-health-cards/archive/refs/heads/master.zip
unzip master.zip
(cd databox-health-cards-master; mv deck.rb layout.yml config.yml icons ..)
cp databox-health-cards-master/card-data.csv card-data.csv
rm -rf databox-health-cards-master
mkdir -p _output
```

```
sudo docker inspect --format='{{.NetworkSettings.Networks.vagrant_default.IPAddress}}' vagrant_squib_1
```
=> IP
```
telnet IP 3001
```
```
rundeck/1 609d13dfd045c0786d2557bf/1
```

