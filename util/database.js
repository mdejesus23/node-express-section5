const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

const username = "dejesusmelnard";
const password = "test123";

// the underscore is only here to signal that this will only be used internally in this file.
let _db;

//URI for version 2.2 insert "shop" database name in the URI to connect to shop database by default.
let uri = `mongodb://${username}:${password}@ac-gjryfep-shard-00-00.qs0hxbq.mongodb.net:27017,ac-gjryfep-shard-00-01.qs0hxbq.mongodb.net:27017,ac-gjryfep-shard-00-02.qs0hxbq.mongodb.net:27017/shop?ssl=true&replicaSet=atlas-u4kb2r-shard-0&authSource=admin&retryWrites=true&w=majority`;

// The mongoConnect function is defined to establish a connection to the MongoDB database.
const mongoConnect = (callback) => {
  // When you call MongoClient.connect(uri), it establishes a connection to the MongoDB Atlas cluster using the provided connection URI.
  MongoClient.connect(uri)
    .then((client) => {
      console.log("connected");
      // The client.db() method is used to obtain a reference to the connected MongoDB database.
      // you can pass string argument to the client.db() method to connect to a different database else
      // you will be connected to the default database in the part of the URI.
      _db = client.db();
      callback();
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};
//  is used to access the connected database instance and store it in the _db variable.
const getDb = () => {
  if (_db) {
    return _db;
  }
  throw "No database found!";
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
