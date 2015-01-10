//TODO: ViewModel
	/*TODO: call MapView function
	* Call PlacesList Function

//TODO: View
	/*TODO: MapView function
	* Display the map
	* Display Markers
	* Display Street View
	*/
	/*TODO: PlacesList function
	* Display list of places in the neighborhood
	* When clicking on a place transition to upper right
	* Another box opens on the right taking up the screen
	* If applicable it will give other information
	*/
	//TODO: Weather API
	//TODO: Wikipedia
	//TODO: Twitter Feed

//TODO: Model
	//TODO: Foursquare
	//TODO: PanoID
	//TODO:

// In the following example, markers appear when the user clicks on the map.
// The markers are stored in an array.
// The user can then click an option to hide, show or delete the markers.
var map;
var markers = [];

function initialize() {
  //var haightAshbury = new google.maps.LatLng(37.7699298, -122.4469157);
  var upTown = new google.maps.LatLng(44.9519177, -93.2983446);
  var mapOptions = {
    zoom: 12,
    center: upTown,
    mapTypeId: google.maps.MapTypeId.TERRAIN
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  // This event listener will call addMarker() when the map is clicked.
  google.maps.event.addListener(map, 'click', function(event) {
    addMarker(event.latLng);
  });

  // Adds a marker at the center of the map.
  addMarker(upTown);
}

// Add a marker to the map and push to the array.
function addMarker(location) {
  var marker = new google.maps.Marker({
    position: location,
    map: map
  });
  markers.push(marker);
}

// Sets the map on all markers in the array.
function setAllMap(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
  setAllMap(null);
}

// Shows any markers currently in the array.
function showMarkers() {
  setAllMap(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
  clearMarkers();
  markers = [];
}

google.maps.event.addDomListener(window, 'load', initialize);