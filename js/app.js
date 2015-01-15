var map,
    markers = [],
    infowindow,
    service,
    requestedPlaces = [],
    uptown = new google.maps.LatLng(44.9519177, -93.2983446);

var Model = function() {
    var self = this;
    this.googModel.init();
};

Model.prototype = {
    googModel: {
        init: function() {
            var self = this;
            // Adds a marker to marker array
            self.addMarker(self.markerOptions);
            infowindow = new google.maps.InfoWindow();
            service = new google.maps.places.PlacesService(map);
            console.log(self.request);
            service.nearbySearch(self.request, self.callback);
        },
        mapOptions: {
            zoom: 15,
            center: uptown,
            scrollwheel: true,
            draggable: true,
            disableDefaultUI: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP //google.maps.MapTypeId.TERRAIN
        },
        markerOptions: {
            map: map,
            position: uptown
        },
        request: {
            location: uptown,
            radius: '1000',
            types: ['art_gallery', 'atm', 'bar', 'bowling_alley', 'bakery', 'bank', 'beauty_salon',
                'bicycle_store', 'book_store', 'cafe', 'clothing_store', 'convenience_store', 'department_store',
                'food', 'night_club', 'park', 'restaurant', 'shopping_mall', 'spa'
            ]
        },
        addMarker: function(data) {
            this.markerOptions = data;
            var marker = new google.maps.Marker(this.markerOptions);
            markers.push(marker);
        },
        callback: function(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                console.log(results.length);
                for (var i = 0; i < results.length; i++) {
                    console.log(results[i]);
                    googModel.createMarker(results[i]);
                }
            }
        },
        createMarker: function(place) {
            var placeLoc = place.geometry.location;
            console.log(placeLoc);
            var marker = new google.maps.Marker({
                map: map,
                position: placeLoc,
                /*icon: {
                    // Star
                    path: 'M 0,-24 6,-7 24,-7 10,4 15,21 0,11 -15,21 -10,4 -24,-7 -6,-7 z',
                    fillColor: '#ffff00',
                    fillOpacity: 1,
                    scale: 1 / 4,
                    strokeColor: '#bd8d2c',
                    strokeWeight: 1
                }*/
            });
            var request = {
                reference: place.reference
            };
            service.getDetails(request, function(details, status) {
                google.maps.event.addListener(marker, 'click', function() {
                    infowindow.setContent(details.name + "<br />" + details.formatted_address +
                        "<br />" + details.website + "<br />" + details.rating + "<br />" +
                        details.formatted_phone_number);
                    infowindow.open(map, this);
                });
            });
        }
    }
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
        /*
        googView.init(googModel);
        googModel.init();
        googView.autoRotate();
        */
        Model();
        View();
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



var View = function() {
    this.googView.init();
};

View.prototype = {
    googView: {
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

    }
};

ko.applyBindings(new ViewModel());
/*
$("#map-canvas").click(function() {
    alert("Handler for .click() called.");
});
*/
