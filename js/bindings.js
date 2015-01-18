/**
 *Custom Bindings from Knockout.js Tutorials
 * http://learn.knockoutjs.com/#/?tutorial=custombindings
 *
 */

//HTML: <h3 data-bind="fadeVisible: pointsUsed() > pointsBudget">You've used too many points! Please remove some.</h3>
ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        // Start visible/invisible according to initial value
        var shouldDisplay = valueAccessor();
        $(element).toggle(shouldDisplay);
    },
    update: function(element, valueAccessor) {
        // On update, fade in/out
        var shouldDisplay = valueAccessor();
        shouldDisplay ? $(element).fadeIn() : $(element).fadeOut();
    }
};

// Third party library example
//HTML: <button data-bind="jqButton: { enable: pointsUsed() <= pointsBudget }, click: save">Finished</button>
ko.bindingHandlers.jqButton = {
    init: function(element) {
        $(element).button(); // Turns the element into a jQuery UI button
    },
    update: function(element, valueAccessor) {
        var currentValue = valueAccessor();
        // Here we just update the "disabled" state, but you could update other properties too
        $(element).button("option", "disabled", currentValue.enable === false);
    }
};

/*StarRating example
HTML: <tbody data-bind="foreach: answers">
    <tr>
        <td data-bind="text: answerText"></td>
        <td data-bind="starRating: points"></td>
    </tr>
</tbody>*/

ko.bindingHandlers.starRating = {
    init: function(element, valueAccessor) {
        $(element).addClass("starRating");
        for (var i = 0; i < 5; i++)
            $("<span>").appendTo(element);
        // Handle mouse events on the stars
        $("span", element).each(function(index) {
            $(this).hover(
                function() {
                    $(this).prevAll().add(this).addClass("hoverChosen");
                },
                function() {
                    $(this).prevAll().add(this).removeClass("hoverChosen");
                }
            ).click(function() {
                var observable = valueAccessor(); // Get the associated observable
                observable(index + 1); // Write the new rating to it
            });
        });
    },
    update: function(element, valueAccessor) {
        // Give the first x stars the "chosen" class, where x <= rating
        var observable = valueAccessor();
        $("span", element).each(function(index) {
            $(this).toggleClass("chosen", index < observable());
        });
    }
};

// <div id="map-canvas" data-bind="map: { venues: venues, uptownLat: 44.9519177, uptownLng: -93.2983446 }"></div>
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

/*<ul data-bind="foreach: tasks, visible: tasks().length > 0">
    <li>
        <input type="checkbox" data-bind="checked: isDone" />
        <input data-bind="value: title, disable: isDone" />
        <a href="#" data-bind="click: $parent.removeTask">Delete</a>
    </li>
</ul>*/
function Task(data) {
    this.title = ko.observable(data.title);
    this.isDone = ko.observable(data.isDone);
}

function TaskListViewModel() {
    // Data
    var self = this;
    self.tasks = ko.observableArray([]);
    self.newTaskText = ko.observable();
    self.incompleteTasks = ko.computed(function() {
        return ko.utils.arrayFilter(self.tasks(), function(task) { return !task.isDone() });
    });

    // Operations
    self.addTask = function() {
        self.tasks.push(new Task({ title: this.newTaskText() }));
        self.newTaskText("");
    };
    self.removeTask = function(task) { self.tasks.remove(task) };

     $.getJSON("/tasks", function(allData) {
        var mappedTasks = $.map(allData, function(item) { return new Task(item) });
        self.tasks(mappedTasks);
    });
}

ko.applyBindings(new TaskListViewModel());