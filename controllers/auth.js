const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: false,
  });
};

exports.postLogin = (req, res, next) => {
  User.findById("64dccdc57b56c3f24510a4a9")
    .then((user) => {
      // user is the user object we find in the user models that came from the database.
      // by setting the user on the session we share it across request and its not valid for a single request.
      req.session.user = user;
      req.session.isLoggedIn = true;
      res.redirect("/");
    })
    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  // this is a method provided with out session package we are using.
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};
