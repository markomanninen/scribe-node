scribe = require('/node_modules/scribe-node/scribe').load(['OAuth', 'LinkedInApi'])

robot = {}
robot['brain'] = {}
robot['brain']['data'] = {}

msg = {}
msg['send'] = (msg) ->\
  console.log msg

_oauth = null
_service = null
_access_token = null

services = {}

services['linkedin'] = {'provider': scribe.LinkedInApi, 'key': '{api_key}', 'secret': '{api_secret}', 'scope': '', 'callback': 'oob'}

get_oauth = (robot) ->\
  if not _oauth\
    _oauth = new scribe.OAuth robot.brain.data, 'linkedin', services\
  return _oauth

get_service = (robot) ->\
  if not _service\
    _service = get_oauth(robot).create_service()\
  return _service

get_access_token = (robot) ->\
  if not _access_token\
    _access_token = get_oauth(robot).get_access_token()\
  return _access_token

handle_authorization = (robot, msg) ->\
  callback = (url) ->\
    message = if url then url else "Error on retrieving url. See logs for more details."\
    msg.send message\
  get_oauth(robot).get_authorization_url(callback)

handle_verification = (robot, msg, code) ->\
  api = 'linkedin'\
  callback = (response) ->\
    if response\
      if not robot.brain.data.oauth_user\
        robot.brain.data.oauth_user = []\
      robot.brain.data.oauth_user[api] = 'marko'\
      message = "Verification done"\
    else\
      message = "Error on verification process. See logs for more details."\
    msg.send message\
  get_oauth(robot).set_verification_code(code, callback)

handle_authorization robot, msg

# after getting authorization url and pin code, use it with next command:
handle_verification robot, msg, '{code}'