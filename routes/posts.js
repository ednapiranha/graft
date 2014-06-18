'use strict';

module.exports = function (app, grafty, dex, profileDb, nopleb, twitter, moment, isAuthed, nconf) {
  var exec = require('child_process').exec;

  app.get('/', function (req, res, next) {
    dex.getAll(0, function (err, posts) {
      if (err) {
        res.status(400);
        next(err);
        return;
      }

      res.render('index', {
        posts: posts
      });
    });
  });

  app.get('/add', function (req, res) {
    res.render('add');
  });

  app.post('/git/:git', function (req, res) {
    exec('cd /var/gopher && git pull');
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
          errors.push('This image could not be converted. Try another one');

          res.render('add', {
            errors: errors
          });
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
    var url = nconf.get('domain') + ':' + nconf.get('authPort') + '/post/' + req.params.id;
    var comments = [];

    var getComments = function (post, profile) {
      var render = function () {
        res.render('post', {
          post: post,
          author: profile.name,
          comments: comments
        });

      };

      nopleb.getComments(url, true, function (err, cmts) {
        if (!err && cmts.comments && cmts.comments.length > 0) {
          var count = 0;

          cmts.comments.forEach(function (c) {
            count ++;

            c.value.created = moment(c.value.created).fromNow();
            comments.push(c);

            if (count === cmts.comments.length) {
              render();
            }
          });
        } else {
          render();
        }
      });
    };

    var getUser = function (post) {
      profileDb.get('user!' + post.meta.author, function (err, profile) {
        if (err) {
          res.status(404);
          next();
          return;
        }

        getComments(post, profile);
      });
    };

    dex.get(req.params.id, function (err, post) {
      if (err) {
        res.status(404);
        next();
        return;
      }

      getUser(post);
    });
  });

  app.post('/post/delete/:id', isAuthed, function (req, res, next) {
    dex.del(req.session.uid, req.params.id, function (err, status) {
      if (err || !status) {
        res.status(400);
        next();
        return;
      }

      var url = nconf.get('domain') + ':' + nconf.get('authPort') + '/post/' + req.params.id;

      nopleb.getAllCommentKeys(url, function (err, keys) {
        if (!err) {
          keys.comments.forEach(function (c) {
            nopleb.removeComment(url, c, function (err) { });
          });
        }
      });

      res.redirect('/u/' + req.session.uid);
    });
  });
};
