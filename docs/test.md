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
  name:"Databox", description: "chris test cards",
  isPublic: true, owners:["chris.greenhalgh@nottingham.ac.uk"]
});
```

