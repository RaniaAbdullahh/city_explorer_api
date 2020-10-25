'use strict';
// Defining Application Dependencies
const express = require('express');
const cors = require('cors');
const { response } = require('express');

require('dotenv').config();
const PORT = process.env.PORT || 3000;
console.log(PORT);
const app = express();
app.use(cors());
//-------------

// Routes
app.get('/', (reqeust, response) => {
  response.send('Home Page Welcome to express');
});
//location  Rout
try {
  app.get('/location', (request, response) => {
    const locationData = require('./data/location.json');
    const city = request.query.city;
    let location;
    locationData.forEach(locationData => {
      location = new Location(city, locationData);
    });
    response.json(location);
   

  });
} catch (error) {
  return response.status(500).send(Error);
}
// location constructor
function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData.display_name;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
}
//---------

//weather Rout
let weatherData = require('./data/weather.json');

try {
  app.get('/weather', (reqeust, response) => {

    let weatherArray = [];
    weatherData.data.forEach(value => {
      let summary = value.weather.description;
      let time = value.datetime;
      weatherArray.push(new Weather(summary, time));

    });
    response.json(weatherArray);
    console.log(weatherArray);

  });
} catch (error) {
  return response.status(500).send(Error);
}
// weather constructor
function Weather(forecast, time) {
  this.forecast = forecast;
  this.time = time;
}


//---------
app.use('*', (request, resp) => {
  resp.status(404).send('Not found');
});
//------------

app.listen(PORT, () => console.log(`App is listening on port ${PORT}`));
