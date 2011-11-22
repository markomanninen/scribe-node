# load module
scribe = require('/path_to/scribe').load(['OAuth', 'TwitterApi'])

# set up service configuration
services = {}
services['twitter'] = {'provider': scribe.TwitterApi, 'key': '{api_key}', 'secret': '{api_secret}', 'scope': '', 'callback': 'oob'}

# get authorization url and pass number on next step
oauth = new scribe.OAuth({}, 'twitter', services)
oauth.get_authorization_url((url)->console.log url)

# set access token by copying code from browser window
oauth.set_verification_code('{code}', (response) -> console.log response)

# get status stream by keyword. note: request type verb must be same as its on Twitter app settings!
# so its either signedRequest or signedPostRequest normally
service = oauth.create_service()
service.signedRequest(
  oauth.get_access_token(),
  (response) ->
    console.log response.data,
  'https://api.twitter.com/1/statuses/home_timeline.json')
