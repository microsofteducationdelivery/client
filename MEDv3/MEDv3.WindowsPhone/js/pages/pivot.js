(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var session = WinJS.Application.sessionState;
    var util = WinJS.Utilities;

    // Получение групп, используемых разделами Hub с привязкой к данным.
    WinJS.UI.Pages.define("/pages/pivot.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },

        // Эта функция вызывается всякий раз, когда пользователь переходит на данную страницу. Она
        // заполняет элементы страницы данными приложения.
        ready: function (element, options) {
            var hub = element.querySelector(".hub").winControl;
            hub.onheaderinvoked = function (args) {
                args.detail.section.onheaderinvoked(args);
            };
            hub.onloadingstatechanged = function (args) {
                if (args.srcElement === hub.element && args.detail.loadingState === "complete") {
                    hub.onloadingstatechanged = null;
                    hub.element.focus();
                }
            }

            // TODO: Инициализируйте здесь страницу.
        },

        unload: function () {
            // TODO: Отвечайте на переходы с этой страницы.
        },

        updateLayout: function (element) {
            /// <param name="element" domElement="true" />

            // TODO: Отвечайте на изменения в макете.
        },
    });
})();