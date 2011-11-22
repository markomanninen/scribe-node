root = exports ? this

api = require('../scribe').DefaultApi20

# Facebook API 2.0
# Docs: http://developers.facebook.com/docs/authentication/
# Register: http://www.facebook.com/developers/createapp.php
class root.FacebookApi extends api
  constructor: ->
    @AUTHORIZE_URL = "https://www.facebook.com/dialog/oauth?response_type=token"
    @ACCESS_TOKEN_URL = "https://graph.facebook.com/oauth/access_token"

  getAccessTokenEndpoint: ->
    @ACCESS_TOKEN_URL

  getAccessTokenVerb: ->
    return @GET

  getRequestVerb: ->
    return @GET

  getAuthorizationUrl: (config) ->
    client = '&client_id=' + config.getApiKey()
    redirect = '&redirect_uri=' + config.getCallback()
    if (config.hasScope())
      scope = '&scope=' + config.getScope()
      return @AUTHORIZE_URL + client + redirect + scope
    else
      return @AUTHORIZE_URL + client + redirect