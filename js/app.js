var my = my || {}; // my namespace

$(function() {
    "use strict";
    ko.bindingHandlers.fadeVisible = {
        init: function(element, valueAccessor) {
            // Starts invisible
            var shouldShow = valueAccessor();
            $(element).toggle(shouldShow);
        },
        update: function(element, valueAccessor, allBindings) {
            // On update, fade in/out
            console.log(allBindings());
            console.log(valueAccessor());
            console.log(element);
            var shouldShow = valueAccessor(),
                duration = allBindings().fadeDuration || 400; // 400ms is default duration unless otherwise specified
            shouldShow ? $(element).fadeIn(duration) : $(element).fadeOut(duration);
        }
    };

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
            return self.name() ? self.name() + " " + "<b class='category-rate'>" + self.rating() + "</span>" : "";
        }, self);
        self.type = ko.observable(data.venue.categories[0].shortName);
        self.lat = data.venue.location.lat;
        self.lng = data.venue.location.lng;
        self.address = ko.observable(data.venue.location.formattedAddress);
        self.phone = ko.observable(self.venuePhone(data.venue.contact.formattedPhone));
        self.tip = ko.observable(self.venueTip(data.tips));
        self.web = ko.observable(self.venueWeb(data.venue.url));
        self.status = ko.observable(my.MapViewModel.canShowPictures);
    };

    // ViewModel
    my.MapViewModel = (function() {
        var venueList = ko.observableArray([]),
            markersList = ko.observableArray([]),
            currentVenue = ko.observable(),
            setVenue = function(clickedVenue) {
                canShowPictures(true);
                currentVenue(clickedVenue);
            },
            map,
            markerArray = [],
            infowindow,
            searchWord = ko.observable(),
            canShowPictures = ko.observable(false),
            closePictures = function() {
                canShowPictures(false);
            },
            baseFourSquareUrl = 'https://api.foursquare.com/v2/venues/',
            uniqueFourSquareID = 'client_id=DZIPLZYHXXYLCELWMS3N2DIO35PWEKTIZMABHZQ4VWKAU2JA' +
            '&client_secret=1BFTWIS2O3IZLCDZNV2R2A4ITV0UYAVJV2MDBXIW3LWUOIOM',
            uptownLL = '&ll=' + 44.9519177 + ',' + -93.2983446 + '&v=20130815&limit=20',
            jumpingMarker = null,
            googMap = function() {
                var mapOptions = {
                    zoom: 15,
                    center: new google.maps.LatLng(44.9519177, -93.2983446)
                };
                map = new google.maps.Map($('#map-canvas')[0], mapOptions);
                infowindow = new google.maps.InfoWindow();
                var marker;
                venueList().forEach(function(loc) {
                    var location = new google.maps.LatLng(loc.lat, loc.lng),
                        marker = new google.maps.Marker({
                            position: location,
                            map: map,
                        }),
                        name = '<span class=name>' + loc.name() + '</span>' + "<br />",
                        rate = '<span class=rating>' + loc.rating() + '</span>' + "<br />",
                        address = '<span class=address>' + loc.address()[0] + "<br />" + loc.address()[1] + '</span>' + "<br />",
                        website = '<a class=website href="' + loc.web() + '" target="_blank"> ' + loc.web() + '</a>' + "<br />",
                        phone = '<span class=phone>' + loc.phone() + '</span>' + "<br />";

                    // When a marker is clicked, it will bounce, and the infowindow will open with content
                    google.maps.event.addListener(marker, 'click', function() {
                        toggleBounce();
                        infowindow.setContent('<div class="info">' + name + rate + address + website + phone + '</div>');
                        infowindow.open(map, marker);
                    });
                    // Stops the marker from bouncing if infowindow closes and marker is bouncing
                    google.maps.event.addListener(infowindow, 'closeclick', function() {
                        if (jumpingMarker != null) {
                            jumpingMarker.setAnimation(null);
                        }
                    });

                    function toggleBounce() {
                        if (jumpingMarker) {
                            jumpingMarker.setAnimation(null);
                        }
                        if (jumpingMarker != marker) {
                            marker.setAnimation(google.maps.Animation.BOUNCE);
                            jumpingMarker = marker;
                        } else {
                            jumpingMarker = null;
                        }
                    }
                });
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
                        //TODO: addMarker()
                    }
                });
            };
        return {
            venueList: venueList,
            currentVenue: currentVenue,
            setVenue: setVenue,
            canShowPictures: canShowPictures,
            closePictures: closePictures,
            googMap: googMap,
            initFourSquareAjax: initFourSquareAjax,
            searchWord: searchWord
        };
    })();

    my.MapViewModel.initFourSquareAjax();
    $(document).ajaxComplete(function() {
        my.MapViewModel.googMap();
        //TODO: get rid of ajaxComplete
    });
    // my.MapViewModel.googMap();

    ko.applyBindings(my.MapViewModel);

});

















