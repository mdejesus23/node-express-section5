const path = require("path");

const express = require("express");

const adminController = require("../controllers/admin");

const router = express.Router();

// implicity this routes start with /admin/add-product => GET
router.get("/add-product", adminController.getAddProduct);

// implicity this routes start with /admin/products => GET
router.get("/products", adminController.getProducts);

// implicity this routes start with /admin/add-product => POST
// this automatically gives us a request which puts all the input data and so on into its body.
// this only works for posting data.
router.post("/add-product", adminController.postAddProduct);

// I have use this dynamic path segment ":productId"
router.get("/edit-product/:productId", adminController.getEditProduct);

router.post("/edit-product", adminController.postEditProducts);

// router.post("/delete-product", adminController.postDeleteProduct);

module.exports = router;
