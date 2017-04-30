const express = require('express');
const router = express.Router();

users.get('/', (req, res, next) => {
  res.status(200).send('Hello World');
});