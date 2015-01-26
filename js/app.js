var my = my || {}; // my namespace
var map;
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
            var shouldShow = valueAccessor(),
                duration = allBindings().fadeDuration || 400; // 400ms is default duration unless otherwise specified
            shouldShow ? $(element).fadeIn(duration) : $(element).fadeOut(duration);
        }
    };

    // Checks to make sure a value is there
    my.Item = function(data) {
        return data ? data : '';
    };

    // Creates venue models
    my.Venue = function(data) {
        var self = this;
        self.venueRating = function(dataRate) {
            return dataRate ? ((dataRate * 10) % 10 === 0 ? dataRate.toFixed(1) : dataRate) : '';
        };
        self.venueTip = function(dataTip) {
            return dataTip ? dataTip[0].text : '';
        };
        self.rating = ko.observable(self.venueRating(data.venue.rating));
        self.name = ko.observable(data.venue.name);
        self.nameRate = ko.computed(function() {
            return self.name() ? self.name() + " " + "<b class='category-rate'>" + self.rating() + "</span>" : "";
        });
        self.type = ko.observable(data.venue.categories[0].shortName);
        self.lat = data.venue.location.lat;
        self.lng = data.venue.location.lng;
        self.address = ko.observable(data.venue.location.formattedAddress);
        self.phone = ko.observable(my.Item(data.venue.contact.formattedPhone));
        self.tip = ko.observable(self.venueTip(data.tips));
        self.web = ko.observable(my.Item(data.venue.url));
    };

    // ViewModel
    my.MapViewModel = (function() {
        var self = this,
            venueList = ko.observableArray([]),
            markersList = [],
            currentVenue = ko.observable(),
            setVenue = function(clickedVenue) {
                canDisplay(true);
                currentVenue(clickedVenue);
            },
            infowindow,
            searchedList = [],
            searchWord = ko.observable(''),
            searchKey = ko.computed(function() {
                // Needs to be lowercase because of case sensitive for indexOF
                return searchWord().toLowerCase().split(' ');
            }),
            isVisible = ko.observable(true),
            canDisplay = ko.observable(false),
            closeDisplay = function() {
                canDisplay(false);
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
                // var marker;
                venueList().forEach(function(loc) {
                    var location = new google.maps.LatLng(loc.lat, loc.lng),
                        marker = new google.maps.Marker({
                            position: location
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
                    markersList.push(marker);
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
                        // setAllMap(map);
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
                            searchedList.push([venueItem.venue.name.toLowerCase(), venueItem.venue.categories[0].name.toLowerCase()]);
                        });

                        googMap();
                        setAllMap(map);
                    }
                });
            },
            clearMap = function() {
                setAllMap(null);
                closeDisplay();
                isVisible(false);
            },

            // Sets the map on all markers in the array.
            setAllMap = function(map) {
                for (var i = 0; i < markersList.length; i++) {
                    markersList[i].setMap(map);
                }
            };
        return {
            venueList: venueList,
            searchedList: searchedList,
            currentVenue: currentVenue,
            setVenue: setVenue,
            canDisplay: canDisplay,
            closeDisplay: closeDisplay,
            googMap: googMap,
            initFourSquareAjax: initFourSquareAjax,
            searchWord: searchWord,
            searchKey: searchKey,
            markersList: markersList,
            setAllMap: setAllMap,
            clearMap: clearMap,
            isVisible: isVisible
        };
    })();

    my.MapViewModel.initFourSquareAjax();

    ko.applyBindings(my.MapViewModel);

});
