var map,
    uptown = new google.maps.LatLng(44.9519177, -93.2983446),
    markers = [],
    infowindow;

// data
var model = {
    mapOptions: {
        zoom: 15,
        center: uptown
    },
    init: function() {
        this.foursq.foursqData();
    },
    foursq: {
        foursqData: function() {
            var prefixUrl = "https://api.foursquare.com/v2/venues/explore?",
                uniqueID = 'client_id=DZIPLZYHXXYLCELWMS3N2DIO35PWEKTIZMABHZQ4VWKAU2JA&client_secret=1BFTWIS2O3IZLCDZNV2R2A4ITV0UYAVJV2MDBXIW3LWUOIOM',
                uptownLL = '&ll=' + 44.9519177 + ',' + -93.2983446,
                section = '&section=' + 'topPicks', // TODO: observable for search content.
                suffixUrl = uniqueID + uptownLL + section + '&v=20130815&radius=500&limit=50',
                requestUrl = prefixUrl + suffixUrl;
            console.log(requestUrl);

            $.ajax({
                url: requestUrl,
                dataType: 'jsonp',
                success: function(data) {
                    var requestedData = data.response.groups[0].items;
                    console.log(requestedData);
                    requestedData.forEach(function(venueData) {
                        model.addMarkers(new model.Venue(venueData));
                    });
                    // TODO: create map markers
                    // TODO: create infowindows
                }

            });
        }
    },
    addMarkers: function(venueData) {
        venueLoc = new google.maps.LatLng(venueData.lat, venueData.lng);
        infowindow = new google.maps.InfoWindow();
        var marker = new google.maps.Marker({
            position: venueLoc,
            map: map,
            title: venueData.name
        });
        markers.push(marker);
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.setContent(venueData.name + "<br/>" + venueData.address +
                "<br/>" + venueData.web() + "<br/>" + venueData.rating() + "<br/>" +
                venueData.phone() + "<br/>" + venueData.tip());
            infowindow.open(map, marker);
        });
    },
    Venue: function(data) {
        this.name = data.venue.name;
        this.lat = data.venue.location.lat;
        this.lng = data.venue.location.lng;
        this.address = data.venue.location.formattedAddress;
        this.phone = function() {
            return data.venue.contact.formattedPhone ? data.venue.contact.formattedPhone : "No phone";
        };
        this.rating = function() {
            return data.venue.rating ? data.venue.rating : "No rating";
        };
        this.tip = function() {
            return data.tips ? data.tips[0].text : "No tips";
        };
        this.web = function() {
            return data.venue.url ? data.venue.url : "No URL available";
        };
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
        //model.foursq.foursqData();
        model.init();
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
