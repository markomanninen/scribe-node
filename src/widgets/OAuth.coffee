# General approach to interact with OAuth 1.0a & 2.0
#
# This is meant to be an example how to use scribe with different services. Generalizing OAuth dance
# it can greatly simplify authorization routines on node.js/coffeescript apps, but one could also use it as
# a starting point to own handling.
#
# - class / widget supports certain api on hood, but with optional services parameter any service can be used.
#   on that case provider class must extend scribe DefaultAPi10a or DefaultAPi20 to work right way
# - default services can be configured with environment variables
# - storage could be any form of storage, session, redis db and so forth that just has "on set" and "on get" event
#   handlers. in case of hubot you can pass robot.brain.data to store oauth tokens
# - public methods by OAuth class are:
#   1. get_authorization_url which takes callback function to return url / false
#   2. set_verification_code which takes code and callback function to return true/false
#   3. refresh_access_token which is used by OAuth 2.0 schemes only and which takes access_token and 
#      callback function to return true/false
#   4. get_request_token, get_access_token and get_verifier methods to retrieve tokens as per method name
#
# TODO: signatureType on default service configurations is not used yet, but its possible and maybe
# required on some services because default will be Header type.

root = exports ? this
# require main library and apis
scribe = require('../scribe').load(['GoogleApi', 'GoogleApi2', 'TwitterApi'])
# hubot enviroment variables
env = process.env
# set up services. this list should be updated when new widgets comes in and has been tested
default_services = {}
default_services['analytics'] = {'provider': scribe.GoogleApi, 'key': env.GOOGLE_OAUTH_API_KEY, 'secret':   env.GOOGLE_OAUTH_API_SECRET, 'scope': 'https://www.google.com/analytics/feeds/', 'callback': 'oob'}
default_services['analytics2'] = {'provider': scribe.GoogleApi2, 'key': env.GOOGLE_OAUTH2_API_KEY, 'secret':   env.GOOGLE_OAUTH2_API_SECRET, 'scope': 'https://www.googleapis.com/auth/analytics.readonly', 'callback': 'urn:ietf:wg:oauth:2.0:oob'}
default_services['twitter'] = {'provider': scribe.TwitterApi, 'key': env.TWITTER_OAUTH_API_KEY, 'secret':   env.TWITTER_OAUTH_API_SECRET, 'scope': '', 'callback': 'oob'}

class root.OAuth
  # TODO: its possible to provide own services here, but then those service providers should be implemented by own classes
  # which is of course possible and suitable, so lets keep this possibility on hood
  constructor: (@storage, @api, @services = null) ->
    if @services and @services[@api]
      @config = @services[@api]
    else
      @config = default_services[@api]
    @service = null

  create_service: () ->
    if @config
      if not @service
        @service = new scribe.ServiceBuilder()
                       .provider(@config['provider'])
                       .apiKey(@config['key'])
                       .apiSecret(@config['secret'])
                       ._callback(@config['callback'])
                       ._scope(@config['scope'])
                       .build()
      return @service
    else
      console.log "Service / API not found: " + @api
      return false

  init_storage: () ->
    if not @storage.oauth
      @storage.oauth = []
      @storage.oauth[@api] = []
    else if not @storage.oauth[@api]
      @storage.oauth[@api] = []
    return @storage.oauth[@api]

  get_authorization_url: (callback) ->
    if service = @create_service()
      storage = @init_storage()
      # OAuth v2.0 is this much simpler on retrieving url
      if service.getVersion() == "2.0"
        callback service.getAuthorizationUrl()
      else
        request_token_extract = (response) ->
          #console.log 'Response: ' + response.data
          token = service.api.getRequestTokenExtractor() response.data
          storage['request_token'] = token.getToken()
          storage['request_secret'] = token.getSecret()
          console.log "Request token set: " + storage['request_token']
          callback service.getAuthorizationUrl token
        service.getRequestToken request_token_extract
    callback false

  get_request_token: () ->
    new scribe.Token @storage.oauth[@api]['request_token'], @storage.oauth[@api]['request_secret']

  get_verifier: () ->
    new scribe.Verifier @storage.oauth[@api]['code']

  # is called after set verification code
  set_access_token: (service, callback) ->
    # this (@) references cant be used inside callback functions, but variables (local) can be used
    storage = @init_storage()
    access_token_extract = (response) ->
      #console.log 'Response: ' + response.data
      token = service.api.getAccessTokenExtractor() response.data
      if storage['access_token'] = token.getToken()
        console.log 'Access token set: ' + storage['access_token']
        # access secret is not really needed on OAuth 2.0 scheme. expires, type and refresh tokens are instead
        if service.getVersion() == "2.0"
          storage['expires_in'] = token.getExpires()
          storage['token_type'] = token.getType()
          storage['refresh_token'] = token.getRefresh()
        else
          storage['access_secret'] = token.getSecret()
        callback true
      else
        console.log "Access token could not be set. Please try to refresh or get a new authorization by url."
        callback false
    # request token is not used on OAuth 2.0
    if service.getVersion() == "2.0"
      service.getAccessToken @get_verifier(), access_token_extract
    else
      service.getAccessToken @get_request_token(), @get_verifier(), access_token_extract

  set_verification_code: (code, callback) ->
    storage = @init_storage()
    if service = @create_service()
      if service.getVersion() == "1.0" and not storage['request_token']
        console.log "Please get authorization url and request token first"
      else if code
        storage['code'] = code
        console.log 'Verification code set: ' + storage['code']
        @set_access_token service, callback
      else
        console.log "Verification code not found"
    callback false

  get_access_token: () ->
    storage = @init_storage()
    if storage['access_token'] and service = @create_service()
      # OAuth v2.0 has some more fields on token
      if service.getVersion() == "2.0"
        return new scribe.Token storage['access_token'], "", "", storage['expires_in'], storage['token_type'], storage['refresh_token']
      else
        return new scribe.Token storage['access_token'], storage['access_secret']
    else
      console.log "Access token not set for api: " + @api + ". Please set verification code or get authorization url."
      return false

  # for OAuth v2.0 only
  refresh_access_token: (access_token, callback) ->
    if access_token and service = @create_service()
      if service.getVersion() == "2.0"
        storage = @init_storage()
        refresh_token_extract = (response) ->
          #console.log 'Response: ' + response.data
          refresh_token = service.api.getAccessTokenExtractor() response.data
          access_token.updateToken refresh_token
          storage['access_token'] = access_token.getToken()
          # TODO: How expired_in should be used?
          # time + expires_in -> look up value. if current is more than stored, then refresh?
          storage['expires_in'] = access_token.getExpires()
          console.log "Refreshed token: " + storage['access_token']
          callback true
        service.getRefreshToken access_token, refresh_token_extract
      else
        console.log "Only OAuth 2.0 tokens can be refreshed."
    callback false