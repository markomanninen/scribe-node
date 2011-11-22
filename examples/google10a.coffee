# load module
scribe = require('/path_to/scribe').load(['OAuth', 'GoogleApi'])

# set up service configuration
services = {}
services['analytics'] = {'provider': scribe.GoogleApi, 'key': '{api_key}', 'secret': '{api_secret}', 'scope': 'https://www.google.com/analytics/feeds/', 'callback': 'oob'}

# get authorization url and pass string on next step
oauth = new scribe.OAuth({}, 'analytics', services)
oauth.get_authorization_url((url)->console.log url)

# set access token by copying code from browser window
oauth.set_verification_code('{code}', (response) -> console.log response)

# get analytics profiles
service = oauth.create_service()
service.signedRequest(
  oauth.get_access_token(),
  (response) ->
    console.log response.data,
  'https://www.google.com/analytics/feeds/accounts/default?max-results=5')
