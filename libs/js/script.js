// Create LeafletJS map
const map = L.map("map").setView([0, 0], 3);

// Create LeafletJS FeatureGroup
const countryMarkersFeatureGroup = L.featureGroup();

// Load in LeafletJS TileLayer
L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  {
    minZoom: 2,
    maxZoom: 10,
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  }
).addTo(map);

// Create object to store coords and country data
let countryObject = {};

// Get coords from current device location
const getCoordsFromDeviceLocation = async () => {
  const pos = await new Promise((resolve, reject) => {
    window.navigator.geolocation.getCurrentPosition(resolve, reject);
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };
};

// Ajax Functions
// Get Country Code from device location

const getCountryFromLoc = async (coords) => {
  const countryCode = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getCountryCodeFromLoc.php",
      type: "POST",
      dataType: "json",
      data: {
        lat: coords.latitude,
        lng: coords.longitude,
      },
      success: function (result) {
        if (result.status.name == "ok") {
          resolve(result.data);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(JSON.stringify(errorThrown));
        reject(JSON.stringify(errorThrown));
      },
    });
  });
  return countryCode;
};

// AJAX Functions to parse CountryBorders.geo.json

// Get country borders from countryBorders.geo.json from Country name
const getCountryBorderFromCountryName = async (countryName) => {
  const border = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getCountryBordersFromJSON.php",
      type: "POST",
      dataType: "json",
      data: {
        countryName: countryName,
      },
      success: function (result) {
        if (result.status.name == "ok") {
          resolve(result.data);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(JSON.stringify(errorThrown));
        reject(JSON.stringify(errorThrown));
      },
    });
  });
  return border;
};

// Get Country list as array from countryBorders.geo.json
const getCountryList = async () => {
  const countryList = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getCountryNamesFromJSON.php",
      type: "GET",
      dataType: "json",
      success: function (result) {
        if (result.status.name == "ok") {
          resolve(result.data);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(JSON.stringify(errorThrown));
        reject(JSON.stringify(errorThrown));
      },
    });
  });
  return countryList;
};

// Clear featureGroup layers, add geoJSON to featuregroup, add featuregroup to map and fit map bounds to featuregroup bounds
function createBorder(geoJSON) {
  countryMarkersFeatureGroup.clearLayers();
  L.geoJSON(geoJSON).addTo(countryMarkersFeatureGroup);
  countryMarkersFeatureGroup.addTo(map);
  map.fitBounds(countryMarkersFeatureGroup.getBounds());
}

// AJAX functions to gather all API data needed for Overlay
// Country Basic Data from https://restcountries.com
const getCountryBasicData = async (countryCode) => {
  const countryBasicData = await new Promise((resolve, reject) => {
    $.ajax({
      url: `https://restcountries.com/v3.1/alpha/${countryCode}`,
      type: "GET",
      dataType: "JSON",
      success: function(result) {
        resolve(result);
      }
    })
  })
  return countryBasicData[0];
}

// Weather data from https://www.visualcrossing.com/
const getWeatherData = async (cityName) => {
  const countryWeatherData = await new Promise((resolve, reject) => {
    $.ajax({
      url: `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${cityName}?unitGroup=metric&key=ULZ8VH9ZR2MR8HA5M4C4TT3JP&contentType=json`,
      type: "GET",
      dataType: "JSON",
      success: function(result) {
        resolve(result);
      }
    })
  })
  return countryWeatherData;
}

// Covid data from https://corona-api.com/
const getCovidData = async (countryCode) => {
  const covidData = await new Promise((resolve, reject) => {
    $.ajax({
      url: `https://corona-api.com/countries/${countryCode}`,
      type: "GET",
      dataType: "JSON",
      success: function(result) {
        resolve(result);
      }
    })
  })
  return covidData.data;
}

// Group API Function Calls for eventual loading into countryObject
const getAllAPIData = async (countryCode) => {{
  const countryBasicData = await getCountryBasicData(countryCode);
  const countryWeatherData = await getWeatherData(countryBasicData.capital);
  const countryCovidData = await getCovidData(countryCode);
  return {countryBasicData, countryWeatherData, countryCovidData};
}}

// JQuery HTML Replacers
const apiToHTML = (countryAPIData) => {
  $("#stats-flag").attr("src", countryAPIData.countryBasicData.flags.png);
  $("#country-name").html(countryAPIData.countryBasicData.name.common);
  $("#country-code").html(countryAPIData.countryBasicData.cca2);
  $("#population").html(countryAPIData.countryBasicData.population);
  $("#capital").html(countryAPIData.countryBasicData.capital);
  const currency = Object.keys(countryAPIData.countryBasicData.currencies)[0];
  $("#currency").html(`${countryAPIData.countryBasicData.currencies[currency].name} - ${countryAPIData.countryBasicData.currencies[currency].symbol}`);
  $("#continent").html(countryAPIData.countryBasicData.region);
}

// Define single function to run in doc.ready, doc.ready cannot be async and async calls needed.
const loaderFunction = async () => {
  // Get list of countries from JSON and populate Select -> Options from list
  const countryList = await getCountryList();
  countryList.sort();
  countryList.forEach((country) => {
    $("#country").append($("<option>", { value: country }).text(country));
  });

  // Get lat and long coords from device location
  countryObject.coords = await getCoordsFromDeviceLocation();

  // Get country data from Geonames from coords, languages, countryCode, countryName
  countryObject.countryDataFromGeoNames = await getCountryFromLoc(countryObject.coords);

  // Get border details for Country from JSON and highlight country as selected in Select html element
  countryObject.borderJSON = await getCountryBorderFromCountryName(
    countryObject.countryDataFromGeoNames.countryName
  );
  $("#country").val(countryObject.countryDataFromGeoNames.countryName);

  // Use border details for Country to create polyline on map
  createBorder(countryObject.borderJSON);

  // Get All API Data
  countryObject.countryAPIData = await getAllAPIData(countryObject.borderJSON.properties.iso_a2)

  // Populate HTML from API data
  apiToHTML(countryObject.countryAPIData);

  // Test countryObject
  console.log(countryObject);
};

// JQuery Document.Ready function for page load
$(function () {
  loaderFunction();
});

// Function to run when selecting Country from Select
$("#country").change(async function () {

  // Clear countryObject
  countryObject = {};

  // Pull Country Name from Select list currently selected item
  countryObject.countryName = $("#country").val();

  // Get Border details from JSON
  countryObject.borderJSON = await getCountryBorderFromCountryName(countryObject.countryName);

  // Create polyline for selected Country
  createBorder(countryObject.borderJSON);

  // Get All API Data
  countryObject.countryAPIData = await getAllAPIData(countryObject.borderJSON.properties.iso_a2)

  // Populate HTML from API data
  apiToHTML(countryObject.countryAPIData);
  
  // Test countryObject
  console.log(countryObject);
});
