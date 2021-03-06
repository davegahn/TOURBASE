'use strict';

const express = require('express');
const content = require('../views/data/content.json');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/prokat-tools');

// const isAdmin = (req, res, next) => {
//   // если в сессии текущего пользователя есть пометка о том, что он является
//   // администратором
//   if (req.session.isAdmin) {
//     //то всё хорошо :)
//     return next();
//   }
//   //если нет, то перебросить пользователя на главную страницу сайта
//   res.redirect('/');
// };

router.get('/', function (req, res) {
  let obj = {
    title: 'About page'
  };
  Object.assign(obj, req.app.locals.settings);
  let Model = mongoose.model('tools');
  Model
    .find()
    .then(items => {
      Object.assign(obj, { tools: items });
      res.render('pages/about', obj);
    },
    e => {
      console.log(e.message);
    }
    );
});

module.exports = router;
