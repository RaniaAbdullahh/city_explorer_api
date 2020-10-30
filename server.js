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
const MOVIES = process.env.MOVIES;
const YELP = process.env.YELP;
const app = express();
app.use(cors());
//-------------
const pg = require('pg');
const request = require('superagent');
//const axios = require("axios");
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);
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
app.get('/movies', moviesHandler);
app.get('/yelp', yelpHandler);
app.use('*', notFound);

// location constructor
function Location(city, locationData) {

  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}

// //for(500) error
// Location.prototype.errorHandler = function () {
//   if (!this.formatted_query.includes(this.search_query)) {
//     error();
//   }
// };


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
//movies constructor 
function Movie(movieObj) {
  this.title = movieObj.title;
  this.overview = movieObj.overview;
  this.vote_average = movieObj.vote_average;
  this.vote_count = movieObj.vote_count;
  this.poster_path = movieObj.poster_path;
  this.popularity = movieObj.popularity;
  this.release_date = movieObj.release_date;

}
//yelp constructor 
function Yelp(yelbObj) {
  this.name = yelbObj.name;
  this.image_url = yelbObj.image_url;
  this.price = yelbObj.price;
  this.rating = yelbObj.rating;
  this.url = yelbObj.url;
}

//helpers functions------------
function welcomePage(request, response) {
  response.send('Home Page Welcome to express');
}

function locationHndler(request, response) {
  const location = 'SELECT * FROM location WHERE search_query=$1;';
  const city = request.query.city;
  const safrvar = [city];
  client.query(location, safrvar).then(result => {
    if (!(result.rowCount === 0)) {
      //console.log(result);
      //console.log(result.rows[0].search_query);
      // result.rows.forEach(value=>{
      //   console.log(value.search_query);
      //   //   if (value.search_query !== null){
      //   //     console.log('whatttt');
      //   //     response.status(200).json(result.rows);
      //   //   }else{
      //   //     console.log('pleassssse');
      //   //   }

      // });
      response.status(200).json(result.rows[0]);
    }
    else {

      //console.log('after catch');
      const url = `https://eu1.locationiq.com/v1/search.php?key=${GEOIQ}&q=${city}&format=json`;
      let locationArr;
      superagent.get(url).then(locationData => {
        //console.log(locationData.body);
        locationArr = new Location(city, locationData.body);
        const newValues = 'INSERT INTO location (search_query,formatted_query,latitude,longitude) VALUES($1,$2,$3,$4);';
        const saveValues = [locationArr.search_query, locationArr.formatted_query, locationArr.latitude, locationArr.longitude];
        //response.json(location);
        client.query(newValues, saveValues).then(() => {
          //console.log(saveValues);
          response.status(200).json(locationArr);
        });

      });
    }

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



//console.log('lat');
function trailsHandler(reqeust, response) {
  let lat = reqeust.query.latitude;
  let lon = reqeust.query.longitude;
  //console.log('before')

  const url = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&key=${TRAILQ}`;
  //console.log(url);




  superagent.get(url).then(trailsData => {
    //console.log(trailsData.body);
    let trail = trailsData.body.trails.map(Data => {
      return new Trail(Data);
    });
    response.json(trail);
  }).catch(console.error);

  //console.log('after')

}






function moviesHandler(request, response) {
  let region = request.query.search_query.slice(0, 2).toUpperCase();
  const url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${MOVIES}&region=${region}`;
  superagent.get(url).then(moviesData => {
    //console.log(moviesData.body.results);
    let movie = moviesData.body.results.map(Data => {
      //console.log(Data);
      return new Movie(Data);
    });
    response.json(movie);
    //console.log(movie);
  }).catch(console.error);
}

function yelpHandler(request, response) {
  const region = request.query.search_query;
  const longitude = request.query.longitude;
  const latitude = request.query.latitude;
  const page=request.query.page;
  let offset=5*(page-1);//for ordering 
  const url = `https://api.yelp.com/v3/businesses/search`;
  //passing parameters
  let queryParemeter={
    location:region,
    latitude:latitude,
    longitude:longitude,
    api_key:YELP,
    offset:offset,
    limit:5,
    categories:'Restaurants ',
    format:'json'
  };
  superagent.get(url).query(queryParemeter).set('Authorization', `Bearer ${YELP}`).then(yelpsData => {
    console.log(yelpsData.body);
   let yelps = yelpsData.body.businesses.map((value) => {
      return (new Yelp(value));
    });
    response.json(yelps);
  }).catch(() => {
    response.status(500).send('Sorry,something went wrong');
  })

  //let url = `https://api.yelp.com/v3/businesses/search?api_key=${YELP}`;
  //let url =`https://api.yelp.com/v3/businesses/search?api_key=${YELP}&categories=&latitude=37.786882&longitude=-122.399972&location=${location}`;

  // superagent.get(url).then(yelpsData => {
  //   console.log(yelpsData.body);
  //   let yelp = yelpsData.body.results.map(Data => {
  //     //console.log(Data);
  //     return new Yelp(Data);
  //   });
  //   response.json(yelp);

  // }).catch(console.error);

  // axios.get(`https://api.yelp.com/v3/businesses/search`, {headers: { Authorization: `Bearer ${YELP}`}, params: { location: { location },categories: 'Restaurants'}
  //   .then(yelpsData => {
  //     console.log(yelpsData.body);
  //     let yelp = yelpsData.body.results.map(Data => {
  //       //console.log(Data);
  //       return new Yelp(Data);
  //     });
  //     response.json(yelp);

  //   }).catch(console.error)
  // })


}





function notFound(request, resp) {
  resp.status(404).send('Not found');
}


//------------
//app.listen(PORT, () => console.log(`App is listening on port ${PORT}`));


client.connect().then(() => {
  app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
}).catch(error => {
  console.log('error', error);
});




