root = exports ? this

api = require('../scribe').DefaultApi10a

# Google API 1.0
class root.GoogleApi extends api
  constructor: ->
    @REQUEST_TOKEN_URL = "https://www.google.com/accounts/OAuthGetRequestToken"
    @SCOPED_REQUEST_TOKEN_URL = @REQUEST_TOKEN_URL + "?scope="
    @AUTHORIZE_URL = "https://www.google.com/accounts/OAuthAuthorizeToken?oauth_token="
    @ACCESS_TOKEN_URL = "https://www.google.com/accounts/OAuthGetAccessToken"

  getAccessTokenEndpoint: ->
    return @ACCESS_TOKEN_URL

  getRequestTokenEndpoint: (config = null) ->
    if config && scope = config.getScope()
      return @SCOPED_REQUEST_TOKEN_URL + scope
    else
      return @REQUEST_TOKEN_URL

  getAccessTokenVerb: ->
    return @GET
  
  getRequestTokenVerb: ->
    return @GET

  getRequestVerb: ->
    return @GET
  
  getAuthorizationUrl: (request_token) ->
    return @AUTHORIZE_URL + request_token.getToken()

  getHeaders: () ->
    headers = super @getHeaders
    headers['Accept'] = '*/*'
    headers['Host'] = 'www.google.com'
    #headers['GData-Version'] = '2.0'
    #headers['Content-Type'] = 'application/atom+xml'
    return headers