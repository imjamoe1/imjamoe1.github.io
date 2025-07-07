(function () {
    'use strict';	
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            e.object.activity.render().find('.full-start__button.button--book').remove();
        }
    });
})();
