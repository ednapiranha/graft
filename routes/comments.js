'use strict';

module.exports = function (app, isAuthed, nopleb, twitter, moment, nconf) {
  app.post('/comment', isAuthed, function (req, res, next) {
    var message = twitter.autoLink(twitter.htmlEscape(req.body.message.trim()), { targetBlank: true });
    var postId = parseInt(req.body.post_id, 10);
    var url = nconf.get('domain') + ':' + nconf.get('authPort') + '/post/' + postId;

    if (message.length > 0) {
      var comment = {
        message: message,
        author: req.session.uid,
        name: req.session.name
      };

      nopleb.addComment(comment, url, req.session.uid, function (err, comment) {
        if (err) {
          res.status(400);
          next();
          return;
        }

        res.redirect('/post/' + postId);
      });
    } else {
      res.redirect('/post/' + postId);
    }
  });

  app.del('/comment', isAuthed, function (req, res, next) {
    var url = req.body.url;
    var key = req.body.key;

    nopleb.getComment(url, key, function (err, comment) {
      if (err || req.session.id !== parseInt(comment.author, 10)) {
        res.status(400);
        next();
        return;
      }

      nopleb.removeComment(url, key, function (err, status) {
        if (err) {
          res.status(400);
          next();
          return;
        }

        res.redirect('/post/' + postId);
      });
    });
  });
};
