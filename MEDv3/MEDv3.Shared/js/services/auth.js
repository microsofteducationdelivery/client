WinJS.Namespace.define("MED.Service.Auth", {

    changePassword: function (creds) {
        var server = localStorage.getItem('currentServer');
        var userId = MED.Settings.get('name');
        return MED.SecureSettings.get('token').then(function (token) {
            return WinJS.xhr({
            type: 'PUT',
            url: server + '/api/mobile/changePassword/' + userId + '?dc=' + Math.random(),
            responseType: 'json',
            headers: {
                'Authorization': 'bearer ' + token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                oldPassword: creds.oldPassword,
                newPass: creds.newPassword
            })
        });
        });
        
    }
});
