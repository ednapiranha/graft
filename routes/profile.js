'use strict';

module.exports = function (app, nconf) {
  var level = require('level');
  var Grafty = require('grafty');
  var path = require('path');
  var uuid = require('uuid');
  var concat = require('concat-stream');

  var grafty = new Grafty({
    width: 50,
    dir: path.dirname(require.main.filename) + '/images'
  });

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
        next(err);
      }

      res.render('user', {
        user: profile
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
          res.status = 400;
          next(err);
          return;
        }

        res.render('profile', {
          profile: profile
        });
      });
    };

    if (req.body.avatar.length > 1) {
      grafty.convert(req.body.avatar, function (err, pic) {
        if (err) {
          res.status = 400;
          next(err);
          return;
        }

        profile.avatar = pic;
        req.session.avatar = pic;
        save();
      });
    } else {
      profile.avatar = req.session.avatar;
      save();
    }
  });
};
