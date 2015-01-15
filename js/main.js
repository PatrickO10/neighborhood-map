var map,
    uptown = new google.maps.LatLng(44.9519177, -93.2983446),
    markers = [];

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
                    requestedData.forEach(function(val) {
                        console.log(val.venue.name + '\n' + val.venue.location.formattedAddress + '\n' /*+
                            val.tips[0].text*/);
                        var venueLat = val.venue.location.lat;
                        var venueLng = val.venue.location.lng;
                        var v = venueLat + venueLng;
                        model.addMarkers(venueLat, venueLng);
                    });
                    // TODO: create map markers
                    // TODO: create infowindows
                }

            });
        }
    },
    addMarkers: function(venueLat, venueLng) {
        venueLoc = new google.maps.LatLng(venueLat, venueLng);
        var marker = new google.maps.Marker({
            position: venueLoc,
            map: map
        });
        markers.push(marker);
    },


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
