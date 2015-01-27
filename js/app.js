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

    // Creates venue models
    my.Venue = function(data) {
        var self = this;
        self.venueRating = function(dataRate) {
            return dataRate ? ((dataRate * 10) % 10 === 0 ? dataRate.toFixed(1) : dataRate) : "N/A";
        };
        self.venueTip = function(dataTip) {
            return dataTip ? dataTip[0].text : '';
        };
        self.itemCheck = function(data) {
            return data ? data : '';
        };
        self.rating = ko.observable(self.venueRating(data.rating));
        self.name = ko.observable(data.name);
        self.type = ko.observable(self.itemCheck(data.categories[0].shortName));
        self.lat = data.location.lat;
        self.lng = data.location.lng;
        self.address = ko.observable(self.itemCheck(data.location.formattedAddress));

        self.tip = ko.observable(self.venueTip(data.tips));
        self.phone = ko.observable(self.itemCheck(data.contact.formattedPhone));
        self.web = ko.observable(self.itemCheck(data.url));
    };

    my.Category = function() {
        var tempCategoryArray = ['food', 'drinks', 'shops', 'coffee', 'arts', 'outdoors'];
        tempCategoryArray.forEach(function(tempItem) {
            my.MapViewModel.categoriesList.push(tempItem);
        });
    };

    // ViewModel
    my.MapViewModel = (function() {
        var
            venueList = ko.observableArray([]),
            categoriesList = ko.observableArray([]),
            markersList = ko.observableArray([]),
            filteredList = ko.observableArray([]),
            currentVenue = ko.observable(),
            setVenue = function(clickedVenue) {
                canDisplay(true);
                currentVenue(clickedVenue);
            },
            setVisible = function(venue) {
                if (self.rating >= 9.0) {
                    isVisible(true);
                }
            },
            infowindow,
            searchedList = [],
            searchWord = ko.observable(''),
            searchKey = ko.computed(function() {
                // Needs to be lowercase because of case sensitive for indexOF
                return searchWord().toLowerCase().split(' ');
            }),
            setExploreType = function(clickedCategory) {
                searchType('explore?&section=');
                searchWord(clickedCategory);
            },
            setSearchType = function() {
                searchType('search?&query=');
            },
        isVisible = ko.observable(true),
            canDisplay = ko.observable(false),
            closeDisplay = function() {
                canDisplay(false);
            },
            baseFourSquareUrl = 'https://api.foursquare.com/v2/venues/',
            uniqueFourSquareID = '&client_id=DZIPLZYHXXYLCELWMS3N2DIO35PWEKTIZMABHZQ4VWKAU2JA' +
            '&client_secret=1BFTWIS2O3IZLCDZNV2R2A4ITV0UYAVJV2MDBXIW3LWUOIOM',
            uptownLL = '&ll=' + 44.9519177 + ',' + -93.2983446 + '&v=20130815&limit=20&day=any&time=any&radius=1000',
            suffixUrl = uniqueFourSquareID + uptownLL,
            searchType = ko.observable('explore?&section='),
            requestUrl = ko.computed(function() {
                return baseFourSquareUrl + searchType() + searchWord() + suffixUrl;
            }),
            jumpingMarker = null,
            googMap = function() {
                var mapOptions = {
                    zoom: 15,
                    center: new google.maps.LatLng(44.9519177, -93.2983446)
                };
                map = new google.maps.Map($('#map-canvas')[0], mapOptions);
                infowindow = new google.maps.InfoWindow();
            },
            init = function() {

                // setAllMap(map);
                my.Category();
                getFourSquareAjax();
                googMap();


            },
            getFourSquareAjax = function() {
                $.ajax({
                    url: requestUrl(),
                    dataType: 'jsonp',
                    success: function(data) {
                        var requestedData;
                        if (searchType()[0] !== 'e') {
                            requestedData = data.response.venues[0];
                            venueList.push(new my.Venue(requestedData));

                        } else {
                            requestedData = data.response.groups[0].items;

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
                                venueList.push(new my.Venue(venueItem.venue));
                                searchedList.push([venueItem.venue.name.toLowerCase(), venueItem.venue.categories[0].name.toLowerCase()]);
                            });
                        }

                        console.log(requestedData);

                        addMarkers(map);
                        setAllMap(map);

                    }
                });
            },

            // Clears markers, infowindow, venueList, and yellow box
            clearMap = function() {
                setAllMap(null);
                closeDisplay();
                isVisible(false);
                venueList([]);
                markersList([]);
            },

            // Puts the markers on the map.
            setAllMap = function(map) {
                for (var i = 0; i < markersList().length; i++) {
                    markersList()[i].setMap(map);
                }
            },
            addMarkers = function(map) {
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
            };

        searchWord.subscribe(function() {
            clearMap();
            getFourSquareAjax();
            isVisible(true);
        });
        return {
            venueList: venueList,
            searchedList: searchedList,
            currentVenue: currentVenue,
            setVenue: setVenue,
            setVisible: setVisible,
            canDisplay: canDisplay,
            closeDisplay: closeDisplay,
            googMap: googMap,
            getFourSquareAjax: getFourSquareAjax,
            searchWord: searchWord,
            searchKey: searchKey,
            markersList: markersList,
            setAllMap: setAllMap,
            clearMap: clearMap,
            isVisible: isVisible,
            filteredList: filteredList,
            init: init,
            searchType: searchType,
            requestUrl: requestUrl,
            categoriesList: categoriesList,
            setSearchType: setSearchType,
            setExploreType: setExploreType
        };
    })();

    my.MapViewModel.init();

    ko.applyBindings(my.MapViewModel);

});
