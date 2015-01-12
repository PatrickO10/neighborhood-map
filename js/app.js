// Ah... the view
var view = {

};
// The data
var model = {

};

// The hub that connects model and view
var ViewModel = function() {
    var self = this;
    self.init(); // Initializes Google Maps
    self.searchValue = ko.observable();
    self.searchSubmit = ko.observable();
    self.searchValue.subscribe(function(val) {
        console.log("Searched: " + val);
        //self.searchSubmit() = self.searchValue();
        //self.searchValue('');
    });
    self.foodList = ko.observableArray([]);
    foodCategory.forEach(function(foodName) {
        self.foodList.push(new Food(foodName));
    });
    // This event listener will call addMarker() when the map is clicked.
    google.maps.event.addListener(map, 'click', function(event) {
        googModel.markerOptions.position = event.latLng; // Data
        googModel.addMarker(googModel.markerOptions); // Data
        googView.setAllMap(map); // Renders on UI
    });

};
ViewModel.prototype = {
    init: function() {
        googModel.init();
        googView.init(googModel);
        googView.autoRotate();
    },
    doSomething: function() {
        console.log("Do SOmething: ");
    }
};

// Model for food Category Test
var foodCategory = [{
    name: "Pizza Place"
}, {
    name: "Subs Place"
}, {
    name: "Chinese Food Place"
}, {
    name: "Fancy Dining Place"
}];

// View function for food Category
var Food = function(data) {
    this.name = ko.observable(data.name);
};


var map;
var markers = [];
var googModel = {
    init: function() {
        var self = this;
        // Adds a marker to marker array
        self.addMarker(self.markerOptions);
    },
    mapOptions: {
        zoom: 17,
        center: new google.maps.LatLng(44.9519177, -93.2983446),
        scrollwheel: false,
        draggable: false,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP //google.maps.MapTypeId.TERRAIN
    },
    markerOptions: {
        map: map,
        position: new google.maps.LatLng(44.9519177, -93.2983446),
        icon: 'images/mapmarker.png'
    },
    addMarker: function(data) {
        this.markerOptions = data;
        var marker = new google.maps.Marker(this.markerOptions);
        markers.push(marker);
    }
};
var googView = {
    init: function(data) {
        var self = this;
        self.upTown = data.mapOptions.center;
        self.mapOptions = data.mapOptions;
        self.markerOptions = data.markerOptions;
        map = new google.maps.Map(document.getElementById('map-canvas'),
            self.mapOptions);
        // Sets every marker in markers on the map
        self.setAllMap(map);
    },
    setAllMap: function(map) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
    },
    autoRotate: function() {
        // Determine if we're showing aerial imagery
        // Used for Hybrid
        if (map.getTilt() !== 0) {
            map.setHeading(180);
            setTimeout('map.setHeading(270)', 3000);
            setTimeout('map.setHeading(0)', 6000);
            setTimeout('map.setHeading(90)', 9000);
        }
    }

};
ko.applyBindings(new ViewModel());
$("#map-canvas").click(function() {
    alert("Handler for .click() called.");
});
