(function () {

    var helps = {
        login: 'login and password are required so that content specifically for you can de delivered. If you have set up your own server you will also need to specify that here',
        libraries: 'Libraries are top level containers for your content. On downloads tab you can review the progress of your downloads',
        library: 'You can browse and download media on this screen',
        media: ' View and comment on your comment. Turn the device into landscape mode to go full screen',
        settings: 'Enabling automated sync will force your app to contact server each time on app launch',
        default: 'No help for this page exists'
    }

    function getHelpForUrl(url) {
        switch (url) {
            case '':
                return helps.login;
            case '/pages/pivot.html':
                return helps.libraries;
            case '/pages/library.html':
                return helps.library;
            case '/pages/media.html':
                return helps.media;
            case '/pages/settings.html':
                return helps.settings;
            default:
                return helps.default;
        }
    }


    function showHelp() {
        var popup = new Windows.UI.Popups.MessageDialog(getHelpForUrl(WinJS.Navigation.location));
        popup.showAsync();
    }


    WinJS.Namespace.define("MED.Help", {
        show: showHelp
    });
})();