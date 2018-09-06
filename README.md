# Shared Node Server
This server allows all of our web apps to interact with one unified users database using simple AJAX requests.

## API Documentation
- [CAS Authentication](#cas-authentication)
- [Carbon Calculator](#carbon-calculator)

### CAS Authentication
The shared node server provides a useful API wrapper for user authentication using OSU's [Central Authentication Service](http://onid.oregonstate.edu/docs/technical/cas.shtml). This allows all of our applications to authenticate users without application-specific authorization from CAS.

To log a user in, use this process:
  1. Redirect the user to the `/auth/login` endpoint. Your application must specify a return URL, which will be used to redirect the user back to your application. A return URL may be specified by either:
    - Specifying the application's url as a URI parameter. ex: `.../auth/login?returnURI=http://www.orst.edu`
    - Specifying the application's url in the POST body of your user's request. The shared node server will parse JSON objects from the body of your HTTP request. Use this object: `{'returnURI': 'http://www.orst.edu'}`
  2. A session for the user will be initialized, and the user will be redirected to the ONID login page.
  3. When the user logs in, the user will be redirected to the `/auth/session` endpoint. This will complete the session initialization, and the user will be redirected to your application via the return URL.
  4. To access the user's data, use the `/auth/userData/` endpoint. To retrieve the user's ONID username, for example, send a get request to `/auth/userData/onid`. The body of the HTTP response will consist of a JSON object containing the requested information.

#### /auth/login
  - Method: GET
  - Parameters:
    - returnURI: This is your web application's url, specified as a URI parameter.
  - Post Conditions:
    - A session is initialized for the user, and they are prompted to login.

#### /auth/login
  - Method: POST
  - Parameters:
    - returnURI: This is your web application's url, specified in a JSON object in the body of your HTTP POST request.
  - Post Conditions:
    - A session is initialized for the user, and they are prompted to login.

#### /auth/session
  - Method: GET
  - Parameters:
    - ticket: The user's CAS login ticket.
  - Pre-Conditions:
    - The user has entered credentials, but their login is unverified.
  - Post Conditions:
    - A session is initialized with all of the user's data.

#### /auth/userData/dataToRetrieve
  - Method: GET
  - Parameters:
    - dataToRetrieve: This is the name of the column in the database to retrieve data from. For example '/auth/userData/onid' or '/auth/userData/allData'
  - Returns:
    - The HTTP response contains a JSON object with the requested user's data.

### Carbon Calculator
I haven't written any documentation for this yet because the current API is subject to change. -Jack
