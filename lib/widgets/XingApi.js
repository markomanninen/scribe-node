(function() {
  var api, root,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  api = require('../scribe').DefaultApi10a;

  root.XingApi = (function(_super) {

    __extends(XingApi, _super);

    function XingApi() {
      this.REQUEST_TOKEN_URL = "https://api.xing.com/v1/request_token";
      this.ACCESS_TOKEN_URL = "https://api.xing.com/vi/access_token";
      this.AUTHORIZE_URL = "https://api.xing.com/vi/authorize?oauth_token=";
    }

    XingApi.prototype.getAccessTokenEndpoint = function() {
      return this.ACCESS_TOKEN_URL;
    };

    XingApi.prototype.getRequestTokenEndpoint = function() {
      return this.REQUEST_TOKEN_URL;
    };

    XingApi.prototype.getAccessTokenVerb = function() {
      return this.POST;
    };

    XingApi.prototype.getRequestTokenVerb = function() {
      return this.POST;
    };

    XingApi.prototype.getRequestVerb = function() {
      return this.GET;
    };

    XingApi.prototype.getAuthorizationUrl = function(request_token) {
      return this.AUTHORIZE_URL + request_token.getToken();
    };

    return XingApi;

  })(api);

}).call(this);
