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
const multer = require("multer");

const errorController = require("./controllers/error");
const User = require("./models/user");

const app = express();

const store = new MongoDBStore({
  uri: URI2,
  collection: "session",
});
const csrfProtecttion = csrf();

// configuration object
//  Disk storage is in the end a storage engine which you can use with multer
// It takes two keys, it takes the destination and it takes the file name.
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images"); // null if its error or empty
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});

// filter function to filter incoming file before it save through its file type.
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true); // null as an error and true if want to accept the file.
  } else {
    cb(null, false); // false means file not accepted.
  }
};

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
app.use(bodyParser.urlencoded({ extended: false })); // urlencoded refers to text data/input.

//initialize multer and setup a middleware to parse text and binary data from the request object.
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

// this is a static middleware where you can serve files statically in express.js. files like css, image etc.
app.use(express.static(path.join(__dirname, "public")));
// and the reason for that is that express assumes that the files in the images folder are served as if they were in the root folder, so slash nothing.
// if we have a request that goes to /images, that starts with /images, then serve these files statically and now /images is the folder we assume for this static serving
app.use("/images", express.static(path.join(__dirname, "images")));

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
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      // throw new Error("Dummy");
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    // catch block will only fires if any technical issues occur. if the database is down. etc.
    .catch((err) => {
      next(new Error(err));
    });
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
  // res.redirect("/500");
  res.status(500).render("500", {
    pageTitle: "Error",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
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
