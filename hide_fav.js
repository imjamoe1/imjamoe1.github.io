(function () {
    'use strict';
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            const render = e.object.activity.render();
            const bookButton = render.find('.full-start__button.button--book');
            bookButton.remove();
        }
    });
})();