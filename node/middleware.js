'use strict';

const loginRequired = (req, res, next) => {
  if (req.session.username) {
    return next();
  } else {
    let error = new Error('You must be logged in to perform this action.');
    error.status = 401;
    return next(error);
  }
}

module.exports.loginRequired = loginRequired;