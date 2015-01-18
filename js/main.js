var map,
    //uptown = new google.maps.LatLng(44.9519177, -93.2983446),
    markers,
    infowindow;

ko.bindingHandlers.map = {
    init: function(element, valueAccessor) {
        $(document).ajaxComplete(function() {
            var venueData = valueAccessor(),
                mapOptions = {
                    zoom: 15,
                    center: new google.maps.LatLng(venueData.uptownLat, venueData.uptownLng)
                },
                map = new google.maps.Map(element, mapOptions);


            venueData.venuesArray.forEach(function(loc) {
                var location = new google.maps.LatLng(
                    loc.lat,
                    loc.lng);

                var infowindow = new google.maps.InfoWindow();
                var marker = new google.maps.Marker({
                    position: location,
                    map: map
                });
                google.maps.event.addListener(marker, 'click', function() {
                    infowindow.setContent(loc.name + "<br />" + loc.address +
                        "<br />" + "rating: " + loc.rating + "<br />" + loc.web + "<br />" +
                        loc.phone);
                    infowindow.open(map, marker);
                });
            });
        });
    }
};

var ViewModel = function() {
    var self = this;
    self.venuesArray = ko.observableArray([]);

    function foursqAPI() {
        var prefixUrl = "https://api.foursquare.com/v2/venues/explore?",
            uniqueID = 'client_id=DZIPLZYHXXYLCELWMS3N2DIO35PWEKTIZMABHZQ4VWKAU2JA&client_secret=1BFTWIS2O3IZLCDZNV2R2A4ITV0UYAVJV2MDBXIW3LWUOIOM',
            uptownLL = '&ll=' + 44.9519177 + ',' + -93.2983446,
            section = '&section=' + 'topPlaces', // TODO: observable for search content.
            suffixUrl = uniqueID + uptownLL + section + '&v=20130815&radius=500&limit=50',
            requestUrl = prefixUrl + suffixUrl;

        $.ajax({
            url: requestUrl,
            dataType: 'jsonp',
            success: function(data) {
                var requestedData = data.response.groups[0].items;
                requestedData.forEach(function(venueData) {

                    self.venuesArray.push(new venue(venueData));
                });

            }
        });
    }
    foursqAPI();
};

var venue = function(data) {
    this.name = data.venue.name;
    this.lat = data.venue.location.lat;
    this.lng = data.venue.location.lng;
    this.address = data.venue.location.formattedAddress;

    function phone() {
        return data.venue.contact.formattedPhone ? data.venue.contact.formattedPhone : "No phone";
    }

    function rating() {
        return data.venue.rating ? data.venue.rating : "No rating";
    }

    function tip() {
        return data.tips ? data.tips[0].text : "No tips";
    }

    function web() {
        return data.venue.url ? data.venue.url : "No URL available";
    }
    this.phone = phone();
    this.rating = rating();
    this.tip = tip();
    this.web = web();
};


ko.applyBindings(new ViewModel());
