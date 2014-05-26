'use strict';

module.exports = function (app, nconf) {
  var Dextromethorphan = require('dextromethorphan');

  var dex = new Dextromethorphan({
    db: nconf.get('db_posts'),
    limit: 20
  });

  app.get('/add', function (req, res) {
    res.render('add');
  });

  app.get('/post/add', function (req, res) {
    res.json({
      title: 'Add post',
      action: '/post',
      button: 'Add',
      type: 'POST'
    });
  });

  app.post('/post', function (req, res, next) {
    var text = req.body.message.trim();

    if (!text) {
      res.status(400);
      next(new Error('message cannot be empty'));
      return;
    }

    var message = {
      content: {
        message: {
          userId: req.session.id,
          body: text
        }
      },
      meta: {
        location: '',
        author: req.session.username,
        postType: req.body.itemType.selected
      }
    };

    dex.create(message, function (err, post) {
      if (err) {
        res.status(400);
        next(err);
        return;
      }

      dex.update(message, function (err, post) {
        if (err) {
          res.status(400);
          next(err);
        } else {
          res.json({
            message: 'posted'
          });
        }
      });
    });
  });

  app.get('/api/recent', function (req, res) {
    var prevPage = 0;
    var nextPage = 0;
    var currPage = 0;

    if (req.query.page) {
      currPage = parseInt(req.query.page, 10) || 0;
    }

    dex.getAll(req.query.page || 0, function (err, posts) {
      nextPage = currPage + 1;

      if (posts.length < dex.limit) {
        nextPage = 0;
      }

      prevPage = currPage - 1;

      if (prevPage < 0) {
        prevPage = 0;
      }

      res.json({
        posts: posts,
        prev: prevPage,
        next: nextPage
      });
    });
  });

  app.get('/api/post/:id', function (req, res) {
    dex.get(req.params.id, function (err, post) {
      if (err) {

        res.status(404);
        res.json({
          message: 'not found'
        });

      } else {

        res.send({
          post: post,
          prev: false,
          next: false
        });
      }
    });
  });

  app.get('/', function (req, res) {
    res.render('index');
  });
};
