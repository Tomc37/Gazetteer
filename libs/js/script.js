// Create LeafletJS map
const map = L.map("map").setView([0, 0], 3);

// Create LeafletJS FeatureGroup
const countryMarkersFeatureGroup = L.featureGroup();

// Load in LeafletJS TileLayer
L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=4e4765b2-fdfd-45d0-ba9a-bfe35596092d",
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

// Get country borders from countryBorders.geo.json from Country code
const getCountryBorderFromCountryCode = async (countryCode) => {
  const border = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getCountryBordersFromJSON.php",
      type: "POST",
      dataType: "json",
      data: {
        countryCode: countryCode,
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

// AJAX functions to gather all API data needed for Overlays
// Country Basic Data from https://restcountries.com
const getCountryBasicData = async (countryCode) => {
  const countryBasicData = await new Promise((resolve, reject) => {
    $.ajax({
      url: `https://restcountries.com/v3.1/alpha/${countryCode}`,
      type: "GET",
      dataType: "JSON",
      success: function (result) {
        resolve(result);
      },
      error: function (error) {
        console.log(error);
        reject(JSON.stringify(error));
      },
    });
  });
  return countryBasicData[0];
};

// Weather data from https://www.visualcrossing.com/
const getWeatherData = async (cityName) => {
  const countryWeatherData = await new Promise((resolve, reject) => {
    $.ajax({
      url: `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${cityName}?unitGroup=metric&key=ULZ8VH9ZR2MR8HA5M4C4TT3JP&contentType=json`,
      type: "GET",
      dataType: "JSON",
      success: function (result) {
        resolve(result);
      },
      error: function (error) {
        console.log(error);
        reject(JSON.stringify(error));
      },
    });
  });
  return countryWeatherData;
};

// Covid data from https://corona-api.com/
const getCovidData = async (countryCode) => {
  const covidData = await new Promise((resolve, reject) => {
    $.ajax({
      url: `https://corona-api.com/countries/${countryCode}`,
      type: "GET",
      dataType: "JSON",
      success: function (result) {
        resolve(result);
      },
      error: function (error) {
        console.log(error);
        reject(JSON.stringify(error));
      },
    });
  });
  return covidData.data;
};

// News data from https://newsapi.org/v2
const getNewsData = async (countryCode) => {
  const newsData = await new Promise((resolve, reject) => {
    $.ajax({
      url: `https://api.newscatcherapi.com/v2/latest_headlines?countries=${countryCode}&lang=en&ranked_only=true`,
      headers: {
        "x-api-key": "cCk3xL_PBnWAWgu-zE7d6vTI6rSiFoSGcSbhCP3O6AU",
      },
      type: "GET",
      dataType: "JSON",
      success: function (result) {
        resolve(result);
      },
      error: function (error) {
        console.log(error);
        reject(JSON.stringify(error));
      },
    })
  })
  return newsData.articles;
}

// Group API Function Calls for eventual loading into countryObject
const getAllAPIData = async (countryCode) => {
  {
    const countryBasicData = await getCountryBasicData(countryCode);
    const countryWeatherData = await getWeatherData(countryBasicData.capital);
    const countryCovidData = await getCovidData(countryCode);
    let countryNewsData = await getNewsData(countryCode);
    const uniqueTitles = [];
    countryNewsData = countryNewsData.filter(element => {
      const isDuplicate = uniqueTitles.includes(element.title);
      if (!isDuplicate) {
        uniqueTitles.push(element.title);
        return true;
      }
      return false;
    })
    countryNewsData = countryNewsData.slice(0, 5);
    return { countryBasicData, countryWeatherData, countryCovidData, countryNewsData };
  }
};


const numberFormat = '0,0';
const timeFormat = "00:00";
// JQuery HTML Replacers
const apiToHTML = (countryAPIData) => {
  // Basic Info
  $("#stats-flag").attr("src", countryAPIData.countryBasicData.flags.png);
  $("#country-name").html(countryAPIData.countryBasicData.name.common);
  $("#country-code").html(countryAPIData.countryBasicData.cca2);
  $("#population").html(
    numeral(countryAPIData.countryBasicData.population).format(numberFormat)
  );
  $("#capital").html(countryAPIData.countryBasicData.capital);
  const currency = Object.keys(countryAPIData.countryBasicData.currencies)[0];
  $("#currency").html(
    `${countryAPIData.countryBasicData.currencies[currency].name} - ${countryAPIData.countryBasicData.currencies[currency].symbol}`
  );
  $("#continent").html(countryAPIData.countryBasicData.region);
  // Weather
  $("#weather-title").html(
    `Weather in ${countryAPIData.countryWeatherData.address}`
  );
  $("#weather-icon").attr(
    "src",
    `libs/util/Images/Weather/${countryAPIData.countryWeatherData.currentConditions.icon}.png`
  );
  $("#weather-description").html(
    countryAPIData.countryWeatherData.currentConditions.conditions
  );
  $("#weather-time").html(
    numeral(countryAPIData.countryWeatherData.currentConditions.datetime).format(timeFormat)
  );
  $("#weather-temperature").html(
    `${countryAPIData.countryWeatherData.currentConditions.temp}C`
  );
  $("#weather-wind-speed").html(
    `${countryAPIData.countryWeatherData.currentConditions.windspeed}mph`
  );
  $("#weather-uv-index").html(
    countryAPIData.countryWeatherData.currentConditions.uvindex
  );
  $("#weather-forecast").html(countryAPIData.countryWeatherData.description);
  // Covid
  $("#covid-icon").attr("src", "libs/util/Images/covid.png");
  $("#covid-confirmed").html(
    numeral(countryAPIData.countryCovidData.latest_data.confirmed).format(numberFormat)
  );
  $("#covid-deaths").html(numeral(countryAPIData.countryCovidData.latest_data.deaths).format(numberFormat));
  $("#covid-recovered").html(
    numeral(countryAPIData.countryCovidData.latest_data.recovered).format(numberFormat)
  );
  $("#covid-cases-today").html(numeral(countryAPIData.countryCovidData.today.confirmed).format(numberFormat));
  $("#covid-deaths-today").html(numeral(countryAPIData.countryCovidData.today.deaths).format(numberFormat));
  // News
  $(".news-article-container").remove();
  countryAPIData.countryNewsData.forEach((article => {
    const newDiv = `<a class='news-article-container' href='${article.link}' target='_blank'><img src='${article.media}'/><h5>${article.title}</h5></div>`;
    $(".news-articles-container").append(newDiv);
  }))
};

// Define single function to run in doc.ready, doc.ready cannot be async and async calls needed.
const loaderFunction = async () => {
  // Get list of countries from JSON and populate Select -> Options from list
  const countryList = await getCountryList();
  countryList.sort((a, b) => (a.name > b.name) ? 1 : -1);
  countryList.forEach((country) => {
    $("#country").append($("<option>", { value: country.code }).text(country.name));
  });

  // Get lat and long coords from device location
  countryObject.coords = await getCoordsFromDeviceLocation();

  // Get country data from Geonames from coords, languages, countryCode, countryName
  countryObject.countryDataFromGeoNames = await getCountryFromLoc(
    countryObject.coords
  );

  // Get border details for Country from JSON and highlight country as selected in Select html element
  countryObject.borderJSON = await getCountryBorderFromCountryCode(
    countryObject.countryDataFromGeoNames.countryCode
  );
  $("#country").val(countryObject.countryDataFromGeoNames.countryCode);

  // Use border details for Country to create polyline on map
  createBorder(countryObject.borderJSON);

  // Get All API Data
  countryObject.countryAPIData = await getAllAPIData(
    countryObject.borderJSON.properties.iso_a2
  );

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
  countryObject.countryCode = $("#country").val();

  // Get Border details from JSON
  countryObject.borderJSON = await getCountryBorderFromCountryCode(
    countryObject.countryCode
  );

  // Create polyline for selected Country
  createBorder(countryObject.borderJSON);

  // Get All API Data
  countryObject.countryAPIData = await getAllAPIData(
    countryObject.countryCode
  );

  // Populate HTML from API data
  apiToHTML(countryObject.countryAPIData);

  // Test countryObject
  console.log(countryObject);
});

// Remove modal on clicks
$("#country").click(function () {
  $("#stats-modal, #covid-modal, #weather-modal, #news-modal").modal("hide");
  $("body").removeClass("modal-open");
  $(".modal-backdrop").remove();
});

$("#map").click(function () {
  $("#stats-modal, #covid-modal, #weather-modal, #news-modal").modal("hide");
  $("body").removeClass("modal-open");
  $(".modal-backdrop").remove();
});
