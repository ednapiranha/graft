'use strict';

module.exports = function (app, grafty, dex, isAuthed, nconf) {
  var twitter = require('twitter-text');

  app.get('/add', function (req, res) {
    res.render('add');
  });

  app.post('/post', isAuthed, function (req, res, next) {
    var content = req.body.content.trim().substring(0, 500);
    var title = req.body.title.trim().substring(0, 100);
    var errors = [];

    if (!content && !req.body.photo) {
      errors.push('Message cannot be empty');
    }

    if (errors.length > 0) {
      res.render('add', {
        errors: errors
      });
      return;
    }

    if (!title) {
      title = 'Untitled';
    }

    var message = {
      content: {
        message: {
          uid: req.session.uid,
          body: twitter.autoLink(twitter.htmlEscape(content), { targetBlank: true }),
          title: title
        }
      },
      meta: {
        location: '',
        author: req.session.uid
      }
    };

    var save = function () {
      dex.create(message, function (err, post) {
        if (err) {
          res.status(400);
          next(err);
          return;
        }

        res.redirect('/post/' + post.id);
      });
    };

    if (req.body.photo && req.body.photo.length > 1) {
      grafty.convert(req.body.photo, function (err, pic) {
        if (err) {
          res.status(400);
          next(err);
          return;
        }

        message.content.message.photo = pic;
        save();
      });
    } else {
      if (req.body.photo_text) {
        message.content.message.photo = req.body.photo_text;
      }

      save();
    }
  });

  app.get('/post/:id', function (req, res, next) {
    dex.get(req.params.id, function (err, post) {
      if (err) {
        res.status(404);
        next();
        return
      }

      res.render('post', {
        post: post
      });
    });
  });

  app.post('/post/delete/:id', isAuthed, function (req, res, next) {
    dex.get(req.params.id, function (err, post) {
      if (err || post.meta.author !== req.session.uid) {
        res.status(404);
        next();
        return;
      }

      dex.del(req.session.uid, req.params.id, function (err, status) {
        if (err || !status) {
          res.status(400);
          next(err);
          return;
        }

        res.redirect('/u/' + req.session.uid);
      });
    });
  });
};
