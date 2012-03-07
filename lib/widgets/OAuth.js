(function() {
  var default_services, env, root, scribe;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  scribe = require('../scribe').load(['GoogleApi', 'GoogleApi2', 'TwitterApi', 'FacebookApi', 'LinkedInApi']);

  env = process.env;

  default_services = {};

  default_services['analytics'] = {
    'provider': scribe.GoogleApi,
    'key': env.GOOGLE_OAUTH_API_KEY,
    'secret': env.GOOGLE_OAUTH_API_SECRET,
    'scope': 'https://www.google.com/analytics/feeds/',
    'callback': 'oob'
  };

  default_services['analytics2'] = {
    'provider': scribe.GoogleApi2,
    'key': env.GOOGLE_OAUTH2_API_KEY,
    'secret': env.GOOGLE_OAUTH2_API_SECRET,
    'scope': 'https://www.googleapis.com/auth/analytics.readonly',
    'callback': 'urn:ietf:wg:oauth:2.0:oob'
  };

  default_services['twitter'] = {
    'provider': scribe.TwitterApi,
    'key': env.TWITTER_OAUTH_API_KEY,
    'secret': env.TWITTER_OAUTH_API_SECRET,
    'scope': '',
    'callback': 'oob'
  };

  default_services['facebook'] = {
    'provider': scribe.FacebookApi,
    'key': env.FACEBOOK_OAUTH_API_KEY,
    'secret': env.FACEBOOK_OAUTH_API_SECRET,
    'scope': 'email,read_stream,read_insights',
    'callback': 'https://www.facebook.com/connect/login_success.html'
  };

  default_services['linkedin'] = {
    'provider': scribe.LinkedInApi,
    'key': env.LINKEDIN_OAUTH_API_KEY,
    'secret': env.LINKEDIN_OAUTH_API_SECRET,
    'scope': '',
    'callback': 'oob'
  };

  root.OAuth = (function() {

    function OAuth(storage, api, services) {
      this.storage = storage;
      this.api = api;
      this.services = services != null ? services : null;
      if (this.services && this.services[this.api]) {
        this.config = this.services[this.api];
      } else {
        this.config = default_services[this.api];
      }
      this.service = null;
    }

    OAuth.prototype.create_service = function() {
      if (this.config) {
        if (!this.service) {
          this.service = new scribe.ServiceBuilder().provider(this.config['provider']).apiKey(this.config['key']).apiSecret(this.config['secret'])._callback(this.config['callback'])._scope(this.config['scope']).build();
        }
        return this.service;
      } else {
        console.log("Service / API not found: " + this.api);
        return false;
      }
    };

    OAuth.prototype._init_storage = function() {
      if (!this.storage.oauth) {
        this.storage.oauth = {
          this.api: {}
        };
      } else if (!this.storage.oauth[this.api]) {
        this.storage.oauth[this.api] = {};
      }
      return this.storage.oauth[this.api];
    };

    OAuth.prototype.get_authorization_url = function(callback) {
      var request_token_extract, service, storage;
      if (service = this.create_service()) {
        storage = this._init_storage();
        if (service.getVersion() === "2.0") {
          return callback(service.getAuthorizationUrl());
        } else {
          request_token_extract = function(response) {
            var token;
            token = service.api.getRequestTokenExtractor()(response.data);
            storage['request_token'] = token.getToken();
            storage['request_secret'] = token.getSecret();
            console.log("Request token set: " + storage['request_token']);
            return callback(service.getAuthorizationUrl(token));
          };
          return service.getRequestToken(request_token_extract);
        }
      } else {
        return callback(false);
      }
    };

    OAuth.prototype.remove_authorization = function() {
      var service, storage;
      if (!(service = this.create_service())) return false;
      storage = this._init_storage();
      if (service.getVersion() === "2.0") {
        delete storage['expires_in'];
        delete storage['token_type'];
        delete storage['refresh_token'];
      } else {
        delete storage['request_token'];
        delete storage['request_secret'];
      }
      delete storage['code'];
      delete storage['access_token'];
      delete storage['access_secret'];
      return true;
    };

    OAuth.prototype.get_request_token = function() {
      return new scribe.Token(this.storage.oauth[this.api]['request_token'], this.storage.oauth[this.api]['request_secret']);
    };

    OAuth.prototype.get_verifier = function() {
      return new scribe.Verifier(this.storage.oauth[this.api]['code']);
    };

    OAuth.prototype.set_access_token_code = function(code) {
      var service, storage;
      if (service = this.create_service()) {
        storage = this._init_storage();
        storage['access_token'] = code;
        console.log('Access token set: ' + storage['access_token']);
        return true;
      }
      return false;
    };

    OAuth.prototype._set_access_token = function(service, callback) {
      var access_token_extract, storage;
      storage = this._init_storage();
      access_token_extract = function(response) {
        var token;
        token = service.api.getAccessTokenExtractor()(response.data);
        if (storage['access_token'] = token.getToken()) {
          console.log('Access token set: ' + storage['access_token']);
          if (service.getVersion() === "2.0") {
            storage['expires_in'] = token.getExpires();
            storage['token_type'] = token.getType();
            storage['refresh_token'] = token.getRefresh();
          } else {
            storage['access_secret'] = token.getSecret();
          }
          return callback(true);
        } else {
          console.log("Access token could not be set. Please try to refresh or get a new authorization by url.");
          return callback(false);
        }
      };
      if (service.getVersion() === "2.0") {
        return service.getAccessToken(this.get_verifier(), access_token_extract);
      } else {
        return service.getAccessToken(this.get_request_token(), this.get_verifier(), access_token_extract);
      }
    };

    OAuth.prototype.set_verification_code = function(code, callback) {
      var service, storage;
      storage = this._init_storage();
      if (service = this.create_service()) {
        if (service.getVersion() === "1.0" && !storage['request_token']) {
          return console.log("Please get authorization url and request token first");
        } else if (code) {
          storage['code'] = code;
          console.log('Verification code set: ' + storage['code']);
          return this._set_access_token(service, callback);
        } else {
          return console.log("Verification code not found");
        }
      } else {
        return callback(false);
      }
    };

    OAuth.prototype.get_access_token = function() {
      var service, storage;
      storage = this._init_storage();
      if (storage['access_token'] && (service = this.create_service())) {
        if (service.getVersion() === "2.0") {
          return new scribe.Token(storage['access_token'], "", "", storage['expires_in'], storage['token_type'], storage['refresh_token']);
        } else {
          return new scribe.Token(storage['access_token'], storage['access_secret']);
        }
      } else {
        console.log("Access token not set for api: " + this.api + ". Please set verification code or get authorization url.");
        return false;
      }
    };

    OAuth.prototype.refresh_access_token = function(access_token, callback) {
      var refresh_token_extract, service, storage;
      if (access_token && (service = this.create_service())) {
        if (service.getVersion() === "2.0") {
          storage = this._init_storage();
          refresh_token_extract = function(response) {
            var refresh_token;
            refresh_token = service.api.getAccessTokenExtractor()(response.data);
            access_token.updateToken(refresh_token);
            storage['access_token'] = access_token.getToken();
            storage['expires_in'] = access_token.getExpires();
            console.log("Refreshed token: " + storage['access_token']);
            return callback(true);
          };
          return service.getRefreshToken(access_token, refresh_token_extract);
        } else {
          return console.log("Only OAuth 2.0 tokens can be refreshed.");
        }
      } else {
        return callback(false);
      }
    };

    return OAuth;

  })();

}).call(this);
