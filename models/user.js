const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          // refer to product model.
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    // use toString to convert type and match both.
    return cp.productId.toString() === product._id.toString();
  });

  //default product quantity.
  let newQuantity = 1;
  // create a copy of the cart.items array.
  const updatedCartItems = [...this.cart.items];

  // check if the product already exist in the cart then add quantity if its true.
  if (cartProductIndex >= 0) {
    // updating the quantity of an existing product.
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });

  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart.items = [];
  return this.save();
};

module.exports = mongoose.model("User", userSchema);

// const mongodb = require("mongodb");
// const { getDb } = require("../util/database");

// class User {
//   constructor(username, email, cart, id) {
//     this.name = username;
//     this.email = email;
//     this.cart = cart; // {items: []}
//     this._id = id;
//   }

//   save() {
//     // I'll call get db to store my database client in that constant.
//     const db = getDb();

//     db.collection("user")
//       .insertOne(this)
//       .then((result) => {
//         console.log(result);
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }

//   addToCart(product) {
//     const cartProductIndex = this.cart.items.findIndex((cp) => {
//       // use toString to convert type and matche both.
//       return cp.productId.toString() === product._id.toString();
//     });

//     //default product quantity.
//     let newQuantity = 1;
//     // create a copy of the cart.items array.
//     const updatedCartItems = [...this.cart.items];

//     // check if the product already exist in the cart then add quantity if its true.
//     if (cartProductIndex >= 0) {
//       newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//       updatedCartItems[cartProductIndex].quantity = newQuantity;
//     } else {
//       updatedCartItems.push({
//         productId: new mongodb.ObjectId(product._id),
//         quantity: newQuantity,
//       });
//     }

//     const db = getDb();
//     // it updates the user in the users collection using _id;
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new mongodb.ObjectId(this._id) },
//         { $set: { cart: { items: updatedCartItems } } }
//       );
//   }

//   // get cart return all the proucts in the user's cart
//   getCart() {
//     const db = getDb();
//     const productsIds = this.cart.items.map((item) => item.productId);
//     return (
//       db
//         .collection("products")
//         .find({ _id: { $in: productsIds } })
//         .toArray()
//         // So in this then method, I'll have all my product data, an array of products for the products that were in my cart.
//         .then((products) => {
//           // map in every products in the array and return an array of objects with additional document/property named quantity.
//           return products.map((prod) => {
//             // I'll return a new object for every product which is fine because every product is an object
//             return {
//               // copy all the old product properties or keep all the data i retrieve.
//               ...prod,
//               // and add new property named quantity
//               quantity: this.cart.items.find((item) => {
//                 // this will return the product objects that will match
//                 return item.productId.toString() === prod._id.toString();
//                 // and choose only the quantity property.
//               }).quantity,
//             };
//           });
//         })
//     );
//   }

//   async deleteItemCart(prodId) {
//     try {
//       const updatedCartItems = this.cart.items.filter((item) => {
//         return item.productId.toString() !== prodId.toString();
//       });

//       const db = getDb();
//       return db
//         .collection("users")
//         .updateOne(
//           { _id: new mongodb.ObjectId(this._id) },
//           { $set: { cart: { items: updatedCartItems } } }
//         );
//     } catch (err) {
//       console.log(err);
//     }
//   }

//   async addOrder() {
//     // reaching out to my database client.
//     const db = getDb();
//     return this.getCart()
//       .then((products) => {
//         const order = {
//           items: products,
//           user: {
//             _id: new mongodb.ObjectId(this._id),
//             name: this.name,
//           },
//         };
//         return db.collection("orders").insertOne(order);
//       })
//       .then((result) => {
//         this.cart = { items: [] };
//         return db
//           .collection("users")
//           .updateOne(
//             { _id: new mongodb.ObjectId(this._id) },
//             { $set: { cart: { items: [] } } }
//           );
//       });
//   }

//   getOrders() {
//     const db = getDb();
//     return db
//       .collection("orders")
//       .find({ "user._id": new mongodb.ObjectId(this._id) })
//       .toArray();
//   }

//   static async findById(userId) {
//     try {
//       const db = getDb();
//       const user = await db
//         .collection("users")
//         .findOne({ _id: new mongodb.ObjectId(userId) });
//       console.log(user);
//       return user;
//     } catch (err) {
//       console.log(err);
//     }
//   }
// }

// module.exports = User;
