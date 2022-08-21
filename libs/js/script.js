// Create LeafletJS FeatureGroup
const countryMarkersFeatureGroup = L.featureGroup();

// Create LeafletJS MarkerCluster for cities
const cityMarkersMarkerCluster = new L.markerClusterGroup({
  maxClusterRadius: "20",
});

const webcamMarkersMarkerCluster = new L.markerClusterGroup({
  maxClusterRadius: "20",
});

// Load in LeafletJS TileLayers
const Stamen_Terrain = L.tileLayer(
  "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}",
  {
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abcd",
    minZoom: 2,
    maxZoom: 10,
    ext: "png",
  }
);

const Stadia_Outdoors = L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png",
  {
    minZoom: 2,
    maxZoom: 10,
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  }
);

const baseMaps = {
  "Stamen Terrain": Stamen_Terrain,
  "Stadia Outdoors": Stadia_Outdoors,
};

// Create LeafletJS map
let map = L.map("map", {
  layers: [Stamen_Terrain],
}).setView([0, 0], 3);

// Create layercontrol for Tilelayers and cities
let layersControl = L.control.layers(baseMaps).addTo(map);

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
  function polystyle(feature) {
    return {
      fillColor: "red",
      color: "purple",
    };
  }
  L.geoJSON(geoJSON, { style: polystyle }).addTo(countryMarkersFeatureGroup);
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

// National holidays data from https://date.nager.at/Api
const getHolidaysData = async (countryCode) => {
  const holidaysData = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getHolidays.php",
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
  return holidaysData.data;
};

// City coords for map markers
const getCityCoords = async (countryCode) => {
  const cityCoords = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getCitiesFromGeonames.php",
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
  return cityCoords.data.geonames;
};

// Get data for webcams
const getWebcams = async (countryCode) => {
  const webcamCoords = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getWebcams.php",
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
    })
  })
  return webcamCoords.data.result.webcams;
}

// Group API Function Calls for eventual loading into countryObject
const getAllAPIData = async (countryCode) => {
  {
    const countryBasicData = await getCountryBasicData(countryCode);
    const countryWeatherData = await getWeatherData(
      countryBasicData.capital[0]
    );
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
    let holidaysData = await getHolidaysData(countryCode);
    const uniqueHolidays = [];
    holidaysData = holidaysData.filter((element) => {
      const isDuplicate = uniqueHolidays.includes(element.localName);
      if (!isDuplicate) {
        uniqueHolidays.push(element.localName);
        return true;
      }
      return false;
    });
    countryNewsData = countryNewsData.slice(0, 5);
    let cityCoords = await getCityCoords(countryCode);
    let capitalCoords = cityCoords.filter(
      (city) => city.name == countryBasicData.capital[0]
    );
    capitalCoords = capitalCoords[0];
    if (cityCoords) {
      cityCoords = cityCoords.filter(
        (city) =>
          city.fclName.includes("city") && city.name !== capitalCoords.name
      );
      cityCoords.sort((a, b) => (a.population > b.population ? -1 : 1));
      cityCoords = cityCoords.slice(0, 8);
    }
    const webcamCoords = await getWebcams(countryCode);
    return {
      countryBasicData,
      countryWeatherData,
      countryCovidData,
      countryNewsData,
      holidaysData,
      capitalCoords,
      cityCoords,
      webcamCoords,
    };
  }
};

