// Ah... the view
var view = {

};
// The data
var model = {

};

// The hub that connects model and view
var ViewModel = {
    init: function() {
        googView.init(googModel);
    }
};

var map;
var markers = [];
var googModel = {
    mapOptions: {
        zoom: 12,
        center: new google.maps.LatLng(44.9519177, -93.2983446),
        mapTypeId: google.maps.MapTypeId.TERRAIN
    }
};
var googView = {
    init: function(data) {
        var self = this;
        self.upTown = data.mapOptions.center;
        self.mapOptions = data.mapOptions;
        map = new google.maps.Map(document.getElementById('map-canvas'),
            self.mapOptions);

        // This event listener will call addMarker() when the map is clicked.
        google.maps.event.addListener(map, 'click', function(event) {
            self.addMarker(event.latLng);
        });

        // Adds a marker at the center of the map.
        self.addMarker(self.upTown);
    },
    addMarker: function(location) {
        var marker = new google.maps.Marker({
            position: location,
            map: map
        });
        markers.push(marker);
    },
    setAllMap: function(map) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
    }

};

ko.applyBindings(new ViewModel.init());
