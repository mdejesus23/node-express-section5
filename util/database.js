const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

const username = "dejesusmelnard";
const password = "test123";

// the underscore is only here to signal that this will only be used internally in this file.
let _db;

//URI for version 2.2
let uri = `mongodb://${username}:${password}@ac-gjryfep-shard-00-00.qs0hxbq.mongodb.net:27017,ac-gjryfep-shard-00-01.qs0hxbq.mongodb.net:27017,ac-gjryfep-shard-00-02.qs0hxbq.mongodb.net:27017/shop?ssl=true&replicaSet=atlas-u4kb2r-shard-0&authSource=admin&retryWrites=true&w=majority`;

const mongoConnect = (callback) => {
  MongoClient.connect(uri)
    .then((client) => {
      console.log("connected");
      _db = client.db();
      callback();
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw "No database found!";
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
