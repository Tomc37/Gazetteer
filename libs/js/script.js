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

const getCountryCodeFromLoc = async (coords) => {
  const countryCode = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getCountryCode.php",
      type: "POST",
      dataType: "json",
      data: {
        lat: coords.latitude,
        lng: coords.longitude,
      },
      success: function (result) {
        if (result.status.name == "ok") {
          resolve(result.data.countryCode);
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

// AJAX Functions for CountryBorders.geo.json -
// Get country borders from Country
const getCountryBorderFromCountryCode = async (countryCode) => {
  const border = await new Promise((resolve, reject) => {
    $.ajax({
      url: "libs/php/getGeoJSONFromCountryCode.php",
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

// Get Country list from CountryBorders.geo.json


// Define the country border based on geoJSON output from countryBorders.geo.json
const createBorder = (geoJSON) => {
  L.geoJSON(geoJSON).addTo(map);
  console.log(geoJSON.geometry.coordinates[0])
};

// Function run in document.ready (required separately for async calls)
const loaderFunction = async () => {
  const coords = await getCoordsFromDeviceLocation();
  console.log(coords);
  const countryCode = await getCountryCodeFromLoc(coords);
  console.log(countryCode);
  const borderJSON = await getCountryBorderFromCountryCode(countryCode);
  console.log(borderJSON);
  createBorder(borderJSON);

};

// JQuery Document.Ready function for page load
$(function () {
  loaderFunction();
});

// var geojsonFeature = {
//   type: "Feature",
//   properties: {
//     name: "United Kingdom",
//     iso_a2: "GB",
//     iso_a3: "GBR",
//     iso_n3: "826",
//   },
//   geometry: {
//     type: "MultiPolygon",
//     coordinates: [
//       [
//         [
//           [-5.661948614921897, 54.55460317648385],
//           [-6.197884894220977, 53.86756500916334],
//           [-6.953730231137996, 54.073702297575636],
//           [-7.572167934591079, 54.05995636658599],
//           [-7.366030646178785, 54.595840969452695],
//           [-7.572167934591079, 55.1316222194549],
//           [-6.733847011736145, 55.1728600124238],
//           [-5.661948614921897, 54.55460317648385],
//         ],
//       ],
//       [
//         [
//           [-3.005004848635281, 58.63500010846633],
//           [-4.073828497728016, 57.55302480735525],
//           [-3.055001796877661, 57.69001902936095],
//           [-1.959280564776918, 57.68479970969951],
//           [-2.219988165689301, 56.87001740175353],
//           [-3.119003058271118, 55.973793036515474],
//           [-2.085009324543023, 55.90999848085127],
//           [-2.005675679673857, 55.80490285035023],
//           [-1.11499101399221, 54.62498647726539],
//           [-0.4304849918542, 54.46437612570216],
//           [0.184981316742039, 53.32501414653103],
//           [0.469976840831777, 52.92999949809197],
//           [1.681530795914739, 52.739520168664],
//           [1.559987827164377, 52.09999848083601],
//           [1.050561557630914, 51.806760565795685],
//           [1.449865349950301, 51.28942780212196],
//           [0.550333693045502, 50.765738837275876],
//           [-0.78751746255864, 50.77498891865622],
//           [-2.489997524414377, 50.50001862243124],
//           [-2.956273972984036, 50.696879991247016],
//           [-3.617448085942328, 50.22835561787272],
//           [-4.542507900399244, 50.34183706318566],
//           [-5.245023159191135, 49.95999990498108],
//           [-5.776566941745301, 50.15967763935682],
//           [-4.309989793301838, 51.21000112568916],
//           [-3.414850633142123, 51.42600861266925],
//           [-3.422719467108323, 51.42684816740609],
//           [-4.984367234710874, 51.593466091510976],
//           [-5.267295701508885, 51.99140045837458],
//           [-4.222346564134853, 52.301355699261364],
//           [-4.770013393564113, 52.840004991255626],
//           [-4.579999152026915, 53.49500377055517],
//           [-3.093830673788659, 53.404547400669685],
//           [-3.092079637047106, 53.404440822963544],
//           [-2.945008510744344, 53.984999701546684],
//           [-3.614700825433034, 54.600936773292574],
//           [-3.63000545898933, 54.615012925833014],
//           [-4.844169073903004, 54.790971177786844],
//           [-5.082526617849226, 55.06160065369937],
//           [-4.719112107756644, 55.50847260194348],
//           [-5.047980922862109, 55.78398550070752],
//           [-5.586397670911139, 55.31114614523682],
//           [-5.644998745130181, 56.275014960344805],
//           [-6.149980841486354, 56.78500967063354],
//           [-5.786824713555291, 57.81884837506465],
//           [-5.009998745127575, 58.63001333275005],
//           [-4.211494513353557, 58.55084503847917],
//           [-3.005004848635281, 58.63500010846633],
//         ],
//       ],
//     ],
//   },
// };

// L.geoJSON(geojsonFeature).addTo(map);
