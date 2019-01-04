# Shared Node Server

[![Greenkeeper badge](https://badges.greenkeeper.io/OSU-Sustainability-Office/shared-node-server.svg)](https://greenkeeper.io/)

This server allows all of our web apps to interact with one unified users database using simple AJAX requests.

## API Documentation
- [CAS Authentication](#cas-authentication)
- [Carbon Calculator](#carbon-calculator)
- [Energy Dashboard](#energy-dashboard)

### CAS Authentication
The shared node server provides a useful API wrapper for user authentication using OSU's [Central Authentication Service](http://onid.oregonstate.edu/docs/technical/cas.shtml). This allows all of our applications to authenticate users without application-specific authorization from CAS.

To log a user in, use this process:
  1. Redirect the user to the `/auth/login` endpoint. Your application must specify a return URL, which will be used to redirect the user back to your application. A return URL may be specified by specifying the application's url as a URI parameter. ex: `.../auth/login?returnURI=http://www.orst.edu`

  2. A session for the user will be initialized, and the user will be redirected to the ONID login page.
  3. When the user logs in, the user will be redirected to the `/auth/session` endpoint. This will complete the session initialization, and the user will be redirected to your application via the return URL.
  4. To access the user's data, use the `/auth/userData/` endpoint. To retrieve the user's ONID username, for example, send a get request to `/auth/userData/onid`. The body of the HTTP response will consist of a JSON object containing the requested information.

#### /auth/login
  - Method: GET
  - Parameters:
    - returnURI: This is your web application's url, specified as a URI parameter.
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

#### /auth/logout
  - Method: GET
  - Parameters:
    - None
  - Post Conditions:
    - The user's session is destroyed.

### Carbon Calculator
I haven't written any documentation for this yet because the current API is subject to change. -Jack

### Energy Dashboard
The Energy Dashboard API offers an extensive list of operations to perform the neccessary operations of the Energy Dashboard front end. Additionally it offers simple ways to grab data in a uniform format. The API is also responsible for interfacing with Acquisuite devices that upload the data.

##### Routes:
  - [Upload](#/energy/upload)
  - [Story](#/energy/story)
  - [Group](#/energy/group)
  - [Block](#/energy/block)
  - [Chart](#/energy/chart)
  - [User](#/energy/user)
  - [Map](#/energy/map)
  - [Buildings](#/energy/buildings)
  - [Stories](#/energy/stories)
  - [Data](#/energy/data)
  - [Meters](#/energy/meters)
  - [Metersbybuilding](#/energy/metersbybuilding)
  - [MeterPoints](#/energy/meterpoints)
  - [Alerts](#/energy/alerts)
  - [Alert](#/energy/alert)
  - [Media](#/energy/meida)
  - [Images](#/energy/images)

#### /devices/upload
  - Method: POST
    - Parameters:
      - PASSWORD: a password used to check the legitmacey of the incoming data upload
      - SERIALNUMBER: the serial number of the Acquisuite device
      - MODBUSDEVICE: the port number of the device associated to the incoming data
      - MODBUSDEVICENAME: the name of the device associated to the incoming data
      - MODBUSDEVICECLASS: the class of device associated to the incoming data. This information is used to match up incoming data columns to the columns of our own database. Information on this mapping can be found in the data/meterdefinitions/all.js file
      - LOGFILE: gzip string containing the data to be uploaded in CSV format
    - Post Conditions
      - The data table is populated with an entry corresponding to the incoming data.
      - A meter entry is created in the meters table if one does not exist for the incoming requests serial and port configuration
      - Alerts are sent to subscribed users of the particular meter if their threshold value is met as per the alerts table
    - Response
      - 200:
        - A 200 status is sent if the above post conditions are meant or if an unsupported MODE parameter is sent. This is to ensure that a connection test works and has no adverse affects.

          ```
          <pre>
            SUCCESS
          </pre>
          ```
      - 406:
        - A 406 status is sent if the query fails or the password is incorrect. A description of the error is contained inside the response.

          ```
          <pre>
            FAILURE: ERROR MESSAGE
          </pre>
          ```

#### /energy/story
  - Method: POST
    - Parameters:
      - group_id: the id of the group the story should belong to
      - name: the name of the story
      - description: the subtitle of the story
      - media: the file name of the image to display on the storys header and card
    - Post Conditions:
      - A story entry is created  in the DB with the respective parameters
    - Response:
      - 201:
        - If the entry is succesffuly added a 201 status is given with the following object

          ```
          {
            id: storyID
          }
          ```
      - 400:
        - If invalid parameters are given then a 400 status is returned

          ```
          400: ERROR MESSAGE
          ```
      - 403:
        - If a user is not logged in then a 403 status is returned

          ```
          403: NOT AUTHORIZED
          ```

  - Method: PUT
    - Parameters:
      - name: the name of the story
      - description: the subtitle of the story
      - media: the file name of the image to display on the storys header and card
      - id: the id of the story to update
    - Post Conditions:
      - The story entry in the DB is updated with the above parameters
    - Response:
      - 201:
        - The entry was succesffuly updated to the new values
      - 400:
        - The parameters were incorrect
          ```
          400: ERROR MESSAGE
          ```
      - 403:
        - The user is not signed in
        ```
        403: NOT AUTHORIZED
        ```

  - Method: DELETE
    - Parameters:
      - id: the id of the story to delete
    - Post Conditions:
      - The entry in the DB with the corresponding ID and user ID (as defined by the session object) is deleted
    - Response:
      - 204:
        - The story was deleted
      - 400:
        - The given parameters were bad
          ```
          400: ERROR MESSAGE
          ```
      - 403:
        - The user is not logged in
          ```
          403: NOT AUTHORIZED
          ```

  - Method: GET
    - Parameters:
      - id: the id of the story to get
    - Response:
      - 200:
        - The following is an example of the returned object. Openmeters and Openblocks require additional processing to be matched to their corresponding block. This processing is left to the client to avoid computational cost on the server.
          ```
          {
          "id":95,
          "user_id":1,
          "name":"Tebeau Hall",
          "description":"Electric",
          "public":1,
          "featured":1,
          "media":"20150416_TebeauHall_HO3514.jpg",
          "group_id":2,
          "blocks":
            [
              {
                "date_start":"2018-06-01T00:00:00.000Z",
                "date_end":"2018-06-30T23:59:00.000Z",
                "graph_type":1,
                "story_id":95,
                "id":190,
                "name":"Total Electricity",
                "date_interval":15,
                "interval_unit":"minute"
                }
              ],
          "openCharts":
            [
              {
                "id":476,
                "block_id":190,
                "group_id":8,
                "name":"Tebau Hall Electricty",
                "point":"accumulated_real",
                "meter":0
                }
              ],
            "openMeters":
              [
                {
                  "id":121,
                  "meter_id":1,
                  "group_id":8,
                  "operation":1,
                  "chart_id":476,
                  "type":"e",
                  "negate":null
                }
              ]
          }
          ```
      - 400:
        - Bad Parameters
          ```
          400: ERROR MESSAGE
          ```

#### /energy/group
  - Method: POST
    - Parameters:
      - name: the name of the group
    - Post Conditions:
      - An entry in the group table is made
    - Response:
      - 201:
        - The entry was made. The id of the created entry is returned.
          ```
          { id: groupID }
          ```
      - 400:
        - Bad Parameters
          ```
          400: ERROR MESSAGE
          ```
      - 403:
        - Not logged in
          ```
          403: NOT AUTHORIZED
          ```

  - Method: PUT
    - Parameters:
      - name: the name to change the group to
      - id: the id of the group to update
    - Post Conditions:
      - The corresponding group entry was updated
    - Response:
      - 204:
        - The entry was updated
      - 400:
        - Bad parameters
          ```
          400: ERROR MESSAGE
          ```
      - 403:
        - Not logged in
          ```
          403: NOT AUTHORIZED
          ```

  - Method: DELETE
    - Parameters:
      - id: the id of the story to delete
    - Post Conditions:
      - The corresponding entry is deleted from the DB
    - Response:
      - 204:
        - The entry was deleted
      - 400:
        - Bad Parameters
          ```
          400: ERROR MESSAGE
          ```
      - 403:
        - Not logged in
          ```
          403: NOT AUTHORIZED
          ```
        
#### /energy/block
#### /energy/chart
#### /energy/user
#### /energy/map
#### /energy/buildings
#### /energy/stories
#### /energy/data
#### /energy/meters
#### /energy/metersbybuilding
#### /energy/meterpoints
#### /energy/alerts
#### /energy/alert
#### /energy/media
#### /energy/images
