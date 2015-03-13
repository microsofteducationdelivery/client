(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/links.html", {
        ready: function (element, options) {
            document.getElementById('appbar').winControl.showOnlyCommands(['btn-help']);
            var links = MED.Downloads.getDetails(options.id).links;
            WinJS.Binding.processAll(element, MED.Downloads.getDetails(options.id));

            this.element.querySelector('.b-links').winControl.data = new WinJS.Binding.List(links.map(function (link) {
                return { link: link };
            }));
        }
    });
})();