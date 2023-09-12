const Product = require("../models/product");
const fileHelper = require("../util/file");

const mongoose = require("mongoose");

const { validationResult } = require("express-validator");
const product = require("../models/product");

// thru this exports syntax we can have multiple exports in one file easily.
exports.getAddProduct = (req, res, next) => {
  // we do render template with the special render method provided by express.js

  /*
    The res.render() function takes two main parameters:
    the name of the view template file and
    an optional object containing data that will be passed to the template for rendering.
  */

  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    oldInput: {
      title: "",
      imageUrl: "",
      price: "",
      description: "",
    },
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  // this automatically gives us a request which puts all the input data and so on into its body.
  // this only works for posting data.
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    // if its undefine it meaning that multer decline the incoming file.
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: "Attached file is not an image",
      validationErrors: [],
    });
  }

  const imageUrl = image.path; // image path is a path to the file system with image directory.

  const errors = validationResult(req); // collect all errors came from validator middleware in admin route.

  if (!errors.isEmpty()) {
    // console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      errorMessage: errors.array()[0].msg,
      product: {
        title: title,
        price: price,
        description: description,
      },
      validationErrors: errors.array(),
    });
  }

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.session.user,
  });
  product
    .save()
    .then((result) => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      // res.redirect("/500");
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error); // we let express know that an error occurred and will skip all other middleware and move rigth away to error handler middleware.
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  console.log(editMode);
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        hasError: false,
        product: product,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error); // we let express know that an error occurred and will skip all other middleware and move rigth away to error handler middleware.
    });
};

exports.postEditProducts = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  // if the image is undefined (if file type is invalid or not provided in the client request) image will not be save.
  // if (image) {
  //   product.imageUrl = image.path;
  // }

  const errors = validationResult(req); // collect all errors came from validator middleware in admin route.
  if (!errors.isEmpty()) {
    // console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      errorMessage: errors.array()[0].msg,
      product: {
        _id: prodId,
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
      },
      validationErrors: errors.array(),
    });
  }

  Product.findById(prodId)
    .then((product) => {
      // add protection to not allow other user to edit the other products
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;

      // if the image is undefined (if file type is invalid or not provided in the client request) image will not be save.
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path; // image path is a path to the file system with image directory.
      }
      return product.save().then((result) => {
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      // res.redirect("/500");
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error); // we let express know that an error occurred and will skip all other middleware and move rigth away to error handler middleware.
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // every then block implicitly returns a new promise.
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};

exports.postDeleteProduct = async (req, res, next) => {
  const prodId = req.body.productId;

  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found!"));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, userId: req.user._id }); // adding filter prodId and userId
    })
    .then(() => {
      console.log("Destroyed Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};
