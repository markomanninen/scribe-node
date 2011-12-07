root = exports ? this

api = require('../scribe').DefaultApi10a

# LinkedIn API
class root.LinkedIn extends api
  constructor: ->
    @REQUEST_TOKEN_URL = "http://api.linkedin.com/uas/oauth/requestToken"
    @ACCESS_TOKEN_URL = "http://api.linkedin.com/uas/oauth/accessToken"
    @AUTHORIZE_URL = "http://api.linkedin.com/uas/oauth/authorize?oauth_token="

  getAccessTokenEndpoint: ->
    return @ACCESS_TOKEN_URL

  getRequestTokenEndpoint: ->
    return @REQUEST_TOKEN_URL

  getAccessTokenVerb: ->
    return @POST

  getRequestTokenVerb: ->
    return @POST

  getRequestVerb: ->
    return @GET

  getAuthorizationUrl: (request_token) ->
    return @AUTHORIZE_URL + request_token.getToken()