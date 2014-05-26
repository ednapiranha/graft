'use strict';

module.exports = function (app, nconf) {
  var NoPlebs = require('no-plebs');

  var nopleb = new NoPlebs({
    db: nconf.get('db_comments'),
    limit: 25
  });

  app.post('/api/comment', function (req, res) {
    nopleb.addComment(req.body.comment, req.body.url, req.session.id, function (err, comment) {
      if (err) {
        res.status(400);
        res.json({
          error: err.toString()
        });

        return;
      }

      res.json({
        comment: comment
      });
    });
  });

  app.del('/api/comment', function (req, res) {
    var url = req.body.url;
    var key = req.body.key;

    nopleb.getComment(url, key, function (err, comment) {
      if (err) {
        res.status(400);
        res.json({
          error: err.toString()
        });

        return;
      }

      if (req.session.id !== parseInt(comment.author, 10)) {
        res.status(400);
        res.json({
          error: 'You do not have permission to delete this comment'
        });

        return;
      }

      nopleb.removeComment(url, key, function (err, status) {
        if (err) {
          res.status(400);
          res.json({
            error: err.toString()
          });

          return;
        }

        res.json({
          message: 'deleted'
        });
      });
    });
  });
};
