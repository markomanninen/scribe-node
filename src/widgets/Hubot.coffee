root = exports ? this
# require main library and apis
scribe = require('../scribe').load(['GoogleApi', 'GoogleApi2'])
# hubot enviroment variables
env = process.env
# set up services
services = {}
services['analytics'] = {'provider': scribe.GoogleApi, 'key': env.HUBOT_GOOGLE_OAUTH_API_KEY, 'secret': env.HUBOT_GOOGLE_OAUTH_API_SECRET, 'scope': 'https://www.google.com/analytics/feeds/', 'callback': 'oob'}
services['analytics2'] = {'provider': scribe.GoogleApi2, 'key': env.HUBOT_GOOGLE_OAUTH2_API_KEY, 'secret': env.HUBOT_GOOGLE_OAUTH2_API_SECRET, 'scope': 'https://www.googleapis.com/auth/analytics.readonly', 'callback': 'urn:ietf:wg:oauth:2.0:oob'}

class root.Hubot
  create_service: (api) ->
    if service = services[api]
      return new scribe.ServiceBuilder()
                .provider(service['provider'])
                .apiKey(service['key'])
                .apiSecret(service['secret'])
                ._callback(service['callback'])
                ._scope(service['scope'])
                .build()
    else
      return false

  init_robot_brains: (robot, api) ->
    if not robot.brain.data.oauth
      robot.brain.data.oauth = []
      robot.brain.data.oauth[api] = []
    else if not robot.brain.data.oauth[api]
      robot.brain.data.oauth[api] = []
    return robot.brain.data.oauth[api]

  get_authorization_url: (robot, msg, api) ->
    if service = @create_service api
      brains = @init_robot_brains robot, api
      # OAuth v2.0 is this much simpler on retrieving url
      if service.getVersion() == "2.0"
        url = service.getAuthorizationUrl()
        msg.send "Authorization url: "+url
      else
        request_token_extract = (response) ->
          console.log 'Response: ' + response.data
          token = service.api.getRequestTokenExtractor() response.data
          url = service.getAuthorizationUrl token
          msg.send "Authorization url: " + url
          brains['request_token'] = token.getToken()
          brains['request_secret'] = token.getSecret()
          console.log "Request token set: " + brains['request_token']
        service.getRequestToken request_token_extract
    else
      msg.send "Api not found: " + api

  get_request_token: (robot, api) ->
    new scribe.Token robot.brain.data.oauth[api]['request_token'], robot.brain.data.oauth[api]['request_secret']

  get_verifier: (robot, api) ->
    new scribe.Verifier robot.brain.data.oauth[api]['code']

  set_access_token: (robot, msg, api, service) ->
    # this (@) references cant be used inside callback functions, but variables (local) can be used
    brains = @init_robot_brains robot, api
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
      service.getAccessToken @get_verifier(robot, api), access_token_extract
    else
      service.getAccessToken @get_request_token(robot, api), @get_verifier(robot, api), access_token_extract

  set_verification_code: (robot, msg, api) ->
    brains = @init_robot_brains robot, api
    if service = @create_service api
      if service.getVersion() == "1.0" and not brains['request_token']
        msg.send "Please get authorization url and request token first"
      else if code = msg.match[2]
        brains['code'] = code
        msg.send 'Verification code set: ' + brains['code']
        @set_access_token robot, msg, api, service
      else
        msg.send "Verification code not found"
    else
      msg.send "Api not found: " + api

  get_access_token: (robot, msg, api) ->
    brains = @init_robot_brains robot, api
    if brains['access_token'] and service = @create_service api
      # OAuth v2.0 has some more fields on token
      if service.getVersion() == "2.0"
        return new scribe.Token brains['access_token'], "", "", brains['expires_in'], brains['token_type'], brains['refresh_token']
      else
        return new scribe.Token brains['access_token'], brains['access_secret']
    else
      msg.send "Access token not set for api: " + api + ". Please set verification code or get authorization url."
      return false

  # for OAuth v2.0 only
  refresh_token: (robot, msg, api) ->
    if service = @create_service api
      if service.getVersion() == "2.0"
        access_token = @get_access_token robot, msg, api
        brains = @init_robot_brains robot, api
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
    else
      msg.send "Api not found: " + api