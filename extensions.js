// ==UserScript==
// @name         Lampa - Мои расширения с категориями
// @version      1.0
// @description  Добавляет блоки "Избранное", "Мои", "Онлайн", "ByLampa"
// @author       Custom
// @match        *://lampa.*/*
// @grant        none
// ==/UserScript==

(function() {
    if (typeof Lampa === 'undefined') return;

    console.log('Плагин с категориями запущен');

    // Хранилища для разных категорий
    function getList(category) {
        return JSON.parse(localStorage.getItem(`lampa_${category}_extensions`) || '[]');
    }

    function saveList(category, list) {
        localStorage.setItem(`lampa_${category}_extensions`, JSON.stringify(list));
    }

    // Показать уведомление
    function showNoty(text) {
        if (Lampa.Noty) {
            Lampa.Noty.show(text);
        }
    }

    // Перезагрузка Lampa
    function reloadLampa() {
        if (Lampa.Utils && Lampa.Utils.showReload) {
            Lampa.Utils.showReload(() => {});
        } else {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    // Проверка расширения (адаптировано под оригинал)
    function checkExtension(url, item) {
        let check = item.querySelector('.extensions__item-check');
        let code = item.querySelector('.extensions__item-code');
        let status = item.querySelector('.extensions__item-status');
        let error = item.querySelector('.extensions__item-error');

        check?.classList.remove('hide');
        if (code) code.classList.add('hide');
        if (status) status.classList.add('hide');
        if (error) error.classList.add('hide');

        function display(type, num, text) {
            if (code) {
                code.innerText = num;
                code.classList.remove('hide', 'success', 'error');
                code.classList.add(type);
            }
            if (status) {
                status.innerText = text;
                status.classList.remove('hide');
            }
            if (check) check.classList.add('hide');
        }

        fetch(url)
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    display('error', response.status, Lampa.Lang.translate('title_error'));
                    throw new Error('HTTP error');
                }
            })
            .then(text => {
                if (/Lampa\./.test(text)) {
                    display('success', '200', Lampa.Lang.translate('extensions_worked'));
                } else {
                    display('error', '500', Lampa.Lang.translate('extensions_no_plugin'));
                }
            })
            .catch(() => {
                display('error', '404', Lampa.Lang.translate('title_error'));
            });
    }

    // Создание элемента расширения
    function createExtensionItem(data, category) {
        const item = document.createElement('div');
        item.className = 'extensions__item selector';
        
        // Определяем статус
        const isLoaded = Lampa.Plugins?.loaded().indexOf(data.url) >= 0;
        const isDisabled = data.status === 0;
        const protocol = data.url.startsWith('https') ? 'protocol-https' : 'protocol-http';
        
        item.innerHTML = `
            <div class="extensions__item-author">${data.author || '@user'}</div>
            <div class="extensions__item-name">${data.name || Lampa.Lang.translate('extensions_no_name')}</div>
            <div class="extensions__item-descr">${data.url}</div>
            <div class="extensions__item-footer">
                <div class="extensions__item-error hide"></div>
                <div class="extensions__item-included ${isLoaded ? '' : 'hide'}"></div>
                <div class="extensions__item-check hide"></div>
                <div class="extensions__item-proto ${protocol}">
                    <svg width="21" height="30" viewBox="0 0 21 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10.5" cy="8.5" r="7" stroke="currentColor" stroke-width="3"></circle>
                        <rect y="9" width="21" height="21" rx="4" fill="currentColor"></rect>
                    </svg>
                </div>
                <div class="extensions__item-code hide success"></div>
                <div class="extensions__item-status hide"></div>
                <div class="extensions__item-disabled ${isDisabled ? '' : 'hide'}">${Lampa.Lang.translate('player_disabled')}</div>
            </div>
        `;

        // Добавляем обработчик для контекстного меню
        item.addEventListener('hover:enter', () => {
            const menu = [
                {
                    title: data.status ? Lampa.Lang.translate('extensions_disable') : Lampa.Lang.translate('extensions_enable'),
                    toggle: true
                },
                {
                    title: Lampa.Lang.translate('extensions_check'),
                    check: true
                },
                {
                    title: Lampa.Lang.translate('extensions_edit'),
                    separator: true
                },
                {
                    title: Lampa.Lang.translate('extensions_change_name'),
                    change: 'name'
                },
                {
                    title: Lampa.Lang.translate('extensions_change_link'),
                    change: 'url'
                },
                {
                    title: 'В избранное',
                    favorite: true
                },
                {
                    title: Lampa.Lang.translate('extensions_remove'),
                    remove: true
                }
            ];

            Lampa.Select.show({
                title: Lampa.Lang.translate('title_action'),
                items: menu,
                onSelect: (action) => {
                    if (action.toggle) {
                        data.status = data.status === 1 ? 0 : 1;
                        
                        const plugin = Lampa.Plugins.get().find(p => p.url === data.url);
                        if (plugin) {
                            plugin.status = data.status;
                            Lampa.Plugins.save(plugin);
                            if (data.status === 1) {
                                Lampa.Plugins.push(plugin);
                            }
                        }
                        
                        const list = getList(category);
                        const index = list.findIndex(i => i.url === data.url);
                        if (index >= 0) {
                            list[index].status = data.status;
                            saveList(category, list);
                        }
                        
                        reloadLampa();
                    }
                    else if (action.check) {
                        checkExtension(data.url, item);
                    }
                    else if (action.change) {
                        Lampa.Input.edit({
                            title: action.change === 'name' ? Lampa.Lang.translate('extensions_set_name') : Lampa.Lang.translate('extensions_set_url'),
                            value: data[action.change] || '',
                            free: true,
                            nosave: true
                        }, (newValue) => {
                            if (newValue && newValue !== data[action.change]) {
                                const oldUrl = data.url;
                                data[action.change] = newValue;
                                
                                const plugins = Lampa.Plugins.get();
                                const oldPlugin = plugins.find(p => p.url === oldUrl);
                                if (oldPlugin) {
                                    Lampa.Plugins.remove(oldPlugin);
                                    Lampa.Plugins.add({...data, status: data.status});
                                }
                                
                                const list = getList(category);
                                const index = list.findIndex(i => i.url === oldUrl);
                                if (index >= 0) {
                                    list[index] = data;
                                    saveList(category, list);
                                }
                                
                                reloadLampa();
                            }
                        });
                    }
                    else if (action.favorite) {
                        const favList = getList('favorite');
                        if (!favList.find(item => item.url === data.url)) {
                            favList.unshift({...data});
                            saveList('favorite', favList);
                            showNoty('✓ Добавлено в избранное');
                            
                            // Обновляем блоки
                            setTimeout(insertMyBlocks, 500);
                        } else {
                            showNoty('✗ Уже в избранном');
                        }
                    }
                    else if (action.remove) {
                        const list = getList(category).filter(i => i.url !== data.url);
                        saveList(category, list);
                        
                        const plugin = Lampa.Plugins.get().find(p => p.url === data.url);
                        if (plugin) {
                            Lampa.Plugins.remove(plugin);
                        }
                        
                        reloadLampa();
                    }
                }
            });
        });

        return item;
    }

    // Создание блока
    function createBlock(title, category) {
        const block = document.createElement('div');
        block.className = 'extensions__block layer--visible layer--render';
        block.id = `${category}-extensions-block`;
        
        const head = document.createElement('div');
        head.className = 'extensions__block-head';
        head.innerHTML = `<div class="extensions__block-title">${title}</div>`;
        block.appendChild(head);

        const body = document.createElement('div');
        body.className = 'extensions__block-body';
        
        const scroll = document.createElement('div');
        scroll.className = 'scroll scroll--horizontal';
        
        const content = document.createElement('div');
        content.className = 'scroll__content';
        
        const scrollBody = document.createElement('div');
        scrollBody.className = 'scroll__body';
        scrollBody.style.display = 'flex';

        // Кнопка добавления
        const addBtn = document.createElement('div');
        addBtn.className = 'extensions__block-add selector';
        addBtn.textContent = Lampa.Lang.translate('extensions_add');
        addBtn.addEventListener('hover:enter', () => {
            Lampa.Input.edit({
                title: Lampa.Lang.translate('extensions_set_url'),
                value: '',
                free: true,
                nosave: true
            }, (url) => {
                if (url) {
                    const list = getList(category);
                    if (list.find(item => item.url === url)) {
                        showNoty(`✗ Плагин уже в списке ${title}`);
                        return;
                    }
                    
                    const newItem = {
                        url: url,
                        name: Lampa.Lang.translate('extensions_no_name'),
                        author: title,
                        status: 1
                    };
                    
                    list.unshift(newItem);
                    saveList(category, list);
                    
                    Lampa.Plugins.add({url: url, status: 1, name: Lampa.Lang.translate('extensions_no_name'), author: title});
                    
                    showNoty(`✓ Плагин добавлен в ${title}`);
                    
                    // Обновляем блок
                    insertMyBlocks();
                }
            });
        });
        scrollBody.appendChild(addBtn);

        // Добавляем сохраненные расширения
        const list = getList(category);
        list.forEach(data => {
            const item = createExtensionItem(data, category);
            scrollBody.appendChild(item);
        });

        // Добавляем невидимые элементы для заполнения (как в оригинале)
        for (let i = 0; i < 20; i++) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'extensions__item selector';
            emptyItem.style.visibility = 'hidden';
            emptyItem.innerHTML = `
                <div class="extensions__item-author"></div>
                <div class="extensions__item-name"></div>
                <div class="extensions__item-descr"></div>
                <div class="extensions__item-footer">
                    <div class="extensions__item-error hide"></div>
                    <div class="extensions__item-included hide"></div>
                    <div class="extensions__item-check hide"></div>
                    <div class="extensions__item-proto hide">
                        <svg width="21" height="30" viewBox="0 0 21 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10.5" cy="8.5" r="7" stroke="currentColor" stroke-width="3"></circle>
                            <rect y="9" width="21" height="21" rx="4" fill="currentColor"></rect>
                        </svg>
                    </div>
                    <div class="extensions__item-code hide success"></div>
                    <div class="extensions__item-status hide"></div>
                    <div class="extensions__item-disabled hide">Отключено</div>
                </div>
            `;
            scrollBody.appendChild(emptyItem);
        }

        content.appendChild(scrollBody);
        scroll.appendChild(content);
        body.appendChild(scroll);
        block.appendChild(body);

        return block;
    }

    // Очистка дубликатов из установленных
    function cleanupInstalledBlock() {
        const allUrls = [
            ...getList('favorite'),
            ...getList('my'),
            ...getList('online'),
            ...getList('bylampa')
        ].map(item => item.url);
        
        const installedBlock = document.querySelector('.extensions__block');
        
        if (installedBlock) {
            const items = installedBlock.querySelectorAll('.extensions__item');
            items.forEach(item => {
                const descr = item.querySelector('.extensions__item-descr');
                if (descr) {
                    const url = descr.textContent;
                    if (allUrls.includes(url)) {
                        item.style.display = 'none';
                    } else {
                        item.style.display = '';
                    }
                }
            });
        }
    }

    // Вставка блоков
    function insertMyBlocks() {
        // Ищем все блоки
        const blocks = document.querySelectorAll('.extensions__block');
        
        // Находим блок "Установленные в память"
        let installedBlock = null;
        
        blocks.forEach((block) => {
            const title = block.querySelector('.extensions__block-title');
            if (title && title.textContent.includes('Установленные в память')) {
                installedBlock = block;
            }
        });

        if (!installedBlock) {
            setTimeout(insertMyBlocks, 300);
            return;
        }

        // Удаляем старые блоки если есть
        ['favorite', 'my', 'online', 'bylampa'].forEach(category => {
            const oldBlock = document.getElementById(`${category}-extensions-block`);
            if (oldBlock) oldBlock.remove();
        });

        // Создаем новые блоки
        const favoriteBlock = createBlock('Избранное', 'favorite');
        const myBlock = createBlock('Мои', 'my');
        const onlineBlock = createBlock('Онлайн', 'online');
        const bylampaBlock = createBlock('ByLampa', 'bylampa');

        // Вставляем блоки после установленных
        installedBlock.parentNode.insertBefore(favoriteBlock, installedBlock.nextSibling);
        favoriteBlock.parentNode.insertBefore(myBlock, favoriteBlock.nextSibling);
        myBlock.parentNode.insertBefore(onlineBlock, myBlock.nextSibling);
        onlineBlock.parentNode.insertBefore(bylampaBlock, onlineBlock.nextSibling);

        cleanupInstalledBlock();

        // Обновляем навигацию несколько раз для надежности
        setTimeout(() => {
            if (Lampa.Navigation) {
                Lampa.Navigation.update();
            }
        }, 300);
        
        setTimeout(() => {
            if (Lampa.Navigation) {
                Lampa.Navigation.update();
            }
        }, 1000);
    }

    // Перехватываем открытие расширений
    const originalShow = Lampa.Extensions?.show;
    if (originalShow) {
        Lampa.Extensions.show = function(params) {
            const result = originalShow.call(this, params);
            
            // Пробуем вставить блоки несколько раз с разными задержками
            setTimeout(insertMyBlocks, 500);
            setTimeout(insertMyBlocks, 1000);
            setTimeout(insertMyBlocks, 1500);
            setTimeout(insertMyBlocks, 2000);
            
            return result;
        };
    }

    // Следим за изменениями в DOM
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // Проверяем, появился ли блок с установленными расширениями
                const blocks = document.querySelectorAll('.extensions__block');
                if (blocks.length > 0) {
                    const installedBlock = Array.from(blocks).find(block => {
                        const title = block.querySelector('.extensions__block-title');
                        return title && title.textContent.includes('Установленные в память');
                    });
                    
                    if (installedBlock && !document.getElementById('favorite-extensions-block')) {
                        setTimeout(insertMyBlocks, 500);
                    }
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('Плагин готов к вставке блоков');
})();
