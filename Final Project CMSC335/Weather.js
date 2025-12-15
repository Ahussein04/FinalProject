const mongoose = require("mongoose");

const songsSchema = new mongoose.Schema({
   city: {
      type: String,
      required: true,
   },
   country: {
      type: String,
      required: true,
   },
   weather: {
      type: Number,
      required: true,
   },
   date: {
      type: Date,
      default: () => Date.now(),
      immutable: true,
   },
   
});

const Weather = mongoose.model("Weather", weatherSchema);
module.exports = Song;
