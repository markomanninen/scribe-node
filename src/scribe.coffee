# Scribe Java OAuth library port to node.js
#
# This library abstracts different OAuth schemes and modularizes web services so
# that both authorization routines and data retrieval after authorization is easy to do.
# Library design is borrowed from the corresponding java library:
#
# https://github.com/fernandezpablo85/scribe-java
#
# See README for usage and examples.
#
# Author: Marko Manninen <mmstud@gmail.com> (http://about.me/markomanninen)
# Copyright (c) 2011

root = exports ? this

http = require 'http'
https = require 'https'
url = require 'url'
crypto = require 'crypto'

root.load = (apis) ->
  for api in apis
    # root[api] = require('./widgets/' + api)[api]
    eval('root.'+api+' = require("./widgets/'+api+'").'+api)
  return this

# Verifier class
class root.Verifier
  constructor: (@value) ->
    if not @value
      console.log "Must provide a valid string for verifier"

  getValue: ->
    @value

# Token class
class root.Token
  # expires, type and refresh are OAuth 2.0 specific arguments
  constructor: (@token, @secret, @rawResponse = null, @expires = null, @type = null, @refresh = null) ->

  updateToken: (refresh_token) ->
    @token = refresh_token.getToken()

  getToken: ->
    @token

  getSecret: ->
    @secret

  getExpires: ->
    @expires

  getType: ->
    @type

  getRefresh: ->
    @refresh

  getRawResponse: ->
    if not @rawResponse
      console.log "This token object was not constructed by scribe and does not have a rawResponse"
      return ""
    @rawResponse

# OAuth Consonants
OAuthConstants = 
  # OAuth 1.0a
  TIMESTAMP: "oauth_timestamp"
  SIGN_METHOD: "oauth_signature_method"
  SIGNATURE: "oauth_signature"
  CONSUMER_SECRET: "oauth_consumer_secret"
  CONSUMER_KEY: "oauth_consumer_key"
  CALLBACK: "oauth_callback"
  VERSION: "oauth_version"
  NONCE: "oauth_nonce"
  PARAM_PREFIX: "oauth_"
  TOKEN: "oauth_token"
  TOKEN_SECRET: "oauth_token_secret"
  OUT_OF_BAND: "oob"
  VERIFIER: "oauth_verifier"
  HEADER: "Authorization"
  # TODO: I'm not sure if there is really rationale for token object. Empty string could work as well...
  EMPTY_TOKEN: new root.Token("", "")
  SCOPE: "scope"
  # OAuth 2.0
  ACCESS_TOKEN: "access_token"
  CLIENT_ID: "client_id"
  CLIENT_SECRET: "client_secret"
  REDIRECT_URI: "redirect_uri"
  GRANT_TYPE: "grant_type"
  AUTHORIZATION_CODE: "authorization_code"
  EXPIRES_IN: "expires_in"
  TOKEN_TYPE: "token_type"
  REFRESH_TOKEN: "refresh_token"
  CODE: "code"
  BEARER: "Bearer "

# Verbs
Verb =
  GET: "GET"
  POST: "POST"
  PUT: "PUT"
  DELETE: "DELETE"

# Signature types
SignatureType =
  Header: "Header"
  QueryString: "QueryString"

