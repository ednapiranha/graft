'use strict';

module.exports = function (app, nconf) {
  var level = require('level');
  var Grafty = require('grafty');
  var path = require('path')

  var grafty = new Grafty({
    width: 28,
    dir: path.dirname(require.main.filename) + '/images'
  });

  //console.log(grafty

  var profileDb = level(nconf.get('db_profile'), {
    createIfMissing: true,
    valueEncoding: 'json'
  });

  app.get('/profile', function (req, res) {
    profileDb.get('user!' + req.session.id, function (err, profile) {
      if (err || !profile) {
        profile = {
          name: '',
          bio: '',
          url: ''
        }
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

    var save = function () {
      profileDb.put('user!' + req.session.id, profile, function (err) {
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
