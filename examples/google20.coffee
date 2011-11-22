# load module
scribe = require('/path_to/scribe').load(['OAuth', 'GoogleApi2'])

# set up service configuration. note: read_insights scope is what we want there
# basicly if you want different information from service, then scope should be changed
# and authorization started again from beginning
services = {}
services['analytics2'] = {'provider': scribe.GoogleApi2, 'key': '{app_id}', 'secret': '{app_secret}', 'scope': 'https://www.googleapis.com/auth/analytics.readonly', 'callback': 'urn:ietf:wg:oauth:2.0:oob'}

# get authorization url and pass string on next step
oauth = new scribe.OAuth({}, 'analytics2', services)
oauth.get_authorization_url((url)->console.log url)

# set access token by copying access token from browser url address bar!
oauth.set_verification_code('{code}', (response)->console.log response)

# get analytics accounts
service = oauth.create_service()
service.signedRequest(
  oauth.get_access_token(),
  (response) ->
    console.log response.data,
  'https://www.googleapis.com/analytics/v3/management/accounts')
