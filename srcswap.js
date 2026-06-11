(function () {
    'use strict';
    function srcswp(src) {

        Lampa.Template.add('src', `
        <div class="src_modal_root">
        <div class="src_grid">
            {src_tmp_Content}
        </div>
        </div>
        `);

        function updateActivitySource(newSource) {
            
            const STORAGE_KEY = 'activity';
            
            try {
                const activity = JSON.parse(localStorage.getItem(STORAGE_KEY) || {});
                
                if (!activity.source) {

                    console.log('Swap_src', 'Объект activity не содержит свойство source');
                    return false;
                }

                activity.source = newSource;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
                return true;
                
            } catch (error) {

                console.log('Swap_src', 'Ошибка при обновлении activity:', error);
                return false;
            }
        }

        const searchElement = document.querySelector('.head__action.selector.open--settings');

        if (searchElement) {
            searchElement.insertAdjacentHTML('afterend', `
            <div class="head__action head__settings selector open--src">
            <svg width="100%" height="100%" viewBox="-10.5 -9.45 21 19" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-sm me-0 w-10 h-10 text-brand dark:text-brand-dark flex origin-center transition-all ease-in-out"><circle cx="0" cy="0" r="2" fill="currentColor"></circle><g stroke="currentColor" stroke-width="1" fill="none"><ellipse rx="10" ry="4.5"></ellipse><ellipse rx="10" ry="4.5" transform="rotate(60)"></ellipse><ellipse rx="10" ry="4.5" transform="rotate(120)"></ellipse></g></svg>
            </div>
            `);

            const srcElement = searchElement.nextElementSibling;

            function swap_src() {

                const srcList = Lampa.Params.values['source'];
                const currentSource = Lampa.Storage.get('source');
                const src_Content = Object.entries(srcList)
                    .map(([key, name]) => {
                        const isActive = key === currentSource ? 'active' : '';
                        return `
                    <div class="src_item selector navigation-tabs__button ${isActive}" data-src="${key}">
                        ${name}
                    </div>
                    `;
                    })
                    .join('');

                const src_render_templates = Lampa.Template.get('src', {

                    src_tmp_Content: src_Content
                });

                Lampa.Modal.open({
                    title: '',
                    select: src_render_templates.find('.navigation-tabs__button.active')[0],
                    html: src_render_templates,
                    onBack: function onBack() {

                        Lampa.Modal.close();
                        Lampa.Controller.toggle('content');
                    },
                    onSelect: function onSelect(a) {
                        const src_swap = a.attr('data-src');

                        Lampa.Storage.set("source", src_swap);
                        updateActivitySource(src_swap);

                        Lampa.Modal.close();
                        try {
                            Lampa.Activity.push({
                                url: '',
                                title: Lampa.Lang.translate('title_main') + ' - ' + Lampa.Storage.get('source').toUpperCase(),
                                component: 'main',
                                source: src_swap
                            });

                        } catch (e) {
                            console.log('Swap_src', 'Ошибка чтения storage: ', e);
                        }

                    }
                });
            }

            $(srcElement).on('hover:enter', swap_src);

        } else {

            console.log('Swap_src', 'Элемент .open--search не найден!');
        }
    }

    if (window.appready) {
        srcswp();
    }
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                srcswp();
            }
        });
    }
})();
