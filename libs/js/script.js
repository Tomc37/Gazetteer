// Create LeafletJS map
const map = L.map("map").setView([0, 0], 3);

// Create LeafletJS FeatureGroup
const countryMarkersFeatureGroup = L.featureGroup();

// Create LeafletJS MarkerCluster
const countryMarkersMarkerCluster = new L.markerClusterGroup();

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
      url: "libs/php/getBasicCountryData.php",
      type: "POST",
      dataType: "JSON",
      data: {
        countryCode: countryCode,
      },
      success: function (result) {
        resolve(result);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(JSON.stringify(errorThrown));
        reject(JSON.stringify(errorThrown));
      },
    });
  });
  return countryBasicData.data[0];
};

// Weather data from https://www.visualcrossing.com/
const getWeatherData = async (cityName) => {
  const countryWeatherData = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getWeatherData.php",
      type: "POST",
      dataType: "JSON",
      data: {
        cityName: cityName,
      },
      success: function (result) {
        resolve(result);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(JSON.stringify(errorThrown));
        reject(JSON.stringify(errorThrown));
      },
    });
  });
  return countryWeatherData.data;
};

// Covid data from https://corona-api.com/
const getCovidData = async (countryCode) => {
  const covidData = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getCovidData.php",
      type: "POST",
      dataType: "json",
      data: {
        countryCode: countryCode,
      },
      success: function (result) {
        resolve(result);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(JSON.stringify(errorThrown));
        reject(JSON.stringify(errorThrown));
      },
    });
  });
  return covidData.data.data;
};

// News data from https://newsapi.org/v2
const getNewsData = async (countryCode) => {
  const newsData = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getNewsData.php",
      type: "POST",
      dataType: "JSON",
      data: {
        countryCode: countryCode,
      },
      success: function (result) {
        resolve(result);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(JSON.stringify(errorThrown));
        reject(JSON.stringify(errorThrown));
      },
    });
  });
  return newsData.data.articles;
};

// City coords for map markers
const getCityCoords = async () => {
  const bounds = await countryMarkersFeatureGroup.getBounds();
  const cityCoords = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getCitiesFromGeonames.php",
      type: "POST",
      dataType: "json",
      data: {
        north: bounds._northEast.lat,
        south: bounds._southWest.lat,
        east: bounds._northEast.lng,
        west: bounds._southWest.lng,
      },
      success: function (result) {
        resolve(result);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(JSON.stringify(errorThrown));
        reject(JSON.stringify(errorThrown));
      },
    });
  });
  return cityCoords.data.geonames;
};

// Landmark coords for map markers:
const getLandmarkCoords = async () => {
  const bounds = await countryMarkersFeatureGroup.getBounds();
  const landmarkCoords = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getLandmarksFromGeonames.php",
      type: "POST",
      dataType: "json",
      data: {
        north: bounds._northEast.lat,
        south: bounds._southWest.lat,
        east: bounds._northEast.lng,
        west: bounds._southWest.lng,
      },
      success: function (result) {
        resolve(result);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(JSON.stringify(errorThrown));
        reject(JSON.stringify(errorThrown));
      },
    });
  });
  return landmarkCoords.data.geonames;
};

