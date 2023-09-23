const express = require("express");

const { body } = require("express-validator");
const Product = require("../models/product");
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

//you can add as many arguments as you want, as many handlers as you want therefore
// and as I mentioned, they will be parsed from left to right,

// // implicity this routes start with /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// // implicity this routes start with /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// // implicity this routes start with /admin/add-product => POST
// // this automatically gives us a request which puts all the input data and so on into its body.
// // this only works for posting data.
router.post(
  "/add-product",
  [
    body("title")
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("Please enter a valid title min of 3 character"),

    // body("imageUrl").isURL().withMessage("Please enter a valid URL"),
    body("price").isFloat().withMessage("Price is not valid!"),
    body("description")
      .isLength({ min: 5, max: 400 })
      .trim()
      .withMessage(
        "Please enter a valid description min of five and max of 400 characters!"
      ),
  ],
  isAuth,
  adminController.postAddProduct
);

// // I have use this dynamic path segment ":productId"
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body("title")
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("Please enter a valid title min of 3 character"),

    body("price").isFloat().withMessage("Price is not valid!"),
    body("description")
      .isLength({ min: 5, max: 400 })
      .withMessage(
        "Please enter a valid description min of five and max of 400 characters!"
      ),
  ],
  isAuth,
  adminController.postEditProducts
);

router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