encode_data = (data) ->
  if not data
    return ""
  data = encodeURIComponent data
  # Fix the mismatch between OAuth's  RFC3986 and Javascript
  # Note: tokens can have % characters too why BaseStringExtractorImpl
  # and getSortedAndEncodedParams has a custom fix too. TODO: are there other
  # similar exceptions?
  data.replace(/\!/g, "%21")
      .replace(/\'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/\*/g, "%2A")

decode_data = (data) ->
  if not data
    return ""
  data = data.replace /\+/g, " "
  return decodeURIComponent data

extract_token = (data, regex) ->
  if data
    result = regex.exec data
    if result && result[1]
      return result[1]
  return ""

params_to_query = (params, cb = null) ->
  query = ""
  for key, value of params
    if cb
      value = cb value
    query += key+"="+value+"&"
  return query.substr 0, query.length-1

sort_by_keys = (obj) ->
  keys = [];
  for key in obj
    keys.push(key)
  return keys

object_merge = ->
  out = {}
  return out unless arguments.length
  i = 0
  while i < arguments.length
    for key of arguments[i]
      out[key] = arguments[i][key]
    i++
  return out

sort_obj = (obj, idx) ->
  sortable = []
  for k, v of obj
    sortable.push [k, v]
  sortable.sort (a, b) ->
    a[idx] + b[idx]
  sortable.sort()

root.get_nonce = () ->
  tsi = new TimestampServiceImpl
  return tsi.getNonce()

#
class JsonTokenExtractorImpl
  extract: (response_data) ->
    if not response_data
      console.log "Response body is incorrect. Can't extract a token from an empty string"
      return OAuthConstants.EMPTY_TOKEN
    new root.Token(extract_token(response_data, /"access_token"\s*:\s*"(\S*?)"/g), "", response_data, extract_token(response_data, /"expires_in"\s*:\s*([0-9]*)/g), extract_token(response_data, /"token_type"\s*:\s*"(\S*?)"/g), extract_token(response_data, /"refresh_token"\s*:\s*"(\S*?)"/g))

#
class TokenExtractor20Impl
  extract: (response_data) ->
    if not response_data
      console.log "Response body is incorrect. Can't extract a token from an empty string"
      return OAuthConstants.EMPTY_TOKEN
    new root.Token(extract_token(response_data, /access_token=([^&]+)/g), "", response_data, extract_token(response_data, /expires_in=([^&]+)/g), extract_token(response_data, /token_type=([^&]+)/g), extract_token(response_data, /refresh_token=([^&]+)/g))

#
class TokenExtractorImpl
  extract: (response_data) ->
    if not response_data
      console.log "Response body is incorrect. Can't extract a token from an empty string"
      return OAuthConstants.EMPTY_TOKEN
    new root.Token(extract_token(response_data, /oauth_token=([^&]+)/g), extract_token(response_data, /oauth_token_secret=([^&]+)/g), response_data)

#
class BaseStringExtractorImpl
  extract: (request) ->
    if not request
      console.log "Cannot extract base string from null object"
      return ""
    params = @getSortedAndEncodedParams request
    request.getVerb()+"&"+encode_data(request.getUrl())+"&"+encode_data(params)

  getSortedAndEncodedParams: (request) ->
    params = object_merge(request.queryStringParams,
                          request.bodyParams,
                          request.oauthParameters)
    params = sort_obj params
    query = ''
    for pair in params
      query += pair[0]+"="+encode_data(pair[1]).replace('%25', "%")+"&"
    query.substr 0, query.length-1

#
class HeaderExtractorImpl
  extract: (request) ->
    if not request
      console.log "Cannot extract a header from a null object"
      return ""
    header = "OAuth "
    for key, value of request.oauthParameters
      header += key+'="'+encode_data(value).replace('%25', "%")+'", '
    header.substr 0, header.length-2

#
class HMACSha1SignatureService
  constructor: ->
    @SHA = "sha1"
    @METHOD = "HMAC-SHA1"

  getSignature: (base_string, api_secret, token_secret) ->
    if not base_string
      console.log "Base string cant be null or empty string"
      return ""
    if not api_secret
      console.log "Api secret cant be null or empty string"
      return ""
    @doSign base_string, api_secret + '&' + encode_data token_secret

  doSign: (data, key) ->
    crypto.createHmac(@SHA, key).update(data).digest "base64"

  getSignatureMethod: ->
    @METHOD

#
class PlaintextSignatureService
  constructor: ->
    @METHOD = "plaintext"

  getSignature: (base_string, api_secret, token_secret) ->
    if not api_secret
      console.log "Api secret cant be null or empty string"
      return ""
    api_secret + '&' + token_secret
  
  getSignatureMethod: ->
    @METHOD

#
class Timer
  getMillis: ->
    new Date().getTime()

  getRandomInteger: ->
    Math.floor Math.random()*100000000000000000

#
class TimestampServiceImpl
  constructor: ->
    @timer = new Timer

  getNonce: ->
    @getTimestampInSeconds() + @timer.getRandomInteger()

  getTimestampInSeconds: ->
    Math.floor (@timer.getMillis() / 1000)

  setTimer: (@timer) ->

# Request class
class Request
  constructor: (@verb, @url) ->
    @queryStringParams = {}
    @bodyParams  = {}
    @headers  = {}
    @encoding = 'utf8'
    # parse query string
    query = @url.split('?')
    if query[1]
      vals = query[1].split("&")
      for val in vals 
          pair = val.split("=")
          @addQueryStringParameter pair[0], pair[1]
    # set up plain url without query string
    @url = query[0]

  getBodyParams: ->
    @bodyParams

  getUrl: ->
    @url

  getVerb: ->
    @verb

  getHeaders: ->
    @headers

  request: (protocol, options, callback) ->
    encoding = @encoding
    protocol.request options, (res) ->
      #console.log 'STATUS: ' + res.statusCode
      #console.log 'HEADERS: ' + JSON.stringify res.headers
      #console.log 'ENCODING: ' + encoding
      #console.log 'ORIGINAL: ' + original_response
      res.setEncoding(encoding)
      res.data = ''
      res.on 'data', (chunk) ->
        #console.log 'DATA: ...'
        this.data += chunk
      res.on 'end', () ->
        #console.log 'END: ' + data
        callback this
      res.on 'close', () ->
        #console.log 'CLOSE: ' + data
        callback this

  send: (callback) ->
    parsed_options = url.parse(@url)
    options = {}
    options['host'] = parsed_options['hostname']
    # TODO: handle ports other than 80, 443
    #options['port'] = 80
    params = params_to_query @queryStringParams, encode_data
    options['path'] = parsed_options['pathname'] + (if params then '?'+params else '')
    options['method'] = @verb
    options['headers'] = @headers
    #console.log 'OPTIONS: ' + JSON.stringify options
    protocol = if parsed_options['protocol'] == 'https:' then https else http
    req = @request protocol, options, callback
    req.on 'error', (e) ->
      console.log 'Problem with sent request: ' + e.message
    if @verb == Verb.PUT || @verb == Verb.POST
      req.write params_to_query @bodyParams, encode_data
    req.end()

  addHeader: (key, value) ->
    @headers[key] = value

  addBodyParameter: (key, value) ->
    @bodyParams[key] = value

  addQueryStringParameter: (key, value) ->
    @queryStringParams[key] = value

  setEncoding: (@encoding) ->

# OAuth request class
class OAuthRequest extends Request
  constructor: (verb, url) ->
    super verb, url
    @oauthParameters = {}

  addOAuthParameter: (key, value) ->
    @oauthParameters[key] = value

# OAuth configuration class
class OAuthConfig
  constructor: (@apiKey, @apiSecret, cb = null, type = null, @scope = null) ->
    if cb != null
      @callback = cb
    else
      @callback = OAuthConstants.OUT_OF_BAND
    if type != null
      @signatureType = type
    else
      @signatureType = SignatureType.Header

  getApiKey: ->
    @apiKey

  getApiSecret: ->
    @apiSecret

  getCallback: ->
    @callback

  getSignatureType: ->
    @signatureType

  getScope: ->
    @scope

  hasScope: ->
    if @getScope()
      return true
    return false


# OAuth 1.0a implementation
class OAuth10aServiceImpl
  constructor: (@api, @config) ->
    @VERSION = "1.0"
    @request = new OAuthRequest @api.getRequestTokenVerb(), @api.getRequestTokenEndpoint()
  
  getRequestToken: (cb) ->
    req = @request
    if scope = @config.getScope()
      # NOTE: google has a scope on signature for example
      req.addQueryStringParameter 'scope', scope
    req.addOAuthParameter OAuthConstants.CALLBACK, @config.getCallback()
    @addOAuthParams req, OAuthConstants.EMPTY_TOKEN
    @addSignature req
    req.send cb

  addOAuthParams: (request, token) ->
    request.addOAuthParameter OAuthConstants.TIMESTAMP, @api.getTimestampService().getTimestampInSeconds()
    request.addOAuthParameter OAuthConstants.NONCE, @api.getTimestampService().getNonce()
    request.addOAuthParameter OAuthConstants.CONSUMER_KEY, @config.getApiKey()
    request.addOAuthParameter OAuthConstants.SIGN_METHOD, @api.getSignatureService().getSignatureMethod()
    request.addOAuthParameter OAuthConstants.VERSION, @getVersion()
    #if scope = @config.getScope()
      # google doesnt have scope on oauth headers but on query string onl. how about others?
      #request.addOAuthParameter OAuthConstants.SCOPE, scope
    request.addOAuthParameter OAuthConstants.SIGNATURE, @getSignature request, token

  getAccessToken: (request_token, verifier, cb) ->
    request = new OAuthRequest @api.getAccessTokenVerb(), @api.getAccessTokenEndpoint()
    request.addOAuthParameter OAuthConstants.TOKEN, request_token.getToken()
    request.addOAuthParameter OAuthConstants.VERIFIER, verifier.getValue()
    @addOAuthParams request, request_token
    @addSignature request
    request.send cb

  signedImagePostRequest: (token, cb, endpoint, params) ->
    request = new OAuthRequest Verb.POST, endpoint
    request.setEncoding('binary')
    for key, value of params
      request.addBodyParameter key, value
    @signRequest token, request
    request.send cb

  signedPostRequest: (token, cb, endpoint, params) ->
    request = new OAuthRequest Verb.POST, endpoint
    for key, value of params
      request.addBodyParameter key, value
    @signRequest token, request
    request.send cb

  signedRequest: (token, cb, endpoint) ->
    request = new OAuthRequest @api.getRequestVerb(), endpoint
    @signRequest token, request
    request.send cb
    
  signRequest: (token, request) ->
    for key, value of @api.getHeaders()
      request.addHeader key, value
    request.addOAuthParameter OAuthConstants.TOKEN, token.getToken()
    @addOAuthParams request, token
    @addSignature request

  addBodyParam: (key, value) ->
    @request.addBodyParameter key, value

  addBodyParams: (params) ->
    for key, value in params
      @addBodyParam key, value

  getVersion: ->
    @VERSION

  getAuthorizationUrl: (request_token) ->
    @api.getAuthorizationUrl request_token

  getSignature: (request, token) ->
    base_string = @api.getBaseStringExtractor().extract request
    @api.getSignatureService().getSignature base_string, @config.getApiSecret(), token.getSecret()

  addSignature: (request) ->
    if @config.getSignatureType() == SignatureType.Header
      oauthHeader = @api.getHeaderExtractor().extract request
      request.addHeader OAuthConstants.HEADER, oauthHeader
    else if @config.getSignatureType() == SignatureType.QueryString
      for key, value of request.oauthParameters
        request.addQueryStringParameter key, value

#
class DefaultApi
  GET: Verb.GET
  POST: Verb.POST
  PUT: Verb.PUT
  DELETE: Verb.DELETE

  getHeaders: () ->
    headers = {}
    headers['User-Agent'] = 'Scribe OAuth Client (node.js)'
    return headers

  getJsonTokenExtractor: ->
    new JsonTokenExtractorImpl().extract

# OAuth version 1a default API. To be included on widgets
class root.DefaultApi10a extends DefaultApi
  getAccessTokenExtractor: ->
    new TokenExtractorImpl().extract

  getBaseStringExtractor: ->
    new BaseStringExtractorImpl

  getHeaderExtractor: ->
    new HeaderExtractorImpl

  getRequestTokenExtractor: ->
    new TokenExtractorImpl().extract

  getSignatureService: ->
    new HMACSha1SignatureService

  getTimestampService: ->
    new TimestampServiceImpl

  getAccessTokenVerb: ->
    @POST

  getRequestTokenVerb: ->
    @POST

  getRequestVerb: ->
    @POST

  createService: (config) ->
    new OAuth10aServiceImpl this, config

# OAuth 2.0 implementation
class OAuth20ServiceImpl
  constructor: (@api, @config) ->
    @VERSION = "2.0"

  getToken: (cb, params, endpoint) ->
    verb = @api.getAccessTokenVerb()
    request = new OAuthRequest verb, endpoint
    # TODO: is this universal behavior or just Google requires to add params on body on post?
    if verb == Verb.POST || verb == Verb.PUT
      for key, value of params
        request.addBodyParameter key, value
    else
      for key, value of params
        request.addQueryStringParameter key, value
    #NOTE: at least Google requires special content type (application/x-www-form-urlencoded) on headers
    for key, value of @api.getHeaders()
      request.addHeader key, value

    return request.send cb

  getAccessToken: (verifier, cb) ->
    params = {}
    params[OAuthConstants.CLIENT_ID] = @config.getApiKey()
    params[OAuthConstants.CLIENT_SECRET] = @config.getApiSecret()
    params[OAuthConstants.CODE] = verifier.getValue()
    params[OAuthConstants.REDIRECT_URI] = @config.getCallback()
    params[OAuthConstants.GRANT_TYPE] = OAuthConstants.AUTHORIZATION_CODE
    # TODO: im not sure if scope is really needed to get access token?
    if @config.hasScope()
      params[OAuthConstants.SCOPE] = @config.getScope()

    @getToken cb, params, @api.getAccessTokenEndpoint()

  getRefreshToken: (access_token, cb) ->
    params = {}
    params[OAuthConstants.CLIENT_ID] = @config.getApiKey()
    params[OAuthConstants.CLIENT_SECRET] = @config.getApiSecret()
    params[OAuthConstants.REFRESH_TOKEN] = access_token.getRefresh()
    params[OAuthConstants.GRANT_TYPE] = OAuthConstants.REFRESH_TOKEN
    if @config.hasScope()
      params[OAuthConstants.SCOPE] = @config.getScope()
    @getToken cb, params, @api.getRefreshTokenEndpoint()

  getRequestToken: ->
    console.log "Unsupported operation, please use 'getAuthorizationUrl' and redirect your users there"

  getVersion: ->
    @VERSION

  signedRequest: (token, cb, endpoint) ->
    request = new OAuthRequest @api.getRequestVerb(), endpoint
    @signRequest token, request
    request.send cb

  signRequest: (access_token, request) ->
    if access_token.getType().toLowerCase() == 'bearer'
      request.addHeader OAuthConstants.HEADER, OAuthConstants.BEARER + access_token.getToken()
    else
      request.addQueryStringParameter OAuthConstants.ACCESS_TOKEN, access_token.getToken()

  getAuthorizationUrl: ->
    @api.getAuthorizationUrl @config

# OAuth version 2 default API. To be included on widgets
class root.DefaultApi20 extends DefaultApi

  isFresh: (response_data) ->
    if extract_token(extract_token(response_data, /"error"\s*:\s*\{(.*?)\}\}/g), /"message"\s*:\s*"(.*?)"/g).toLowerCase() == "invalid credentials" then false else true

  getAccessTokenExtractor: ->
    new TokenExtractor20Impl().extract

  getAccessTokenVerb: ->
    @GET

  createService: (config) ->
    new OAuth20ServiceImpl this, config

# Main API service builder
class root.ServiceBuilder
  constructor: (@signatureType = null, @scope = null) ->
    @callback = OAuthConstants.OUT_OF_BAND

  provider: (apiClass) ->
    if not apiClass
      console.log "Error: API class not given!"
    else
      @api = new apiClass
    this

  _callback: (@callback) ->
    if not @callback
      console.log "Notice: Callback not given"
    this

  apiKey: (@apiKey) ->
    if not @apiKey
      console.log "Error: API key not given!"
    this

  apiSecret: (@apiSecret) ->
    if not @apiSecret
      console.log "Warning: API secret not given"
    this

  _scope: (@scope) ->
    if not @scope
      console.log "Warning: OAuth scope not given"
    this

  signatureType: (@signatureType) ->
    if not @signatureType
      # see OAuthConfig
      console.log "Notice: Signature type not given. Header type will be used."
    this

  build: ->
    if not @api
      console.log "Error: You must specify a valid API through the provider() method"
    if not @apiKey
      console.log "Error: You must provide an API key"
    if not @apiSecret
      console.log "Warning: You didnt provide an API secret"
    @api.createService(new OAuthConfig @apiKey, @apiSecret, @callback, @signatureType, @scope)