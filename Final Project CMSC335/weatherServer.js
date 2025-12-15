const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({
   path: path.resolve(__dirname, ".env"),
});
const { MongoClient, ServerApiVersion } = require("mongodb");

/* Define Weather model at module scope so all routes can use it */
const weatherSchema = new mongoose.Schema({
	city: String,
	country: String,
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
app.use(express.static(path.join(__dirname, 'css')));

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

	const city = req.query.cityName;
	const region = req.query.region;
	const country = req.query.country;

	let locParts = [city];
	if (region && region.trim() !== "") locParts.push(region.trim());
	if (country && country.trim() !== "") locParts.push(country.trim());

	const locQuery = locParts.join(",");
	const toSearch = baseURL + encodeURIComponent(locQuery);
	try {
		
		const response = await fetch(toSearch);
		const result = await response.json();

		if(!result.current) {
			throw new Error("City not found");
		}
		
		//make sure its exact match bc if u enter some random word it matches to some city sometimes the api
		const userCity = req.query.cityName.trim().toLowerCase();
		const apiCity = result.location.name.trim().toLowerCase();

		if (apiCity !== userCity) {
			throw new Error("City not found");
}

		let temperature = result.current.temperature;
		let feelsLike = result.current.feelslike;
		let weatherDescription = result.current.weather_descriptions[0];
		let windSpeed = result.current.wind_speed;
		let windDirection = result.current.wind_dir;
		let humidity = result.current.humidity;
		let pressure = result.current.pressure;
		let uvIndex = result.current.uv_index;
		let visibility = result.current.visibility;
		

		const toRender = {
			city: city,
			region: result.location.region,
			country: result.location.country,
			temperature: temperature,
			feelsLike: feelsLike,
			weatherDescription: weatherDescription,
			windSpeed: windSpeed,
			windDirection: windDirection,
			humidity: humidity,
			pressure: pressure,
			uvIndex: uvIndex,
			visibility: visibility,
		};	
		
		try {
		await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

		const currWeather = new Weather({
			city: city,
			country: result.location.country,
			weather: temperature,
			date: new Date(),
		});

		await currWeather.save();
		
		mongoose.disconnect();
	} catch (err) {
		console.error(err);
	}
   		res.render("searchCity", toRender);
		
	} catch (error) {
		res.status(404).render("error");
	}
	
})


app.get("/previousSearches", async (req, res) => {
	let variables = {itemsTable: ""};
	try {
      await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

  
      let pastWeather = await Weather.find({});
	  let newTable = '<table style="border: 1px double black;">';
      newTable += '<tr> <th style="border: 1px double black;">Name</th> <th style="border: 1px double black;">Country</th> <th style="border: 1px double black;">Temperature (in Celsius)</th><th style="border: 1px double black;">Date of Lookup</th></tr>';
  
	 for(const dudes of pastWeather){
        newTable += "<tr>";
        newTable += `<td style="border: 1px double black;"> ${dudes.city} <td style="border: 1px double black;"> ${dudes.country} </td></td><td style="border: 1px double black;"> ${dudes.weather}°</td> <td style="border: 1px double black;"> ${dudes.date} </td></tr>`
      }


        newTable += "</table>"
	    variables =  {itemsTable: newTable};

      mongoose.disconnect();
   } catch (err) {
      console.error(err);
   }


	res.render("savedCities",variables);
});


app.get("/clearDatabase", async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
    await Weather.deleteMany({});
    mongoose.disconnect();

	res.redirect("/previousSearches")
  } catch (e) {
    console.error(e);
  }
});


