const path = require("path");

const URI2 = require("./uri").URI;

//URI for version 2.2 insert "shop" database name in the URI to connect to shop database by default.
// let URI = `mongodb://${username}:${password}@ac-gjryfep-shard-00-00.qs0hxbq.mongodb.net:27017,ac-gjryfep-shard-00-01.qs0hxbq.mongodb.net:27017,ac-gjryfep-shard-00-02.qs0hxbq.mongodb.net:27017/shop?ssl=true&replicaSet=atlas-u4kb2r-shard-0&authSource=admin&retryWrites=true&w=majority`;

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("express-flash");

const app = express();

const store = new MongoDBStore({
  uri: URI2,
  collection: "session",
});
const csrfProtecttion = csrf();

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

// setup another middleware to initialize session.
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtecttion);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    // catch block will only fires if any technical issues occur. if the database is down. etc.
    .catch((err) => {
      throw new Error(err);
    });
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// adding filter routes that starts with /admin
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

// .use is use to catch all middleware. to catch all types of request method.
app.use(errorController.get404);

// error handler middleware takes 4 arguments which express detect
// it will execute and skip all other middleware if you call next(error) wit error object pass to it.
// if we have more than one-handling middleware they execute from top to bottom.
app.use((error, req, res, next) => {
  res.redirect("/500");
});

mongoose
  .connect(URI2)
  .then((result) => {
    app.listen(3000, () => {
      console.log("app is running!");
    });
  })
  .catch((err) => {
    console.log(err);
  });
