const Product = require("../models/product");
const Order = require("../models/order");

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: `/products`,
      });
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
      });
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};

exports.getCart = async (req, res, next) => {
  try {
    const user = await req.user.populate("cart.items.productId");
    const products = user.cart.items;
    res.render("shop/cart", {
      path: "/cart",
      pageTitle: "Your Cart",
      products: products,
    });
    // console.log("execute get cart in shop controller");
    // console.log(products);
  } catch (err) {
    const error = new Error(err); // create error object with the build-in new Error keyword.
    error.httpStatusCode = 500; // set property of error object we created
    return next(error);
  }
};

exports.postCart = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const product = await Product.findById(prodId);

    const result = await req.user.addToCart(product);
    // console.log(result);
    res.redirect("/cart");
  } catch (err) {
    const error = new Error(err); // create error object with the build-in new Error keyword.
    error.httpStatusCode = 500; // set property of error object we created
    return next(error);
  }
};

exports.postCartDeleteProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const result = await req.user.removeFromCart(prodId);
    // console.log(result);
    res.redirect("/cart");
  } catch (err) {
    const error = new Error(err); // create error object with the build-in new Error keyword.
    error.httpStatusCode = 500; // set property of error object we created
    return next(error);
  }
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((item) => {
        // product: value wrap in curly braces to create a new javascript object. _doc special field that mongoose have.
        return { quantity: item.quantity, product: { ...item.productId._doc } };
      });
      const order = new Order({
        products: products,
        user: {
          email: req.user.email,
          userId: req.user,
        },
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      console.log("orders");
      console.log(orders);
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};
