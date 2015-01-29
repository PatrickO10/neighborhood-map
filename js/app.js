var my = my || {}; // my namespace

$(function() {
    "use strict";
    var map,
        infowindow,
        jumpingMarker = null;


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

    /**
     * Venue Model
     * Used to hold onto each venue data.
     * The argument is data from a single venue from FourSquare API
     */
    my.Venue = function(data) {
        var self = this;

        // Checks to make sure rate data is not undefined
        self.ratingCheck = function(dataRate) {
            // If there is a dataRate,
            // format number to have one decimal place.
            return dataRate ? dataRate.toFixed(1) : 'N/A';
        };
        // Checks to make sure their is a tip.
        self.tipCheck = function(dataTip) {
            return dataTip ? dataTip[0].text : '';
        };
        // Checks any general data that doesn't need a special case.
        self.itemCheck = function(data) {
            return data ? data : '';
        };

        // Assigns unchanging data about the specific venue.
        self.name = data.name;
        self.type = self.itemCheck(data.categories[0].shortName);
        self.lat = data.location.lat;
        self.lng = data.location.lng;
        self.center = {
            lat: self.lat,
            lng: self.lng
        };

        // Data that needs to be checked
        // because it might not be in the venue data
        self.rating = self.ratingCheck(data.rating);
        self.address = self.itemCheck(data.location.formattedAddress);
        self.tip = self.tipCheck(data.tips);
        self.phone = self.itemCheck(data.contact.formattedPhone);
        self.web = self.itemCheck(data.url);
    };

    /**
     * Returns an array of explore keywords to be used inside the FourSquare url.
     *  'explore?&section=food' (FourSquare url)
     * The keywords are placed on the UI
     */
    my.categoryArray = function() {
        return ['food', 'drinks', 'shops', 'coffee', 'arts', 'outdoors'];
    };

    /**
     * Creates a string with HTML elements, CSS classes, and venue data
     * to be used in infowindow content.
     * Takes an individual venue as an argument.
     * Returns the string.
     */
    my.contentStr = function(venue) {
        return '<div class=info><span class=name>' + venue.name + '</span> <br />' +
            '<span class=rating>' + venue.rating + '</span> <br />' +
            '<span class=address>' + venue.address[0] + "<br />" + venue.address[1] + '</span> <br />' +
            '<a class=website href="' + venue.web + '" target="_blank"> ' + venue.web + '</a> <br />' +
            '<span class=phone>' + venue.phone + '</span> <br /></div>';
    };

    /**
     * Sets jumpingMarker animation to null if jumpingMarker is not null
     * If jumpingMarker does not equal marker then set animation on marker and
     * assign jumpingMarker to marker.
     * Else set jumpingMarker to null.
     * Takes an individual marker as an argument
     */
    my.toggleBounce = function(marker) {
        if (jumpingMarker) {
            jumpingMarker.setAnimation(null);
        }
        if (jumpingMarker !== marker) {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            jumpingMarker = marker;
        } else {
            jumpingMarker = null;
        }
    };

    // Returns the start of the string url needed to request API from FourSquare
    my.baseUrl = function() {
        return 'https://api.foursquare.com/v2/venues/';
    };

    // Returns the end of the string url to request API from FourSquare
    // Specifies version, limit, day, time, radius, latlng, and my unique client_id/client_secret.
    my.suffixUrl = function() {
        return '&client_id=DZIPLZYHXXYLCELWMS3N2DIO35PWEKTIZMABHZQ4VWKAU2JA' +
            '&client_secret=1BFTWIS2O3IZLCDZNV2R2A4ITV0UYAVJV2MDBXIW3LWUOIOM' +
            '&ll=' + 44.9519177 + ',' + -93.2983446 +
            '&v=20130815&limit=20&day=any&time=any&radius=1500';
    };

    // The ViewModel for the map application
    my.MapViewModel = (function() {
        var
            venueList = ko.observableArray([]), // Array of venues
            exploreList = ko.observableArray([]), // Array of explore keywords
            currentVenue = ko.observable(), // Current venue
            canDisplay = ko.observable(false), // Hides yellow-box
            searchWord = ko.observable(''), // Word or words to be used inside requestUrl.
            searchType = ko.observable('explore?&section='), // Type of search to be used inside requestUrl

            // A ko computable that returns a new requestUrl anytime either search type or word changes
            requestUrl = ko.computed(function() {
                return my.baseUrl() + searchType() + searchWord() + my.suffixUrl();
            }),

            /**
             *  Adds explorekeywords to exploreList array
             *  and calls getFourSquareData and initGoogMap
             */
            init = function() {
                my.categoryArray().forEach(function(categoryItem) {
                    exploreList.push(categoryItem);
                });
                getFourSquareData();
                initGoogMap();
            },

            // Initializes Google Map
            initGoogMap = function() {

                // Creates a local variable storing map options
                var mapOptions = {
                    zoom: 15,
                    center: new google.maps.LatLng(44.9519177, -93.2983446)
                };

                // Create a new map
                map = new google.maps.Map($('#map-canvas')[0], mapOptions);

                // Create a new infowindow with a maxWidth
                infowindow = new google.maps.InfoWindow({
                    maxWidth: 500
                });
            },

            /**
             * Gets either the best nearby venues data from foursquare API
             * when searchType() is 'explore' or gets a single location
             * if searchType() is 'search'.
             * Adds markers to every venue in VenueList()
             * and sets all of them on the map.
             */
            getFourSquareData = function() {
                $.ajax({
                    url: requestUrl(),
                    dataType: 'jsonp',
                    success: function(data) {
                        var requestedData;
                        if (searchType()[0] !== 'e') {
                            requestedData = data.response.venues[0];
                            venueList.push(new my.Venue(requestedData));
                            map.panTo({
                                lat: requestedData.location.lat,
                                lng: requestedData.location.lng
                            });
                        } else {
                            requestedData = data.response.groups[0].items; // An array of venues from FourSquare

                            // Sorts each venue by comparing ratings
                            // and if a rating is undefined sets it to 0 to compare.
                            requestedData.sort(function(a, b) {
                                var aRating = undefinedChange(a.venue.rating),
                                    bRating = undefinedChange(b.venue.rating);

                                if (aRating < bRating) {
                                    return 1;
                                } else if (aRating > bRating) {
                                    return -1;
                                } else {
                                    return 0;
                                }
                            });

                            // Pushes a new venue to venueList
                            requestedData.forEach(function(venueItem) {
                                venueList.push(new my.Venue(venueItem.venue));
                            });
                        }
                        // If val from sort function is undefined returns 0
                        function undefinedChange(val) {
                            if (val === undefined) {
                                val = 0;
                            }
                            return val;
                        }

                        addMarkers(map);
                        setAllMap(map);

                    }
                });
            },


            /**
             * Sets the currentVenue and infowindow to the clicked venue.
             * And sets canDisplay to true for Yellow Box
             * @param {Object} venue A clickedVenue object returned from a user click.
             */
            setVenue = function(clickedVenue) {
                canDisplay(true);
                currentVenue(clickedVenue);
                setInfowindowContent(clickedVenue);
                openInfowindow(clickedVenue.myMarker);
                map.panTo(clickedVenue.center);
            },

            /**
             * Sets the searchType() to 'explore' foursquare setting
             * and searchWord() to the clicked category.
             * ClickedCategory argument from a user click.
             */
            setExploreType = function(clickedCategory) {
                searchType('explore?&section=');
                searchWord(clickedCategory);
            },

            // Sets the searchType() to 'search' foursquare setting.
            setSearchType = function() {
                searchType('search?&query=');
            },

            // Sets canDisplay() to false,
            // which closes the yellow-box.
            closeDisplay = function() {
                canDisplay(false);
            },

            /**
             * Adds the markers to each venue in venueList(),
             * and has google event listeners for clicking on markers
             * and for closing infowindows.
             * When the marker is clicked on the map,
             * it will open its infowindow, bounce the marker,
             * and panTo the marker on the map.
             * @param {Object} map A global variable
             */
            addMarkers = function(map) {
                venueList().forEach(function(venue) {

                    // Creates local variables for location, content, and marker
                    var location = new google.maps.LatLng(venue.lat, venue.lng),
                        marker = new google.maps.Marker({
                            position: location
                        });

                    // Associates venue.myMarker to marker
                    venue.myMarker = marker;

                    // When a marker is clicked, it will bounce and panTo it on the map,
                    // and the infowindow will open with its content.
                    google.maps.event.addListener(marker, 'click', function() {
                        setInfowindowContent(venue);
                        openInfowindow(marker);
                        map.panTo(location);
                        closeDisplay();
                    });

                    // Stops the marker from bouncing if the user
                    // clicks the x button in top right corner of the infowindow.
                    google.maps.event.addListener(infowindow, 'closeclick', function() {
                        // If the marker isn't null set its animation to null
                        if (jumpingMarker !== null) {
                            jumpingMarker.setAnimation(null);
                            jumpingMarker = null;
                        }
                    });
                });
            },

            /**
             * Adds all of the markers in each venue onto the map.
             * Iterates through each venue in venueList(),
             * and sets the markers in each one onto the map.
             */
            setAllMap = function(map) {
                for (var i = 0, len = venueList().length; i < len; i++) {
                    venueList()[i].myMarker.setMap(map);
                }
            },

            /**
             * Calls my.contentStr(venue) which returns a content string
             * with HTML elements and assigns it a local var.
             * Then sets the infowindow content.
             */
            setInfowindowContent = function(venue) {
                var content = my.contentStr(venue);
                infowindow.setContent(content);
            },

            /**
             * Opens the infowindow on the map based on the clickedMarker.
             * Toggles the clickedMarker to make it bounce.
             */
            openInfowindow = function(clickedMarker) {
                infowindow.open(map, clickedMarker);
                my.toggleBounce(clickedMarker);
                // If the user clicks on the marker again
                // close the infowindow.
                if (jumpingMarker === null) {
                    infowindow.close();
                }
            },

            // Clears markers, infowindow, venueList(), and yellow box.
            clearMap = function() {
                setAllMap(null);
                closeDisplay();
                venueList([]);
            };


        // When searchWord() changes run clearMap() and getFourSquareData().
        searchWord.subscribe(function() {
            clearMap();
            getFourSquareData();
        });
        return {
            venueList: venueList,
            exploreList: exploreList,
            currentVenue: currentVenue,
            canDisplay: canDisplay,
            closeDisplay: closeDisplay,
            searchType: searchType,
            searchWord: searchWord,
            requestUrl: requestUrl,
            init: init,
            initGoogMap: initGoogMap,
            getFourSquareData: getFourSquareData,
            setVenue: setVenue,
            setAllMap: setAllMap,
            setSearchType: setSearchType,
            setExploreType: setExploreType,
            clearMap: clearMap
        };
    })();

    my.MapViewModel.init();

    ko.applyBindings(my.MapViewModel);

});
