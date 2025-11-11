(function () {
    'use strict';

    function replaceLoader() {
        $('#loader').remove();
        
        const newStyle_activity_loader = `
            .activity__loader {
                background: url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 24 24' fill='orange' xmlns='http://www.w3.org/2000/svg'%3E%3Cstyle%3E.spinner_7mtw%7Btransform-origin:center;animation:spinner_jgYN .3s linear infinite%7D@keyframes spinner_jgYN%7B100%25%7Btransform:rotate(360deg)%7D%7D%3C/style%3E%3Cpath class='spinner_7mtw' d='M2,12A11.2,11.2,0,0,1,13,1.05C12.67,1,12.34,1,12,1a11,11,0,0,0,0,22c.34,0,.67,0,1-.05C6,23,2,17.74,2,12Z'/%3E%3C/svg%3E") no-repeat 50% 50% !important;
                //background-size: 80px 80px !important;
            }
        `;
        
        $('<style id="loader">' + newStyle_activity_loader + '</style>').appendTo('head');
    }

    if (window.Lampa && Lampa.Storage && Lampa.Listener) {
        if (window.appready) {
            replaceLoader();
        } else {
            Lampa.Listener.follow('app', (e) => {
                if (e.type === 'ready') {
                    replaceLoader();
                }
            });
        }
    } else {
        console.error('Lampa core modules are not available!');
    }
})();
