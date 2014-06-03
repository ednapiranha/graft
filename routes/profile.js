'use strict';

module.exports = function (app, grafty, dex, profileDb, isAuthed) {
  var uuid = require('uuid');
  var concat = require('concat-stream');

  var DEFAULT_AVATAR = "MMMMMMMMMMMMMMMMWMMMMMMMMMMMMMMWWMMMMWMMMMMMMMMMMM\n\
MMMMMMMMMMMMMMMWWWMMMWWWMMMMMMMMMMMMMMMMMMMMMMMMMM\n\
MMMMMMMMMMMMMMWNKOxoc:;;;;;,;:ldkKNWMMMMMMMMMMMMMM\n\
MMMMMMMMMMWMWKd:..               .,ckXWMMMMMMMMMMM\n\
MMMMMMMMWWNOc.                       'dXMMMMMMMMMM\n\
MMMMMMMMNOc.                          .;OWWWMMMMMM\n\
MMMMMMMWx.                              '0WWMWWMMM\n\
MMMMMMMO'          .,ldxolc,             oWMMWWMMM\n\
MMMMMMMo          ,kNWWMWNWNl.           lWMWWMMMM\n\
MMMMMMMKkkkxxxkkkkKNWWWWWNNWO.           cWMWWMMMM\n\
MMMMMMMMMMMMMMMWWWMMMMWWWWWKl.          .dWMMMWWMM\n\
MMMMMMMMMMMMMMMMWMMMWWMXxoc'            cXWWMMWWMM\n\
MMMMMMMMMMMMMMMMWMMWW0o'             .'dNMMMMMMMMM\n\
MMMMMMMMMMMMMMMMMMMWx.             .:kXNWMMMMMMMMM\n\
MMMMMMMMMMMMMMMMMMWK,            ;xKWMMMMMMMMMMMMM\n\
MMMMMMMMMMMMMMMMMWW0'           ;XMWWMMWMMMMMMMMMM\n\
MMMMMMMMMMMMMMMMWWMXdlllllllllllOMMMMMWMMMMMMMMMMM\n\
MMMMMMMMMMMMMMMWWWMWNWWWMMMMMMMMWWMMMMMMMMMMMMMMMM\n\
MMMMMMMMMMMMMMMMMMWKl,;,,,,,,,,,oXMMMMMMMMMMMMMMMM\n\
MMMMMMMMMMMMMMMMMWW0'           ;KWMMMMMMMMMMMMMMM\n\
MMMMMMMMMMMMMMMWWWW0'           ;KWMMMMMMMMMMMMMMM\n\
MMMMMMMMMMMMMMMWWMWKl;;;;;;;;;;;dXMMMMMMMMMMMMMMMM\n\
MMMMMMMMMMMMMMMMWWMMWWMMMMMMMMMMMMMMMMMMMMMMMMMMMM\n\
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM\n\
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM";

  app.get('/users', function (req, res, next) {
    var rs = profileDb.createReadStream();

    rs.pipe(concat(function (u) {
      res.render('users', {
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

      dex.getAllByUser(req.params.uid, req.query.page || 0, function (err, posts) {
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
    var errors = [];

    var profile = {
      name: req.body.name.trim().substring(0, 32),
      bio: req.body.bio.trim().substring(0, 200),
      url: req.body.url.trim().substring(0, 300)
    };

    if (profile.name.length < 1) {
      errors.push('Name cannot be empty');
    }

    if (errors.length > 0) {
      res.render('profile', {
        errors: errors,
        profile: profile
      });
    }

    if (!req.session.uid) {
      profile.uid = req.session.uid = uuid.v4();
    } else {
      profile.uid = req.session.uid;
    }

    if (profile.url && !profile.url.match(/^http/)) {
      profile.url = 'http://' + profile.url;
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
          errors.push('This image could not be converted. Try another one');

          res.render('profile', {
            profile: profile,
            errors: errors
          });
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
        if (req.session.avatar) {
          profile.avatar = req.session.avatar;
        } else {
          profile.avatar = DEFAULT_AVATAR;
          req.session.avatar = profile.avatar;
        }
      }

      save();
    }
  });
};
