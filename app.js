const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const GitHubAPI = require('github');
const OAuth = require('oauth');
const OAuth2 = new OAuth(process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET, 'https://github.com/', 'login/oauth/authorize', 'login/oauth/access_token');

const github = new GitHubAPI({
  debug: false,
  protocol: 'https',
  host: 'api.github.com',
  headers: {
    'user-agent': 'Resume Generator'
  },
  timeout: 5000
});
const baseUrl = 'localhost:3000';

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.get('/auth', function(req, res) {
  res.writeHead(303, {
    Location: OAuth2.getAuthorizeUrl({
      'redirect_uri': 'http://' + baseUrl + '/auth/callback',
      scope: ''
    })
  });
  res.end();
});

app.get('/auth/callback', function(req, res) {
  const code = req.query.code;
  OAuth2.getOAuthAccessToken(code, {}, function(err, accessToken, refreshToken) {
    if (err) {
      throw err;
    }
    // authenticate github API
    github.authenticate({
      type: 'oauth',
      token: accessToken
    });
    github.users.get({
    }, (err, result) => {
      const user = result.login;
      console.log(user);
    });
  });
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
