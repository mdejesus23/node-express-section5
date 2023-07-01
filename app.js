const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "pug");
app.set("views", "views");

// import
const adminData = require("./routes/admin");
const shopRoutes = require("./routes/shop");

// parsing middleware. it is use to parse data from form request
app.use(bodyParser.urlencoded({ extended: false }));
// this is a static middleware where you can serve files statically in express.js
app.use(express.static(path.join(__dirname, "public")));

// adding filter routes that starts with /admin
app.use("/admin", adminData.routes);
app.use(shopRoutes);

// .use is use to catch all middleware. to catch all types of request method.
app.use((req, res, next) => {
  res.status(404).render("404", { pageTitle: "Page Not Found!" });
});

app.listen(3000);
