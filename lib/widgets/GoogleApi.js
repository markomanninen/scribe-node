(function() {
  var api, root,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  api = require('../scribe').DefaultApi10a;

  root.GoogleApi = (function(_super) {

    __extends(GoogleApi, _super);

    function GoogleApi() {
      this.REQUEST_TOKEN_URL = "https://www.google.com/accounts/OAuthGetRequestToken";
      this.SCOPED_REQUEST_TOKEN_URL = this.REQUEST_TOKEN_URL + "?scope=";
      this.AUTHORIZE_URL = "https://www.google.com/accounts/OAuthAuthorizeToken?oauth_token=";
      this.ACCESS_TOKEN_URL = "https://www.google.com/accounts/OAuthGetAccessToken";
    }

    GoogleApi.prototype.getAccessTokenEndpoint = function() {
      return this.ACCESS_TOKEN_URL;
    };

    GoogleApi.prototype.getRequestTokenEndpoint = function(config) {
      var scope;
      if (config == null) config = null;
      if (config && (scope = config.getScope())) {
        return this.SCOPED_REQUEST_TOKEN_URL + scope;
      } else {
        return this.REQUEST_TOKEN_URL;
      }
    };

    GoogleApi.prototype.getAccessTokenVerb = function() {
      return this.GET;
    };

    GoogleApi.prototype.getRequestTokenVerb = function() {
      return this.GET;
    };

    GoogleApi.prototype.getRequestVerb = function() {
      return this.GET;
    };

    GoogleApi.prototype.getAuthorizationUrl = function(request_token) {
      return this.AUTHORIZE_URL + request_token.getToken();
    };

    GoogleApi.prototype.getHeaders = function() {
      var headers;
      headers = GoogleApi.__super__.getHeaders.call(this, this.getHeaders);
      headers['Accept'] = '*/*';
      headers['Host'] = 'www.google.com';
      return headers;
    };

    return GoogleApi;

  })(api);

}).call(this);
