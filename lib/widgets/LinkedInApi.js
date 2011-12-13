(function() {
  var api, root;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  api = require('../scribe').DefaultApi10a;

  root.LinkedInApi = (function() {

    __extends(LinkedInApi, api);

    function LinkedInApi() {
      this.REQUEST_TOKEN_URL = "https://api.linkedin.com/uas/oauth/requestToken";
      this.ACCESS_TOKEN_URL = "https://api.linkedin.com/uas/oauth/accessToken";
      this.AUTHORIZE_URL = "https://api.linkedin.com/uas/oauth/authorize?oauth_token=";
    }

    LinkedInApi.prototype.getAccessTokenEndpoint = function() {
      return this.ACCESS_TOKEN_URL;
    };

    LinkedInApi.prototype.getRequestTokenEndpoint = function() {
      return this.REQUEST_TOKEN_URL;
    };

    LinkedInApi.prototype.getAccessTokenVerb = function() {
      return this.POST;
    };

    LinkedInApi.prototype.getRequestTokenVerb = function() {
      return this.POST;
    };

    LinkedInApi.prototype.getRequestVerb = function() {
      return this.GET;
    };

    LinkedInApi.prototype.getAuthorizationUrl = function(request_token) {
      return this.AUTHORIZE_URL + request_token.getToken();
    };

    return LinkedInApi;

  })();

}).call(this);
