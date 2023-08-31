const express = require("express");
const { check, body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post(
  "/login",

  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password", "Password has to be valid.")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],

  authController.postLogin
);

// check validator and take the name of the input we want to check.
// we also call a method for exp isEmail() and many build-in method.
router.post(
  "/signup",
  // you can wrap check validator in an array.
  [
    // check would extract that email from the cookies, headers, params, anywhere.
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email") // we can customize the error message by this.
      // takes arguments 1st value of the field "email" 2nd object optional which we can extract
      // things like location was sent, path or the req object.
      .custom(async (value, { req }) => {
        // if (value === "test@test.com") {
        //   throw new Error("This email address is forbiden");
        // }
        // return true;
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            // A promise is a built-in javascript object and with reject,
            // I basically throw an error inside of the promise and I reject with this error message I used before.
            return Promise.reject(
              "Email exists already, please pick a different one"
            );
          }
        });
      })
      .normalizeEmail(),
    // body specifically check in the req.body
    // 2nd argument optional is the default error message.
    body(
      "password",
      "Please enter a password with only numbers and text and at least 5 characters."
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    // trim excess white space.
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        // first arg value refers to value of confirmPassword input.
        // second arg value refers to password input.
        if (value !== req.body.password) {
          throw new Error("Password have to match!");
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

// :token is a params
router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
