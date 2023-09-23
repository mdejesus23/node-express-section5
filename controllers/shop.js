const Product = require("../models/product");
const Order = require("../models/order");

const { secrete_key } = require("../uri");
const stripe = require("stripe")(
  "sk_test_51NtPxTImxVMhiCpZASeXb0THiw4n6Pi9FdLagh7FA7BSUKEQEwi5qAP35XorOHMde5rfPpiqVDBTpIIIDqtKTWeL00AX9SCRK1"
);

// gloal object
const ITEMS_PER_PAGE = 2;

// core node modules
const fs = require("fs");
const path = require("path");

const PDFDocument = require("pdfkit");

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products List",
        path: "/products",
        currentPage: page,
        totalProducts: totalItems,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
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
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        totalProducts: totalItems,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
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

exports.getCheckout = async (req, res, next) => {
  let products;
  let total = 0;
  try {
    const user = await req.user.populate("cart.items.productId");
    products = user.cart.items;
    products.forEach((p) => {
      total += p.quantity * p.productId.price;
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // referes to credit card payments
      mode: "payment",
      line_items: products.map((p) => {
        // line items is product to checkout
        return {
          quantity: p.quantity,
          price_data: {
            currency: "usd", // us dollars
            unit_amount: p.productId.price * 100, // because we specify this in cents
            product_data: {
              name: p.productId.title,
              description: p.productId.description,
            },
          },
        };
      }),
      customer_email: req.user.email,
      success_url: req.protocol + "://" + req.get("host") + "/checkout/success",
      cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
    });

    res.render("shop/checkout", {
      path: "/checkout",
      pageTitle: "Checkout",
      products: products,
      totalSum: total,
      sessionId: session.id,
    });
    // console.log("execute get cart in shop controller");
    // console.log(products);
  } catch (err) {
    const error = new Error(err); // create error object with the build-in new Error keyword.
    error.httpStatusCode = 500; // set property of error object we created
    return next(error);
  }
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      console.log(user);
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

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      console.log(user);
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
      // console.log("orders");
      // console.log(orders);
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

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  // additonal filter to authorized the invoice for the specific user that is currently loggedin for the specific session.
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order was found!"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }

      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName); // data(folder)>invoices(folder)>invoiceName(file name)

      const pdfDoc = new PDFDocument(); // this is also turns out as a readable streams.
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath)); // also get stored in the server and not just return in the client.
      pdfDoc.pipe(res);

      // pdfDoc.text("Hello World"); // text method allow us to add a single line of text in the pdf doc.
      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
        align: "center",
      });

      // you can style thru passing object as a 2nd argument with style key-value.
      pdfDoc.text("------------------------------------------------------", {
        align: "center",
      });

      let totalPrice = 0;

      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " x " +
              "$" +
              prod.product.price
          );
      });
      pdfDoc
        .fontSize(18)
        .text(`Total Price : $ ${totalPrice}`, { align: "center" });

      pdfDoc.end();

      //first arg path, 2nd arg a callback function which will execute once done reading that file.
      // takes either an error or a data(which is form as a buffer)
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next();
      //   }
      //   res.setHeader("Content-Type", "application/pdf");
      //   res.setHeader(
      //     "Content-Disposition",
      //     'inline; filename="' + invoiceName + '"'
      //   );

      //   res.send(data);
      // });

      //streamed data created with that create read stream thing which is the recommended way of getting your file data especially for bigger files.
      // const file = fs.createReadStream(invoicePath);

      // // file readable streams to pipe their output into a writable stream which is the response object.
      // file.pipe(res);
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err); // create error object with the build-in new Error keyword.
      error.httpStatusCode = 500; // set property of error object we created
      return next(error);
    });
};
