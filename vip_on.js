'use strict';

Lampa.Platform.tv();

setInterval(function() {
    if (typeof Lampa !== 'undefined') {
        clearInterval(this);

        var unic_id = Lampa.Storage.get('lampac_unic_id', '');
        if (unic_id !== 'guest') {
            Lampa.Storage.set('lampac_unic_id', 'guest');
        }

        Lampa.Utils.putScriptAsync(['http://lampa.vip/online.js'], function() {});
    }
}, 200);