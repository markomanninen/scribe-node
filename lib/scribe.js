(function() {
  var BaseStringExtractorImpl, DefaultApi, HMACSha1SignatureService, HeaderExtractorImpl, JsonTokenExtractorImpl, OAuth10aServiceImpl, OAuth20ServiceImpl, OAuthConfig, OAuthConstants, OAuthRequest, PlaintextSignatureService, Request, SignatureType, Timer, TimestampServiceImpl, TokenExtractor20Impl, TokenExtractorImpl, Verb, crypto, decode_data, encode_data, extract_token, http, https, object_merge, params_to_query, root, sort_by_keys, sort_obj, url;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  http = require('http');

  https = require('https');

  url = require('url');

  crypto = require('crypto');

  root.load = function(apis) {
    var api, _i, _len;
    for (_i = 0, _len = apis.length; _i < _len; _i++) {
      api = apis[_i];
      eval('root.' + api + ' = require("./widgets/' + api + '").' + api);
    }
    return this;
  };

  root.Verifier = (function() {

    function Verifier(value) {
      this.value = value;
      if (!this.value) console.log("Must provide a valid string for verifier");
    }

    Verifier.prototype.getValue = function() {
      return this.value;
    };

    return Verifier;

  })();

  root.Token = (function() {

    function Token(token, secret, rawResponse, expires, type, refresh) {
      this.token = token;
      this.secret = secret;
      this.rawResponse = rawResponse != null ? rawResponse : null;
      this.expires = expires != null ? expires : null;
      this.type = type != null ? type : null;
      this.refresh = refresh != null ? refresh : null;
    }

    Token.prototype.updateToken = function(refresh_token) {
      return this.token = refresh_token.getToken();
    };

    Token.prototype.getToken = function() {
      return this.token;
    };

    Token.prototype.getSecret = function() {
      return this.secret;
    };

    Token.prototype.getExpires = function() {
      return this.expires;
    };

    Token.prototype.getType = function() {
      return this.type;
    };

    Token.prototype.getRefresh = function() {
      return this.refresh;
    };

    Token.prototype.getRawResponse = function() {
      if (!this.rawResponse) {
        console.log("This token object was not constructed by scribe and does not have a rawResponse");
        return "";
      }
      return this.rawResponse;
    };

    return Token;

  })();

  OAuthConstants = {
    TIMESTAMP: "oauth_timestamp",
    SIGN_METHOD: "oauth_signature_method",
    SIGNATURE: "oauth_signature",
    CONSUMER_SECRET: "oauth_consumer_secret",
    CONSUMER_KEY: "oauth_consumer_key",
    CALLBACK: "oauth_callback",
    VERSION: "oauth_version",
    NONCE: "oauth_nonce",
    PARAM_PREFIX: "oauth_",
    TOKEN: "oauth_token",
    TOKEN_SECRET: "oauth_token_secret",
    OUT_OF_BAND: "oob",
    VERIFIER: "oauth_verifier",
    HEADER: "Authorization",
    EMPTY_TOKEN: new root.Token("", ""),
    SCOPE: "scope",
    ACCESS_TOKEN: "access_token",
    CLIENT_ID: "client_id",
    CLIENT_SECRET: "client_secret",
    REDIRECT_URI: "redirect_uri",
    GRANT_TYPE: "grant_type",
    AUTHORIZATION_CODE: "authorization_code",
    EXPIRES_IN: "expires_in",
    TOKEN_TYPE: "token_type",
    REFRESH_TOKEN: "refresh_token",
    CODE: "code",
    BEARER: "Bearer "
  };

  Verb = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE"
  };

  SignatureType = {
    Header: "Header",
    QueryString: "QueryString"
  };

  encode_data = function(data) {
    if (!data) return "";
    data = encodeURIComponent(data);
    return data.replace(/\!/g, "%21").replace(/\'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\*/g, "%2A");
  };

  decode_data = function(data) {
    if (!data) return "";
    data = data.replace(/\+/g, " ");
    return decodeURIComponent(data);
  };

  extract_token = function(data, regex) {
    var result;
    if (data) {
      result = regex.exec(data);
      if (result && result[1]) return result[1];
    }
    return "";
  };

  params_to_query = function(params, cb) {
    var key, query, value;
    if (cb == null) cb = null;
    query = "";
    for (key in params) {
      value = params[key];
      if (cb) value = cb(value);
      query += key + "=" + value + "&";
    }
    return query.substr(0, query.length - 1);
  };

  sort_by_keys = function(obj) {
    var key, keys, _i, _len;
    keys = [];
    for (_i = 0, _len = obj.length; _i < _len; _i++) {
      key = obj[_i];
      keys.push(key);
    }
    return keys;
  };

  object_merge = function() {
    var i, key, out;
    out = {};
    if (!arguments.length) return out;
    i = 0;
    while (i < arguments.length) {
      for (key in arguments[i]) {
        out[key] = arguments[i][key];
      }
      i++;
    }
    return out;
  };

  sort_obj = function(obj, idx) {
    var k, sortable, v;
    sortable = [];
    for (k in obj) {
      v = obj[k];
      sortable.push([k, v]);
    }
    sortable.sort(function(a, b) {
      return a[idx] + b[idx];
    });
    return sortable.sort();
  };

  root.get_nonce = function() {
    var tsi;
    tsi = new TimestampServiceImpl;
    return tsi.getNonce();
  };

  JsonTokenExtractorImpl = (function() {

    function JsonTokenExtractorImpl() {}

    JsonTokenExtractorImpl.prototype.extract = function(response_data) {
      if (!response_data) {
        console.log("Response body is incorrect. Can't extract a token from an empty string");
        return OAuthConstants.EMPTY_TOKEN;
      }
      return new root.Token(extract_token(response_data, /"access_token"\s*:\s*"(\S*?)"/g), "", response_data, extract_token(response_data, /"expires_in"\s*:\s*([0-9]*)/g), extract_token(response_data, /"token_type"\s*:\s*"(\S*?)"/g), extract_token(response_data, /"refresh_token"\s*:\s*"(\S*?)"/g));
    };

    return JsonTokenExtractorImpl;

  })();

  TokenExtractor20Impl = (function() {

    function TokenExtractor20Impl() {}

    TokenExtractor20Impl.prototype.extract = function(response_data) {
      if (!response_data) {
        console.log("Response body is incorrect. Can't extract a token from an empty string");
        return OAuthConstants.EMPTY_TOKEN;
      }
      return new root.Token(extract_token(response_data, /access_token=([^&]+)/g), "", response_data, extract_token(response_data, /expires_in=([^&]+)/g), extract_token(response_data, /token_type=([^&]+)/g), extract_token(response_data, /refresh_token=([^&]+)/g));
    };

    return TokenExtractor20Impl;

  })();

  TokenExtractorImpl = (function() {

    function TokenExtractorImpl() {}

    TokenExtractorImpl.prototype.extract = function(response_data) {
      if (!response_data) {
        console.log("Response body is incorrect. Can't extract a token from an empty string");
        return OAuthConstants.EMPTY_TOKEN;
      }
      return new root.Token(extract_token(response_data, /oauth_token=([^&]+)/g), extract_token(response_data, /oauth_token_secret=([^&]+)/g), response_data);
    };

    return TokenExtractorImpl;

  })();

  BaseStringExtractorImpl = (function() {

    function BaseStringExtractorImpl() {}

    BaseStringExtractorImpl.prototype.extract = function(request) {
      var params;
      if (!request) {
        console.log("Cannot extract base string from null object");
        return "";
      }
      params = this.getSortedAndEncodedParams(request);
      return request.getVerb() + "&" + encode_data(request.getUrl()) + "&" + encode_data(params);
    };

    BaseStringExtractorImpl.prototype.getSortedAndEncodedParams = function(request) {
      var pair, params, query, _i, _len;
      params = object_merge(request.queryStringParams, request.bodyParams, request.oauthParameters);
      params = sort_obj(params);
      query = '';
      for (_i = 0, _len = params.length; _i < _len; _i++) {
        pair = params[_i];
        query += pair[0] + "=" + encode_data(pair[1]).replace('%25', "%") + "&";
      }
      return query.substr(0, query.length - 1);
    };

    return BaseStringExtractorImpl;

  })();

  HeaderExtractorImpl = (function() {

    function HeaderExtractorImpl() {}

    HeaderExtractorImpl.prototype.extract = function(request) {
      var header, key, value, _ref;
      if (!request) {
        console.log("Cannot extract a header from a null object");
        return "";
      }
      header = "OAuth ";
      _ref = request.oauthParameters;
      for (key in _ref) {
        value = _ref[key];
        header += key + '="' + encode_data(value).replace('%25', "%") + '", ';
      }
      return header.substr(0, header.length - 2);
    };

    return HeaderExtractorImpl;

  })();

  HMACSha1SignatureService = (function() {

    function HMACSha1SignatureService() {
      this.SHA = "sha1";
      this.METHOD = "HMAC-SHA1";
    }

    HMACSha1SignatureService.prototype.getSignature = function(base_string, api_secret, token_secret) {
      if (!base_string) {
        console.log("Base string cant be null or empty string");
        return "";
      }
      if (!api_secret) {
        console.log("Api secret cant be null or empty string");
        return "";
      }
      return this.doSign(base_string, api_secret + '&' + encode_data(token_secret));
    };

    HMACSha1SignatureService.prototype.doSign = function(data, key) {
      return crypto.createHmac(this.SHA, key).update(data).digest("base64");
    };

    HMACSha1SignatureService.prototype.getSignatureMethod = function() {
      return this.METHOD;
    };

    return HMACSha1SignatureService;

  })();

  PlaintextSignatureService = (function() {

    function PlaintextSignatureService() {
      this.METHOD = "plaintext";
    }

    PlaintextSignatureService.prototype.getSignature = function(base_string, api_secret, token_secret) {
      if (!api_secret) {
        console.log("Api secret cant be null or empty string");
        return "";
      }
      return api_secret + '&' + token_secret;
    };

    PlaintextSignatureService.prototype.getSignatureMethod = function() {
      return this.METHOD;
    };

    return PlaintextSignatureService;

  })();

  Timer = (function() {

    function Timer() {}

    Timer.prototype.getMillis = function() {
      return new Date().getTime();
    };

    Timer.prototype.getRandomInteger = function() {
      return Math.floor(Math.random() * 100000000000000000);
    };

    return Timer;

  })();

  TimestampServiceImpl = (function() {

    function TimestampServiceImpl() {
      this.timer = new Timer;
    }

    TimestampServiceImpl.prototype.getNonce = function() {
      return this.getTimestampInSeconds() + this.timer.getRandomInteger();
    };

    TimestampServiceImpl.prototype.getTimestampInSeconds = function() {
      return Math.floor(this.timer.getMillis() / 1000);
    };

    TimestampServiceImpl.prototype.setTimer = function(timer) {
      this.timer = timer;
    };

    return TimestampServiceImpl;

  })();

  Request = (function() {

    function Request(verb, url) {
      var pair, query, val, vals, _i, _len;
      this.verb = verb;
      this.url = url;
      this.queryStringParams = {};
      this.bodyParams = {};
      this.headers = {};
      this.encoding = 'utf8';
      query = this.url.split('?');
      if (query[1]) {
        vals = query[1].split("&");
        for (_i = 0, _len = vals.length; _i < _len; _i++) {
          val = vals[_i];
          pair = val.split("=");
          this.addQueryStringParameter(pair[0], pair[1]);
        }
      }
      this.url = query[0];
    }

    Request.prototype.getBodyParams = function() {
      return this.bodyParams;
    };

    Request.prototype.getUrl = function() {
      return this.url;
    };

    Request.prototype.getVerb = function() {
      return this.verb;
    };

    Request.prototype.getHeaders = function() {
      return this.headers;
    };

    Request.prototype.request = function(protocol, options, callback) {
      var encoding;
      encoding = this.encoding;
      return protocol.request(options, function(res) {
        res.setEncoding(encoding);
        res.data = '';
        res.on('data', function(chunk) {
          return this.data += chunk;
        });
        res.on('end', function() {
          return callback(this);
        });
        return res.on('close', function() {
          return callback(this);
        });
      });
    };

    Request.prototype.send = function(callback) {
      var options, params, parsed_options, protocol, req;
      parsed_options = url.parse(this.url);
      options = {};
      options['host'] = parsed_options['hostname'];
      params = params_to_query(this.queryStringParams, encode_data);
      options['path'] = parsed_options['pathname'] + (params ? '?' + params : '');
      options['method'] = this.verb;
      options['headers'] = this.headers;
      protocol = parsed_options['protocol'] === 'https:' ? https : http;
      req = this.request(protocol, options, callback);
      req.on('error', function(e) {
        return console.log('Problem with sent request: ' + e.message);
      });
      if (this.verb === Verb.PUT || this.verb === Verb.POST) {
        req.write(params_to_query(this.bodyParams, encode_data));
      }
      return req.end();
    };

    Request.prototype.addHeader = function(key, value) {
      return this.headers[key] = value;
    };

    Request.prototype.addBodyParameter = function(key, value) {
      return this.bodyParams[key] = value;
    };

    Request.prototype.addQueryStringParameter = function(key, value) {
      return this.queryStringParams[key] = value;
    };

    Request.prototype.setEncoding = function(encoding) {
      this.encoding = encoding;
    };

    return Request;

  })();

  OAuthRequest = (function() {

    __extends(OAuthRequest, Request);

    function OAuthRequest(verb, url) {
      OAuthRequest.__super__.constructor.call(this, verb, url);
      this.oauthParameters = {};
    }

    OAuthRequest.prototype.addOAuthParameter = function(key, value) {
      return this.oauthParameters[key] = value;
    };

    return OAuthRequest;

  })();

  OAuthConfig = (function() {

    function OAuthConfig(apiKey, apiSecret, cb, type, scope) {
      this.apiKey = apiKey;
      this.apiSecret = apiSecret;
      if (cb == null) cb = null;
      if (type == null) type = null;
      this.scope = scope != null ? scope : null;
      if (cb !== null) {
        this.callback = cb;
      } else {
        this.callback = OAuthConstants.OUT_OF_BAND;
      }
      if (type !== null) {
        this.signatureType = type;
      } else {
        this.signatureType = SignatureType.Header;
      }
    }

    OAuthConfig.prototype.getApiKey = function() {
      return this.apiKey;
    };

    OAuthConfig.prototype.getApiSecret = function() {
      return this.apiSecret;
    };

    OAuthConfig.prototype.getCallback = function() {
      return this.callback;
    };

    OAuthConfig.prototype.getSignatureType = function() {
      return this.signatureType;
    };

    OAuthConfig.prototype.getScope = function() {
      return this.scope;
    };

    OAuthConfig.prototype.hasScope = function() {
      if (this.getScope()) return true;
      return false;
    };

    return OAuthConfig;

  })();

  OAuth10aServiceImpl = (function() {

    function OAuth10aServiceImpl(api, config) {
      this.api = api;
      this.config = config;
      this.VERSION = "1.0";
      this.request = new OAuthRequest(this.api.getRequestTokenVerb(), this.api.getRequestTokenEndpoint());
    }

    OAuth10aServiceImpl.prototype.getRequestToken = function(cb) {
      var req, scope;
      req = this.request;
      if (scope = this.config.getScope()) {
        req.addQueryStringParameter('scope', scope);
      }
      req.addOAuthParameter(OAuthConstants.CALLBACK, this.config.getCallback());
      this.addOAuthParams(req, OAuthConstants.EMPTY_TOKEN);
      this.addSignature(req);
      return req.send(cb);
    };

    OAuth10aServiceImpl.prototype.addOAuthParams = function(request, token) {
      request.addOAuthParameter(OAuthConstants.TIMESTAMP, this.api.getTimestampService().getTimestampInSeconds());
      request.addOAuthParameter(OAuthConstants.NONCE, this.api.getTimestampService().getNonce());
      request.addOAuthParameter(OAuthConstants.CONSUMER_KEY, this.config.getApiKey());
      request.addOAuthParameter(OAuthConstants.SIGN_METHOD, this.api.getSignatureService().getSignatureMethod());
      request.addOAuthParameter(OAuthConstants.VERSION, this.getVersion());
      return request.addOAuthParameter(OAuthConstants.SIGNATURE, this.getSignature(request, token));
    };

    OAuth10aServiceImpl.prototype.getAccessToken = function(request_token, verifier, cb) {
      var request;
      request = new OAuthRequest(this.api.getAccessTokenVerb(), this.api.getAccessTokenEndpoint());
      request.addOAuthParameter(OAuthConstants.TOKEN, request_token.getToken());
      request.addOAuthParameter(OAuthConstants.VERIFIER, verifier.getValue());
      this.addOAuthParams(request, request_token);
      this.addSignature(request);
      return request.send(cb);
    };

    OAuth10aServiceImpl.prototype.signedImagePostRequest = function(token, cb, endpoint, params) {
      var key, request, value;
      request = new OAuthRequest(Verb.POST, endpoint);
      request.setEncoding('binary');
      for (key in params) {
        value = params[key];
        request.addBodyParameter(key, value);
      }
      this.signRequest(token, request);
      return request.send(cb);
    };

    OAuth10aServiceImpl.prototype.signedPostRequest = function(token, cb, endpoint, params) {
      var key, request, value;
      request = new OAuthRequest(Verb.POST, endpoint);
      for (key in params) {
        value = params[key];
        request.addBodyParameter(key, value);
      }
      this.signRequest(token, request);
      return request.send(cb);
    };

    OAuth10aServiceImpl.prototype.signedRequest = function(token, cb, endpoint) {
      var request;
      request = new OAuthRequest(this.api.getRequestVerb(), endpoint);
      this.signRequest(token, request);
      return request.send(cb);
    };

    OAuth10aServiceImpl.prototype.signRequest = function(token, request) {
      var key, value, _ref;
      _ref = this.api.getHeaders();
      for (key in _ref) {
        value = _ref[key];
        request.addHeader(key, value);
      }
      request.addOAuthParameter(OAuthConstants.TOKEN, token.getToken());
      this.addOAuthParams(request, token);
      return this.addSignature(request);
    };

    OAuth10aServiceImpl.prototype.addBodyParam = function(key, value) {
      return this.request.addBodyParameter(key, value);
    };

    OAuth10aServiceImpl.prototype.addBodyParams = function(params) {
      var key, value, _len, _results;
      _results = [];
      for (value = 0, _len = params.length; value < _len; value++) {
        key = params[value];
        _results.push(this.addBodyParam(key, value));
      }
      return _results;
    };

    OAuth10aServiceImpl.prototype.getVersion = function() {
      return this.VERSION;
    };

    OAuth10aServiceImpl.prototype.getAuthorizationUrl = function(request_token) {
      return this.api.getAuthorizationUrl(request_token);
    };

    OAuth10aServiceImpl.prototype.getSignature = function(request, token) {
      var base_string;
      base_string = this.api.getBaseStringExtractor().extract(request);
      return this.api.getSignatureService().getSignature(base_string, this.config.getApiSecret(), token.getSecret());
    };

    OAuth10aServiceImpl.prototype.addSignature = function(request) {
      var key, oauthHeader, value, _ref, _results;
      if (this.config.getSignatureType() === SignatureType.Header) {
        oauthHeader = this.api.getHeaderExtractor().extract(request);
        return request.addHeader(OAuthConstants.HEADER, oauthHeader);
      } else if (this.config.getSignatureType() === SignatureType.QueryString) {
        _ref = request.oauthParameters;
        _results = [];
        for (key in _ref) {
          value = _ref[key];
          _results.push(request.addQueryStringParameter(key, value));
        }
        return _results;
      }
    };

    return OAuth10aServiceImpl;

  })();

  DefaultApi = (function() {

    function DefaultApi() {}

    DefaultApi.prototype.GET = Verb.GET;

    DefaultApi.prototype.POST = Verb.POST;

    DefaultApi.prototype.PUT = Verb.PUT;

    DefaultApi.prototype.DELETE = Verb.DELETE;

    DefaultApi.prototype.getHeaders = function() {
      var headers;
      headers = {};
      headers['User-Agent'] = 'Scribe OAuth Client (node.js)';
      return headers;
    };

    DefaultApi.prototype.getJsonTokenExtractor = function() {
      return new JsonTokenExtractorImpl().extract;
    };

    return DefaultApi;

  })();

  root.DefaultApi10a = (function() {

    __extends(DefaultApi10a, DefaultApi);

    function DefaultApi10a() {
      DefaultApi10a.__super__.constructor.apply(this, arguments);
    }

    DefaultApi10a.prototype.getAccessTokenExtractor = function() {
      return new TokenExtractorImpl().extract;
    };

    DefaultApi10a.prototype.getBaseStringExtractor = function() {
      return new BaseStringExtractorImpl;
    };

    DefaultApi10a.prototype.getHeaderExtractor = function() {
      return new HeaderExtractorImpl;
    };

    DefaultApi10a.prototype.getRequestTokenExtractor = function() {
      return new TokenExtractorImpl().extract;
    };

    DefaultApi10a.prototype.getSignatureService = function() {
      return new HMACSha1SignatureService;
    };

    DefaultApi10a.prototype.getTimestampService = function() {
      return new TimestampServiceImpl;
    };

    DefaultApi10a.prototype.getAccessTokenVerb = function() {
      return this.POST;
    };

    DefaultApi10a.prototype.getRequestTokenVerb = function() {
      return this.POST;
    };

    DefaultApi10a.prototype.getRequestVerb = function() {
      return this.POST;
    };

    DefaultApi10a.prototype.createService = function(config) {
      return new OAuth10aServiceImpl(this, config);
    };

    return DefaultApi10a;

  })();

  OAuth20ServiceImpl = (function() {

    function OAuth20ServiceImpl(api, config) {
      this.api = api;
      this.config = config;
      this.VERSION = "2.0";
    }

    OAuth20ServiceImpl.prototype.getToken = function(cb, params, endpoint) {
      var key, request, value, verb, _ref;
      verb = this.api.getAccessTokenVerb();
      request = new OAuthRequest(verb, endpoint);
      if (verb === Verb.POST || verb === Verb.PUT) {
        for (key in params) {
          value = params[key];
          request.addBodyParameter(key, value);
        }
      } else {
        for (key in params) {
          value = params[key];
          request.addQueryStringParameter(key, value);
        }
      }
      _ref = this.api.getHeaders();
      for (key in _ref) {
        value = _ref[key];
        request.addHeader(key, value);
      }
      return request.send(cb);
    };

    OAuth20ServiceImpl.prototype.getAccessToken = function(verifier, cb) {
      var params;
      params = {};
      params[OAuthConstants.CLIENT_ID] = this.config.getApiKey();
      params[OAuthConstants.CLIENT_SECRET] = this.config.getApiSecret();
      params[OAuthConstants.CODE] = verifier.getValue();
      params[OAuthConstants.REDIRECT_URI] = this.config.getCallback();
      params[OAuthConstants.GRANT_TYPE] = OAuthConstants.AUTHORIZATION_CODE;
      if (this.config.hasScope()) {
        params[OAuthConstants.SCOPE] = this.config.getScope();
      }
      return this.getToken(cb, params, this.api.getAccessTokenEndpoint());
    };

    OAuth20ServiceImpl.prototype.getRefreshToken = function(access_token, cb) {
      var params;
      params = {};
      params[OAuthConstants.CLIENT_ID] = this.config.getApiKey();
      params[OAuthConstants.CLIENT_SECRET] = this.config.getApiSecret();
      params[OAuthConstants.REFRESH_TOKEN] = access_token.getRefresh();
      params[OAuthConstants.GRANT_TYPE] = OAuthConstants.REFRESH_TOKEN;
      if (this.config.hasScope()) {
        params[OAuthConstants.SCOPE] = this.config.getScope();
      }
      return this.getToken(cb, params, this.api.getRefreshTokenEndpoint());
    };

    OAuth20ServiceImpl.prototype.getRequestToken = function() {
      return console.log("Unsupported operation, please use 'getAuthorizationUrl' and redirect your users there");
    };

    OAuth20ServiceImpl.prototype.getVersion = function() {
      return this.VERSION;
    };

    OAuth20ServiceImpl.prototype.signedRequest = function(token, cb, endpoint) {
      var request;
      request = new OAuthRequest(this.api.getRequestVerb(), endpoint);
      this.signRequest(token, request);
      return request.send(cb);
    };

    OAuth20ServiceImpl.prototype.signRequest = function(access_token, request) {
      if (access_token.getType().toLowerCase() === 'bearer') {
        return request.addHeader(OAuthConstants.HEADER, OAuthConstants.BEARER + access_token.getToken());
      } else {
        return request.addQueryStringParameter(OAuthConstants.ACCESS_TOKEN, access_token.getToken());
      }
    };

    OAuth20ServiceImpl.prototype.getAuthorizationUrl = function() {
      return this.api.getAuthorizationUrl(this.config);
    };

    return OAuth20ServiceImpl;

  })();

  root.DefaultApi20 = (function() {

    __extends(DefaultApi20, DefaultApi);

    function DefaultApi20() {
      DefaultApi20.__super__.constructor.apply(this, arguments);
    }

    DefaultApi20.prototype.isFresh = function(response_data) {
      if (extract_token(extract_token(response_data, /"error"\s*:\s*\{(.*?)\}\}/g), /"message"\s*:\s*"(.*?)"/g).toLowerCase() === "invalid credentials") {
        return false;
      } else {
        return true;
      }
    };

    DefaultApi20.prototype.getAccessTokenExtractor = function() {
      return new TokenExtractor20Impl().extract;
    };

    DefaultApi20.prototype.getAccessTokenVerb = function() {
      return this.GET;
    };

    DefaultApi20.prototype.createService = function(config) {
      return new OAuth20ServiceImpl(this, config);
    };

    return DefaultApi20;

  })();

  root.ServiceBuilder = (function() {

    function ServiceBuilder(signatureType, scope) {
      this.signatureType = signatureType != null ? signatureType : null;
      this.scope = scope != null ? scope : null;
      this.callback = OAuthConstants.OUT_OF_BAND;
    }

    ServiceBuilder.prototype.provider = function(apiClass) {
      if (!apiClass) {
        console.log("Error: API class not given!");
      } else {
        this.api = new apiClass;
      }
      return this;
    };

    ServiceBuilder.prototype._callback = function(callback) {
      this.callback = callback;
      if (!this.callback) console.log("Notice: Callback not given");
      return this;
    };

    ServiceBuilder.prototype.apiKey = function(apiKey) {
      this.apiKey = apiKey;
      if (!this.apiKey) console.log("Error: API key not given!");
      return this;
    };

    ServiceBuilder.prototype.apiSecret = function(apiSecret) {
      this.apiSecret = apiSecret;
      if (!this.apiSecret) console.log("Warning: API secret not given");
      return this;
    };

    ServiceBuilder.prototype._scope = function(scope) {
      this.scope = scope;
      if (!this.scope) console.log("Warning: OAuth scope not given");
      return this;
    };

    ServiceBuilder.prototype.signatureType = function(signatureType) {
      this.signatureType = signatureType;
      if (!this.signatureType) {
        console.log("Notice: Signature type not given. Header type will be used.");
      }
      return this;
    };

    ServiceBuilder.prototype.build = function() {
      if (!this.api) {
        console.log("Error: You must specify a valid API through the provider() method");
      }
      if (!this.apiKey) console.log("Error: You must provide an API key");
      if (!this.apiSecret) console.log("Warning: You didnt provide an API secret");
      return this.api.createService(new OAuthConfig(this.apiKey, this.apiSecret, this.callback, this.signatureType, this.scope));
    };

    return ServiceBuilder;

  })();

}).call(this);
