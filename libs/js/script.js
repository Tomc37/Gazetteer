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
const countryObject = {};

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

// Function to gather all API data needed for Overlay

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

  // Test countryObject
  console.log(countryObject);
};

// JQuery Document.Ready function for page load
$(function () {
  loaderFunction();
});

// Function to run when selecting Country from Select
$("#country").change(async function () {

  // Pull Country Name from Select list currently selected item
  countryObject.countryName = $("#country").val();

  // Get Border details from JSON
  countryObject.borderJSON = await getCountryBorderFromCountryName(countryObject.countryName);

  // Set current coords as coords from new border details from JSON
  countryObject.coords.latitude = countryObject.borderJSON.geometry.coordinates[0][0][0];
  countryObject.coords.longitude = countryObject.borderJSON.geometry.coordinates[0][0][1];

  // Get country data from Geonames from coords, languages, countryCode, countryName
  countryObject.countryDataFromGeoNames = await getCountryFromLoc(countryObject.coords);

  // Create polyline for selected Country
  createBorder(countryObject.borderJSON);

  // Test countryObject
  console.log(countryObject);
});
