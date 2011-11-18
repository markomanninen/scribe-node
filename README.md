# Scribe Java OAuth Library Port to Node.js

This library abstracts different OAuth schemes and modularizes web services so that both authorization routines and data retrieval after authorization is easy to do. Supported schemes are 1.0a and 2.0 so far, Echo definitely and maybe 1.0 to come later. For historical and credit note I need to state that library design is borrowed from the corresponding java library:

https://github.com/fernandezpablo85/scribe-java

Due to different language used (coffeescript + node.js) and pretty heavy alter of the design on some parts I rather did not "github fork" the original repository. Althought there are some OAuth libraries for node.js ([https://github.com/ciaranj/node-oauth oauth] and [ x] namely) reasoning behind this work was that I really liked the way scribe was organized, especially giving option to add easily different web2.0 services to the codebase as a widgets. I also wanted to offer more specific support to different web service APIs via widgets, not only general interface.

Following small code snippets shows only general OAuth 1.0a and 2.0 dance routines. On final application storing tokens on each step differs a lot depending on how application is done. Normally store would be either some kind of persistent data store or session store. But on these examples I just hard code tokens inside functions before calling them. Its a lof of manual work I know, but on final application most of it is hidden behind the flow.

For more real implementation of the library you should follow `hubot-scripts` repository, analytics.coffee script specifically (coming soon).

## Installation

Source files are made with coffeescript as it provides seemingly cleaner and managable code. This adds one more step on development process thou. So if you want to add new widgets, fix bugs or add any new features, I recommend to install coffeescript first and use `cake build` on install directory to compile coffeescripts from `src` to `lib` directory. As an end user you would either get git repository or use `npm` to get scrible-node plus all depencities hassle free to your development environment:

    npm install scribe-node

Next steps are to demostrate retrieving authorization token and use it on your application to access data from web service. See Google analytics example at the end of the read me file. Examples uses OAuth 1.0a scheme. Later OAuth 2.0 examples will be added.

Note that I'm using offpage application mode for authorization. It means callback page is set to `oob` which causes service provider to show  verification code on browser window. Then you need to paste code to your application manually. Approach is a little bit different on fully pledged web appliations, that can hide this part of the process behind the screen.

## OAuth 1.0a Dance Snippets

### Get authorization url

    get_authorization_url = (service) ->
      request_token_extract = (response) ->
        # request token should be saved somewhere because service.getAccessToken uses request token
        # but here we just print it on console, where you can take tokens and save inside get_request_token function
        request_token = service.api.getRequestTokenExtractor() response.data
        console.log request_token
        url = service.getAuthorizationUrl request_token
        # as it is with request token, also url is printed to the console which you need to
        # copy and paste to browser to retrieve the verification code
        console.log "\nAuthorization url: "+url

      service.getRequestToken request_token_extract

### Save verification code

This is the code you got from clicking and following the authorization url from the first step.

    set_verification_code = (code) ->
      # save code to data store or session store

### Get verification code

    get_verification_code = () ->
      code = 'verification_code' # get from datastore or session
      new scribe.Verifier code

### Get request token at any point after get_authorization_url

    get_request_token = () ->
      token = 'request_token' # get from datastore or session
      secret = 'request_secret' # get from datastore or session
      new scribe.Token token, secret

### Retrieve and save access token

    set_access_token = (service) ->
      access_token_extract = (response) ->
        access_token = service.api.getAccessTokenExtractor() response.data
        #save access token for later use
        console.log access_token

      service.getAccessToken get_request_token(), get_verification_code(), access_token_extract

### Get access token at any point after set_access_token

This will return the final token you would use to retrieve data via selected web service. All earlier steps are just preparing and completing authorization for the service.

    get_access_token = () ->
      token = 'access_token' # get from datastore or session
      secret = 'access_secret' # get from datastore or session
      new scribe.Token token, secret

## Google Analytics Example

### Authorize

So those are the helper functions to get final acces token. Lets see how to use them and after that how to get Google analytics account profiles using saved access token.

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
      console.log "Listing Google Analytics account profiles:\n"
      entries = JSON.parse(parser(response.data)).feed.entry
      for entry in entries
        console.log entry.id + " " + entry.title['$t'] + " " + entry["dxp:tableId"]
    
    service.signedRequest(access_token, handle_analytics_accounts_feed, analytics_accounts_feed)

If you do a lot of interaction with Google Analytics or other Google services, you may want to create own model for more sophisticated approach, buts its beyond the scope of this work.

## Widgets (APIs)

### Supported and tested list

These are the specialized APIs that are already implemented on scribe-node library. Althought limited list of APIs mentiond here, it doesnt mean to you cannot use library with any other web service available from internet. Library should work with all OAuth 1.0a and 2.0 schemes. If you have made your own API, please dont hesitate to fork this repository, add API as a widget to the library and send a pull request.

* GoogleApi
* GoogleApi2
* TwitterApi ([http://github.com/fernandezpablo85 fernandezpablo85])

### Yet to be done list

* YammerApi
* YahooApi
* VkontakteApi
* VimeoApi
* SohuWeiboApi
* SinaWeiboApi
* SimpleGeoApi
* SapoApi
* QWeiboApi
* PlurkApi
* NeteaseWeibooApi
* LoveFilmApi
* LiveApi
* LinkedInApi
* KaixinApi
* FoursquareApi
* Foursquare2Api
* FacebookApi
* EvernoteApi
* DropBoxApi
* ConstantContactApi

## TODO

* extracting tokens might be over generalizing now when they are on classes having only extract method. simpler way would be to use just functions, but need to research, if there is any name collision possibility. but i think not because they would be inside module anyway
* all the apis to widgets from original java lib. see supported list
* 