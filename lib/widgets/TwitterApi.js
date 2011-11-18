(function() {
  var api, root;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  api = require('../scribe').DefaultApi10a;

  root.Twitter = (function() {

    __extends(Twitter, api);

    function Twitter() {
      this.REQUEST_TOKEN_URL = "http://api.twitter.com/oauth/request_token";
      this.ACCESS_TOKEN_URL = "http://api.twitter.com/oauth/access_token";
      this.AUTHORIZE_URL = "http://api.twitter.com/oauth/authorize?oauth_token=";
    }

    Twitter.prototype.getAccessTokenEndpoint = function() {
      return this.ACCESS_TOKEN_URL;
    };

    Twitter.prototype.getRequestTokenEndpoint = function() {
      return this.REQUEST_TOKEN_URL;
    };

    Twitter.prototype.getAccessTokenVerb = function() {
      return this.GET;
    };

    Twitter.prototype.getRequestTokenVerb = function() {
      return this.GET;
    };

    Twitter.prototype.getRequestVerb = function() {
      return this.GET;
    };

    Twitter.prototype.getAuthorizationUrl = function(request_token) {
      return this.AUTHORIZE_URL + request_token.getToken();
    };

    return Twitter;

  })();

}).call(this);
