(function () {
    'use strict';

    function startPlugin() {
        if (Lampa.Storage.get('full_btn_priority') === undefined) {
            Lampa.Storage.set('full_btn_priority', '{}');
        }

        const STORAGE_KEY = 'full_btn_priority';

        // Добавление кастомных стилей
        Lampa.Template.add('custom-context-style', `
        <style>
            .custom-context-menu {
                background: rgba(20, 20, 20, 0.95);
                border-radius: 10px;
                padding: 10px;
                color: white;
                font-size: 16px;
                min-width: 200px;
                position: fixed;
                z-index: 1000;
                max-height: 90vh;
                overflow-y: auto;
            }
            .context-item {
                padding: 8px 12px;
                cursor: pointer;
            }
            .context-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        </style>
        `);
        $('body').append(Lampa.Template.get('custom-context-style'));

        function getStorage() {
            try {
                return JSON.parse(Lampa.Storage.get(STORAGE_KEY)) || {};
            } catch (e) {
                console.warn('Storage corrupted, resetting...');
                Lampa.Storage.set(STORAGE_KEY, '{}');
                return {};
            }
        }

        function setStorage(data) {
            Lampa.Storage.set(STORAGE_KEY, JSON.stringify(data));
        }

        function applyButtonSettings($button, key, settings) {
            if (settings.hidden) $button.hide();
            if (settings.title) $button.find('.full-start__button-name').text(settings.title);
        }

        function showContextMenu($button, x = null, y = null) {
            $('.custom-context-menu').remove();

            const menu = $('<div class="custom-context-menu">');

            const windowHeight = $(window).height();
            const menuHeight = 200;
            const adjustedTop = Math.min(y || $button.offset().top + $button.height(), windowHeight - menuHeight);
            const left = x || $button.offset().left;

            menu.css({ top: adjustedTop, left: left }).appendTo('body');

            const key = $button.data('key');
            const storage = getStorage();

            const actions = [
                { title: 'Сдвинуть влево', action: () => {
                    $button.prev().before($button);
                    updateOrder();
                }},
                { title: 'Сдвинуть вправо', action: () => {
                    $button.next().after($button);
                    updateOrder();
                }},
                { title: 'Скрыть', action: () => {
                    $button.hide();
                    storage[key] = storage[key] || {};
                    storage[key].hidden = true;
                    setStorage(storage);
                }},
                { title: 'Показать скрытые', action: () => {
                    $('.full-start__button:hidden').show();
                    Object.keys(storage).forEach(k => {
                        if (storage[k].hidden) delete storage[k].hidden;
                    });
                    setStorage(storage);
                }},
                { title: 'Сменить название', action: () => {
                    const newName = prompt('Новое название кнопки:', $button.text().trim());
                    if (newName) {
                        $button.find('.full-start__button-name').text(newName);
                        storage[key] = storage[key] || {};
                        storage[key].title = newName;
                        setStorage(storage);
                    }
                }},
                { title: 'Сбросить все настройки', action: () => {
                    if (confirm('Сбросить все настройки кнопок?')) {
                        Lampa.Storage.set(STORAGE_KEY, '{}');
                        location.reload();
                    }
                }}
            ];

            actions.forEach(item => {
                $('<div class="context-item">').text(item.title).on('click', () => {
                    menu.remove();
                    item.action();
                }).appendTo(menu);
            });

            $(document).one('click', () => menu.remove());
        }

        function updateOrder() {
            const storage = getStorage();
            const buttons = $('.full-start-new__buttons .full-start__button');
            buttons.each((i, el) => {
                const key = $(el).data('key');
                storage[key] = storage[key] || {};
                storage[key].order = i;
            });
            setStorage(storage);
        }

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                setTimeout(function () {
                    const fullContainer = e.object.activity.render();
                    const targetContainer = fullContainer.find('.full-start-new__buttons');

                    fullContainer.find('.button--play').remove();

                    const allButtons = fullContainer.find('.buttons--container .full-start__button')
                        .add(targetContainer.find('.full-start__button'));

                    const storage = getStorage();
                    const buttonArray = [];

                    allButtons.each(function () {
                        const $btn = $(this);
                        const name = $btn.text().trim().toLowerCase();
                        const key = name.replace(/[^a-z0-9]/gi, '_');
                        $btn.attr('data-key', key);
                        $btn.data('key', key);
                        applyButtonSettings($btn, key, storage[key] || {});
                        buttonArray.push({ key, $btn, order: storage[key]?.order ?? 999 });
                    });

                    buttonArray.sort((a, b) => a.order - b.order);

                    targetContainer.empty();
                    buttonArray.forEach(({ $btn }) => {
                        targetContainer.append($btn);

                        let holdTimer;

                        $btn.on('keydown', function (e) {
                            if (e.keyCode === 13) {
                                holdTimer = setTimeout(() => showContextMenu($btn), 800);
                            }
                        }).on('keyup', function (e) {
                            if (e.keyCode === 13) clearTimeout(holdTimer);
                        });

                        $btn.on('contextmenu', function (e) {
                            e.preventDefault();
                            showContextMenu($btn, e.pageX, e.pageY);
                        });
                    });

                    Lampa.Controller.toggle("full_start");
                }, 100);
            }
        });

        if (typeof module !== 'undefined' && module.exports) {
            module.exports = {};
        }
    }

    startPlugin();
})();
