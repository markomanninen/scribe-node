# Scribe Java OAuth library port to node.js

This library abstracts different OAuth schemes and modularizes web services so that both authorization routines and data retrieval after authorization is easy to do. Library design is borrowed from the corresponding java library:

https://github.com/fernandezpablo85/scribe-java

Due to different language used (coffeescript + node.js) and heavy alter of the design on some parts I rather did not "github fork" the original repository. Althought there are some OAuth libraries for node.js reasoning behind this work was that I really liked the way scribe was organized, especially giving option to add easily different web2.0 services to the codebase as a widgets.

Following small code snippets shows only general OAuth dance routines. On final application storing tokens on steps differs a lot depending on how application is done, normally it would be either some kind of persistent data store or session store.

## Installation

Source files are made with coffeescript as it provides seemingly cleaner and managable code. This adds one more step on development process thou. So if you want to add new widgets, fix bugs or add any new features, I recommend to install coffeescript first and use `cake build` on install directory to compile coffeescripts from `src` to `lib` directory. As an end user you would either get git repository or use `npm` to get scrible-node plus all depencities hassle free to your development environment:

   npm install scribe-node

Next steps are to retrieve authorization token and use it on your application to retrieve data from web service API. See Google analytics example at the end of the read me file.

Note that I'm using offpage application mode for authorization. It means callback page is set to `oob` which causes service provider to show  verification code on browser window. Then you need to paste code to your application manually. Approach is a little bit different on fully pledged web appliations, that can hide this part of the process behind the screen.

## 1. Get authorization url

    get_authorization_url = (service) ->
      request_token_extract = (extractor, response) ->
        # request token should be saved somewhere because service.getAccessToken uses request token
        request_token = extractor response
        console.log request_token
        url = service.getAuthorizationUrl request_token
        console.log url

      service.getRequestToken request_token_extract

## 2.1 Save verification code to the datastore or session

This is the code you got from clicking and following the authorization url from the first step.

    set_verification_code = (code) ->
      # save code to datastore or session

## 2.2 Get verification code

    get_verification_code = () ->
      code = 'verification_code' # get from datastore or session
      new scribe.Verifier code

## 3. Get request token from datastore or session after get_authorization_url

    get_request_token = () ->
      token = 'request_token' 
      secret = 'request_secret'
      new scribe.Token token, secret

## 4.1 Set and save access token to datastore or session

    set_access_token = (service) ->
      access_token_extract = (extractor, response) ->
        access_token = extractor response
        console.log access_token
        #save access token for later usage

      service.getAccessToken get_request_token(), get_verifier(), access_token_extract

## 4.2 Get access token from datastore or session after set_access_token

This will return the final token you would use to retrieve data via selected web service. All earlier steps are just preparing and completing authorization for the service.

    get_access_token = () ->
      token = 'access_token' # get from datastore or session
      secret = 'access_secret' # get from datastore or session
      new scribe.Token token, secret

## Google analytics example

I will use xml2json parser here to transform xml formatted response from Google service to json.

    scribe = require('scribe').load(['GoogleApi'])
    parser = require('xml2json').toJson
    
    service = new scribe.ServiceBuilder()
                  .provider(scribe.GoogleApi)
                  .apiKey('api_key')
                  .apiSecret('api_secret')
                  ._scope('https://www.google.com/analytics/feeds/')
                  .build()
    access_token = get_access_token()
    analytics_accounts_feed = 'https://www.google.com/analytics/feeds/accounts/default?max-results=5'
    
    handle_analytics_accounts_feed = (response) ->
      console.log "Listing analytics account profiles:\n"
      entries = JSON.parse(parser(response)).feed.entry
      for entry in entries
        console.log entry.id + " " + entry.title['$t'] + " " + entry["dxp:tableId"]
    
    service.signedRequest(access_token, handle_analytics_accounts_feed, analytics_accounts_feed)

If you do a lot of interaction with Google Analytics or other Google services, you may want to create own model for more sophisticated approach, buts its beyond the scope of this work.