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

router.post("/create-order", shopController.postOrder);

router.get("/orders", shopController.getOrders);

module.exports = router;
