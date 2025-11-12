(function() {        
    'use strict';        
        
    function startPlugin() {        
        window.plugin_menu_editor_ready = true    
               
        function initialize() {      
            try {    
                const lampaVersion = Lampa.Manifest ? Lampa.Manifest.app_digital : 0    
                const needsIconFix = lampaVersion < 300    
                    
                if (needsIconFix) {    
                    const iconStyles = `    
                        <style id="menu-editor-icon-fix">       
                            .menu-edit-list__item {    
                                display: flex !important;    
                                padding: 0.3em !important;    
                                border-radius: 0.3em !important;    
                                align-items: center !important;    
                            }    
                                
                            .menu-edit-list__item:nth-child(even) {    
                                background: rgba(255, 255, 255, 0.1) !important;    
                            }    
                                  
                            .menu-edit-list__icon {    
                                width: 2.4em !important;    
                                height: 2.4em !important;    
                                margin-right: 1em !important;    
                                flex-shrink: 0 !important;    
                                border-radius: 100% !important;    
                                display: flex !important;    
                                align-items: center !important;    
                                justify-content: center !important;    
                            }    
                                
                            .menu-edit-list__icon > svg,    
                            .menu-edit-list__icon > img {    
                                width: 1.4em !important;    
                                height: 1.4em !important;    
                            }    
                                    
                            .menu-edit-list__title {    
                                font-size: 1.3em !important;    
                                font-weight: 300 !important;    
                                line-height: 1.2 !important;    
                                flex-grow: 1 !important;    
                            }    
                                  
                            .menu-edit-list__move,    
                            .menu-edit-list__toggle {    
                                width: 2.4em !important;    
                                height: 2.4em !important;    
                                display: flex !important;    
                                align-items: center !important;    
                                justify-content: center !important;    
                            }    
                                
                            .menu-edit-list__move svg {    
                                width: 1em !important;    
                                height: 1em !important;    
                            }    
                                
                            .menu-edit-list__toggle svg {    
                                width: 1.2em !important;    
                                height: 1.2em !important;    
                            }    
                                
                            .menu-edit-list__move.focus,    
                            .menu-edit-list__toggle.focus {    
                                background: rgba(255, 255, 255, 1) !important;    
                                border-radius: 0.3em !important;    
                                color: #000 !important;    
                            }    
                        </style>    
                    `    
                    $('head').append(iconStyles)    
                }    
            } catch(e) {    
                console.log('Menu Editor', 'Version check failed:', e)    
            }    
                   
            Lampa.Lang.add({        
                menu_editor_title: {        
                    ru: 'Редактирование меню',        
                    uk: 'Редагування меню',        
                    en: 'Menu Editor'        
                },        
                menu_editor_left: {        
                    ru: 'Левое меню',        
                    uk: 'Ліве меню',        
                    en: 'Left Menu'        
                },        
                menu_editor_top: {        
                    ru: 'Верхнее меню',        
                    uk: 'Верхнє меню',        
                    en: 'Top Menu'        
                },        
                menu_editor_settings: {        
                    ru: 'Меню настроек',        
                    uk: 'Меню налаштувань',        
                    en: 'Settings Menu'        
                },        
                menu_editor_hide_nav: {        
                    ru: 'Скрыть панель навигации',        
                    uk: 'Приховати панель навігації',        
                    en: 'Hide Navigation Bar'        
                },
                menu_editor_hide_nav_desc: {
                    ru: 'Скрывает нижнюю панель навигации',
                    uk: 'Приховує нижню панель навігації',
                    en: 'Hides the bottom navigation bar'
                }         
            })  
   
            function applyLeftMenu() {  
                let sort = Lampa.Storage.get('menu_sort', [])  
                let hide = Lampa.Storage.get('menu_hide', [])  
                   
                if(sort.length) {  
                    sort.forEach((name) => {  
                        let item = $('.menu .menu__item').filter(function() {  
                            return $(this).find('.menu__text').text().trim() === name  
                        })  
                        if(item.length) item.appendTo($('.menu .menu__list:eq(0)'))  
                    })  
                }  
                   
                $('.menu .menu__item').removeClass('hidden')  
                if(hide.length) {  
                    hide.forEach((name) => {  
                        let item = $('.menu .menu__item').filter(function() {  
                            return $(this).find('.menu__text').text().trim() === name  
                        })  
                        if(item.length) item.addClass('hidden')  
                    })  
                }  
            }  
  
            function applyTopMenu() {  
                let sort = Lampa.Storage.get('head_menu_sort', [])  
                let hide = Lampa.Storage.get('head_menu_hide', [])  
                  
                let actionsContainer = $('.head__actions')  
                if(!actionsContainer.length) return  
                  
                if(sort.length) {  
                    sort.forEach((uniqueClass) => {  
                        let item = $('.head__action.' + uniqueClass)  
                        if(item.length) item.appendTo(actionsContainer)  
                    })  
                }  
                  
                $('.head__action').removeClass('hide')  
                if(hide.length) {  
                    hide.forEach((uniqueClass) => {  
                        let item = $('.head__action.' + uniqueClass)  
                        if(item.length) item.addClass('hide')  
                    })  
                }  
            }  
   
            function applySettingsMenu() {  
                let sort = Lampa.Storage.get('settings_menu_sort', [])  
                let hide = Lampa.Storage.get('settings_menu_hide', [])  
                   
                let settingsContainer = $('.settings .scroll__body > div')  
                if(!settingsContainer.length) return  
                  
                if(sort.length) {  
                    sort.forEach((name) => {  
                        let item = $('.settings-folder').filter(function() {  
                            return $(this).find('.settings-folder__name').text().trim() === name  
                        })  
                        if(item.length) item.appendTo(settingsContainer)  
                    })  
                }  
                  
                $('.settings-folder').removeClass('hide')  
                if(hide.length) {  
                    hide.forEach((name) => {  
                        let item = $('.settings-folder').filter(function() {  
                            return $(this).find('.settings-folder__name').text().trim() === name  
                        })  
                        if(item.length) item.addClass('hide')  
                    })  
                }  
            }
    
            function editLeftMenu() {      
                let list = $('<div class="menu-edit-list"></div>')      
                let menu = $('.menu')      
              
                menu.find('.menu__item').each(function(){      
                    let item_orig = $(this)      
                    let item_clone = $(this).clone()      
                    let item_sort = $(`<div class="menu-edit-list__item">      
                        <div class="menu-edit-list__icon"></div>      
                        <div class="menu-edit-list__title">${item_clone.find('.menu__text').text()}</div>      
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
                    </div>`)      
          
                    item_sort.find('.menu-edit-list__icon').append(item_clone.find('.menu__ico').html())      
          
                    item_sort.find('.move-up').on('hover:enter', ()=>{      
                        let prev = item_sort.prev()      
                        if(prev.length){      
                            item_sort.insertBefore(prev)      
                            item_orig.insertBefore(item_orig.prev())      
                        }      
                    })      
          
                    item_sort.find('.move-down').on('hover:enter', ()=>{      
                        let next = item_sort.next()      
                        if(next.length){      
                            item_sort.insertAfter(next)      
                            item_orig.insertAfter(item_orig.next())      
                        }      
                    })      
          
                    item_sort.find('.toggle').on('hover:enter', ()=>{      
                        item_orig.toggleClass('hidden')      
                        item_sort.find('.dot').attr('opacity', item_orig.hasClass('hidden') ? 0 : 1)      
                    }).find('.dot').attr('opacity', item_orig.hasClass('hidden') ? 0 : 1)      
          
                    list.append(item_sort)      
                })      
          
                Lampa.Modal.open({      
                    title: Lampa.Lang.translate('menu_editor_left'),      
                    html: list,      
                    size: 'small',      
                    scroll_to_center: true,      
                    onBack: ()=>{      
                        saveLeftMenu()      
                        Lampa.Modal.close()      
                        Lampa.Controller.toggle('settings_component')      
                    }      
                })      
            }  
  
            function editTopMenu() {      
                const headMenuNames = {      
                    'open--search': 'Поиск',      
                    'open--broadcast': 'Трансляции',       
                    'notice--icon': 'Уведомления',      
                    'open--settings': 'Настройки',      
                    'open--profile': 'Профиль',      
                    'full--screen': 'На весь экран'      
                }      
                      
                let list = $('<div class="menu-edit-list"></div>')        
                let head = $('.head')        
            
                head.find('.head__action').each(function(){        
                    let item_orig = $(this)      
                    let item_clone = $(this).clone()      
                          
                    let allClasses = item_clone.attr('class').split(' ')      
                    let mainClass = allClasses.find(c =>       
                        c.startsWith('open--') ||       
                        c.startsWith('notice--') ||       
                        c.startsWith('full--')      
                    ) || ''      
                          
                    let displayName = headMenuNames[mainClass] || mainClass      
                          
                    let item_sort = $(`<div class="menu-edit-list__item">        
                        <div class="menu-edit-list__icon"></div>        
                        <div class="menu-edit-list__title">${displayName}</div>        
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
                    </div>`)        
            
                    let svg = item_clone.find('svg')        
                    if(svg.length) {        
                        item_sort.find('.menu-edit-list__icon').append(svg.clone())        
                    }        
            
                    item_sort.find('.move-up').on('hover:enter', ()=>{        
                        let prev = item_sort.prev()      
                        if(prev.length){      
                            item_sort.insertBefore(prev)      
                            item_orig.insertBefore(item_orig.prev())      
                        }      
                    })        
            
                    item_sort.find('.move-down').on('hover:enter', ()=>{        
                        let next = item_sort.next()      
                        if(next.length){      
                            item_sort.insertAfter(next)      
                            item_orig.insertAfter(item_orig.next())      
                        }      
                    })        
            
                    item_sort.find('.toggle').on('hover:enter', ()=>{        
                        item_orig.toggleClass('hide')      
                        item_sort.find('.dot').attr('opacity', item_orig.hasClass('hide') ? 0 : 1)      
                    }).find('.dot').attr('opacity', item_orig.hasClass('hide') ? 0 : 1)        
            
                    list.append(item_sort)        
                })        
            
                Lampa.Modal.open({        
                    title: Lampa.Lang.translate('menu_editor_top'),      
                    html: list,      
                    size: 'small',      
                    scroll_to_center: true,      
                    onBack: ()=>{        
                        saveTopMenu()      
                        Lampa.Modal.close()      
                        Lampa.Controller.toggle('settings_component')      
                    }      
                })        
            }    
                
            function editSettingsMenu() {      
                Lampa.Controller.toggle('settings')      
                      
                setTimeout(()=>{      
                    let settings = $('.settings')      
                          
                    if(!settings.length || !settings.find('.settings-folder').length){      
                        Lampa.Noty.show('Меню налаштувань ще не завантажене')      
                        return      
                    }      
                          
                    let list = $('<div class="menu-edit-list"></div>')      
                          
                    settings.find('.settings-folder').each(function(){      
                        let item_orig = $(this)      
                        let item_clone = $(this).clone()      
                        let item_sort = $(`<div class="menu-edit-list__item">      
                            <div class="menu-edit-list__icon"></div>      
                            <div class="menu-edit-list__title">${item_clone.find('.settings-folder__name').text()}</div>      
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
                        </div>`)      
          
                        let icon = item_clone.find('.settings-folder__icon svg, .settings-folder__icon img')      
                        if(icon.length) {      
                            item_sort.find('.menu-edit-list__icon').append(icon.clone())      
                        }      
          
                        item_sort.find('.move-up').on('hover:enter', ()=>{      
                            let prev = item_sort.prev()      
                            if(prev.length){      
                                item_sort.insertBefore(prev)      
                                item_orig.insertBefore(item_orig.prev())      
                            }      
                        })      
          
                        item_sort.find('.move-down').on('hover:enter', ()=>{      
                            let next = item_sort.next()      
                            if(next.length){      
                                item_sort.insertAfter(next)      
                                item_orig.insertAfter(item_orig.next())      
                            }      
                        })      
          
                        item_sort.find('.toggle').on('hover:enter', ()=>{      
                            item_orig.toggleClass('hide')      
                            item_sort.find('.dot').attr('opacity', item_orig.hasClass('hide') ? 0 : 1)      
                        }).find('.dot').attr('opacity', item_orig.hasClass('hide') ? 0 : 1)      
          
                        list.append(item_sort)      
                    })      
          
                    Lampa.Modal.open({      
                        title: Lampa.Lang.translate('menu_editor_settings'),      
                        html: list,      
                        size: 'small',      
                        scroll_to_center: true,      
                        onBack: ()=>{      
                            saveSettingsMenu()      
                            Lampa.Modal.close()      
                            Lampa.Controller.toggle('settings_component')      
                        }      
                    })      
                }, 300)      
            }
   
            function saveLeftMenu() {      
                let sort = []      
                let hide = []      
          
                $('.menu .menu__item').each(function(){      
                    let name = $(this).find('.menu__text').text().trim()      
                    sort.push(name)      
                    if($(this).hasClass('hidden')){      
                        hide.push(name)      
                    }      
                })      
          
                Lampa.Storage.set('menu_sort', sort)      
                Lampa.Storage.set('menu_hide', hide)      
            }      
                   
            function saveTopMenu() {        
                let sort = []        
                let hide = []        
            
                $('.head__action').each(function(){   
                    let classes = $(this).attr('class').split(' ')  
                    let uniqueClass = classes.find(c =>   
                        c.startsWith('open--') ||   
                        c.startsWith('notice--') ||   
                        c.startsWith('full--')  
                    )  
                      
                    if(uniqueClass) {  
                        sort.push(uniqueClass)  
                        if($(this).hasClass('hide')){  
                            hide.push(uniqueClass)  
                        }  
                    }  
                })        
            
                Lampa.Storage.set('head_menu_sort', sort)        
                Lampa.Storage.set('head_menu_hide', hide)        
            }        
                   
            function saveSettingsMenu() {        
                let sort = []        
                let hide = []        
            
                $('.settings-folder').each(function(){        
                    let name = $(this).find('.settings-folder__name').text().trim()        
                    sort.push(name)        
                    if($(this).hasClass('hide')){        
                        hide.push(name)        
                    }        
                })        
            
                Lampa.Storage.set('settings_menu_sort', sort)        
                Lampa.Storage.set('settings_menu_hide', hide)        
            }        
                  
            function addSettings() {               
                Lampa.SettingsApi.addComponent({        
                    component: 'menu_editor',        
                    icon: `<svg width="30" height="29" viewBox="0 0 30 29" fill="none" xmlns="http://www.w3.org/2000/svg">        
                        <path d="M18.2989 5.27973L2.60834 20.9715C2.52933 21.0507 2.47302 21.1496 2.44528 21.258L0.706081 28.2386C0.680502 28.3422 0.682069 28.4507 0.710632 28.5535C0.739195 28.6563 0.793788 28.75 0.869138 28.8255C0.984875 28.9409 1.14158 29.0057 1.30498 29.0059C1.35539 29.0058 1.4056 28.9996 1.45449 28.9873L8.43509 27.2479C8.54364 27.2206 8.64271 27.1643 8.72172 27.0851L24.4137 11.3944L18.2989 5.27973ZM28.3009 3.14018L26.5543 1.39363C25.3869 0.226285 23.3524 0.227443 22.1863 1.39363L20.0469 3.53318L26.1614 9.64766L28.3009 7.50816C28.884 6.9253 29.2052 6.14945 29.2052 5.32432C29.2052 4.49919 28.884 3.72333 28.3009 3.14018Z" fill="currentColor"/>        
                    </svg>`,        
                    name: Lampa.Lang.translate('menu_editor_title')        
                })        
                   
                Lampa.SettingsApi.addParam({        
                    component: 'menu_editor',        
                    param: {        
                        name: 'edit_left_menu',        
                        type: 'button',        
                    },        
                    field: {        
                        name: Lampa.Lang.translate('menu_editor_left'),        
                    },        
                    onChange: editLeftMenu        
                })        
            
                Lampa.SettingsApi.addParam({        
                    component: 'menu_editor',        
                    param: {        
                        name: 'edit_top_menu',        
                        type: 'button',        
                    },        
                    field: {        
                        name: Lampa.Lang.translate('menu_editor_top'),        
                    },        
                    onChange: editTopMenu        
                })        
            
                Lampa.SettingsApi.addParam({        
                    component: 'menu_editor',        
                    param: {        
                        name: 'edit_settings_menu',        
                        type: 'button',        
                    },        
                    field: {        
                        name: Lampa.Lang.translate('menu_editor_settings'),        
                    },        
                    onChange: editSettingsMenu        
                })    
                   
                Lampa.SettingsApi.addParam({        
                    component: 'menu_editor',        
                    param: {        
                        name: 'hide_navigation_bar',        
                        type: 'trigger',        
                        default: false        
                    },        
                    field: {        
                        name: Lampa.Lang.translate('menu_editor_hide_nav'),        
                        description: Lampa.Lang.translate('menu_editor_hide_nav_desc')         
                    },        
                    onChange: function(value) {        
                        if (Lampa.Storage.field('hide_navigation_bar') == true) {        
                            Lampa.Template.add('hide_nav_bar', '<style id="hide_nav_bar">.navigation-bar{display:none!important}</style>');        
                            $('body').append(Lampa.Template.get('hide_nav_bar', {}, true));        
                        }        
                        if (Lampa.Storage.field('hide_navigation_bar') == false) {        
                            $('#hide_nav_bar').remove();        
                        }        
                    }        
                })        
                   
                if (Lampa.Storage.field('hide_navigation_bar') == true) {        
                    Lampa.Template.add('hide_nav_bar', '<style id="hide_nav_bar">.navigation-bar{display:none!important}</style>');        
                    $('body').append(Lampa.Template.get('hide_nav_bar', {}, true));        
                }        
            }    
                    
            addSettings()  
               
            setTimeout(() => {  
                applyLeftMenu()  
                setTimeout(applyTopMenu, 300)  
            }, 500)  
               
            Lampa.Listener.follow('activity', (e) => {  
                if(e.type === 'start' && e.component === 'settings') {   
                    setTimeout(applySettingsMenu, 500)  
                }  
            })  
              
            if(Lampa.Settings && Lampa.Settings.listener) {  
                Lampa.Settings.listener.follow('open', (e) => {  
                    setTimeout(applySettingsMenu, 300)  
                })  
            }  
        }    
             
        if(window.appready) initialize()        
        else {        
            Lampa.Listener.follow('app', function (e) {        
                if (e.type == 'ready') initialize()        
            })        
        }        
    }        
        
    if(!window.plugin_menu_editor_ready) startPlugin()        
})();
