const path = require("path");

const express = require("express");

const rootDir = require("../util/path");

const router = express.Router();

// exact matching using method and exact path.
router.get("/", (req, res, next) => {
  res.sendFile(path.join(rootDir, "views", "shop.html"));
});

module.exports = router;
