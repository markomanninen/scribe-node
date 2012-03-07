(function() {
  var api, root,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  api = require('../scribe').DefaultApi20;

  root.FacebookApi = (function(_super) {

    __extends(FacebookApi, _super);

    function FacebookApi() {
      this.AUTHORIZE_URL = "https://www.facebook.com/dialog/oauth?response_type=token";
      this.ACCESS_TOKEN_URL = "https://graph.facebook.com/oauth/access_token";
    }

    FacebookApi.prototype.getAccessTokenEndpoint = function() {
      return this.ACCESS_TOKEN_URL;
    };

    FacebookApi.prototype.getAccessTokenVerb = function() {
      return this.GET;
    };

    FacebookApi.prototype.getRequestVerb = function() {
      return this.GET;
    };

    FacebookApi.prototype.getAuthorizationUrl = function(config) {
      var client, redirect, scope;
      client = '&client_id=' + config.getApiKey();
      redirect = '&redirect_uri=' + config.getCallback();
      if (config.hasScope()) {
        scope = '&scope=' + config.getScope();
        return this.AUTHORIZE_URL + client + redirect + scope;
      } else {
        return this.AUTHORIZE_URL + client + redirect;
      }
    };

    return FacebookApi;

  })(api);

}).call(this);
