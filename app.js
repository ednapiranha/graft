var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var nconf = require('nconf');
var settings = require('./settings')(app, configurations, express);

var path = require('path');
var Grafty = require('grafty');
var grafty = new Grafty({
  width: 50
});

var Dextromethorphan = require('dextromethorphan');
var dex = new Dextromethorphan({
  db: nconf.get('db_posts'),
  limit: 30
});

var level = require('level');
var profileDb = level(nconf.get('db_profile'), {
  createIfMissing: true,
  valueEncoding: 'json'
});

var NoPlebs = require('no-plebs');
var nopleb = new NoPlebs({
  db: nconf.get('db_comments'),
  limit: 25
});

var twitter = require('twitter-text');

nconf.argv().env().file({ file: 'local.json' });

var isAuthed = function (req, res, next) {
  if (req.session.uid) {
    next();
  } else {
    res.redirect('/');
  }
};

var moment = require('moment');

// routes
require('./routes/comments')(app, isAuthed, nopleb, twitter, moment, nconf);
require('./routes/posts')(app, grafty, dex, profileDb, nopleb, twitter, moment, isAuthed, nconf);
require('./routes/profile')(app, grafty, dex, profileDb, isAuthed);

server.listen(process.env.PORT || nconf.get('port'));
