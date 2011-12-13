(function() {
  var api, root;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  api = require('../scribe').DefaultApi10a;

  root.LinkedIn = (function() {

    __extends(LinkedIn, api);

    function LinkedIn() {
      this.REQUEST_TOKEN_URL = "http://api.linkedin.com/uas/oauth/requestToken";
      this.ACCESS_TOKEN_URL = "http://api.linkedin.com/uas/oauth/accessToken";
      this.AUTHORIZE_URL = "http://api.linkedin.com/uas/oauth/authorize?oauth_token=";
    }

    LinkedIn.prototype.getAccessTokenEndpoint = function() {
      return this.ACCESS_TOKEN_URL;
    };

    LinkedIn.prototype.getRequestTokenEndpoint = function() {
      return this.REQUEST_TOKEN_URL;
    };

    LinkedIn.prototype.getAccessTokenVerb = function() {
      return this.POST;
    };

    LinkedIn.prototype.getRequestTokenVerb = function() {
      return this.POST;
    };

    LinkedIn.prototype.getRequestVerb = function() {
      return this.GET;
    };

    LinkedIn.prototype.getAuthorizationUrl = function(request_token) {
      return this.AUTHORIZE_URL + request_token.getToken();
    };

    return LinkedIn;

  })();

}).call(this);
