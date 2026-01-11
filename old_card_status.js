(function () {
    'use strict';	
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            e.object.activity.render().find('.full-start__status, .full-start__pg').remove();
        }
    });
})();
