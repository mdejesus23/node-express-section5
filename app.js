const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

// import
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

// parsing middleware. it is use to parse data from form request
app.use(bodyParser.urlencoded({ extended: false }));
// this is a static middleware where you can serve files statically in express.js
app.use(express.static(path.join(__dirname, "public")));

// adding filter routes that starts with /admin
app.use("/admin", adminRoutes);
app.use(shopRoutes);

// .use is use to catch all middleware. to catch all types of request method.
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});

app.listen(3000);
