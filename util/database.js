const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("node-complete", "root", "Melnerdz_23", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
