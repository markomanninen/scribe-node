# load module
scribe = require('/path_to/scribe').load(['OAuth', 'FacebookApi'])

# set up service configuration. note: read_insights scope is what we want there
# basicly if you want different information from service, then scope should be changed
# and authorization started again from beginning
services = {}
services['facebook'] = {'provider': scribe.FacebookApi, 'key': '{app_id}', 'secret': '{app_secret}', 'scope': 'email,read_stream,read_insights', 'callback': 'https://www.facebook.com/connect/login_success.html'}

# get authorization url. grab access token from url and continue
oauth = new scribe.OAuth({}, 'facebook', services)
oauth.get_authorization_url((url)->console.log url)

# set access token by copying access token from browser url address bar!
oauth.set_access_token_code('{code}')

# get insights feed
service = oauth.create_service()
service.signedRequest(
  oauth.get_access_token(),
  (response) ->
    console.log response.data,
  'https://graph.facebook.com/{app_id}/insights')
