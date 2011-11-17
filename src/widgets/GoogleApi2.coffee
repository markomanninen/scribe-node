root = exports ? this

api = require('../scribe').DefaultApi20

# Google API 2.0
class root.GoogleApi2 extends api
  constructor: ->
    @AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/auth?response_type=code&"
    @ACCESS_TOKEN_URL = "https://accounts.google.com/o/oauth2/token"

  getAccessTokenExtractor: ->
    @getJsonTokenExtractor()

  getAccessTokenEndpoint: ->
    @ACCESS_TOKEN_URL

  # is his same as accesstoken endpoint for every provider?
  getRefreshTokenEndpoint: ->
    @ACCESS_TOKEN_URL

  # access token and refresh token retrieval requires this
  getAccessTokenVerb: ->
    @POST

  getRequestVerb: ->
    @GET
  
  getAuthorizationUrl: (config) ->
    scope = 'scope=' + config.getScope() + '&'
    client = 'client_id=' + config.getApiKey() + '&'
    callback = 'redirect_uri=' + config.getCallback()
    @AUTHORIZE_URL + scope + client + callback

  getHeaders: ->
    headers = super @getHeaders
    # retrieving access code requires this
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    headers