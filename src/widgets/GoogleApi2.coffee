root = exports ? this

api = require('../scribe').DefaultApi20

# Google API 2.0
# Docs: http://code.google.com/apis/accounts/docs/OAuth2.html
# Register: https://code.google.com/apis/console/
class root.GoogleApi2 extends api
  constructor: ->
    @AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/auth?response_type=code&"
    @ACCESS_TOKEN_URL = "https://accounts.google.com/o/oauth2/token"

  getAccessTokenExtractor: ->
    @getJsonTokenExtractor()

  getAccessTokenEndpoint: ->
    @ACCESS_TOKEN_URL

  # is this same as access token endpoint for every provider, or do they even have expires_in?
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
    # retrieving access code Google requires this
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    headers