const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({
   path: path.resolve(__dirname, "credentialsDontPost/.env"),
});
const { MongoClient, ServerApiVersion } = require("mongodb");

let baseURL = "https://api.weatherstack.com/current?access_key=9b76ef6fb256b5bf9bd2780d2c4ecdb9&query=";
// const url = 'https://api.weatherstack.com/current?access_key=9b76ef6fb256b5bf9bd2780d2c4ecdb9&query=New Delhi';
const options = {
	method: 'GET'
};

const express = require("express"); /* Accessing express module */
const ejs = require("ejs"); /* Accessing ejs module */
const bodyParser = require("body-parser"); /* Accessing body-parser module */
const httpSuccessStatus = 200;

const app = express(); /* app is a request handler function */

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());
const portNumber = 7003;
app.listen(portNumber);
console.log(`To access server: http://localhost:${portNumber}`);

/* Defining the view/templating engine to use */
app.set("view engine", "ejs");

/* Directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));

app.get("/", (req, res) => {

	res.render("index");
});

app.get("/searchCity", async (req, res) => {

	let city = req.query.cityName;
	let toSearch = baseURL + city;
	try {
		
		const response = await fetch(toSearch);
		const result = await response.json();

		if(result.request.type !== "City") {
			throw Error("City not found");
		}

		let weather = result.current.temperature;
		let country = result.location.country;
		let region = result.location.region;
		let feelsLike = result.current.feelslike;
		let weatherDescription = result.current.weather_descriptions[0];
		let windSpeed = result.current.wind_speed;

		const toRender = {
			city: city,
			weather: weather,
			region: region,
			country: country,
			feelsLike: feelsLike,
			weatherDescription: weatherDescription,
			windSpeed: windSpeed
		};
		


		try {
      await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

      /* Schema defining structure of a song document */
      /* Valid types: String, Number, Date, Buffer, Boolean, Mixed,
      ObjecdtId, Array, Decimal128, Map */
      const weatherSchema = new mongoose.Schema({
         city: String,
         weather: Number,
         date: Date,
      });

      /* Creating a Model what will allow us to complete CRUD operations
      IMPORTANT: The first argument to model() should be the singular
      form of the collection's name (e.g. the collection will be named
      "songs", if you provide "Song"). Moongoose will change the argument
      you provide to model() to plural and lowercase, and use it as the
      collections name */
      const Weather = mongoose.model("Weather", weatherSchema);

      /* Creating a document (instance of Model) */
      const currWeather = new Weather({
        	city: city,
			weather: weather,
			date: new Date()
      });

      /* Saving the song */
      await currWeather.save();


      mongoose.disconnect();
   } catch (err) {
      console.error(err);
   }
   		res.render("searchCity", toRender);

		
		// console.log(weather);
	} catch (error) {
		//console.error(error);
		
		res.status(404).send("<p>City not found. Please try again.</p>");
	}
	
})

app.get("/previousCities", async (req, res) => {
	const variables = {itemsTable: ""};
	try {
      await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

  
      let pastWeather = await Weather.find({});
	  let newTable = '<table style="border: 1px double black;">';
    newTable += '<tr> <th style="border: 1px double black;">Name</th> <th style="border: 1px double black;">Temperature</th><th style="border: 1px double black;">Date</th></tr>';
  
	 for(const dudes of pastWeather){
        newTable += "<tr>";
        newTable += `<td style="border: 1px double black;"> ${dudes.weather} </td> <td style="border: 1px double black;"> ${dudes.date} </td></tr>`
      }


        newTable += "</table>"
	    variables =  {itemsTable: newTable};

      mongoose.disconnect();
   } catch (err) {
      console.error(err);
   }


	res.render("previousCity",variables);
});

// try {
// 	let toSearch = baseURL + "query=" + "Emflop";
// 	const response = await fetch(toSearch, options);
// 	const result = await response.json();

//     let weather = result.current.temperature;
// 	console.log(weather);
// } catch (error) {
// 	//console.error(error);
// 	console.log("Error");
// }

