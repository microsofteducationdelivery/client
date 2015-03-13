(function () {

    var crypto = Windows.Security.Cryptography;
    var cbuffer = crypto.CryptographicBuffer;
    var encoding = crypto.BinaryStringEncoding.utf16BE;

    function get(key) {
        var Provider = new Windows.Security.Cryptography.DataProtection.DataProtectionProvider();
        var value = localStorage.getItem(key);

        if (!value) {
            return WinJS.Promise.as(null);
        }

        value = cbuffer.decodeFromHexString(localStorage.getItem(key));

        
        return Provider.unprotectAsync(value).then(function (data) {
            return cbuffer.convertBinaryToString(encoding, data);
        });
    };

    function set(key, value) {
        var Provider = new Windows.Security.Cryptography.DataProtection.DataProtectionProvider('LOCAL=user');
        

        return Provider.protectAsync(cbuffer.convertStringToBinary(value, encoding)).then(function (data) {
            localStorage.setItem(key, cbuffer.encodeToHexString(data));
        });
    }
    function remove(key) {
        localStorage.removeItem(key);
    }
    WinJS.Namespace.define("MED.SecureSettings", {
        get: get,
        set: set,
        remove: remove
    });
})();