const express = require('express');
const router = express.Router();
const geospacial = require('/geospacial.js');
const trailapi = require('./trailapi.js');

users.get('/', (req, res, next) => {
  res.status(200).send('Hello World');
});