const path = require("path");

const username = "dejesusmelnard";
const password = "test123";

//URI for version 2.2 insert "shop" database name in the URI to connect to shop database by default.
let URI = `mongodb://${username}:${password}@ac-gjryfep-shard-00-00.qs0hxbq.mongodb.net:27017,ac-gjryfep-shard-00-01.qs0hxbq.mongodb.net:27017,ac-gjryfep-shard-00-02.qs0hxbq.mongodb.net:27017/shop?ssl=true&replicaSet=atlas-u4kb2r-shard-0&authSource=admin&retryWrites=true&w=majority`;

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const app = express();

const store = new MongoDBStore({
  uri: URI,
  collection: "session",
});

const errorController = require("./controllers/error");
const User = require("./models/user");

// the "view engine" is a special configuration to set ejs as a template engine.
// a reserved confituration key which is understood by express.js
app.set("view engine", "ejs");
// this is to tell engine where to be found the template.
app.set("views", "views");

// import
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

// parsing middleware. it is use to parse data from form the request
app.use(bodyParser.urlencoded({ extended: false }));

// this is a static middleware where you can serve files statically in express.js. files like css, image etc.
app.use(express.static(path.join(__dirname, "public")));

// setup another middle to initialize session.
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// adding filter routes that starts with /admin
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// .use is use to catch all middleware. to catch all types of request method.
app.use(errorController.get404);

mongoose
  .connect(URI)
  .then((result) => {
    User.findOne().then((user) => {
      if (!user) {
        const user = new User({
          name: "Melnard",
          email: "dejesusmelnard@gmail.com",
          cart: {
            items: [],
          },
        });
        user.save();
      }
    });
    app.listen(3000, () => {
      console.log("app is running!");
    });
  })
  .catch((err) => {
    console.log(err);
  });
