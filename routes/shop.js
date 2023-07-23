const express = require("express");

const shopController = require("../controllers/shop");

const router = express.Router();

// exact matching using method and exact path.
router.get("/", shopController.getIndex);

router.get("/products", shopController.getProducts);

//dynamic segment
router.get("/products/:productId", shopController.getProduct);

router.get("/cart", shopController.getCart);

router.post("/cart", shopController.postCart);

router.post("/cart-delete-item", shopController.postCartDeleteProduct);

router.get("/orders", shopController.getOrders);

router.get("/checkout", shopController.getCheckout);

module.exports = router;
