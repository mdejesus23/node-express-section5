const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();

const errorController = require("./controllers/error");
const { mongoConnect } = require("./util/database");
const User = require("./models/user");

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

app.use(async (req, res, next) => {
  // try {
  //   const user = await User.findById("64c91b47cc405b9691b9f91c")
  //   req.user = user;

  // } catch(err) {
  //   console.log(err);
  // }
  User.findById("64c91b47cc405b9691b9f91c")
    .then((user) => {
      // user is the user object we find in the user models that came from the database.
      req.user = new User(user.name, user.email, user.cart, user._id);
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

mongoConnect(() => {
  app.listen(3000);
});
