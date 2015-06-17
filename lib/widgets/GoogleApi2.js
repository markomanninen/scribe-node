(function() {
  var api, root,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  api = require('../scribe').DefaultApi20;

  root.GoogleApi2 = (function(_super) {

    __extends(GoogleApi2, _super);

    function GoogleApi2() {
      this.AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/auth?response_type=code&";
      this.ACCESS_TOKEN_URL = "https://accounts.google.com/o/oauth2/token";
    }

    GoogleApi2.prototype.getAccessTokenExtractor = function() {
      return this.getJsonTokenExtractor();
    };

    GoogleApi2.prototype.getAccessTokenEndpoint = function() {
      return this.ACCESS_TOKEN_URL;
    };

    GoogleApi2.prototype.getRefreshTokenEndpoint = function() {
      return this.ACCESS_TOKEN_URL;
    };

    GoogleApi2.prototype.getAccessTokenVerb = function() {
      return this.POST;
    };

    GoogleApi2.prototype.getRequestVerb = function() {
      return this.GET;
    };

    GoogleApi2.prototype.getAuthorizationUrl = function(config) {
      var callback, client, scope;
      scope = 'scope=' + config.getScope() + '&';
      client = 'client_id=' + config.getApiKey() + '&';
      callback = 'redirect_uri=' + config.getCallback();
      return this.AUTHORIZE_URL + scope + client + callback;
    };

    GoogleApi2.prototype.getHeaders = function() {
      var headers;
      headers = GoogleApi2.__super__.getHeaders.call(this, this.getHeaders);
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      return headers;
    };

    return GoogleApi2;

  })(api);

}).call(this);
