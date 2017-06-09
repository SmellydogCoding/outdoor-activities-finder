'use strict';

const loginRequired = (req, res, next) => {
  if (res.locals.currentUser) {
    return next();
  } else {
    var err = new Error('You must be logged in to perform this action.');
    err.status = 401;
    return next(err);
  }
}

module.exports.loginRequired = loginRequired;