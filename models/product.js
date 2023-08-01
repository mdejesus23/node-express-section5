const mongodb = require("mongodb");
const { getDb } = require("../util/database");

class Product {
  constructor(title, price, description, imageUrl, id, userId) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    // new mongodb.ObjectId(id) is used to convert the this_id property of the product instance into a valid ObjectId.
    // use ternary operator to check if the id is undefined and assign null value else convert it to valid ObjectId
    this._id = id ? new mongodb.ObjectId(id) : null;
    this.userId = userId;
  }

  save() {
    // db is used to access the connected database instance.
    const db = getDb();
    let dbOp;
    if (this._id) {
      // updateOne update only 1 element
      dbOp = db
        .collection("products")
        // updateOne takes atleast 2 args, 1. filter that defines which elem/doc we want to update. 2. we specify how we update.
        // $set is a special property understand by mongodb
        .updateOne({ _id: this._id }, { $set: this });
    } else {
      dbOp = db.collection("products").insertOne(this);
    }
    return dbOp
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static async fetchAll() {
    // db is used to access the connected database instance.
    // const db = getDb();

    // return db
    //   .collection("products")
    //   .find()
    //   .toArray()
    //   .then((products) => {
    //     console.log(products);
    //     return products;
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });

    try {
      const db = getDb();
      const products = await db.collection("products").find().toArray();
      // console.log(products);
      return products;
    } catch (err) {
      console.log(err);
    }
  }

  static async findById(prodId) {
    // db is used to access the connected database instance.
    // const db = getDb();

    // return db
    //   .collection("products")
    //   .find({
    //     // converts prodId to a valid ObjectId prop in mongodb.
    //     _id: new mongodb.ObjectId(prodId),
    //   })
    //   .next()
    //   .then((product) => {
    //     console.log(product);
    //     return product;
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });

    try {
      const db = getDb();
      const product = await db
        .collection("products")
        .find({ _id: new mongodb.ObjectId(prodId) })
        .next();
      console.log(product);
      return product;
    } catch (err) {
      console.log(err);
    }
  }

  static async deleteById(prodId) {
    try {
      const db = getDb();
      await db
        .collection("products")
        .deleteOne({ _id: new mongodb.ObjectId(prodId) });

      console.log("deleted!");
    } catch (err) {
      console.log(err);
    }

    // const db = getDb();
    // return db
    //   .collection("products")
    //   .deleteOne({ _id: new mongodb.ObjectId(prodId) })
    //   .then((result) => {
    //     console.log("deleted!");
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  }
}

module.exports = Product;
