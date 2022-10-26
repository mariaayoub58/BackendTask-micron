const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require("../db.config");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
});

//User model is defined, with DB datatypes
const User = sequelize.define("User", {
  ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  EMAIL_ADDRESS: { type: DataTypes.STRING, allowNull: false, unique: true },
  PASSWORD: { type: DataTypes.STRING, allowNull: false },
  FIRST_NAME: { type: DataTypes.STRING, allowNull: false },
  LAST_NAME: { type: DataTypes.STRING, allowNull: false },
  AUTH_TOKEN: { type: DataTypes.STRING, allowNull: true },
  TOKEN_CREATE_TIME: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'users',
  timestamps: false,
});

module.exports = User;
