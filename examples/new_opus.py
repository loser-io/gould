import requests

requests.post( # use the POST method
    "https://loserio.cloud/api/as/composer/opus", # this is the url for uploading opuses
    headers= {
        "Authorization": "Bearer loserkeyINSERT_API_KEY_HERE" # contact us if you lost your api key
    },
    json={
        "events": [ # the events you would like to happen, sorted in past-to-future order
        {
            "ts" : 129, # ts is when the event should happen, in milliseconds.
            "type" : "KEY_DOWN", # can be KEY_DOWN or KEY_UP
            "note" : 30, # pitch as midi note value
            "velocity" : 85 # velocity as midi velocity value
        },
        {
            "ts" : 158,
            "type" : "KEY_DOWN",
            "note" : 36,
            "velocity" : 100
        },
        {
            "ts" : 182,
            "type" : "KEY_DOWN",
            "note" : 37,
            "velocity" : 81
        }]
    })
