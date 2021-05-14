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
  isPublic: true, owners:["chris.greenhalgh@nottingham.ac.uk"]
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
```

