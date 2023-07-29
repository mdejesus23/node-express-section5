const path = require("path");

// .join is use to construct the absolute path.
const p = path.join(
  // absolute path of the main module app.js exluding the filename. it use to locate the based file path of the proj.
  path.dirname(require.main.filename),
  // directory/folder name
  "data",
  // filename / file inside the "data" directory. which is in json format file.
  "products.json"
);

// helper function.
const getProductsFromFile = (cb) => {
  // fileContent refers to the content of the givern p file.
  fs.readFile(p, (err, fileContent) => {
    // if there is an err object
    if (err) {
      cb([]);
    } else {
      cb(JSON.parse(fileContent));
    }
  });
};

module.exports = class Product {
  constructor(id, title, imageUrl, description, price) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  // save function for adding new product or editing existing product
  save() {
    getProductsFromFile((products) => {
      if (this.id) {
        const existingProductIndex = products.findIndex(
          (prod) => prod.id === this.id
        );
        const updatedProducts = [...products];
        updatedProducts[existingProductIndex] = this;
        // will replace the old file to with the updated products.
        fs.writeFile(p, JSON.stringify(updatedProducts), (err) => {
          console.log(err);
        });
      } else {
        this.id = Math.random().toString();
        products.push(this);
        fs.writeFile(p, JSON.stringify(products), (err) => {
          console.log(err);
        });
      }
    });
  }

  // delete product
  static deleteById(id) {
    getProductsFromFile((products) => {
      const product = products.find((prod) => prod.id === id);
      const updatedProducts = products.filter((prod) => prod.id !== id);
      fs.writeFile(p, JSON.stringify(updatedProducts), (err) => {
        if (!err) {
          Cart.deleteProduct(id, product.price);
        }
      });
    });
  }

  // use static keyword  to directly call this method on the class itself and not to instantiated object.
  static fetchAll(cb) {
    getProductsFromFile(cb);
  }

  static findById(id, cb) {
    getProductsFromFile((products) => {
      const product = products.find((prod) => prod.id === id);
      cb(product);
    });
  }
};
