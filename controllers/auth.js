const bcrypt = require("bcryptjs");
// this is a library that help us with creating secure unique random values and other things.
const crypto = require("crypto"); // built-in node.js module. provides cryptographic functionality.

const apiKey = require("../uri").apiKey;
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
// validation result will be a function that allows us to gather all the errors prior validation middleware might have stored.
// like the one we setup in the auth router
const { validationResult } = require("express-validator");

const User = require("../models/user");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: apiKey,
    },
  })
);

exports.getLogin = (req, res, next) => {
  let message = req.flash("error").join("");
  // if (message.length > 0) {
  //   message = message[0];
  // } else {
  //   message = null;
  // }

  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error").join("");

  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: null,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: { email: email, password: password },
      validationErrors: errors.array(),
    });
  }

  // user is the user object we find in the user models that came from the database.
  // by setting the user on the session we share it across request and its not valid for a single request.
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        // req.flash("error", "Invalid email or password.");
        // console.log(req.flash("error"));
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password.",
          oldInput: { email: email, password: password },
          validationErrors: [],
        });
      }

      // if email input exist on the database will proceed below.
      bcrypt
        .compare(password, user.password)
        // the then block will execute wheater the compare method matched or not matched
        .then((doMatch) => {
          // console.log(doMatch);
          // in this point user exist and check password if match
          if (doMatch) {
            req.session.user = user;
            req.session.isLoggedIn = true;
            return req.session.save((err) => {
              // console.log(err);
              console.log("post login runs");
              res.redirect("/");
            });
          }
          // if password didn't match
          res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password.",
            oldInput: { email: email, password: password },
            validationErrors: [],
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
  // the password we extracted and want to check from our request body and the hashed value of the existing user.
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  // const confirmPass = req.body.confirmPassword;
  const errors = validationResult(req); // collect errors in the middleware thru request.
  if (!errors.isEmpty()) {
    // error status code
    // console.log(errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }
  // first argument is the string you want to hash
  // The second argument then is the salt value, 12 is accepted as highly secured.
  // it is asynchronous task which gives us a promise object.
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      // redirected immediately to login page without waiting for the email to be sent
      res.redirect("/login");
      return transporter.sendMail({
        to: email,
        from: "dejesusmelnard@gmail.com",
        subject: "Signup Succeeded",
        html: "<h1>You successfully signed up</h1>",
      });
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  // this is a method provided with our session package we are using.
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }

    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found!");
          res.redirect("/reset");
        }

        user.resetToken = token;
        // The result will be a new timestamp representing the time one hour from the current moment.
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/login");
        transporter.sendMail({
          to: req.body.email,
          from: "dejesusmelnard@gmail.com",
          subject: "Password Reset",
          html: `
          <p>You requested password reset</p>
          <p>Click this <a href='http://localhost:3000/reset/${token}'>link</a> to set a new password</p>
          `,
        });
      })
      .catch((err) => {
        const error = new Error(err); // create error object with the build-in new Error keyword.
        error.httpStatusCode = 500; // set property of error object we created
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  // use findOne method to retrieve user that has this token and check expiration by using $gt meaning greater than.

  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() }, // $gt means greater than.
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};