// Functions to add map markers for capital and cities
const addMapMarkers = (capitalCoords, cityCoords, webcamCoords) => {
  cityMarkersMarkerCluster.clearLayers();
  webcamMarkersMarkerCluster.clearLayers();
  const capitalMarker = L.ExtraMarkers.icon({
    markerColor: "red",
    icon: "fa-city",
    shape: "circle",
    prefix: "fa",
  });
  const cityMarker = L.ExtraMarkers.icon({
    markerColor: "blue",
    icon: "fa-city",
    shape: "circle",
    prefix: "fa",
  });
  const webcamMarker = L.ExtraMarkers.icon({
    markerColor: "green",
    icon: "fa-video",
    shape: "circle",
    prefix: "fa",
  });
  cityMarkersMarkerCluster.addLayer(
    L.marker([capitalCoords.lat, capitalCoords.lng], {
      icon: capitalMarker,
    }).bindPopup(
      `<h5>${
        capitalCoords.name
      }</h5><p>Capital City</p><p>Population - ${numeral(
        capitalCoords.population
      ).format(numberFormat)}`
    )
  );
  if (cityCoords) {
    cityCoords.forEach((city) => {
      cityMarkersMarkerCluster.addLayer(
        L.marker([city.lat, city.lng], {
          icon: cityMarker,
        }).bindPopup(
          `<h5>${city.name}</h5><p>Population - ${numeral(
            city.population
          ).format(numberFormat)}`
        )
      );
    });
  }
  cityMarkersMarkerCluster.addTo(map);
  if (webcamCoords) {
    webcamCoords.forEach((webcam) => {
      webcamMarkersMarkerCluster.addLayer(
        L.marker([webcam.location.latitude, webcam.location.longitude], {
          icon: webcamMarker,
        }).bindPopup(
          `<a class='webcam-anchor' href='${webcam.url.current.desktop}' target='_blank'><h5 class='webcam-title'>${webcam.title}</h5><img class='webcam-image' src=${webcam.image.current.thumbnail}></a>`
        )
      )
    })
  }
  const overlayMaps = {
    Cities: cityMarkersMarkerCluster,
    Camera: webcamMarkersMarkerCluster,
  };
  map.removeControl(layersControl);
  layersControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
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
  $("#weather-header").html(
    `Weather in ${countryAPIData.countryWeatherData.address}`
  );
  $("#weather-current-icon").attr(
    "src",
    `libs/util/Images/Weather/${countryAPIData.countryWeatherData.currentConditions.icon}.png`
  );
  $("#weather-current-high").html(
    `${Math.ceil(countryAPIData.countryWeatherData.days[0].tempmax)}&#176`
  );
  $("#weather-current-low").html(
    `${Math.ceil(countryAPIData.countryWeatherData.days[0].tempmin)}&#176`
  );
  $("#weather-current-desc").html(
    countryAPIData.countryWeatherData.days[0].conditions
  );
  $("#weather-forecast-one-icon").attr(
    "src",
    `libs/util/Images/Weather/${countryAPIData.countryWeatherData.days[1].icon}.png`
  );
  $("#weather-forecast-two-icon").attr(
    "src",
    `libs/util/Images/Weather/${countryAPIData.countryWeatherData.days[2].icon}.png`
  );
  $("#weather-forecast-three-icon").attr(
    "src",
    `libs/util/Images/Weather/${countryAPIData.countryWeatherData.days[3].icon}.png`
  );
  $("#weather-forecast-one-date").html(
    Date.parse(countryAPIData.countryWeatherData.days[1].datetime).toString(
      "ddd dS"
    )
  );
  $("#weather-forecast-two-date").html(
    Date.parse(countryAPIData.countryWeatherData.days[2].datetime).toString(
      "ddd dS"
    )
  );
  $("#weather-forecast-three-date").html(
    Date.parse(countryAPIData.countryWeatherData.days[3].datetime).toString(
      "ddd dS"
    )
  );
  $("#weather-forecast-one-high").html(
    `${Math.ceil(countryAPIData.countryWeatherData.days[1].tempmax)}&#176`
  );
  $("#weather-forecast-two-high").html(
    `${Math.ceil(countryAPIData.countryWeatherData.days[2].tempmax)}&#176`
  );
  $("#weather-forecast-three-high").html(
    `${Math.ceil(countryAPIData.countryWeatherData.days[3].tempmax)}&#176`
  );
  $("#weather-forecast-one-low").html(
    `${Math.ceil(countryAPIData.countryWeatherData.days[1].tempmin)}&#176`
  );
  $("#weather-forecast-two-low").html(
    `${Math.ceil(countryAPIData.countryWeatherData.days[2].tempmin)}&#176`
  );
  $("#weather-forecast-three-low").html(
    `${Math.ceil(countryAPIData.countryWeatherData.days[3].tempmin)}&#176`
  );
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
  // Holidays
  $("#holidays-table").empty();
  countryAPIData.holidaysData.forEach((holiday) => {
    const newDiv = `<tr><td class='table-head'>${
      holiday.name
    }</td><td class='table-data'>${Date.parse(holiday.date).toString(
      "MMMM dS"
    )}</td></tr>`;
    $("#holidays-table").append(newDiv);
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
    countryObject.countryAPIData.webcamCoords
  );
  $("#loading").hide();
  console.log(countryObject);
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
    "<i class='fa fa-table' style='font-size:1.25rem;color:blue'>",
    function (btn, map) {
      $("#stats-modal").modal("toggle");
      $("#weather-modal").modal("hide");
      $("#covid-modal").modal("hide");
      $("#news-modal").modal("hide");
      $("#holidays-modal").modal("hide");
    }
  ).addTo(map);

  L.easyButton(
    "<i class='fa fa-sun' style='font-size:1.25rem;color:orange'>",
    function (btn, map) {
      $("#weather-modal").modal("toggle");
      $("#stats-modal").modal("hide");
      $("#covid-modal").modal("hide");
      $("#news-modal").modal("hide");
      $("#holidays-modal").modal("hide");
    }
  ).addTo(map);

  L.easyButton(
    "<i class='fa fa-virus' style='font-size:1.25rem;color:red'>",
    function (btn, map) {
      $("#covid-modal").modal("toggle");
      $("#weather-modal").modal("hide");
      $("#stats-modal").modal("hide");
      $("#news-modal").modal("hide");
      $("#holidays-modal").modal("hide");
    }
  ).addTo(map);

  L.easyButton(
    "<i class='fa fa-newspaper' style='font-size:1.25rem;color:black'>",
    function (btn, map) {
      $("#news-modal").modal("toggle");
      $("#weather-modal").modal("hide");
      $("#covid-modal").modal("hide");
      $("#stats-modal").modal("hide");
      $("#holidays-modal").modal("hide");
    }
  ).addTo(map);

  L.easyButton(
    "<i class='fa fa-calendar' style='font-size:1.25rem;color:green'>",
    function (btn, map) {
      $("#holidays-modal").modal("toggle");
      $("#news-modal").modal("hide");
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
  $("#stats-modal, #covid-modal, #weather-modal, #news-modal, #holiday-modal").modal("hide");
  $("body").removeClass("modal-open");
  $(".modal-backdrop").remove();
});

$("#map").click(function () {
  $("#stats-modal, #covid-modal, #weather-modal, #news-modal, #holiday-modal").modal("hide");
  $("body").removeClass("modal-open");
  $(".modal-backdrop").remove();
});
