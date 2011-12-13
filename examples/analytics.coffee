scribe = require('/node_modules/scribe-node/scribe').load(['OAuth', 'GoogleApi'])

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

services['analytics'] = {'provider': scribe.GoogleApi, 'key': '{api_key}', 'secret': '{api_secret}', 'scope': 'https://www.google.com/analytics/feeds/', 'callback': 'oob'}

analytics_profiles_feed = 'https://www.google.com/analytics/feeds/accounts/default?alt=json'

accounts = {}

get_oauth = (robot) ->\
  if not _oauth\
    _oauth = new scribe.OAuth robot.brain.data, 'analytics', services\
  return _oauth

get_service = (robot) ->\
  if not _service\
    _service = get_oauth(robot).create_service()\
  return _service

get_access_token = (robot) ->\
  if not _access_token\
    _access_token = get_oauth(robot).get_access_token()\
  return _access_token

get_profiles = (robot, msg) ->\
  service = get_service robot\
  access_token = get_access_token robot\
  callback = (response) ->\
    list_profiles response, access_token, robot, msg, service\
  service.signedRequest access_token, callback, analytics_profiles_feed

handle_authorization = (robot, msg) ->\
  callback = (url) ->\
    message = if url then url else "Error on retrieving url. See logs for more details."\
    msg.send message\
  get_oauth(robot).get_authorization_url(callback)

handle_verification = (robot, msg, code) ->\
  api = 'analytics'\
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

list_profiles = (response, access_token, robot, msg, service) ->\
  entries = JSON.parse(response.data).feed.entry\
  for entry in entries\
    for property in entry['dxp$property']\
      if property.name == 'ga:accountName'\
        accountName = property.value\
      if property.name == 'ga:profileId'\
        profileId = property.value\
      if property.name == 'ga:webPropertyId'\
        webPropertyId = property.value\
    if not accounts[accountName]\
      accounts[accountName] = {}\
      accounts[accountName][webPropertyId] = {}\
    else if not accounts[accountName][webPropertyId]\
      accounts[accountName][webPropertyId] = {}\
    accounts[accountName][webPropertyId][profileId] = entry.title['$t']\
    msg.send 'plot ' + webPropertyId + ' (' + entry.title['$t'].replace('www.', '') + ':' + profileId + ')'

chart_params = (entries) ->\
  chds = 't:'\
  chxly = chxlx = ''\
  max_visits = max_page_views = i = 0\
  for entry in entries\
    for metric in entry['dxp$metric']\
      if metric['name'] == 'ga:visits'\
        if max_visits < metric['value']\
          max_visits = metric['value']\
        chds = chds + metric['value'] + ','\
        chxly = chxly + metric['value'] + '|'\
        chxlx += i + '|'\
        i++\
  chds = chds.substr 0, chds.length-1\
  {\
    cht: 'lc'\
    chg: '25,25,3,2'\
    chs: '1000x300'\
    chds: '0,'+max_visits\
    chxt: 'y|y|x|x'\
    chma: '100,100,100,100'\
    chd: chds\
    chof: 'gif'\
  }

test_chart_params = () ->\
  chd = 't:'\
  i = 0\
  while i < 150\
    chd = chd + (Math.floor Math.random()*100000) + ','\
    i++\
  chds = chd.substr 0, chd.length-1\
  {\
    cht: 'lc'\
    chs: '600x200'\
    chds: '0,100000'\
    chd: chds\
    chof: 'gif'\
  }

plot_profiles = (robot, msg, account, webproperty = null) ->\
  if not accounts[account]\
    msg.send "Account not found: " + account\
    return false\
  service = get_service robot\
  access_token = get_access_token robot\
  chart_feed = 'https://chart.googleapis.com/chart?chid=' + scribe.get_nonce()\
  params = {}\
  handle_chart_feed = (response) ->\
    msg.send '<img src="data:image/gif;base64,' + new Buffer(response.data, 'binary').toString('base64') + '" />'\
  if property = accounts[account][webproperty]\
    msg.send 'property: ' + property\
    callback = (response) ->\
      params = chart_params JSON.parse(response.data).feed.entry\
      service.signedImagePostRequest access_token, handle_chart_feed, chart_feed, params\
    for id, href of property\
      feed = 'https://www.google.com/analytics/feeds/data?alt=json&start-date=2011-10-01&end-date=2011-11-01&dimensions=ga:date&metrics=ga:visits,ga:pageviews&sort=ga:date&ids=ga:' + id\
      msg.send feed\
      service.signedRequest access_token, callback, feed\
  else\
    msg.send "Plot all profiles"

handle_authorization robot, msg

handle_verification robot, msg, ''

get_profiles robot, msg

plot_profiles robot, msg, 'nichese2', 'UA-16039038-1'