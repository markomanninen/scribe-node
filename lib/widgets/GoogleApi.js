(function() {
  var root;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  root.GoogleApi = (function() {

    __extends(GoogleApi, DefaultApi10a);

    function GoogleApi() {
      this.REQUEST_TOKEN_URL = "https://www.google.com/accounts/OAuthGetRequestToken";
      this.SCOPED_REQUEST_TOKEN_URL = this.REQUEST_TOKEN_URL + "?scope=%s";
      this.AUTHORIZE_URL = "https://www.google.com/accounts/OAuthAuthorizeToken?oauth_token=%s";
      this.ACCESS_TOKEN_URL = "https://www.google.com/accounts/OAuthGetAccessToken";
    }

    GoogleApi.prototype.getAccessTokenEndpoint = function() {
      return this.ACCESS_TOKEN_URL;
    };

    GoogleApi.prototype.getRequestTokenEndpoint = function(config) {
      var scope;
      if (config == null) config = null;
      if (config && (scope = config.getScope())) {
        return sprintf(this.SCOPED_REQUEST_TOKEN_URL, config);
      } else {
        return this.REQUEST_TOKEN_URL;
      }
    };

    GoogleApi.prototype.getAccessTokenVerb = function() {
      return Verb.GET;
    };

    GoogleApi.prototype.getRequestTokenVerb = function() {
      return Verb.GET;
    };

    GoogleApi.prototype.getRequestVerb = function() {
      return Verb.GET;
    };

    GoogleApi.prototype.getAuthorizationUrl = function(request_token) {
      return sprintf(this.AUTHORIZE_URL, request_token.getToken());
    };

    GoogleApi.prototype.getHeaders = function() {
      var headers;
      headers = GoogleApi.__super__.getHeaders.apply(this, arguments).getHeaders();
      headers['Accept'] = '*/*';
      headers['Host'] = 'www.google.com';
      return headers;
    };

    return GoogleApi;

  })();

}).call(this);
