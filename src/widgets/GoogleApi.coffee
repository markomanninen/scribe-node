root = exports ? this

# Google API 1.0
class root.GoogleApi extends DefaultApi10a
  constructor: ->
    @REQUEST_TOKEN_URL = "https://www.google.com/accounts/OAuthGetRequestToken"
    @SCOPED_REQUEST_TOKEN_URL = @REQUEST_TOKEN_URL + "?scope=%s"
    @AUTHORIZE_URL = "https://www.google.com/accounts/OAuthAuthorizeToken?oauth_token=%s"
    @ACCESS_TOKEN_URL = "https://www.google.com/accounts/OAuthGetAccessToken"

  getAccessTokenEndpoint: ->
    @ACCESS_TOKEN_URL

  getRequestTokenEndpoint: (config = null) ->
    if config && scope = config.getScope()
      sprintf @SCOPED_REQUEST_TOKEN_URL, config
    else
      @REQUEST_TOKEN_URL

  getAccessTokenVerb: ->
    Verb.GET
  
  getRequestTokenVerb: ->
    Verb.GET

  getRequestVerb: ->
    Verb.GET
  
  getAuthorizationUrl: (request_token) ->
    sprintf @AUTHORIZE_URL, request_token.getToken()

  getHeaders: () ->
    headers = super.getHeaders()
    headers['Accept'] = '*/*'
    headers['Host'] = 'www.google.com'
    #headers['User-Agent'] = 'node.js'
    #headers['GData-Version'] = '2.0'
    #headers['Content-Type'] = 'application/atom+xml'
    return headers