(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/description.html", {
        ready: function (element, options) {
            document.getElementById('appbar').winControl.showOnlyCommands(['btn-help']);
            
            WinJS.Binding.processAll(element, MED.Downloads.getDetails(options.id));
        }
    });
})();