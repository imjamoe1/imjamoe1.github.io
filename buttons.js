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
        if (data && typeof data === 'object') {
            const result = {};
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    result[key] = data[key];
                }
            }
            return result;
        }
        return {};
    }

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
            .card-icons-only .full-start__button:not(.button-empty) span {
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
            .button-empty span {
                display: none !important;
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
        const html = $element.clone().removeClass('focus').prop('outerHTML');
        const hash = Lampa.Utils.hash(html).substring(0, 12);
        
        const text = $element.text().trim() || $element.find('span').first().text().trim();
        const classes = ($element.attr('class') || '').split(/\s+/);
        
        let baseType = 'button';
        if (classes.find(c => c.startsWith('view--'))) baseType = 'view';
        if (classes.find(c => c.includes('modss'))) baseType = 'modss';
        if (classes.find(c => c.includes('reaction'))) baseType = 'reaction';
        if (classes.find(c => c.includes('online'))) baseType = 'online';
        if (classes.find(c => c.includes('torrent'))) baseType = 'torrent';
        if (classes.find(c => c.includes('trailer'))) baseType = 'trailer';
        if (classes.find(c => c.includes('book'))) baseType = 'book';
        
        return `${baseType}:${hash}`;
    }

    function extractButtonLabel(key, $element, allButtons = []) {
        const renamed = getRenamedButtons();
        if (renamed.hasOwnProperty(key)) {
            return renamed[key] === '' ? '<span style="opacity:0.5"><i>(без текста)</i></span>' : renamed[key];
        }
        
        const spanText = $element.find('span').first().text().trim();
        if (spanText) {
            const sameTextCount = allButtons.filter(btn => 
                btn.find('span').first().text().trim() === spanText
            ).length;
            
            if (sameTextCount > 1) {
                const subtitle = $element.attr('data-subtitle') || '';
                if (subtitle) {
                    return spanText + ' <span style="opacity:0.5">(' + subtitle.substring(0, 30) + ')</span>';
                }
                
                const classes = ($element.attr('class') || '').split(/\s+/);
                const viewClass = classes.find(c => c.startsWith('view--'));
                if (viewClass) {
                    const identifier = viewClass.replace('view--', '').replace(/_/g, ' ');
                    return spanText + ' <span style="opacity:0.5">(' + capitalize(identifier) + ')</span>';
                }
                
                const index = allButtons.findIndex(btn => 
                    btn.find('span').first().text().trim() === spanText
                );
                if (index !== -1) {
                    return spanText + ` <span style="opacity:0.5">(${index + 1})</span>`;
                }
            }
            return spanText;
        }
        
        const fullText = $element.text().trim();
        if (fullText) return fullText;
        
        const dataText = $element.data('text') || $element.attr('data-text');
        if (dataText) return dataText;
        
        const classes = ($element.attr('class') || '').split(/\s+/);
        
        const viewClass = classes.find(c => c.startsWith('view--'));
        if (viewClass) {
            const viewName = viewClass.replace('view--', '').replace(/_/g, ' ');
            return capitalize(viewName);
        }
        
        const buttonClass = classes.find(c => c.startsWith('button--') && c !== 'button--priority');
        if (buttonClass) {
            const buttonName = buttonClass.replace('button--', '').replace(/_/g, ' ');
            return capitalize(buttonName);
        }
        
        if (classes.find(c => c.includes('modss'))) return 'MODSS';
        if (classes.find(c => c.includes('reaction'))) return 'Оценить';
        if (classes.find(c => c.includes('online'))) return 'Онлайн';
        if (classes.find(c => c.includes('book'))) return 'Закладки';
        if (classes.find(c => c.includes('torrent'))) return 'Торренты';
        if (classes.find(c => c.includes('trailer'))) return 'Трейлеры';
        
        const baseType = key.split(':')[0];
        return capitalize(baseType);
    }

    function collectButtons(container, remove) {
        const mainArea = container.find('.full-start-new__buttons');
        const extraArea = container.find('.buttons--container');
        const keys = [];
        const elements = {};
        
        function process($items, isMainArea) {
            $items.each(function() {
                const $item = $(this);
                if ($item.hasClass('button--play') || $item.hasClass('button--priority')) return;
                
                const key = extractButtonKey($item);
                if (!key) return;
                
                if (remove) {
                    const cloned = $item.clone(true, true);
                    elements[key] = {
                        element: $item.detach(),
                        original: cloned,
                        isMainArea: isMainArea
                    };
                } else {
                    elements[key] = {
                        element: $item,
                        original: $item.clone(true, true),
                        isMainArea: isMainArea
                    };
                }
                keys.push(key);
            });
        }
        
        process(mainArea.find('.full-start__button'), true);
        process(extraArea.find('.full-start__button'), false);
        
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
        
        saved.forEach(k => {
            if (known.has(k)) result.push(k);
        });
        
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
        const showAll = localStorageGet('cardbtn_showall', false);
        if (!showAll && Lampa.Storage) {
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

        const allButtonsArray = Object.values(elements).map(item => item.original);

        mainArea.empty();
        if (priorityBtn.length) mainArea.append(priorityBtn);
        
        const renamedButtons = getRenamedButtons();
        
        ordered.forEach(k => {
            if (elements[k] && elements[k].element) {
                const $btn = elements[k].element;
                
                $btn.removeClass('button-empty');
                
                if (renamedButtons[k] !== undefined) {
                    if (renamedButtons[k] === '') {
                        $btn.addClass('button-empty');
                        $btn.find('span').remove();
                        $btn.contents().filter(function() {
                            return this.nodeType === 3 && this.textContent.trim() !== '';
                        }).remove();
                    } else {
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

    function saveOrderFromEditor(editorList) {
        const newOrder = [];
        editorList.find('.menu-edit-list__item').each(function() {
            const k = $(this).data('id');
            if (k) newOrder.push(k);
        });
        saveToBoth(ORDER_STORAGE, newOrder);
        return newOrder;
    }

    function saveOrderAfterMove() {
        if (currentCard && currentCard.length) {
            const collected = collectButtons(currentCard, false);
            const { keys } = collected;
            const saved = getStoredArray(ORDER_STORAGE);
            const newOrder = buildOrder(saved, keys);
            saveToBoth(ORDER_STORAGE, newOrder);
        }
    }

    function openRenameModal(key, currentLabel, callback) {
        renameModalActive = true;
        
        const cleanLabel = currentLabel.replace(/<[^>]*>/g, '').replace('(без текста)', '').trim();
        
        Lampa.Input.edit({
            free: true,
            title: 'Переименовать кнопку',
            nosave: false,
            value: cleanLabel,
            nomic: true,
            maxlength: 50,
            placeholder: 'Введите новое название (оставьте пустым для удаления текста)'
        }, function(newName) {
            renameModalActive = false;
            
            const trimmedName = newName === null ? '' : newName.trim();
            
            callback(trimmedName);
            
            const renamedButtons = getRenamedButtons();
            if (trimmedName === '') {
                renamedButtons[key] = '';
            } else {
                renamedButtons[key] = trimmedName;
            }
            saveToBoth(RENAME_STORAGE, renamedButtons);
            
            const currentOrder = getStoredArray(ORDER_STORAGE);
            saveToBoth(ORDER_STORAGE, currentOrder);
            
            if (currentCard && currentCard.length) {
                rebuildCard(currentCard);
            }
        }, function() {
            renameModalActive = false;
        });
    }

    function startEditor(container, fromSettings = false) {
        if (!container || !container.length) return;

        const collected = collectButtons(container, false);
        const { keys, elements } = collected;

        const allButtonsArray = Object.values(elements).map(item => item.element);

        const ordered = buildOrder(getStoredArray(ORDER_STORAGE), keys);
        const hidden = new Set(getStoredArray(HIDE_STORAGE));
        const renamed = getRenamedButtons();

        const editorList = $('<div class="menu-edit-list"></div>');

        ordered.forEach(k => {
            const elementData = elements[k];
            if (!elementData || !elementData.element) return;

            const $elem = elementData.element;
            let label = '';
            if (renamed.hasOwnProperty(k)) {
                label = renamed[k] === '' ? '<span style="opacity:0.5"><i>(без текста)</i></span>' : renamed[k];
            } else {
                label = extractButtonLabel(k, $elem, allButtonsArray);
            }
            
            const svg = $elem.find('svg').first().prop('outerHTML') || '';

            const row = $(`
                <div class="menu-edit-list__item" data-id="${k}">
                    <div class="menu-edit-list__icon"></div>
                    <div class="menu-edit-list__title">${label}</div>
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

            const renameBtn = row.find('.menu-edit-list__rename');
            const moveUpBtn = row.find('.move-up');
            const moveDownBtn = row.find('.move-down');
            const toggleBtn = row.find('.toggle');

            renameBtn.on('hover:enter', (e) => {
                e.stopPropagation();
                Lampa.Modal.close();
                setTimeout(() => {
                    openRenameModal(k, label || '', (newName) => {
                        const renamedButtons = getRenamedButtons();
                        if (newName === '') {
                            renamedButtons[k] = '';
                        } else {
                            renamedButtons[k] = newName;
                        }
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

            moveUpBtn.on('hover:enter', () => {
                const prev = row.prev();
                if (prev.length) {
                    row.insertBefore(prev);
                    saveOrderFromEditor(editorList);
                    saveOrderAfterMove();
                }
            });

            moveDownBtn.on('hover:enter', () => {
                const next = row.next();
                if (next.length) {
                    row.insertAfter(next);
                    saveOrderFromEditor(editorList);
                    saveOrderAfterMove();
                }
            });

            toggleBtn.on('hover:enter', () => {
                const newHidden = !row.hasClass('menu-edit-list__item-hidden');
                row.toggleClass('menu-edit-list__item-hidden', newHidden);
                row.find('.dot').attr('opacity', newHidden ? 0 : 1);
                
                toggleBtn.attr('title', newHidden ? 'Показать' : 'Скрыть');
                
                const hiddenButtons = getStoredArray(HIDE_STORAGE);
                const index = hiddenButtons.indexOf(k);
                if (newHidden) {
                    if (index === -1) hiddenButtons.push(k);
                } else {
                    if (index !== -1) hiddenButtons.splice(index, 1);
                }
                saveToBoth(HIDE_STORAGE, hiddenButtons);
                
                if (currentCard && currentCard.length) {
                    const elements = collectButtons(currentCard, false).elements;
                    if (elements[k] && elements[k].element) {
                        elements[k].element.toggleClass('card-button-hidden', newHidden);
                    }
                }
            });

            row.on('focusin', function() {
                if (!renameBtn.hasClass('focus') && 
                    !moveUpBtn.hasClass('focus') && 
                    !moveDownBtn.hasClass('focus') && 
                    !toggleBtn.hasClass('focus')) {
                    renameBtn.addClass('focus');
                }
            });

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

            row.on('hover:enter', function(e) {
                if (renameBtn.hasClass('focus')) {
                    renameBtn.trigger('hover:enter');
                }
                else if (moveUpBtn.hasClass('focus')) {
                    moveUpBtn.trigger('hover:enter');
                }
                else if (moveDownBtn.hasClass('focus')) {
                    moveDownBtn.trigger('hover:enter');
                }
                else if (toggleBtn.hasClass('focus')) {
                    toggleBtn.trigger('hover:enter');
                }
                else {
                    e.stopPropagation();
                    renameBtn.addClass('focus');
                }
            });

            editorList.append(row);
        });

        const resetBtn = $(`
            <div class="menu-edit-list__item selector" style="justify-content: center; margin-top: 20px; background: rgba(200, 100, 100, 0.2); border-radius: 5px;">
                <div class="menu-edit-list__title" style="text-align: center;">Сбросить по умолчанию</div>
            </div>
        `);

        resetBtn.on('hover:enter', () => {
            localStorage.removeItem(ORDER_STORAGE);
            localStorage.removeItem(HIDE_STORAGE);
            localStorage.removeItem(RENAME_STORAGE);
            
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

        setTimeout(() => {
            const firstRow = editorList.find('.menu-edit-list__item').first();
            if (firstRow.length) {
                const firstRenameBtn = firstRow.find('.menu-edit-list__rename');
                if (firstRenameBtn.length) {
                    firstRenameBtn.addClass('focus');
                }
            }
        }, 100);

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

    function checkAndFixOrder() {
        const savedOrder = getStoredArray(ORDER_STORAGE);
        const renamedButtons = getRenamedButtons();
        
        const hasEmptyNamedButtons = savedOrder.some(k => renamedButtons[k] === '');
        
        if (hasEmptyNamedButtons && currentCard && currentCard.length) {
            setTimeout(() => {
                rebuildCard(currentCard);
            }, 100);
        }
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
                
                setTimeout(() => {
                    rebuildCard(container);
                    setTimeout(() => {
                        checkAndFixOrder();
                    }, 200);
                }, 300);
            }
        });
    }

    const CardHandler = {
        run: cardListener,
        fromSettings: startEditorFromSettings
    };

    function setupSettings() {
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
                localStorageSet('cardbtn_showall', value);
                
                if (Lampa.Storage && Lampa.Storage.set) {
                    Lampa.Storage.set('cardbtn_showall', value);
                }
                
                Lampa.Settings.update();
                
                if (currentCard && currentCard.length) {
                    setTimeout(() => {
                        rebuildCard(currentCard);
                    }, 500);
                }
            },
            onRender: function(element, component) {
                const currentValue = localStorageGet('cardbtn_showall', false);
                const checkbox = element.find('input[type="checkbox"]');
                if (checkbox.length) {
                    checkbox.prop('checked', currentValue);
                }
            }
        });

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
        version: "1.1.4",
        author: '@custom',
        name: "Кастомные кнопки карточки",
        description: "Управление кнопками действий в карточке фильма/сериала. Возможность переименования, скрытия, изменения порядка. Поддержка пустых имен для кнопок.",
        component: "cardbtn"
    };

    function loadPlugin() {
      Lampa.Manifest.plugins = pluginInfo;
      SettingsConfig.run();
      if (Lampa.Storage.get('cardbtn_showall') === true) {
        CardHandler.run();
      }
    }

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
