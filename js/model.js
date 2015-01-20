var my = my || {}; // my namespace
$(function() {
    "use strict";

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
        self.lat = ko.observable(data.venue.location.lat);
        self.lng = ko.observable(data.venue.location.lng);
        self.address = ko.observable(data.venue.location.formattedAddress);
        self.phone = ko.observable(self.venuePhone(data.venue.contact.formattedPhone));
        self.tip = ko.observable(self.venueTip(data.tips));
        self.web = ko.observable(self.venueWeb(data.venue.url));
    };

    // ViewModel
    my.Map = (function() {
        var self = this,
            venueList = ko.observableArray([]),
            searchWord = ko.observable('Lake Calhoun'),
            baseFourSquareUrl = 'https://api.foursquare.com/v2/venues/',
            uniqueFourSquareID = 'client_id=DZIPLZYHXXYLCELWMS3N2DIO35PWEKTIZMABHZQ4VWKAU2JA' +
            '&client_secret=1BFTWIS2O3IZLCDZNV2R2A4ITV0UYAVJV2MDBXIW3LWUOIOM',
            uptownLL = '&ll=' + 44.9519177 + ',' + -93.2983446 + '&v=20130815&limit=20',
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
            searchFourSquare = function() {

            };

        return {
            venueList: venueList,
            initFourSquareAjax: initFourSquareAjax(),
            searchWord: searchWord
        };
    })();
    //my.Map.initFourSquareAjax();
    ko.applyBindings(my.Map);
});
