'use strict';

var Burger  = require('../models/burger');
var { notFoundError, validationError } = require('../lib/error_handler');

var isEmpty = require('lodash/isEmpty');

exports.list_all_burgers = function(req, res, next) {

  req.checkQuery({
    burger_name: {
      errorMessage: 'Must have a value and if you are using multiple words use underscores to separate',
      optional: true,
      notEmpty: true
    },
    page: {
      errorMessage: 'Must be a number greater than 0',
      optional: true,
      isInt: { options: { min: 1 } }
    },
    per_page: {
      errorMessage: 'Must be a number greater than 0 and less than 80',
      optional: true,
      isInt: { options: { min: 1, max: 80 } }
    }
  });

  var errors = req.validationErrors();

  if (errors) {
    return next(validationError(errors));
  }

  if ( ! req.query.burger_name ) {
    pagination(req, res);
  } else {
    read_a_burger_by_name(req, res, next);
  }
};


exports.create_a_burger = function(req, res) {
  var new_burger = new Burger(req.body);

  new_burger.save(function(err, burger) {
    if (err)
      res.send(err);

    res.status(200);
    res.json({ message: 'Burger created!', burger });
  });
};


exports.read_a_random_burger = function(req, res) {
  Burger.count().exec(function(err, count) {
    if (err)
      res.send(err);

    // add LODASH LIB for random func
    var random = Math.floor(Math.random() * count);
    Burger.findOne().skip(random).exec(function(err, result) {
      if (err)
        res.send(err)

      res.status(200);
      res.json([result]);
    });
  });
};


exports.read_a_burger = function(req, res, next) {

  req.checkParams({
    burger_id: {
      errorMessage: 'burger_id must be a mongoID',
      isMongoId: function(id) {
        var ObjectId = require('mongoose').Types.ObjectId;
        return ObjectId.isValid(id);
      }
    }
  });

  var errors = req.validationErrors();

  if (errors) {
    return next(validationError(errors));
  }

  var burger_id = req.params.burger_id;
  Burger.find({ "_id": burger_id }, function(err, burger) {
    if (err || isEmpty(burger)) {
      next(notFoundError(`No burger found that matches the ID ${burger_id}`));
    } else {
      res.status(200);
      res.json([burger]);
    }
  });
};


function read_a_burger_by_name(req, res, next) {
  var burger_name = req.query.burger_name;
  Burger.find({ "name": burger_name }, function(err, burger) {
    if (err || isEmpty(burger)) {
      next(notFoundError(`No burger found that matches the name ${burger_name}`));
    } else {
      res.status(200);
      res.json(burger);
    }
  });
}


function pagination(req, res) {
  var { page, per_page } = req.query;

  var per_page    = per_page || 25;
  var page_number = page || 1;

  var parsed_per_page    = parseInt(per_page);
  var parsed_page_number = parseInt(page_number);

  var offset = (parsed_page_number - 1) * parsed_per_page;

  Burger.find({}, {}, { skip: offset, limit: parsed_per_page }, function(err, burgers) {
    if (err)
      res.send(err);

    res.status(200);
    res.json(burgers);
  });
}
