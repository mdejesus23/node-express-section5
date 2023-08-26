const express = require("express");

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
router.post("/add-product", isAuth, adminController.postAddProduct);

// // I have use this dynamic path segment ":productId"
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post("/edit-product", isAuth, adminController.postEditProducts);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

module.exports = router;
