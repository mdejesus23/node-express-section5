const mongodb = require("mongodb");
const { getDb } = require("../util/database");

class User {
  constructor(username, email, cart, id) {
    this.name = username;
    this.email = email;
    this.cart = cart; // {items: []}
    this._id = id;
  }

  save() {
    // I'll call get db to store my database client in that constant.
    const db = getDb();

    db.collection("user")
      .insertOne(this)
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  addToCart(product) {
    const cartProductIndex = this.cart.items.findIndex((cp) => {
      // use toString to convert type and matche both.
      return cp.productId.toString() === product._id.toString();
    });

    //default product quantity.
    let newQuantity = 1;
    // create a copy of the cart.items array.
    const updatedCartItems = [...this.cart.items];

    // check if the product already exist in the cart then add quantity if its true.
    if (cartProductIndex >= 0) {
      newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        productId: new mongodb.ObjectId(product._id),
        quantity: newQuantity,
      });
    }

    const db = getDb();
    // it updates the user in the users collection using _id;
    return db
      .collection("users")
      .updateOne(
        { _id: new mongodb.ObjectId(this._id) },
        { $set: { cart: { items: updatedCartItems } } }
      );
  }

  getCart() {
    const db = getDb();
    const productsIds = this.cart.items.map((item) => item.productId);
    // and now I don't pass an ID here because I'm not looking for a single ID
    // instead I pass an object because this allows me to use some special mongodb query operators of
    // which there are many covered in detail in my mongodb course or in the official docs of course but
    // toArray() is used to easily convert that into javascript array.
    return (
      db
        .collection("products")
        // we are looking for the $in operator. And this operator takes an array of IDs
        // return array of products wrap as a promise receive in the then blocks as asynchronous
        // therefore every ID which is in the array will be accepted and will get back a cursor which holds references to
        // all products with one of the IDs mentioned in this array.
        .find({ _id: { $in: productsIds } })
        .toArray()
        // So in this then method, I'll have all my product data, an array of products for the products that were in my cart.
        .then((products) => {
          // map in every products in the array and return an array of objects with additional document/property named quantity.
          return products.map((prod) => {
            // I'll return a new object for every product which is fine because every product is an object
            return {
              // copy all the old product properties or keep all the data i retrieve.
              ...prod,
              // and add new property named quantity
              quantity: this.cart.items.find((item) => {
                // this will return the product objects that will match
                return item.productId.toString() === prod._id.toString();
                // and choose only the quantity property.
              }).quantity,
            };
          });
        })
    );
  }

  async deleteItemCart(prodId) {
    try {
      const updatedCartItems = this.cart.items.filter((item) => {
        return item.productId.toString() !== prodId.toString();
      });

      const db = getDb();
      return db
        .collection("users")
        .updateOne(
          { _id: new mongodb.ObjectId(this._id) },
          { $set: { cart: { items: updatedCartItems } } }
        );
    } catch (err) {
      console.log(err);
    }
  }

  async addOrder() {
    // reaching out to my database client.
    const db = getDb();
    return db
      .collection("orders")
      .insertOne(this.cart)
      .then((result) => {
        this.cart = { items: [] };
        return db
          .collection("users")
          .updateOne(
            { _id: new mongodb.ObjectId(this._id) },
            { $set: { cart: { items: [] } } }
          );
      });
  }

  static async findById(userId) {
    try {
      const db = getDb();
      const user = await db
        .collection("users")
        .findOne({ _id: new mongodb.ObjectId(userId) });
      console.log(user);
      return user;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = User;
