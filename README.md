# Scribe Java OAuth library port to node.js

See: https://github.com/fernandezpablo85/scribe-java

Due to different language used (coffeescript / node.js) and heavy altering the design on some parts I rather did not "github-fork" the original repository. Althought there are some oauth libraries for node.js reasoning behind this work was that I really liked the way scribe was organized, especially giving option to add easily different web2.0 services to the codebase as a widgets.

These small code snippets shows only general OAuth dance routines. On final application storing tokens on steps differs a lot depending on how application is done.

## Get authorization url

    get_authorization_url = (service) ->
      request_token_extract = (extractor, response) ->
        # request token should be saved somewhere because service.getAccessToken uses request token
        request_token = extractor response
        console.log request_token
        url = service.getAuthorizationUrl request_token
        console.log url

      service.getRequestToken request_token_extract

## Save verification code to the datastore or session

    set_verification_code = (code) ->
      # save to datastore for example

## Get verifier you got from clicking and following the authorization url on earlier steps

    get_verification_code = () ->
      code = 'verification_code'
      new scribe.Verifier code

## Get request token from datastore or session after get_authorization_url

    get_request_token = () ->
      token = 'request_token' 
      secret = 'request_secret'
      new scribe.Token token, secret

## Set and save access token to datastore or session

    set_access_token = (service) ->
      access_token_extract = (extractor, response) ->
        access_token = extractor response
        console.log access_token
        #save access token for late usage

      service.getAccessToken get_request_token(), get_verifier(), access_token_extract

## Get from datastore or session after set_access_token.

This will return the final token you would use to retrieve data via selected web service. All earlier steps are just preparing and completing authorization for the service.

    get_access_token = () ->
      token = 'access_token'
      secret = 'access_secret'
      new scribe.Token token, secret

## Google analytics example

    scribe = require('scribe')
    widgets = require('widgets').getWidgets(['GoogleApi'])

    service = new scribe.ServiceBuilder()
              .provider(widgets.GoogleApi)
              .apiKey('api_key')
              .apiSecret('api_secret')
              ._scope('https://www.google.com/analytics/feeds/')
              .build()
    access_token = get_access_token()
    analytics_accounts_feed = 'https://www.google.com/analytics/feeds/accounts/default?max-results=5'
    
    handle_analytics_accounts_feed = (extractor, response) ->
      entries = JSON.parse(extractor(response)).feed.entry
      for entry in entries
        console.log entry.id + " " + entry.title['$t'] + " " + entry["dxp:tableId"]
    
    service.signedRequest(access_token, handle_analytics_accounts_feed, analytics_accounts_feed)