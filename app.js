var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var nconf = require('nconf');
var settings = require('./settings')(app, configurations, express);

var path = require('path');
var Grafty = require('grafty');
var grafty = new Grafty({
  width: 50,
  dir: path.dirname(require.main.filename) + '/images'
});

var Dextromethorphan = require('dextromethorphan');
var dex = new Dextromethorphan({
  db: nconf.get('db_posts'),
  limit: 30
});

nconf.argv().env().file({ file: 'local.json' });

var isAuthed = function (req, res, next) {
  if (req.session.uid) {
    next();
  } else {
    res.redirect('/');
  }
};

// routes
require('./routes/comments')(app, isAuthed, nconf);
require('./routes/posts')(app, grafty, dex, isAuthed, nconf);
require('./routes/profile')(app, grafty, dex, isAuthed, nconf);

server.listen(process.env.PORT || nconf.get('port'));
