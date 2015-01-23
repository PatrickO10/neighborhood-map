var my = my || {}; // my namespace

$(function() {
    "use strict";
    /*    ko.bindingHandlers.map = {
            init: function(element, valueAccessor) {
                $(document).ajaxComplete(function() {
                    var venueData = valueAccessor(),
                        mapObj = ko.utils.unwrapObservable(valueAccessor()),
                    // var venueData = valueAccessor(),
                        mapOptions = {
                            zoom: 15,
                            // center: new google.maps.LatLng(venueData.uptownLat, venueData.uptownLng)
                            center: {
                                lat: 44.9519177,
                                lng: -93.2983446
                            }
                        },
                        map = new google.maps.Map(element, mapOptions);

                    console.log(venueData);
                    venueData.forEach(function(loc) {
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
            }
        };*/
    /*    ko.bindingHandlers.map = {
            init: function(element, valueAccessor, allBindings) {
                var position = new google.maps.LatLng(allBindings().latitude(), allBindings().longitude());
                console.log(allBindings());
                console.log(valueAccessor());
                var marker = new google.maps.Marker({
                    map: allBindings().map,
                    position: position,
                    title: name
                });

                my.MapViewModel._mapMarker = marker;
            },
            update: function(element, valueAccessor, allBindings) {
                var latlng = new google.maps.LatLng(allBindings().latitude(), allBindings().longitude());
                my.MapViewModel._mapMarker.setPosition(latlng);
            }
        };
    */
    /*    my.InitMap = function() {
            var mapOptions = {
                zoom: 10,
                center: {
                    lat: 44.9519177,
                    lng: -93.2983446
                },
                mapTypeId: 'terrain'
            };
            map = new google.maps.Map($('#map-canvas')[0], mapOptions);
        };*/
    // Creates venue models
    my.Venue = function(data) {
        var self = this;
        self.venueRating = function(dataRate) {
            return dataRate ? ((dataRate * 10) % 10 === 0 ? dataRate.toFixed(1) : dataRate) : "N/A";
        };
        self.venuePhone = function(dataPhone) {
            return dataPhone ? dataPhone : "Phone N/A";
        };
        self.venueTip = function(dataTip) {
            return dataTip ? dataTip[0].text : "Tips N/A";
        };
        self.venueWeb = function(dataWeb) {
            return dataWeb ? dataWeb : "Website N/A";
        };
        self.rating = ko.observable(self.venueRating(data.venue.rating));
        self.name = ko.observable(data.venue.name);
        self.nameRate = ko.computed(function() {
            return self.name() ? self.name() + " " + self.rating() : "";
        }, self);

        self.type = ko.observable(data.venue.categories[0].shortName);
        self.lat = data.venue.location.lat;
        self.lng = data.venue.location.lng;
        self.address = ko.observable(data.venue.location.formattedAddress);
        self.phone = ko.observable(self.venuePhone(data.venue.contact.formattedPhone));
        self.tip = ko.observable(self.venueTip(data.tips));
        self.web = ko.observable(self.venueWeb(data.venue.url));
    };

    // ViewModel
    my.MapViewModel = (function() {
        var self = this,
            venueList = ko.observableArray([]),
            markersList = ko.observableArray([]),
            map,
            markerArray = [],
            infowindow,
            searchWord = ko.observable('Lake Calhoun'),
            baseFourSquareUrl = 'https://api.foursquare.com/v2/venues/',
            uniqueFourSquareID = 'client_id=DZIPLZYHXXYLCELWMS3N2DIO35PWEKTIZMABHZQ4VWKAU2JA' +
            '&client_secret=1BFTWIS2O3IZLCDZNV2R2A4ITV0UYAVJV2MDBXIW3LWUOIOM',
            uptownLL = '&ll=' + 44.9519177 + ',' + -93.2983446 + '&v=20130815&limit=20',
            googMap = function() {
                var mapOptions = {
                    zoom: 15,
                    center: new google.maps.LatLng(44.9519177, -93.2983446)
                };
                map = new google.maps.Map($('#map-canvas')[0], mapOptions);
                venueList().forEach(function(loc) {
                    console.log(loc);
                    var location = new google.maps.LatLng(loc.lat, loc.lng),
                        infowindow = new google.maps.InfoWindow(),
                        marker = new google.maps.Marker({
                            position: location,
                            map: map,
                        }),
                        name = '<span class=name>' + loc.name + '</span>' + "<br />",
                        address = '<span class=address>' + loc.address[0] + "<br />" + loc.address[1] +
                        "<br />" + loc.address[2] + '</span>' + "<br />",
                        website = '<a class=website href="' + loc.web + '"> ' + loc.web + '</a>' + "<br />",
                        rate = "rating: " + '<span class=rating>' + loc.rating + '</span>' + "<br />",
                        phone = '<span class=phone>' + loc.phone + '</span>' + "<br />";
                    google.maps.event.addListener(marker, 'click', function() {
                        infowindow.setContent(name + address + rate + website + phone);
                        infowindow.open(map, marker);
                    });
                });
            },
            addMarker = function(dataLat, dataLng) {
                var pos = new google.maps.LatLng(dataLat.lat, dataLng.lng);
                console.log(pos);
                var marker = new google.maps.Marker({
                    position: pos,
                    map: map
                        /*,
                                            animation: google.maps.Animation.DROP*/
                });
                // my.Venue.marker = marker;

            },
            initFourSquareAjax = function() {
                var prefixUrl = baseFourSquareUrl + 'explore?',
                    section = '&section=topPlaces&day=any&time=any',
                    suffixUrl = uniqueFourSquareID + uptownLL + section,
                    requestUrl = prefixUrl + suffixUrl;

                $.ajax({
                    url: requestUrl,
                    dataType: 'jsonp',
                    success: function(data) {
                        var requestedData = data.response.groups[0].items;
                        // Sorts each venue by comparing ratings
                        requestedData.sort(function(a, b) {
                            if (a.venue.rating < b.venue.rating) {
                                return 1;
                            } else if (a.venue.rating > b.venue.rating) {
                                return -1;
                            } else {
                                return 0;
                            }
                        });
                        requestedData.forEach(function(venueItem) {
                            venueList.push(new my.Venue(venueItem));
                        });
                    }
                });
            },
            searchFourSquare = function() {};
        return {
            venueList: venueList,
            googMap: googMap,
            initFourSquareAjax: initFourSquareAjax,
            searchWord: searchWord
        };
    })();

    my.MapViewModel.initFourSquareAjax();
    $(document).ajaxComplete(function() {
        my.MapViewModel.googMap();
    });
    // my.MapViewModel.googMap();

    ko.applyBindings(my.MapViewModel);

});
