root = exports ? this

api = require('../scribe').DefaultApi10a

# Twitter API
class root.Twitter extends api
  constructor: ->
    @REQUEST_TOKEN_URL = "http://api.twitter.com/oauth/request_token"
    @ACCESS_TOKEN_URL = "http://api.twitter.com/oauth/access_token"
    @AUTHORIZE_URL = "http://api.twitter.com/oauth/authorize?oauth_token="

  getAccessTokenEndpoint: ->
    return @ACCESS_TOKEN_URL

  getRequestTokenEndpoint: ->
    return @REQUEST_TOKEN_URL

  getAccessTokenVerb: ->
    return @GET

  getRequestTokenVerb: ->
    return @GET

  getRequestVerb: ->
    return @GET

  getAuthorizationUrl: (request_token) ->
    return @AUTHORIZE_URL + request_token.getToken()