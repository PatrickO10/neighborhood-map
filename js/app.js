var my = my || {}; // my namespace

$(function() {
    "use strict";
    var map,
        infowindow,
        jumpingMarker = null,
        uptownCenter = {
            lat: 44.9519177,
            lng: -93.2983446
        },
        exInstr = "Click on any category below to show types of places around Uptown Minneapolis.";


    // Custom binding used to display errors.
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
        self.type = self.itemCheck(data.categories[0].name);
        self.lat = data.location.lat;
        self.lng = data.location.lng;
        self.center = {
            lat: self.lat,
            lng: self.lng
        };

        // Data that needs to be checked
        // because it might not be in the venue data.
        self.rating = self.ratingCheck(data.rating);
        self.address = self.itemCheck(data.location.formattedAddress);
        self.tip = self.tipCheck(data.tips);
        self.phone = self.itemCheck(data.contact.formattedPhone);
        self.web = self.itemCheck(data.url);
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
     * Sets jumpingMarker animation to null if jumpingMarker is not null.
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
        return 'https://api.foursquare.com/v2/venues/explore?&section=';
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
        var exploreArray = [
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ], // An array of arrays storing four square explore keywords data
            venueList = ko.observableArray([]), // Array of venues
            filterList = ko.observableArray([]), // Filtered array of venues
            exploreList = ko.observableArray([
                'top places',
                'food',
                'drinks',
                'shops',
                'coffee',
                'arts',
                'outdoors'
            ]), // Array of explore keywords
            imgList = ko.observableArray([
                'images/cat0.jpg',
                'images/cat1.jpg',
                'images/cat2.jpg',
                'images/cat3.jpg',
                'images/cat4.jpg'
            ]), // List of cat images to display when error occurs
            wrongSearch = ko.observable('images/searchError1.png'), // Image to display when no search turns up
            currentVenue = ko.observable(), // Current venue
            errorText = ko.observable('Sorry an error has occurred. Please Try again or look at these cute cats.'),
            currentExplore = ko.observable('TOP PLACES'), // Shows what category the user is on.
            exploreInstructions = ko.observable(exInstr), // Shows instructions on what to do with click-box
            canDisplayError = ko.observable(false), // Hides/shows error
            canDisplaySearch = ko.observable(false), // Hides/shows search box if search is not found
            searchWord = ko.observable(''), // Word or words to be used inside requestUrl.
            exploreWord = ko.observable(''), // explore keyword to be used inside requestUrl

            // A ko computable that returns a new requestUrl anytime exploreWord() changes
            requestUrl = ko.computed(function() {
                return my.baseUrl() + exploreWord() + my.suffixUrl();
            }),

            /**
             *  Adds explore keywords to exploreList array
             *  and calls getFourSquareService and initGoogMap
             */
            init = function() {
                setExploreArray(); // Iterates through exploreList
                initGoogMap(); // Loads google map on page
            },

            // Initializes Google Map
            initGoogMap = function() {

                // Creates a local variable storing map options
                var mapOptions = {
                    zoom: 14,
                    center: new google.maps.LatLng(44.9519177, -93.2983446),
                    disableDefaultUI: true
                };

                // Create a new map
                map = new google.maps.Map($('#map-canvas')[0], mapOptions);

                if (map === undefined) {
                    canDisplayError(true);
                }

                // Create a new infowindow with a maxWidth
                infowindow = new google.maps.InfoWindow({
                    maxWidth: 200
                });
            },

            /**
             * setExploreArray() iterates through each keyword in exploreList
             * and changes the exploreWord, which will result in calling
             * getFourSquareService, adding sub arrays to the exploreArray.
             */
            setExploreArray = function() {
                exploreList().forEach(function(keyword) {
                    exploreWord(keyword);
                });
            },

            /**
             * Gets the best nearby venues data from foursquare API
             * based on the explore keyword.
             * Adds markers to every venue in filterList() obsArray
             * and sets all of them on the map.
             */
            getFourSquareService = function() {

                $.ajax({
                    url: requestUrl(),
                    dataType: 'jsonp',
                    success: function(data) {
                        var requestedData,
                            tempArray = [],
                            num;
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

                        // Pushes a new venue to tempArray
                        requestedData.forEach(function(venuePlace) {
                            tempArray.push(new my.Venue(venuePlace.venue));
                        });

                        // Gets the correct index for exploreArray to put
                        // the tempArray.
                        if (data.response.query === 'food') {
                            num = 1;
                        } else if (data.response.query === 'drinks') {
                            num = 2;
                        } else if (data.response.query === 'shops') {
                            num = 3;
                        } else if (data.response.query === 'coffee') {
                            num = 4;
                        } else if (data.response.query === 'arts') {
                            num = 5;
                        } else if (data.response.query === 'outdoors') {
                            num = 6;
                        } else {
                            num = 0;
                        }

                        exploreArray[num] = tempArray; // Creates a subarray in exploreArray

                        // If top places fill filterList and venueList and set markers on the map
                        if (num == 0) {
                            fillSetVenues(num);
                        }

                        // If val from sort function is undefined returns 0
                        function undefinedChange(val) {
                            if (val === undefined) {
                                val = 0;
                            }
                            return val;
                        }
                    },
                    timeout: 3000
                })

                // If the ajax has an error make canDisplayError true
                .fail(function() {
                    canDisplayError(true);
                });

            },


            // Sets the currentVenue and infowindow to the clicked venue.
            setVenue = function(clickedVenue) {
                currentVenue(clickedVenue);
                setInfowindowContent(clickedVenue);
                openInfowindow(clickedVenue.myMarker);
                map.panTo(clickedVenue.center);
            },

            /**
             * Changes the venue-box and markers on the map
             * to whatever explore keyword the user clicks on.
             */
            setVenueBox = function(clickedExploreWord) {
                var num;
                clearMap(); // Clears the map and previous filterList() obsArray
                venueList([]); // Clears venueList

                currentExplore(clickedExploreWord.toUpperCase());

                // Finds the num to use for the index in exploreArray
                // to get the correct subarray.
                if (clickedExploreWord === 'top places') {
                    num = 0;
                } else if (clickedExploreWord === 'food') {
                    num = 1;
                } else if (clickedExploreWord === 'drinks') {
                    num = 2;
                } else if (clickedExploreWord === 'shops') {
                    num = 3;
                } else if (clickedExploreWord === 'coffee') {
                    num = 4;
                } else if (clickedExploreWord === 'arts') {
                    num = 5;
                } else if (clickedExploreWord === 'outdoors') {
                    num = 6;
                }

                fillSetVenues(num);
            },

            // Iterate through each venue in the subarray
            // and put them in the filterList()
            // and venueList obsArray
            fillSetVenues = function(num) {
                exploreArray[num].forEach(function(venue) {
                    filterList.push(venue);
                    venueList.push(venue);
                });

                // put markers on the map
                addMarkers(map);
                setAllMap(map);
                map.panTo(uptownCenter);
            },

            /**
             * compareStrs turns searchWord(), venue.type and venue.name strings to lowercase,
             * and then iterates through each venue searching for a match in words.
             * If there is a match, it will push that venue into the filterList()
             * to be displayed in the venue-box.
             * If no matches found return a message and ask them to try again.
             */
            compareStrs = function() {
                var searchKey = searchWord().toLowerCase(),
                    nameKey,
                    categoryKey;

                venueList().forEach(function(venue) {
                    nameKey = venue.name.toLowerCase();
                    categoryKey = venue.type.toLowerCase();
                    if (nameKey.search(searchKey) !== -1 || categoryKey.search(searchKey) !== -1) {
                        filterList.push(venue);
                    }
                });

                // If filterList() is empty show canDisplaySearch on UI,
                // telling the user to try a different search.
                filterList().length < 1 ? canDisplaySearch(true) : canDisplaySearch(false);
            },

            /**
             * Adds the markers to each venue in filterList(),
             * and has google event listeners for clicking on markers
             * and for closing infowindows.
             * When the marker is clicked on the map,
             * it will open its infowindow, bounce the marker,
             * and panTo the marker on the map.
             */
            addMarkers = function(map) {
                filterList().forEach(function(venue) {

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
             * Using map method, this function sets all of the markers in
             * each venue from filterList obsArray onto the google map.
             */
            setAllMap = function(map) {
                filterList().map(function(venue) {
                    venue.myMarker.setMap(map);
                });
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

            // Clears markers, infowindow, and filterList().
            clearMap = function() {
                setAllMap(null);
                filterList([]);
            };


        // When searchWord() changes run clearMap(), compareStrs() and getFourSquareService().
        searchWord.subscribe(function() {
            clearMap();
            compareStrs();
            setAllMap(map);
        });

        // When exploreWord changes clear the map, empty venueList(), and getFourSquareService().
        exploreWord.subscribe(function() {
            getFourSquareService();
        });
        return {
            venueList: venueList,
            filterList: filterList,
            exploreList: exploreList,
            exploreArray: exploreArray,
            currentVenue: currentVenue,
            exploreWord: exploreWord,
            searchWord: searchWord,
            requestUrl: requestUrl,
            init: init,
            initGoogMap: initGoogMap,
            getFourSquareService: getFourSquareService,
            setVenue: setVenue,
            setAllMap: setAllMap,
            clearMap: clearMap,
            canDisplayError: canDisplayError,
            canDisplaySearch: canDisplaySearch,
            setVenueBox: setVenueBox,
            currentExplore: currentExplore,
            errorText: errorText,
            imgList: imgList,
            wrongSearch: wrongSearch,
            exploreInstructions: exploreInstructions
        };
    })();

    my.MapViewModel.init();

    ko.applyBindings(my.MapViewModel);

});