// Group API Function Calls for eventual loading into countryObject
const getAllAPIData = async (countryCode) => {
  {
    const countryBasicData = await getCountryBasicData(countryCode);
    const countryWeatherData = await getWeatherData(
      countryBasicData.capital[0]
    );
    const capitalCoords = {
      latitude: countryWeatherData.latitude,
      longitude: countryWeatherData.longitude,
    };
    const countryCovidData = await getCovidData(countryCode);
    let countryNewsData = await getNewsData(countryCode);
    const uniqueTitles = [];
    countryNewsData = countryNewsData.filter((element) => {
      const isDuplicate = uniqueTitles.includes(element.title);
      if (!isDuplicate) {
        uniqueTitles.push(element.title);
        return true;
      }
      return false;
    });
    countryNewsData = countryNewsData.slice(0, 5);
    let cityCoords = await getCityCoords();
    if (cityCoords) {
      cityCoords = cityCoords.filter(
        (city) =>
          city.countrycode == countryCode &&
          city.name !== countryBasicData.capital[0]
      );
    }
    let landmarkCoords = await getLandmarkCoords();
    if (landmarkCoords) {
      landmarkCoords = landmarkCoords.filter(
        (landmark) =>
          landmark.feature == "landmark" && landmark.countryCode == countryCode
      );
    }
    return {
      countryBasicData,
      countryWeatherData,
      countryCovidData,
      countryNewsData,
      capitalCoords,
      cityCoords,
      landmarkCoords,
    };
  }
};

// Functions to add map markers for capital and landmarks
const addMapMarkers = (capitalCoords, cityCoords, landmarkCoords) => {
  countryMarkersMarkerCluster.clearLayers();
  const capitalMarker = L.ExtraMarkers.icon({
    markerColor: "red",
    shape: "circle",
    prefix: "fa",
  });
  const cityMarker = L.ExtraMarkers.icon({
    markerColor: "yellow",
    shape: "circle",
    prefix: "fa",
  });
  const landmarkMarker = L.ExtraMarkers.icon({
    markerColor: "green",
    shape: "circle",
    prefix: "fa",
  });
  countryMarkersMarkerCluster.addLayer(
    L.marker([capitalCoords.latitude, capitalCoords.longitude], {
      icon: capitalMarker,
    }).bindTooltip(
      `Capital City: ${countryObject.countryAPIData.countryWeatherData.address}`,
      {
        permanent: false,
        direction: "right",
      }
    )
  );
  if (cityCoords) {
    cityCoords.forEach((city) => {
      countryMarkersMarkerCluster.addLayer(
        L.marker([city.lat, city.lng], {
          icon: cityMarker,
        }).bindTooltip(`City: ${city.name}`, {
          permanent: false,
          direction: "right",
        })
      );
    });
  }
  if (landmarkCoords) {
    landmarkCoords.forEach((landmark) => {
      countryMarkersMarkerCluster.addLayer(
        L.marker([landmark.lat, landmark.lng], {
          icon: landmarkMarker,
        }).bindTooltip(`Landmark: ${landmark.title}`, {
          permanent: false,
          direction: "right",
        })
      );
    });
  }
  map.addLayer(countryMarkersMarkerCluster);
};

const numberFormat = "0,0";
// JQuery HTML Replacers
const apiToHTML = (countryAPIData) => {
  // Basic Info
  $("#stats-flag").attr("src", countryAPIData.countryBasicData.flags.png);
  $("#country-name").html(countryAPIData.countryBasicData.name.common);
  $("#country-code").html(countryAPIData.countryBasicData.cca2);
  $("#population").html(
    numeral(countryAPIData.countryBasicData.population).format(numberFormat)
  );
  let capital = "";
  capital = countryAPIData.countryBasicData.capital[0];
  for (i = 1; i < countryAPIData.countryBasicData.capital.length; i++) {
    capital += `, ${countryAPIData.countryBasicData.capital[i]}`;
  }
  $("#capital").html(capital);
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
    numeral(countryAPIData.countryWeatherData.currentConditions.datetime)
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
    numeral(countryAPIData.countryCovidData.latest_data.confirmed).format(
      numberFormat
    )
  );
  $("#covid-deaths").html(
    numeral(countryAPIData.countryCovidData.latest_data.deaths).format(
      numberFormat
    )
  );
  $("#covid-recovered").html(
    numeral(countryAPIData.countryCovidData.latest_data.recovered).format(
      numberFormat
    )
  );
  $("#covid-cases-today").html(
    numeral(countryAPIData.countryCovidData.today.confirmed).format(
      numberFormat
    )
  );
  $("#covid-deaths-today").html(
    numeral(countryAPIData.countryCovidData.today.deaths).format(numberFormat)
  );
  // News
  $(".news-article-container").remove();
  countryAPIData.countryNewsData.forEach((article) => {
    const newDiv = `<a class='news-article-container' href='${article.link}' target='_blank'><img src='${article.media}'/><h5>${article.title}</h5></a>`;
    $(".news-articles-container").append(newDiv);
  });
};

