(function() {
  var default_services, env, root, scribe;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  scribe = require('../scribe').load(['GoogleApi', 'GoogleApi2', 'TwitterApi']);

  env = process.env;

  default_services = {};

  default_services['analytics'] = {
    'provider': scribe.GoogleApi,
    'key': env.HUBOT_GOOGLE_OAUTH_API_KEY,
    'secret': env.HUBOT_GOOGLE_OAUTH_API_SECRET,
    'scope': 'https://www.google.com/analytics/feeds/',
    'callback': 'oob'
  };

  default_services['analytics2'] = {
    'provider': scribe.GoogleApi2,
    'key': env.HUBOT_GOOGLE_OAUTH2_API_KEY,
    'secret': env.HUBOT_GOOGLE_OAUTH2_API_SECRET,
    'scope': 'https://www.googleapis.com/auth/analytics.readonly',
    'callback': 'urn:ietf:wg:oauth:2.0:oob'
  };

  default_services['twitter'] = {
    'provider': scribe.TwitterApi,
    'key': env.HUBOT_TWITTER_OAUTH_API_KEY,
    'secret': env.HUBOT_TWITTER_OAUTH_API_SECRET,
    'scope': '',
    'callback': 'oob'
  };

  root.Hubot = (function() {

    function Hubot(robot, msg, api, services) {
      this.robot = robot;
      this.msg = msg;
      this.api = api;
      this.services = services != null ? services : null;
      if (this.services && this.services[this.api]) {
        this.config = this.services[this.api];
      } else {
        this.config = default_services[this.api];
      }
      this.service = null;
    }

    Hubot.prototype.create_service = function() {
      if (this.config) {
        if (!this.service) {
          this.service = new scribe.ServiceBuilder().provider(this.config['provider']).apiKey(this.config['key']).apiSecret(this.config['secret'])._callback(this.config['callback'])._scope(this.config['scope']).build();
        }
        return this.service;
      } else {
        this.msg.send("Service / API not found: " + this.api);
        return false;
      }
    };

    Hubot.prototype.init_robot_brains = function() {
      if (!this.robot.brain.data.oauth) {
        this.robot.brain.data.oauth = [];
        this.robot.brain.data.oauth[this.api] = [];
      } else if (!this.robot.brain.data.oauth[this.api]) {
        this.robot.brain.data.oauth[this.api] = [];
      }
      return this.robot.brain.data.oauth[this.api];
    };

    Hubot.prototype.get_authorization_url = function() {
      var brains, msg, request_token_extract, service;
      if (service = this.create_service()) {
        brains = this.init_robot_brains();
        msg = this.msg;
        if (service.getVersion() === "2.0") {
          return msg.send("Authorization url: " + service.getAuthorizationUrl());
        } else {
          request_token_extract = function(response) {
            var token;
            console.log('Response: ' + response.data);
            token = service.api.getRequestTokenExtractor()(response.data);
            msg.send("Authorization url: " + service.getAuthorizationUrl(token));
            brains['request_token'] = token.getToken();
            brains['request_secret'] = token.getSecret();
            return console.log("Request token set: " + brains['request_token']);
          };
          return service.getRequestToken(request_token_extract);
        }
      }
    };

    Hubot.prototype.get_request_token = function() {
      return new scribe.Token(this.robot.brain.data.oauth[this.api]['request_token'], this.robot.brain.data.oauth[this.api]['request_secret']);
    };

    Hubot.prototype.get_verifier = function() {
      return new scribe.Verifier(this.robot.brain.data.oauth[this.api]['code']);
    };

    Hubot.prototype.set_access_token = function(service) {
      var access_token_extract, brains, msg;
      brains = this.init_robot_brains();
      msg = this.msg;
      access_token_extract = function(response) {
        var token;
        console.log('Response: ' + response.data);
        token = service.api.getAccessTokenExtractor()(response.data);
        if (brains['access_token'] = token.getToken()) {
          console.log('Access token set: ' + brains['access_token']);
          if (service.getVersion() === "2.0") {
            brains['expires_in'] = token.getExpires();
            brains['token_type'] = token.getType();
            brains['refresh_token'] = token.getRefresh();
          } else {
            brains['access_secret'] = token.getSecret();
          }
          return msg.send("Access token set");
        } else {
          return msg.send("Access token could not be set. Please try to refresh or get a new authorization by url.");
        }
      };
      if (service.getVersion() === "2.0") {
        return service.getAccessToken(this.get_verifier(), access_token_extract);
      } else {
        return service.getAccessToken(this.get_request_token(), this.get_verifier(), access_token_extract);
      }
    };

    Hubot.prototype.set_verification_code = function() {
      var brains, code, service;
      brains = this.init_robot_brains();
      if (service = this.create_service()) {
        if (service.getVersion() === "1.0" && !brains['request_token']) {
          return this.msg.send("Please get authorization url and request token first");
        } else if (code = this.msg.match[2]) {
          brains['code'] = code;
          this.msg.send('Verification code set: ' + brains['code']);
          return this.set_access_token(service);
        } else {
          return this.msg.send("Verification code not found");
        }
      }
    };

    Hubot.prototype.get_access_token = function() {
      var brains, service;
      brains = this.init_robot_brains();
      if (brains['access_token'] && (service = this.create_service())) {
        if (service.getVersion() === "2.0") {
          return new scribe.Token(brains['access_token'], "", "", brains['expires_in'], brains['token_type'], brains['refresh_token']);
        } else {
          return new scribe.Token(brains['access_token'], brains['access_secret']);
        }
      } else {
        this.msg.send("Access token not set for api: " + this.api + ". Please set verification code or get authorization url.");
        return false;
      }
    };

    Hubot.prototype.refresh_token = function() {
      var access_token, brains, msg, refresh_token_extract, service;
      if (service = this.create_service()) {
        msg = this.msg;
        if (service.getVersion() === "2.0") {
          if (!(access_token = this.get_access_token())) return false;
          brains = this.init_robot_brains();
          refresh_token_extract = function(response) {
            var refresh_token;
            console.log('Response: ' + response.data);
            refresh_token = service.api.getAccessTokenExtractor()(response.data);
            access_token.updateToken(refresh_token);
            brains['access_token'] = access_token.getToken();
            brains['expires_in'] = access_token.getExpires();
            console.log("Refreshed token: " + brains['access_token']);
            return msg.send("Token refreshed");
          };
          return service.getRefreshToken(access_token, refresh_token_extract);
        } else {
          return msg.send("Only OAuth 2.0 tokens can be refreshed.");
        }
      }
    };

    return Hubot;

  })();

}).call(this);
