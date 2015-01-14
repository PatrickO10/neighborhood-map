var map,
    uptown = new google.maps.LatLng(44.9519177, -93.2983446);

// data
var model = {
    mapOptions: {
        zoom: 15,
        center: uptown
    }
};

// hub for model and view
var ViewModel = function() {
    var self = this;
    self.init();

};

ViewModel.prototype = {
    // Methods for prototype
    init: function() {
        view.initMap(model.mapOptions);
    }
};

// UI

var view = {
    initMap: function(mapOptions) {
        map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
    }
};

ko.applyBindings(new ViewModel());
