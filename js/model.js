var my = my || {};
$(function(my) {
    "use strict";

    my.Venue = function(data) {
        var self = this;
        self.name = ko.observable(data.venue.name);
        self.rating = ko.observable(my.VenueRating(data.venue.rating));
        self.nameRate = ko.computed(function() {
            return self.name() ? self.name() + " " + self.rating() : "";
        });
        self.type = ko.observable(data.venue.categories[0].shortName);
        self.lat = ko.observable(data.venue.location.lat);
        self.lng = ko.observable(data.venue.location.lng);
        self.address = ko.observable(data.venue.location.formattedAddress);
        self.phone = ko.observable(my.VenuePhone(data.venue.contact.formattedPhone));
        self.tip = ko.observable(my.VenueTip(data.tips));
        self.web = ko.observable(my.VenueWeb(data.venue.url));
    };

    my.VenueRating = function(data) {
        return data ? ((data * 10) % 10 === 0 ? data.toFixed(1) : data) : "N/A";
    };

    my.VenuePhone = function(data) {
        return data ? data : "No phone";
    };

    my.VenueTip = function(data) {
        return data ? data[0].text : "No tips";
    };

    my.VenueWeb = function(data) {
        return data ? data : "No URL available";
    };

    my.vm = (function() {
        var venueList = ko.observableArray([]);
        return {
            venueList: venueList
        };
    })();

    my.foursqAjax = function() {
        var prefixUrl = "https://api.foursquare.com/v2/venues/explore?",
            uniqueID = 'client_id=DZIPLZYHXXYLCELWMS3N2DIO35PWEKTIZMABHZQ4VWKAU2JA&client_secret=1BFTWIS2O3IZLCDZNV2R2A4ITV0UYAVJV2MDBXIW3LWUOIOM',
            uptownLL = '&ll=' + 44.9519177 + ',' + -93.2983446,
            section = '&section=' + 'topPlaces', // TODO: observable for search content.
            suffixUrl = uniqueID + uptownLL + section + '&v=20130815&radius=500&limit=5',
            requestUrl = prefixUrl + suffixUrl;

        $.ajax({
            url: requestUrl,
            dataType: 'jsonp',
            success: function(data) {
                var requestedData = data.response.groups[0].items;
                console.log(requestedData);
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
                    my.vm.venueList.push(new my.Venue(venueItem));
                });
            }
        });
    };
    my.foursqAjax();
    ko.applyBindings(my.vm);
});
