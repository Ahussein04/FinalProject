const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({
   path: path.resolve(__dirname, "credentialsDontPost/.env"),
});
const { MongoClient, ServerApiVersion } = require("mongodb");

/* Define Weather model at module scope so all routes can use it */
const weatherSchema = new mongoose.Schema({
	city: String,
	weather: Number,
	date: Date,
});
const Weather = mongoose.models.Weather || mongoose.model("Weather", weatherSchema);

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
app.use(express.static(path.join(__dirname, 'css')));//comment out if not needed or unnecessary

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

		/* Creating a document (instance of Model) */
		const currWeather = new Weather({
			city: city,
			weather: weather,
			date: new Date(),
		});

		/* Saving the document */
		await currWeather.save();

		mongoose.disconnect();
   } catch (err) {
      console.error(err);
   }
   		res.render("searchCity", toRender);

		
		// console.log(weather);
	} catch (error) {
		//console.error(error);
		
		res.status(404).render("error");
	}
	
})

app.get("/previousSearches", async (req, res) => {
	let variables = {itemsTable: ""};
	try {
      await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

  
      let pastWeather = await Weather.find({});
	  let newTable = '<table style="border: 1px double black;">';
    newTable += '<tr> <th style="border: 1px double black;">Name</th> <th style="border: 1px double black;">Temperature</th><th style="border: 1px double black;">Date of Lookup</th></tr>';
  
	 for(const dudes of pastWeather){
        newTable += "<tr>";
        newTable += `<td style="border: 1px double black;"> ${dudes.city} </td><td style="border: 1px double black;"> ${dudes.weather} </td> <td style="border: 1px double black;"> ${dudes.date} </td></tr>`
      }


        newTable += "</table>"
	    variables =  {itemsTable: newTable};

      mongoose.disconnect();
   } catch (err) {
      console.error(err);
   }


	res.render("savedCities",variables);
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
