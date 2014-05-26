var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var nconf = require('nconf');
var settings = require('./settings')(app, configurations, express);

nconf.argv().env().file({ file: 'local.json' });

// routes
require('./routes/comments')(app, nconf);
require('./routes/posts')(app, nconf);

server.listen(process.env.PORT || nconf.get('port'));
