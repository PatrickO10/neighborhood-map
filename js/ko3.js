var my = my || {};
$(function() {
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
                console.log(venueData);


                venueData.venuesArray.forEach(function(loc) {
                    var location = new google.maps.LatLng(
                        loc.lat,
                        loc.lng);

                    var infowindow = new google.maps.InfoWindow();
                    var marker = new google.maps.Marker({
                        position: location,
                        map: map
                    });
                    // <a href="loc.web">loc.web</a>
                    var name = '<span class=name>' + loc.name + '</span>' + "<br />";
                    var address = '<span class=address>' + loc.address[0] + "<br />" + loc.address[1] +
                        "<br />" + loc.address[2] + '</span>' + "<br />";
                    var website = '<a class=website href="' + loc.web + '"> ' + loc.web + '</a>' + "<br />";
                    var rate = "rating: " + '<span class=rating>' + loc.rating + '</span>' + "<br />";
                    var phone = '<span class=phone>' + loc.phone + '</span>' + "<br />";
                    google.maps.event.addListener(marker, 'click', function() {
                        infowindow.setContent(name + address + rate + website + phone);
                        infowindow.open(map, marker);
                    });
                });
            });
        },
        update: function(element, valueAccessor) {
            var venueData = valueAccessor();
            console.log(venueData);
        }
    };

    my.Venue = function() {
        this.name = ko.observable();
        this.lat = ko.observable();
        this.lng = ko.observable();
        this.address = ko.observable([]);
        this.phone = ko.observable();
        this.rating = ko.observable();
        this.tip = ko.observable();
        this.web = ko.observable();
    };

    my.mapViewModel = (function() {
        var venuesArray = ko.observableArray([]);
        return {
            venuesArray: venuesArray,
            phone: function(data) {
                return data ? data : "No phone";
            },
            rating: function(data) {
                return data ? data : "No rating";
            },
            tip: function(data) {
                return data ? data[0].text : "No tips";
            },
            web: function(data) {
                return data ? data : "No URL available";
            },
            getFoursqAPI: function() {
                    var prefixUrl = "https://api.foursquare.com/v2/venues/explore?",
                        uniqueID = 'client_id=DZIPLZYHXXYLCELWMS3N2DIO35PWEKTIZMABHZQ4VWKAU2JA&client_secret=1BFTWIS2O3IZLCDZNV2R2A4ITV0UYAVJV2MDBXIW3LWUOIOM',
                        uptownLL = '&ll=' + 44.9519177 + ',' + -93.2983446,
                        section = '&section=' + 'topPlaces', // TODO: observable for search content.
                        suffixUrl = uniqueID + uptownLL + section + '&v=20130815&radius=500&limit=10',
                        requestUrl = prefixUrl + suffixUrl;

                    $.ajax({
                        url: requestUrl,
                        dataType: 'jsonp',
                        success: function(data) {
                            var requestedData = data.response.groups[0].items;
                            requestedData.forEach(function(venueData) {
                                console.log(venueData.venue.name);
                                my.mapViewModel.venuesArray.push(new my.Venue(venueData).name(venueData.venue.name)
                        /*            .lat(venueData.venue.location.lat)
                                    .lng(venueData.venue.location.lng)
                                    .address(venueData.venue.location.formattedAddress)
                                    .phone(my.mapViewModel.phone(venueData.venue.contact.formattedPhone))
                                    .rating(my.mapViewModel.rating(venueData.venue.rating))
                                    .tip(my.mapViewModel.tip(venueData.tips))
                                    .web(my.mapViewModel.web(venueData.venue.url))*/
                                );
                                //console.log(my.mapViewModel.venuesArray());
                            });

                        }
                    });
                }
                //getFoursqAPI();

        };
    })();
    my.mapViewModel.getFoursqAPI();
    ko.applyBindings(my.mapViewModel);
});
