(function() {
    'use strict';

    const STYLE_TAG = 'cardbtn-style';
    const ORDER_STORAGE = 'cardbtn_order';
    const HIDE_STORAGE = 'cardbtn_hidden';
    const RENAME_STORAGE = 'cardbtn_renamed';
    let currentCard = null;
    let currentActivity = null;
    let renameModalActive = false;

    const DEFAULT_LABELS = {
        'button--play': () => Lampa.Lang.translate('title_watch'),
        'button--book': () => Lampa.Lang.translate('settings_input_links'),
        'button--reaction': () => Lampa.Lang.translate('title_reactions'),
        'button--subscribe': () => Lampa.Lang.translate('title_subscribe'),
        'button--options': () => Lampa.Lang.translate('more'),
        'view--torrent': () => Lampa.Lang.translate('full_torrents'),
        'view--trailer': () => Lampa.Lang.translate('full_trailers')
    };

    // Прямая работа с localStorage
    function localStorageGet(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            if (data === null) return defaultValue;
            
            if (data.startsWith('[') || data.startsWith('{')) {
                return JSON.parse(data);
            }
            return data;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    }

    function localStorageSet(key, value) {
        try {
            if (typeof value === 'object' || Array.isArray(value)) {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                localStorage.setItem(key, value);
            }
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    function getStoredArray(key) {
        const data = localStorageGet(key, []);
        if (Array.isArray(data)) return data.slice();
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return data.split(',').map(v => v.trim()).filter(Boolean);
            }
        }
        return [];
    }

    function getRenamedButtons() {
        const data = localStorageGet(RENAME_STORAGE, {});
        return data && typeof data === 'object' ? data : {};
    }

    // Также сохраняем через Lampa.Storage для совместимости
    function saveToBoth(key, value) {
        localStorageSet(key, value);
        if (Lampa.Storage && Lampa.Storage.set) {
            Lampa.Storage.set(key, value);
        }
    }

    function addStyles() {
        if (document.getElementById(STYLE_TAG)) return;
        const css = `
            .card-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            .card-button-hidden {
                display: none !important;
            }
            .card-icons-only span {
                display: none;
            }
            .card-always-text span {
                display: block !important;
            }
            .head__action.edit-card svg {
                width: 26px;
                height: 26px;
            }
            .menu-edit-list__rename {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 26px;
                height: 26px;
                margin-right: 10px;
                opacity: 0.7;
                transition: opacity 0.2s;
                border-radius: 3px;
            }
            .menu-edit-list__rename:hover,
            .menu-edit-list__rename.focus {
                opacity: 1;
                border: 2px solid rgba(255, 255, 255, 0.8);
            }
            .menu-edit-list__rename svg {
                width: 18px;
                height: 18px;
            }
            .menu-edit-list__move {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 26px;
                height: 26px;
                margin-right: 10px;
                opacity: 0.7;
                transition: opacity 0.2s;
                border-radius: 3px;
            }
            .menu-edit-list__move:hover,
            .menu-edit-list__move.focus {
                opacity: 1;
                border: 2px solid rgba(255, 255, 255, 0.8);
            }
            .menu-edit-list__move svg {
                width: 18px;
                height: 18px;
            }
            .menu-edit-list__toggle {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 26px;
                height: 26px;
                opacity: 0.7;
                transition: opacity 0.2s;
                border-radius: 3px;
            }
            .menu-edit-list__toggle:hover,
            .menu-edit-list__toggle.focus {
                opacity: 1;
                border: 2px solid rgba(255, 255, 255, 0.8);
            }
            .menu-edit-list__toggle svg {
                width: 20px;
                height: 20px;
            }
            .menu-edit-list__item-hidden .menu-edit-list__title {
                opacity: 0.5;
                text-decoration: line-through;
            }
        `;
        $('head').append(`<style id="${STYLE_TAG}">${css}</style>`);
    }

    function getCardContainer(e) {
        if (e && e.body) return e.body;
        if (e && e.link && e.link.html) return e.link.html;
        if (e && e.object && e.object.activity && typeof e.object.activity.render === 'function') return e.object.activity.render();
        return null;
    }

    function findActiveCard() {
        const active = $('.full-start-new').first();
        return active.length ? active : null;
    }

    function capitalize(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function extractButtonKey($element) {
        // Пытаемся найти data-id или data-name
        let key = $element.data('id') || $element.data('name') || $element.attr('data-id') || $element.attr('data-name');
        
        if (key) return `data:${key}`;
        
        // Проверяем все классы
        const classes = ($element.attr('class') || '').split(/\s+/);
        
        // Ищем modss в классах
        const modssClass = classes.find(c => c.includes('modss') || c.includes('mods'));
        if (modssClass) return `modss:${modssClass}`;
        
        // Ищем reaction/rate в классах
        const reactionClass = classes.find(c => c.includes('reaction') || c.includes('rate'));
        if (reactionClass) return `reaction:${reactionClass}`;
        
        // Ищем online в классах
        const onlineClass = classes.find(c => c.includes('online'));
        if (onlineClass) return `online:${onlineClass}`;
        
        // Ищем стандартные классы
        const buttonClass = classes.find(c => c.startsWith('button--') && c !== 'button--priority');
        if (buttonClass) return `button:${buttonClass}`;
        
        const viewClass = classes.find(c => c.startsWith('view--'));
        if (viewClass) return `view:${viewClass}`;
        
        // Используем текст кнопки
        const text = $element.text().trim();
        if (text) {
            const cleanText = text.replace(/\s+/g, '_').replace(/[^\wа-яА-ЯёЁ_]/g, '').toLowerCase();
            // Создаем уникальный ключ на основе текста и хэша
            const hash = Lampa.Utils.hash($element.prop('outerHTML')).substring(0, 8);
            return `text:${cleanText}_${hash}`;
        }
        
        // Если ничего не нашли, используем хэш
        const html = $element.clone().removeClass('focus').prop('outerHTML');
        return `hash:${Lampa.Utils.hash(html)}`;
    }

    function extractButtonLabel(key, $element, allButtons = []) {
        const renamed = getRenamedButtons();
        if (renamed[key]) return renamed[key];
        
        // Берем текст из span или из всей кнопки
        const spanText = $element.find('span').first().text().trim();
        if (spanText) {
            // Проверяем, есть ли другие кнопки с таким же текстом
            const sameTextCount = allButtons.filter(btn => 
                btn.find('span').first().text().trim() === spanText
            ).length;
            
            if (sameTextCount > 1) {
                const subtitle = $element.attr('data-subtitle') || '';
                if (subtitle) {
                    return spanText + ' <span style="opacity:0.5">(' + subtitle.substring(0, 30) + ')</span>';
                }
                
                // Используем класс для идентификации
                const classes = ($element.attr('class') || '').split(/\s+/);
                const viewClass = classes.find(c => c.startsWith('view--'));
                if (viewClass) {
                    const identifier = viewClass.replace('view--', '').replace(/_/g, ' ');
                    return spanText + ' <span style="opacity:0.5">(' + capitalize(identifier) + ')</span>';
                }
            }
            return spanText;
        }
        
        const fullText = $element.text().trim();
        if (fullText) return fullText;
        
        // Пробуем получить текст из data-атрибутов
        const dataText = $element.data('text') || $element.attr('data-text');
        if (dataText) return dataText;
        
        // Если нет текста, пробуем извлечь из классов
        const classes = ($element.attr('class') || '').split(/\s+/);
        
        // Ищем view-- классы
        const viewClass = classes.find(c => c.startsWith('view--'));
        if (viewClass) {
            const viewName = viewClass.replace('view--', '').replace(/_/g, ' ');
            return capitalize(viewName);
        }
        
        // Ищем button-- классы
        const buttonClass = classes.find(c => c.startsWith('button--') && c !== 'button--priority');
        if (buttonClass) {
            const buttonName = buttonClass.replace('button--', '').replace(/_/g, ' ');
            return capitalize(buttonName);
        }
        
        // Проверяем специальные классы
        if (classes.find(c => c.includes('modss'))) return 'MODSS';
        if (classes.find(c => c.includes('reaction'))) return 'Оценить';
        if (classes.find(c => c.includes('online'))) return 'Онлайн';
        if (classes.find(c => c.includes('book'))) return 'Закладки';
        if (classes.find(c => c.includes('torrent'))) return 'Торренты';
        if (classes.find(c => c.includes('trailer'))) return 'Трейлеры';
        
        // Пробуем извлечь из ключа
        if (key.startsWith('text:')) {
            const textPart = key.substring(5).split('_')[0];
            return textPart.replace(/_/g, ' ');
        }
        
        if (key.startsWith('button:')) {
            const buttonType = key.substring(7);
            if (DEFAULT_LABELS[buttonType]) {
                return DEFAULT_LABELS[buttonType]();
            }
            return capitalize(buttonType.replace('button--', '').replace(/_/g, ' '));
        }
        
        if (key.startsWith('view:')) {
            const viewType = key.substring(5);
            if (viewType === 'view--torrent') return 'Торренты';
            if (viewType === 'view--trailer') return 'Трейлеры';
            return capitalize(viewType.replace('view--', '').replace(/_/g, ' '));
        }
        
        // Возвращаем пустую строку вместо "Кнопка"
        return '';
    }

    function collectButtons(container, remove) {
        const mainArea = container.find('.full-start-new__buttons');
        const extraArea = container.find('.buttons--container');
        const keys = [];
        const elements = {};
        
        function process($items) {
            $items.each(function() {
                const $item = $(this);
                if ($item.hasClass('button--play') || $item.hasClass('button--priority')) return;
                
                const key = extractButtonKey($item);
                if (!key) return;
                
                // Сохраняем оригинальный элемент для будущего использования
                if (remove) {
                    const cloned = $item.clone(true, true);
                    elements[key] = {
                        element: $item.detach(),
                        original: cloned
                    };
                } else {
                    elements[key] = {
                        element: $item,
                        original: $item.clone(true, true)
                    };
                }
                keys.push(key);
            });
        }
        
        process(mainArea.find('.full-start__button'));
        process(extraArea.find('.full-start__button'));
        
        return {
            keys,
            elements,
            mainArea,
            extraArea
        };
    }

    function buildOrder(saved, available) {
        const result = [];
        const known = new Set(available);
        
        // Сначала добавляем сохраненные ключи, которые есть в доступных
        saved.forEach(k => {
            if (known.has(k)) result.push(k);
        });
        
        // Затем добавляем новые кнопки, которых нет в сохраненном порядке
        available.forEach(k => {
            if (!result.includes(k)) result.push(k);
        });
        
        return result;
    }

    function hideButtons(elements) {
        const hidden = new Set(getStoredArray(HIDE_STORAGE));
        
        Object.keys(elements).forEach(k => {
            if (elements[k] && elements[k].element) {
                elements[k].element.toggleClass('card-button-hidden', hidden.has(k));
            }
        });
    }

    function rebuildCard(container) {
        // Проверяем через localStorage
        const showAll = localStorageGet('cardbtn_showall', false);
        if (!showAll && Lampa.Storage) {
            // Также проверяем через Lampa.Storage для совместимости
            const lampaShowAll = Lampa.Storage.get('cardbtn_showall');
            if (lampaShowAll !== true) return;
        } else if (!showAll) {
            return;
        }

        if (!container || !container.length) return;

        addStyles();

        const header = container.find('.head__actions');
        if (header.length) {
            let pencil = header.find('.edit-card');
            if (pencil.length === 0) {
                pencil = $(`
                    <div class="head__action selector edit-card">
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                `);

                header.find('.open--settings').after(pencil);

                pencil.on('hover:enter', () => {
                    startEditor(container, false);
                });
            }
        }

        const priorityBtn = container.find('.full-start-new__buttons .button--priority').detach();
        container.find('.full-start-new__buttons .button--play').remove();

        const collected = collectButtons(container, true);
        const { keys, elements, mainArea } = collected;

        const saved = getStoredArray(ORDER_STORAGE);
        let ordered = buildOrder(saved, keys);

        if (saved.length === 0) {
            ordered.sort((a, b) => {
                // Приоритет для modss и online кнопок
                const aPriority = a.includes('modss') || a.includes('online') || a.startsWith('button:');
                const bPriority = b.includes('modss') || b.includes('online') || b.startsWith('button:');
                if (aPriority && !bPriority) return -1;
                if (!aPriority && bPriority) return 1;
                return 0;
            });
        }

        mainArea.empty();
        if (priorityBtn.length) mainArea.append(priorityBtn);
        
        // Получаем переименованные кнопки
        const renamedButtons = getRenamedButtons();
        
        ordered.forEach(k => {
            if (elements[k] && elements[k].element) {
                const $btn = elements[k].element;
                // Применяем переименованное название если есть
                if (renamedButtons[k]) {
                    const span = $btn.find('span').first();
                    if (span.length) {
                        span.text(renamedButtons[k]);
                    } else {
                        const icon = $btn.find('svg').first();
                        if (icon.length) {
                            icon.after(`<span>${renamedButtons[k]}</span>`);
                        } else {
                            $btn.append(`<span>${renamedButtons[k]}</span>`);
                        }
                    }
                }
                mainArea.append($btn);
            }
        });

        const mode = localStorageGet('cardbtn_viewmode', 'default');
        mainArea.removeClass('card-icons-only card-always-text');
        if (mode === 'icons') mainArea.addClass('card-icons-only');
        if (mode === 'always') mainArea.addClass('card-always-text');

        mainArea.addClass('card-buttons');
        hideButtons(elements);

        if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
            setTimeout(() => {
                Lampa.Controller.toggle("full_start");
            }, 100);
        }

        if (currentActivity && currentActivity.html && container[0] === currentActivity.html[0]) {
            const first = mainArea.find('.full-start__button.selector').not('.hide').not('.card-button-hidden').first();
            if (first.length) currentActivity.last = first[0];
        }
    }

    // Функция для сохранения порядка из редактора
    function saveOrderFromEditor(editorList) {
        const newOrder = [];
        editorList.find('.menu-edit-list__item').each(function() {
            const k = $(this).data('id');
            if (k) newOrder.push(k);
        });
        saveToBoth(ORDER_STORAGE, newOrder);
        return newOrder;
    }

    // Упрощенная функция переименования
    function openRenameModal(key, currentLabel, callback) {
        renameModalActive = true;
        
        const cleanLabel = currentLabel.replace(/<[^>]*>/g, '');
        
        // Используем стандартный Input.edit от Lampa
        Lampa.Input.edit({
            free: true,
            title: 'Переименовать кнопку',
            nosave: false,
            value: cleanLabel,
            nomic: true,
            maxlength: 50,
            placeholder: 'Введите новое название'
        }, function(newName) {
            renameModalActive = false;
            if (newName && newName.trim() !== cleanLabel) {
                const trimmedName = newName.trim();
                callback(trimmedName);
                
                // Сохраняем в хранилище
                const renamedButtons = getRenamedButtons();
                renamedButtons[key] = trimmedName;
                saveToBoth(RENAME_STORAGE, renamedButtons);
                
                // Немедленно обновляем текущую карточку
                if (currentCard && currentCard.length) {
                    rebuildCard(currentCard);
                }
            }
        }, function() {
            renameModalActive = false;
        });
    }

    function startEditor(container, fromSettings = false) {
        if (!container || !container.length) return;

        const collected = collectButtons(container, false);
        const { keys, elements } = collected;

        // Получаем все кнопки для передачи в extractButtonLabel
        const allButtonsArray = Object.values(elements).map(item => item.element);

        const ordered = buildOrder(getStoredArray(ORDER_STORAGE), keys);
        const hidden = new Set(getStoredArray(HIDE_STORAGE));
        const renamed = getRenamedButtons();

        const editorList = $('<div class="menu-edit-list"></div>');

        ordered.forEach(k => {
            const elementData = elements[k];
            if (!elementData || !elementData.element) return;

            const $elem = elementData.element;
            // Используем переименованное название если есть, иначе оригинальное
            let label = renamed[k] || extractButtonLabel(k, $elem, allButtonsArray);
            
            const svg = $elem.find('svg').first().prop('outerHTML') || '';

            const row = $(`
                <div class="menu-edit-list__item" data-id="${k}">
                    <div class="menu-edit-list__icon"></div>
                    <div class="menu-edit-list__title">${label || '...'}</div>
                    <div class="menu-edit-list__rename selector">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                    <div class="menu-edit-list__move move-up selector">
                        <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="menu-edit-list__move move-down selector">
                        <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="menu-edit-list__toggle toggle selector">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>
                            <path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="0" stroke-linecap="round"/>
                        </svg>
                    </div>
                </div>
            `);

            if (svg) row.find('.menu-edit-list__icon').append(svg);

            const isHidden = hidden.has(k);
            row.toggleClass('menu-edit-list__item-hidden', isHidden);
            row.find('.dot').attr('opacity', isHidden ? 0 : 1);

            // Добавляем обработчики фокуса для всех кнопок действий
            const renameBtn = row.find('.menu-edit-list__rename');
            const moveUpBtn = row.find('.move-up');
            const moveDownBtn = row.find('.move-down');
            const toggleBtn = row.find('.toggle');

            // Обработчики для кнопки "Переименовать"
            renameBtn.on('hover:enter', (e) => {
                e.stopPropagation();
                Lampa.Modal.close();
                setTimeout(() => {
                    openRenameModal(k, label || '', (newName) => {
                        const renamedButtons = getRenamedButtons();
                        renamedButtons[k] = newName;
                        saveToBoth(RENAME_STORAGE, renamedButtons);
                        
                        if (currentCard && currentCard.length) {
                            rebuildCard(currentCard);
                        }
                        
                        setTimeout(() => {
                            startEditor(container, fromSettings);
                        }, 100);
                    });
                }, 100);
            });

            // Обработчики для кнопок перемещения
            moveUpBtn.on('hover:enter', () => {
                const prev = row.prev();
                if (prev.length) {
                    row.insertBefore(prev);
                    saveOrderFromEditor(editorList);
                }
            });

            moveDownBtn.on('hover:enter', () => {
                const next = row.next();
                if (next.length) {
                    row.insertAfter(next);
                    saveOrderFromEditor(editorList);
                }
            });

            // Обработчик для кнопки скрытия/показа
            toggleBtn.on('hover:enter', () => {
                const newHidden = !row.hasClass('menu-edit-list__item-hidden');
                row.toggleClass('menu-edit-list__item-hidden', newHidden);
                row.find('.dot').attr('opacity', newHidden ? 0 : 1);
                
                // Обновляем заголовок кнопки
                toggleBtn.attr('title', newHidden ? 'Показать' : 'Скрыть');
                
                // Немедленно сохраняем состояние скрытия
                const hiddenButtons = getStoredArray(HIDE_STORAGE);
                const index = hiddenButtons.indexOf(k);
                if (newHidden) {
                    if (index === -1) hiddenButtons.push(k);
                } else {
                    if (index !== -1) hiddenButtons.splice(index, 1);
                }
                saveToBoth(HIDE_STORAGE, hiddenButtons);
                
                // Немедленно применяем к карточке
                if (currentCard && currentCard.length) {
                    const elements = collectButtons(currentCard, false).elements;
                    if (elements[k] && elements[k].element) {
                        elements[k].element.toggleClass('card-button-hidden', newHidden);
                    }
                }
            });

            // Добавляем навигацию с клавиатуры для всех кнопок
            row.on('focusin', function() {
                // При фокусе на строке, фокусируем первую кнопку (Переименовать)
                if (!renameBtn.hasClass('focus') && 
                    !moveUpBtn.hasClass('focus') && 
                    !moveDownBtn.hasClass('focus') && 
                    !toggleBtn.hasClass('focus')) {
                    renameBtn.addClass('focus');
                }
            });

            // Обработка навигации между кнопками в строке
            row.on('navleft', function() {
                if (toggleBtn.hasClass('focus')) {
                    toggleBtn.removeClass('focus');
                    moveDownBtn.addClass('focus');
                } else if (moveDownBtn.hasClass('focus')) {
                    moveDownBtn.removeClass('focus');
                    moveUpBtn.addClass('focus');
                } else if (moveUpBtn.hasClass('focus')) {
                    moveUpBtn.removeClass('focus');
                    renameBtn.addClass('focus');
                }
            });

            row.on('navright', function() {
                if (renameBtn.hasClass('focus')) {
                    renameBtn.removeClass('focus');
                    moveUpBtn.addClass('focus');
                } else if (moveUpBtn.hasClass('focus')) {
                    moveUpBtn.removeClass('focus');
                    moveDownBtn.addClass('focus');
                } else if (moveDownBtn.hasClass('focus')) {
                    moveDownBtn.removeClass('focus');
                    toggleBtn.addClass('focus');
                }
            });

            // Обработка нажатия Enter на кнопках
            row.on('hover:enter', function(e) {
                // Если фокус на кнопке "Переименовать"
                if (renameBtn.hasClass('focus')) {
                    renameBtn.trigger('hover:enter');
                }
                // Если фокус на кнопке "Вверх"
                else if (moveUpBtn.hasClass('focus')) {
                    moveUpBtn.trigger('hover:enter');
                }
                // Если фокус на кнопке "Вниз"
                else if (moveDownBtn.hasClass('focus')) {
                    moveDownBtn.trigger('hover:enter');
                }
                // Если фокус на кнопке "Скрыть/Показать"
                else if (toggleBtn.hasClass('focus')) {
                    toggleBtn.trigger('hover:enter');
                }
                // Если ни одна кнопка не в фокусе, фокусируем "Переименовать"
                else {
                    e.stopPropagation();
                    renameBtn.addClass('focus');
                }
            });

            editorList.append(row);
        });

        // Добавляем кнопку сброса
        const resetBtn = $(`
            <div class="menu-edit-list__item selector" style="justify-content: center; margin-top: 20px; background: rgba(200, 100, 100, 0.2); border-radius: 5px;">
                <div class="menu-edit-list__title" style="text-align: center;">Сбросить по умолчанию</div>
            </div>
        `);

        resetBtn.on('hover:enter', () => {
            // Очищаем все сохраненные данные
            localStorage.removeItem(ORDER_STORAGE);
            localStorage.removeItem(HIDE_STORAGE);
            localStorage.removeItem(RENAME_STORAGE);
            
            // Также очищаем через Lampa.Storage если доступен
            if (Lampa.Storage && Lampa.Storage.set) {
                Lampa.Storage.set(ORDER_STORAGE, []);
                Lampa.Storage.set(HIDE_STORAGE, []);
                Lampa.Storage.set(RENAME_STORAGE, {});
            }
            
            Lampa.Modal.close();
            if (Lampa.Noty && Lampa.Noty.show) {
                Lampa.Noty.show('Настройки сброшены');
            }
            
            setTimeout(() => {
                if (container && container.length) {
                    rebuildCard(container);
                }
            }, 100);
        });

        editorList.append(resetBtn);

        // Инициализация навигации при открытии редактора
        setTimeout(() => {
            // Фокусируем первую строку и первую кнопку в ней
            const firstRow = editorList.find('.menu-edit-list__item').first();
            if (firstRow.length) {
                const firstRenameBtn = firstRow.find('.menu-edit-list__rename');
                if (firstRenameBtn.length) {
                    firstRenameBtn.addClass('focus');
                }
            }
        }, 100);

        // Открываем модальное окно редактора
        Lampa.Modal.open({
            title: 'Редактировать кнопки',
            html: editorList,
            size: 'small',
            scroll_to_center: true,
            onBack: () => {
                saveOrderFromEditor(editorList);
                Lampa.Modal.close();
                
                if (container && container.length) {
                    rebuildCard(container);
                }
                
                setTimeout(() => {
                    if (fromSettings && Lampa.Controller) {
                        Lampa.Controller.toggle("settings_component");
                    } else if (Lampa.Controller) {
                        Lampa.Controller.toggle("full_start");
                    }
                }, 100);
            }
        });
    }

    function startEditorFromSettings() {
        if (!currentCard || !currentCard.length || !document.body.contains(currentCard[0])) {
            const active = findActiveCard();
            if (active && active.length) {
                currentCard = active;
            }
        }

        if (!currentCard || !currentCard.length) {
            Lampa.Modal.open({
                title: Lampa.Lang.translate('title_error'),
                html: Lampa.Template.get('error', {
                    title: Lampa.Lang.translate('title_error'),
                    text: 'Редактировать кнопки можно только после открытия карточки фильма'
                }),
                size: 'small',
                onBack: () => {
                    Lampa.Modal.close();
                    setTimeout(() => {
                        if (Lampa.Controller) {
                            Lampa.Controller.toggle("settings_component");
                        }
                    }, 100);
                }
            });
            return;
        }

        startEditor(currentCard, true);
    }

    function cardListener() {
        Lampa.Listener.follow('full', e => {
            if (e.type === 'build' && e.name === 'start' && e.item && e.item.html) {
                currentActivity = e.item;
            }
            if (e.type === 'complite') {
                const container = getCardContainer(e);
                if (!container) return;
                currentCard = container;
                
                // Небольшая задержка чтобы все кнопки успели загрузиться
                setTimeout(() => {
                    rebuildCard(container);
                }, 300);
            }
        });
    }

    const CardHandler = {
        run: cardListener,
        fromSettings: startEditorFromSettings
    };

    function setupSettings() {
        // Сначала проверяем существующие настройки
        const existingSettings = localStorageGet('cardbtn_showall', false);
        
        Lampa.SettingsApi.addComponent({
            component: "cardbtn",
            name: 'Кнопки в карточке',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: "cardbtn",
            param: {
                name: "cardbtn_showall",
                type: "trigger",
                default: existingSettings
            },
            field: {
                name: 'Все кнопки в карточке',
                description: 'Требуется перезагрузить приложение после включения'
            },
            onChange: (value) => {
                // Сохраняем в localStorage
                localStorageSet('cardbtn_showall', value);
                
                // Также сохраняем в Lampa.Storage
                if (Lampa.Storage && Lampa.Storage.set) {
                    Lampa.Storage.set('cardbtn_showall', value);
                }
                
                Lampa.Settings.update();
                
                // Перезагружаем текущую карточку если она открыта
                if (currentCard && currentCard.length) {
                    setTimeout(() => {
                        rebuildCard(currentCard);
                    }, 500);
                }
            },
            onRender: function(element, component) {
                // Устанавливаем текущее значение из localStorage
                const currentValue = localStorageGet('cardbtn_showall', false);
                const checkbox = element.find('input[type="checkbox"]');
                if (checkbox.length) {
                    checkbox.prop('checked', currentValue);
                }
            }
        });

        // Проверяем включен ли плагин
        const isEnabled = localStorageGet('cardbtn_showall', false);
        
        if (isEnabled) {
            const currentMode = localStorageGet('cardbtn_viewmode', 'default');
            
            Lampa.SettingsApi.addParam({
                component: "cardbtn",
                param: {
                    name: "cardbtn_viewmode",
                    type: "select",
                    values: {
                        default: 'Стандартный',
                        icons: 'Только иконки кнопок',
                        always: 'Текст в кнопках'
                    },
                    default: currentMode
                },
                field: {
                    name: 'Режим отображения кнопок'
                },
                onChange: (value) => {
                    localStorageSet('cardbtn_viewmode', value);
                    
                    if (Lampa.Storage && Lampa.Storage.set) {
                        Lampa.Storage.set('cardbtn_viewmode', value);
                    }
                    
                    Lampa.Settings.update();
                    
                    if (currentCard && currentCard.length) {
                        setTimeout(() => {
                            rebuildCard(currentCard);
                        }, 100);
                    }
                }
            });

            Lampa.SettingsApi.addParam({
                component: "cardbtn",
                param: {
                    name: "cardbtn_editor",
                    type: "button"
                },
                field: {
                    name: 'Редактировать кнопки',
                    description: 'Изменить порядок, скрыть или переименовать кнопки'
                },
                onChange: () => {
                    CardHandler.fromSettings();
                }
            });
        }
    }

    const SettingsConfig = {
        run: setupSettings
    };

    const pluginInfo = {
        type: "other",
        version: "1.1.1",
        author: '@custom',
        name: "Кастомные кнопки карточки",
        description: "Управление кнопками действий в карточке фильма/сериала",
        component: "cardbtn"
    };

    // Загружает плагин (манифест, настройки, обработчики)
    function loadPlugin() {
      Lampa.Manifest.plugins = pluginInfo;
      SettingsConfig.run();
      if (Lampa.Storage.get('cardbtn_showall') === true) {
        CardHandler.run();
      }
    }

    // Инициализация плагина при готовности приложения
    function init() {
      window.plugin_cardbtn_ready = true;
      if (window.appready) loadPlugin();
      else {
        Lampa.Listener.follow("app", e => {
          if (e.type === "ready") loadPlugin();
        });
      }
    }

    if (!window.plugin_cardbtn_ready) init();

})();

