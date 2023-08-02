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
    // product details that will store in the cart document in the users collection mongodb.
    const updatedCart = {
      items: updatedCartItems,
    };
    const db = getDb();
    // it updates the user in the users collection using _id;
    return db
      .collection("users")
      .updateOne(
        { _id: new mongodb.ObjectId(this._id) },
        { $set: { cart: updatedCart } }
      );
  }

  getCart() {
    const db = getDb();
    const productsIds = this.cart.items.map((item) => item.productId);
    // and now I don't pass an ID here because I'm not looking for a single ID
    // instead I pass an object because this allows me to use some special mongodb query operators of
    // which there are many covered in detail in my mongodb course or in the official docs of course but
    // we are looking for the $in operator. And this operator takes an array of IDs and therefore
    // toArray() is used to easily convert that into javascript array.
    return (
      db
        .collection("products")
        .find({ _id: { $in: productsIds } })
        .toArray()
        // return array of products wrap as a promise receive in the then blocks as asynchronous
        .then((products) => {
          // map in every products in the array and return an array of objects with additional document/property named quantity.
          return products.map((prod) => {
            return {
              // copy all the old product properties
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
