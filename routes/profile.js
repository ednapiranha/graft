'use strict';

module.exports = function (app, grafty, dex, isAuthed, nconf) {
  var level = require('level');
  var uuid = require('uuid');
  var concat = require('concat-stream');

  var profileDb = level(nconf.get('db_profile'), {
    createIfMissing: true,
    valueEncoding: 'json'
  });

  app.get('/', function (req, res, next) {
    var rs = profileDb.createReadStream();

    rs.pipe(concat(function (u) {
      res.render('index', {
        users: u
      });
    }));

    rs.on('error', function (err) {
      res.status(400);
      next(err);
    });
  });

  app.get('/u/:uid', function (req, res, next) {
    profileDb.get('user!' + req.params.uid, function (err, profile) {
      if (err || !profile) {
        res.status(404);
        next();
        return;
      }

      var prevPage = 0;
      var nextPage = 0;
      var currPage = 0;

      if (req.query.page) {
        currPage = parseInt(req.query.page, 10) || 0;
      }

      dex.getAll(req.query.page || 0, function (err, posts) {
        if (err) {
          res.status(400);
          next(err);
          return;
        }

        nextPage = currPage + 1;

        if (posts.length < dex.limit) {
          nextPage = 0;
        }

        prevPage = currPage - 1;

        if (prevPage < 0) {
          prevPage = 0;
        }

        res.render('user', {
          posts: posts,
          user: profile,
          prev: prevPage,
          next: nextPage
        });
      });
    });
  });

  app.get('/profile', function (req, res) {
    profileDb.get('user!' + req.session.uid, function (err, profile) {
      if (err || !profile) {
        profile = {
          name: '',
          bio: '',
          url: ''
        }
      } else {
        req.session.uid = profile.uid;
      }

      req.session.avatar = profile.avatar || '';

      res.render('profile', {
        profile: profile
      });
    });
  });

  app.post('/profile', function (req, res, next) {
    var profile = {
      name: req.body.name.trim(),
      bio: req.body.bio.trim(),
      url: req.body.url.trim()
    };

    if (!req.session.uid) {
      profile.uid = req.session.uid = uuid.v4();
    } else {
      profile.uid = req.session.uid;
    }

    var save = function () {
      profileDb.put('user!' + profile.uid, profile, function (err) {
        if (err) {
          res.status(400);
          next(err);
          return;
        }

        req.session.name = profile.name;

        res.render('profile', {
          profile: profile
        });
      });
    };

    if (req.body.avatar && req.body.avatar.length > 1) {
      grafty.convert(req.body.avatar, function (err, pic) {
        if (err) {
          res.status(400);
          next(err);
          return;
        }

        profile.avatar = pic;
        req.session.avatar = profile.avatar;
        save();
      });
    } else {
      if (req.body.avatar_text && req.body.avatar_text.length > 1) {
        profile.avatar = req.body.avatar_text;
        req.session.avatar = profile.avatar;
      } else {
        profile.avatar = req.session.avatar;
      }

      save();
    }
  });
};
