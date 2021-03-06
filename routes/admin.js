const express = require('express');
const router = express.Router();
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const mongoose = require('mongoose');

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

router.get('/', function(req, res) {
  let obj = {
    title: 'Админ панель'
  };
  Object.assign(obj, req.app.locals.settings);
  let Model = mongoose.model('tools');
  Model.find({}).then(
    items => {
      Object.assign(obj, { tools: items });
      res.render('pages/admin', obj);
    },
    e => {
      console.log(e.message);
    }
  );
});

router.post('/addpost', (req, res) => {
  //требуем наличия заголовка, даты и текста
  if (!req.body.title || !req.body.date || !req.body.text) {
    //если что-либо не указано - сообщаем об этом
    return res.json({status: 'Укажите данные!'});
  }
  //создаем новую запись блога и передаем в нее поля из формы
  const Model = mongoose.model('news');
  let item = new Model({title: req.body.title, date: new Date(req.body.date), body: req.body.text});
  item.save().then(
    //обрабатываем и отправляем ответ в браузер
    (i) => {
      return res.json({status: 'Запись успешно добавлена'});
    }, e => {
      //если есть ошибки, то получаем их список и так же передаем в шаблон
      const error = Object
        .keys(e.errors)
        .map(key => e.errors[key].message)
        .join(', ');
      
      //обрабатываем шаблон и отправляем его в браузер
      res.json({
        status: 'При добавление записи произошла ошибка: ' + error
      });
    });
});

router.post('/upload', function (req, res) {
  let form = new formidable.IncomingForm();
  form.uploadDir = path.join(process.cwd(), config.upload);
  form.parse(req, function(err, fields, files) {
    if (err) {
      return res.json({status: 'Не удалось загрузить картинку'});
    }
    if (!fields.name) {
      fs.unlink(files.photo.path);
      return res.json({status: 'Не указано описание картинки!'});
    }
    if (!fields.url) {
      fs.unlink(files.photo.path);
      return res.json({status: 'Не указан адрес сайта!'});
    }
    //если ошибок нет, то создаем новую picture и передаем в нее поле из формы
    const Model = mongoose.model('pics');
    
    fs.rename(files.photo.path, path.join(config.upload, files.photo.name), function (err) {
      if (err) {
        fs.unlink(path.join(config.upload, files.photo.name));
        fs.rename(files.photo.path, files.photo.name);
      }
      let dir = config
        .upload
        .substr(config.upload.indexOf('/'));
      const item = new Model({url: fields.url, name: fields.name, picture: path.join(dir,files.photo.name)});
      item
        .save()
        .then(
          i => res.json({status: 'Картинка успешно загружена'}),
          e => res.json({status: e.message})
        );
      // const item = new Model({name: fields.name});
      // item
      //   .save()
      //   .then(pic => {
      //     Model.update({ _id: pic._id }, { $set: { picture: path.join(dir, files.photo.name)}}).then(
      //       i => res.json({status: 'Картинка успешно загружена'}),
      //       e => res.json({status: e.message})
      //       );
      //   });
    });
  });
});

router.post('/addtools', (req, res) => {
  //получаем модель навыков
  let Model = mongoose.model('tools');
  //создаем массив, в который будем складывать навыки, которые нужно сохранить
  let models = req.body;
  let prom = [];
  let count = 0;
  for (let i in models) {
    prom[count++] = Model.update(
      { section: i },
      {
        $set: {
          items: models[i]
        }
      }
    );
  }
  Promise.all(prom).then(
    data => {
      res.json({ status: 'Навыки успешно обновлены' });
    },
    e => {
      //если есть ошибки, то получаем их список и так же передаем в шаблон
      const error = Object.keys(e.errors)
        .map(key => e.errors[key].message)
        .join(', ');
      res.json({
        status: 'При добавление записи произошла ошибка: ' + error
      });
    }
  );
});

module.exports = router;