const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();

const errorController = require("./controllers/error");
const sequelize = require("./util/database");
const Product = require("./models/product");
const User = require("./models/user");
const Cart = require("./models/cart");
const CartItem = require("./models/cart-item");
const Order = require("./models/order");
const OrderItem = require("./models/order-item");

// the "view engine" is a special configuration to set ejs as a template engine.
// a reserved confituration key which is understood by express.js
app.set("view engine", "ejs");
// this is to tell engine where to be found the template.
app.set("views", "views");

// import
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

// parsing middleware. it is use to parse data from form request
app.use(bodyParser.urlencoded({ extended: false }));
// this is a static middleware where you can serve files statically in express.js. files like css, image etc.
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  User.findByPk(1)
    .then((user) => {
      // sequelize user object
      req.user = user;
      next();
    })
    .catch((err) => {
      console.log(err);
    });
});

// adding filter routes that starts with /admin
app.use("/admin", adminRoutes);
app.use(shopRoutes);

// .use is use to catch all middleware. to catch all types of request method.
app.use(errorController.get404);

// Defining Association / relation between tables / database
Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

User.sequelize
  // .sync({ force: true })
  .sync()
  .then((result) => {
    return User.findByPk(1);
    // console.log(result);
  })
  .then((user) => {
    if (!user) {
      return User.create({ name: "mel", email: "test@gmail.com" });
    }
    // if you return a value in a then block, it is automatically wrapped into a new promise.
    return user;
  })
  .then((user) => {
    // console.log(user);
    return user.createCart();
  })
  .then((cart) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