// Group common functions for loader and Select->Option Select
const groupedFunctions = async (countryCode) => {
  $("#loading").show();
  // Get border details for Country from JSON
  countryObject.borderJSON = await getCountryBorderFromCountryCode(countryCode);

  // Use border details for Country to create polyline on map
  createBorder(countryObject.borderJSON);

  // Get All API Data
  countryObject.countryAPIData = await getAllAPIData(countryCode);

  // Populate HTML from API data
  apiToHTML(countryObject.countryAPIData);

  // Add additional map markers
  addMapMarkers(
    countryObject.countryAPIData.capitalCoords,
    countryObject.countryAPIData.cityCoords,
    countryObject.countryAPIData.landmarkCoords
  );
  $("#loading").hide();
  return countryObject;
};

// Define single function to run in doc.ready, doc.ready cannot be async and async calls needed.
const loaderFunction = async () => {
  // Get list of countries from JSON and populate Select -> Options from list
  const countryList = await getCountryList();
  countryList.sort((a, b) => (a.name > b.name ? 1 : -1));
  countryList.forEach((country) => {
    $("#country").append(
      $("<option>", { value: country.code }).text(country.name)
    );
  });

  // Get lat and long coords from device location
  countryObject.coords = await getCoordsFromDeviceLocation();

  // Get country data from Geonames from coords, languages, countryCode, countryName
  countryObject.countryDataFromGeoNames = await getCountryFromLoc(
    countryObject.coords
  );

  // Run grouped functions to get border details, create border, get API data, populate HTML and add map markers
  await groupedFunctions(countryObject.countryDataFromGeoNames.countryCode);

  $("#country").val(countryObject.countryDataFromGeoNames.countryCode);
};

// JQuery Document.Ready function for page load
$(function () {
  //Add easybuttons
  L.easyButton(
    "<i class='fa fa-info' style='font-size:18px;color:blue'>",
    function (btn, map) {
      $("#stats-modal").modal("toggle");
      $("#weather-modal").modal("hide");
      $("#covid-modal").modal("hide");
      $("#news-modal").modal("hide");
    }
  ).addTo(map);

  L.easyButton(
    "<i class='fa fa-sun' style='font-size:18px;color:orange'>",
    function (btn, map) {
      $("#weather-modal").modal("toggle");
      $("#stats-modal").modal("hide");
      $("#covid-modal").modal("hide");
      $("#news-modal").modal("hide");
    }
  ).addTo(map);

  L.easyButton(
    "<i class='fa fa-virus' style='font-size:18px;color:red'>",
    function (btn, map) {
      $("#covid-modal").modal("toggle");
      $("#weather-modal").modal("hide");
      $("#stats-modal").modal("hide");
      $("#news-modal").modal("hide");
    }
  ).addTo(map);

  L.easyButton(
    "<i class='fa fa-newspaper' style='font-size:18px;color:black'>",
    function (btn, map) {
      $("#news-modal").modal("toggle");
      $("#weather-modal").modal("hide");
      $("#covid-modal").modal("hide");
      $("#stats-modal").modal("hide");
    }
  ).addTo(map);

  loaderFunction();
});

// Function to run when selecting Country from Select
$("#country").change(async function () {
  // Clear countryObject
  countryObject = {};

  // Run grouped functions to get border details, create border, get API data, populate HTML and add map markers from country code
  await groupedFunctions($("#country").val());
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
