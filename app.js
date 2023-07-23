const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

const errorController = require("./controllers/error");

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

// adding filter routes that starts with /admin
app.use("/admin", adminRoutes);
app.use(shopRoutes);

// .use is use to catch all middleware. to catch all types of request method.
app.use(errorController.get404);

app.listen(3000);
