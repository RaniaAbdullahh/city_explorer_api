'use strict';
// Defining Application Dependencies
const superagent = require('superagent');
const express = require('express');
const cors = require('cors');
const { response } = require('express');

require('dotenv').config();
const PORT = process.env.PORT || 3000;
const GEOIQ = process.env.GEOIQ;
const WEATHERQ = process.env.WEATHERQ;
const TRAILQ = process.env.TRAILQ;
console.log(PORT);
const app = express();
app.use(cors());
//-------------
const pg = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);
//-------------
app.get('/get-locations', (req, res) => {
  const location = 'SELECT * FROM location ;';
  client.query(location).then(result => {
    res.status(200).json(result.rows);
  });
});
//-----------

app.get('/add-location',locationHndler);
//-------------
//  home Route
app.get('/', welcomePage);
//location  Rout
app.get('/location', locationHndler);
//weather Rout
app.get('/weather', weatherHandler);

//  trial Route
app.get('/trails', trailsHandler);
//---------
app.use('*', notFound);

// location constructor
function Location(city, locationData) {

  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}

//for(500) error
Location.prototype.errorHandler = function () {
  if (!this.formatted_query.includes(this.search_query)) {
    error();



  }

};


function Weather(weatherData) {
  this.forecast = weatherData.weather.description;
  this.time = weatherData.datetime;
}
// Trail constructor
function Trail(trailObj) {
  this.name = trailObj.name;
  this.location = trailObj.location;
  this.length = trailObj.length;
  this.stars = trailObj.stars;
  this.star_votes = trailObj.starVotes;
  this.summary = trailObj.summary;
  this.trail_url = trailObj.url;
  this.conditions = trailObj.conditionDetails;
  this.condition_date = trailObj.conditionDate;

}

//helpers functions------------
function welcomePage(request, response) {
  response.send('Home Page Welcome to express');
}

function locationHndler(request, response) {
  const city = request.query.city;
  const url = `https://eu1.locationiq.com/v1/search.php?key=${GEOIQ}&q=${city}&format=json`;
  let locationArr = [];
  superagent.get(url).then(locationData => {
    //console.log(locationData.body);
    locationArr.push(new Location(city, locationData.body));
    const newValues = 'INSERT INTO location (search_query,formatted_query,latitude,longitude) VALUES($1,$2,$3,$4);';
    const saveValues = [locationArr[0].search_query, locationArr[0].formatted_query, locationArr[0].latitude, locationArr[0].longitude];
    //response.json(location);
    client.query(newValues, saveValues).then(data => {
      response.status(200).json(data);
    });
  });
}

function weatherHandler(reqeust, response) {
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=38.123&lon=-78.543&key=${WEATHERQ}`;
  superagent.get(url).then(weatherData => {
    let weather = weatherData.body.data.map(Data => {
      // console.log(Data);
      return new Weather(Data);
    });
    // console.log(weather);
    response.json(weather);
  }).catch(console.error);

}
function trailsHandler(reqeust, response) {

  // const url = `https://www.hikingproject.com/data/get?lat=40.0274&lon=-105.2519&maxDistance=10&key=${TRAILQ}`;
  const url = `https://www.hikingproject.com/data/get-trails?lat=40.0274&lon=-105.2519&maxDistance=10&key=200959308-d46bf86a332e86ae55bf43b6e24ea048`;

  superagent.get(url).then(trailsData => {
    console.log(trailsData.body.trails);

    let trail = trailsData.body.trails.map(Data => {
      return new Trail(Data);
    });
    console.log(trail);
    response.json(trail);
  }).catch(console.error);






}

function notFound(request, resp) {
  resp.status(404).send('Not found');
}

function error(request, resp) {
  resp.status(500).send('Error ! ');
}

//------------
//app.listen(PORT, () => console.log(`App is listening on port ${PORT}`));


client.connect().then(() => {
  app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
}).catch(error => {
  console.log('error', error);
});
