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

## Get authorization url

    get_authorization_url = (service) ->
      request_token_extract = (response) ->
        # request token should be saved somewhere because service.getAccessToken uses request token
        # but here we just print it on console, where you can take tokens and save inside get_request_token function
        request_token = service.api.getRequestTokenExtractor() response
        console.log request_token
        url = service.getAuthorizationUrl request_token
        # as it is with request token, also url is printed to the console which you need to
        # copy and paste to browser to retrieve the verification code
        console.log "\nAuthorization url: "+url

      service.getRequestToken request_token_extract

## Save verification code

This is the code you got from clicking and following the authorization url from the first step.

    set_verification_code = (code) ->
      # save code to data store or session store

## Get verification code

    get_verification_code = () ->
      code = 'verification_code' # get from datastore or session
      new scribe.Verifier code

## Get request token at any point after get_authorization_url

    get_request_token = () ->
      token = 'request_token' # get from datastore or session
      secret = 'request_secret' # get from datastore or session
      new scribe.Token token, secret

## Retrieve and save access token

    set_access_token = (service) ->
      access_token_extract = (response) ->
        access_token = service.api.getAccessTokenExtractor() response
        #save access token for later use
        console.log access_token

      service.getAccessToken get_request_token(), get_verification_code(), access_token_extract

## Get access token at any point after set_access_token

This will return the final token you would use to retrieve data via selected web service. All earlier steps are just preparing and completing authorization for the service.

    get_access_token = () ->
      token = 'access_token' # get from datastore or session
      secret = 'access_secret' # get from datastore or session
      new scribe.Token token, secret

## Google analytics example

So those are the helper functions to get final acces token. Lets see how to use them and after that how to get Google analytics account profiles using saved access token.

### OAuth dance

First of all, you need to register Google application api key and secret to be able to finnish next steps. So if you dont have it yet, you can request them from: https://accounts.google.com/ManageDomains

After that you can start coffee eval loop:

    $ coffee

Then evaluate `get_authorization_url` function and do the following:

    scribe = require('scribe').load(['GoogleApi'])
    service = new scribe.ServiceBuilder().provider(scribe.GoogleApi).apiKey('api_key').apiSecret('api_secret')._scope('https://www.google.com/analytics/feeds/').build()
    get_authorization_url service

Copy and paste printed url from console to browser and save code to `get_verification_code` function. Similarly save printed request tokens to `get_request_token` function and evaluate both of them on console. Evaluate also `set_access_token` function before doing the next:

    set_access_token service

Now save access tokens to `get_access_token` function and evaluate it on console again. Now we are done the dance!

### Get profiles

I will use xml2json parser here to transform xml formatted response from Google service to json, iterate over entries and print profile data on console. You may need to install xml2json before this (ctrl-c to quit coffee):

    $ npm install xml2json
    $ coffee

And then from coffee eval loop:

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