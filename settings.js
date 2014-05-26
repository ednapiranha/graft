// Module dependencies.
module.exports = function(app, configurations, express) {
  var maxAge = 24 * 60 * 60 * 365 * 1000;
  var nconf = require('nconf');
  var RedisStore = require('connect-redis')(express);

  nconf.argv().env().file({ file: 'local.json' });

  // Configuration

  app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      app.use(express.logger('dev'));
    }
    app.use(express.static(__dirname + '/public'));
    app.use(express.cookieParser());
    app.use(express.session({
      secret: nconf.get('session_secret'),
      store: new RedisStore({ db: nconf.get('redis_db'), prefix: 'graft' }),
      cookie: { maxAge: maxAge }
    }));
    app.use(express.csrf());
    app.use(function (req, res, next) {
      res.locals.csrf = req.csrfToken();
      res.locals.analytics = nconf.get('analytics');
      res.locals.analyticsHost = nconf.get('analyticsHost');
      res.locals.siteHost = nconf.get('domain') + ':' + nconf.get('authPort');

      if (!process.env.NODE_ENV) {
        res.locals.isDebug = true;
      } else {
        res.locals.isDebug = false;
      }

      next();
    });
    app.locals.pretty = true;
    app.use(app.router);
    app.use(function (req, res, next) {
      res.status(404);
      res.render('404', { url: req.url, layout: false });
      return;
    });
    app.use(function (req, res, next) {
      res.status(403);
      res.render('403', { url: req.url, layout: false });
      return;
    });
  });

  app.configure('development, test', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('prod', function() {
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('500', { error: err, layout: false });
    });
    app.use(express.errorHandler());
  });

  return app;
};
