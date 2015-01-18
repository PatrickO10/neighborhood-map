var map;
//var infowindow;
ko.bindingHandlers.map = {
    init: function(element, valueAccessor) {
        var venueData = valueAccessor(),
            mapOptions = {
                zoom: 15,
                center: new google.maps.LatLng(venueData.uptownLat, venueData.uptownLng),
                mapTypeId: venueData.mapTypeId
            },
            map = new google.maps.Map(element, mapOptions);

        venueData.venues().forEach(function(loc) {
            console.log(loc);
            var location = new google.maps.LatLng(
                loc.lat,
                loc.lng);
            var infowindow = new google.maps.InfoWindow({
                content: loc.name
            });
            var marker = new google.maps.Marker({
                position: location,
                map: map
            });
            google.maps.event.addListener(marker, 'click', function() {
                infowindow.open(map, marker);
            });
        });
    }
};

var vm = {
    venues: ko.observableArray([{
        name: "Uptown",
        lat: 44.9519177,
        lng: -93.2983446,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }, {
        name: "parma",
        lat: 44.9549377,
        lng: -93.2983446,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }, {
        name: "jamma",
        lat: 44.9545377,
        lng: -93.2983446,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }])
};
console.log(vm.venues());

ko.applyBindings(vm);
