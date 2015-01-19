var my = my || {};
$(function(my) {
    "use strict";

    my.Venue = function(data) {
        var self = this;
        self.name = ko.observable(data.venue.name);
        self.rating = ko.observable(my.Rating(data.venue.rating));
        self.nameRate = ko.computed(function() {
            return self.name() ? self.name() + " " + self.rating() : "";
        });
    };
    my.Rating = function(data) {
    	console.log((data * 10) % 10);
        return data ? ((data * 10) % 10 === 0 ? data.toFixed(1) : data) : "N/A";
    };

    my.vm = (function() {
        var venueList = ko.observableArray([]);
        return {
            venueList: venueList
        };

        /*            return {
                        venues: venues,
                        name: name,
                        addNames: function() {
                            console.log(venues());
                            venues().forEach(function(nameItem) {
                                my.vm.name.push(nameItem);
                            });
                            console.log(name());
                        }
                    };*/
    })();

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
                    my.vm.venueList.push(new my.Venue(venueData));
                });
            }
        });
    }
    foursqAPI();
    ko.applyBindings(my.vm);
});
