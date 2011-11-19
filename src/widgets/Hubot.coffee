root = exports ? this
# require main library and apis
scribe = require('../scribe').load(['GoogleApi', 'GoogleApi2', 'TwitterApi'])
# hubot enviroment variables
env = process.env
# set up services. this list should be updated when new widgets comes in and has been tested
default_services = {}
default_services['analytics'] = {'provider': scribe.GoogleApi, 'key': env.HUBOT_GOOGLE_OAUTH_API_KEY, 'secret': env.HUBOT_GOOGLE_OAUTH_API_SECRET, 'scope': 'https://www.google.com/analytics/feeds/', 'callback': 'oob'}
default_services['analytics2'] = {'provider': scribe.GoogleApi2, 'key': env.HUBOT_GOOGLE_OAUTH2_API_KEY, 'secret': env.HUBOT_GOOGLE_OAUTH2_API_SECRET, 'scope': 'https://www.googleapis.com/auth/analytics.readonly', 'callback': 'urn:ietf:wg:oauth:2.0:oob'}
default_services['twitter'] = {'provider': scribe.TwitterApi, 'key': env.HUBOT_TWITTER_OAUTH_API_KEY, 'secret': env.HUBOT_TWITTER_OAUTH_API_SECRET, 'scope': '', 'callback': 'oob'}

class root.Hubot
  # TODO: its possible to provide own services here, but then those service providers should be implemented by own classes
  # which is of course possible and suitable, so lets keep this possibility on hood
  constructor: (@robot, @msg, @api, @services = null) ->
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
      @msg.send "Service / API not found: " + @api
      return false

  init_robot_brains: () ->
    if not @robot.brain.data.oauth
      @robot.brain.data.oauth = []
      @robot.brain.data.oauth[@api] = []
    else if not @robot.brain.data.oauth[@api]
      @robot.brain.data.oauth[@api] = []
    return @robot.brain.data.oauth[@api]

  get_authorization_url: () ->
    if service = @create_service()
      brains = @init_robot_brains()
      msg = @msg
      # OAuth v2.0 is this much simpler on retrieving url
      if service.getVersion() == "2.0"
        msg.send "Authorization url: " + service.getAuthorizationUrl()
      else
        request_token_extract = (response) ->
          console.log 'Response: ' + response.data
          token = service.api.getRequestTokenExtractor() response.data
          msg.send "Authorization url: " + service.getAuthorizationUrl token
          brains['request_token'] = token.getToken()
          brains['request_secret'] = token.getSecret()
          console.log "Request token set: " + brains['request_token']
        service.getRequestToken request_token_extract

  get_request_token: () ->
    new scribe.Token @robot.brain.data.oauth[@api]['request_token'], @robot.brain.data.oauth[@api]['request_secret']

  get_verifier: () ->
    new scribe.Verifier @robot.brain.data.oauth[@api]['code']

  # is called after set verification code
  set_access_token: (service) ->
    # this (@) references cant be used inside callback functions, but variables (local) can be used
    brains = @init_robot_brains()
    msg = @msg
    access_token_extract = (response) ->
      console.log 'Response: ' + response.data
      token = service.api.getAccessTokenExtractor() response.data
      if brains['access_token'] = token.getToken()
        console.log 'Access token set: ' + brains['access_token']
        # access secret is not really needed on OAuth 2.0 scheme. expires, type and refresh tokens are instead
        if service.getVersion() == "2.0"
          brains['expires_in'] = token.getExpires()
          brains['token_type'] = token.getType()
          brains['refresh_token'] = token.getRefresh()
        else
          brains['access_secret'] = token.getSecret()
        msg.send "Access token set"
      else
        msg.send "Access token could not be set. Please try to refresh or get a new authorization by url."
    # request token is not used on OAuth 2.0
    if service.getVersion() == "2.0"
      service.getAccessToken @get_verifier(), access_token_extract
    else
      service.getAccessToken @get_request_token(), @get_verifier(), access_token_extract

  set_verification_code: () ->
    brains = @init_robot_brains()
    if service = @create_service()
      if service.getVersion() == "1.0" and not brains['request_token']
        @msg.send "Please get authorization url and request token first"
      else if code = @msg.match[2]
        brains['code'] = code
        @msg.send 'Verification code set: ' + brains['code']
        @set_access_token service
      else
        @msg.send "Verification code not found"

  get_access_token: () ->
    brains = @init_robot_brains()
    if brains['access_token'] and service = @create_service()
      # OAuth v2.0 has some more fields on token
      if service.getVersion() == "2.0"
        return new scribe.Token brains['access_token'], "", "", brains['expires_in'], brains['token_type'], brains['refresh_token']
      else
        return new scribe.Token brains['access_token'], brains['access_secret']
    else
      @msg.send "Access token not set for api: " + @api + ". Please set verification code or get authorization url."
      return false

  # for OAuth v2.0 only
  refresh_token: () ->
    if service = @create_service()
      msg = @msg
      if service.getVersion() == "2.0"
        if not access_token = @get_access_token()
          return false
        brains = @init_robot_brains()
        refresh_token_extract = (response) ->
          console.log 'Response: ' + response.data
          refresh_token = service.api.getAccessTokenExtractor() response.data
          access_token.updateToken refresh_token
          brains['access_token'] = access_token.getToken()
          # TODO: How expired_in should be used?
          # time + expires_in -> look up value. if current is more than stored, then refresh?
          brains['expires_in'] = access_token.getExpires()
          console.log "Refreshed token: " + brains['access_token']
          msg.send "Token refreshed"
        service.getRefreshToken access_token, refresh_token_extract
      else
        msg.send "Only OAuth 2.0 tokens can be refreshed."