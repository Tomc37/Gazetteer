// Create map

const map = L.map("map").setView([0, 0], 3);

// Load in TileLayer

L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  {
    minZoom: 2,
    maxZoom: 10,
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  }
).addTo(map);

// Define Bounds for map

const southWest = L.latLng(-89.98155760646617, -180),
  northEast = L.latLng(89.99346179538875, 180);
var bounds = L.latLngBounds(southWest, northEast);

// Set bounds to prevent panning off the map

map.setMaxBounds(bounds);
map.on("drag", function () {
  map.panInsideBounds(bounds, { animate: false });
});

// Functions

// Get coords from current device location
const getCoordsFromDeviceLocation = async () => {
  const pos = await new Promise((resolve, reject) => {
    window.navigator.geolocation.getCurrentPosition(resolve, reject);
  });
  // console.log(pos.coords);
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
        reject(JSON.stringify(errorThrown))
      }
    })
  });
  return countryCode;
};

// AJAX Functions to parse CountryBorders.geo.json

// Get country borders from countryBorders.geo.json from Country Code
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

// Get Country list as array from countryBorders.geo.json and load it into Select
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
    })
  })
  return countryList;
};

// Define the country border based on geoJSON output from countryBorders.geo.json
function createBorder(geoJSON) {
  L.geoJSON(geoJSON).addTo(map);
  const bounds = new L.latLngBounds([geoJSON.geometry.coordinates]);
  map.fitBounds(bounds);
}

// Function run in document.ready (required separately for async calls)
const loaderFunction = async () => {

  // Get list of countries from JSON and populate Select
  const countryList = await getCountryList();
  console.log(countryList);
    countryList.sort();
  countryList.forEach((country) => {
    $("#country")
      .append($('<option>', {value : country})
      .text(country));
  })

  // Get lat and long coords from device location
  const coords = await getCoordsFromDeviceLocation();
  console.log(coords);

  // Get country data from Geonames from coords, languages, countryCode, countryName
  const countryFromGeoNames = await getCountryFromLoc(coords);
  console.log(countryFromGeoNames);

  // Get border details for Country from JSON and highlight country as selected in Select html element
  const borderJSON = await getCountryBorderFromCountryCode(countryFromGeoNames.countryCode);
  console.log(borderJSON);
  $("#country").val(countryFromGeoNames.countryName);

  // Use border details for Country to create polyline on map
  createBorder(borderJSON);

};

// JQuery Document.Ready function for page load
$(function () {
  loaderFunction();
});
