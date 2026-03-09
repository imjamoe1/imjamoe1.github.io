(function () {
    'use strict';

    // Функция для добавления эффекта размытия при прокрутке
    function attachScrollBlur(activity) {
        const render = activity.render();
        const background = render.find('.full-start__background')[0];
        const scrollBody = render.find('.scroll__body')[0];
        
        if (!background || !scrollBody) return;
        
        // Добавляем класс для стилей
        background.classList.add('liquid-glass-target');
        
        // Убираем стандартное затемнение Lampa
        background.classList.remove('dim');
        background.style.opacity = '1';
        
        // Кешируем состояние
        let isBlurred = false;
        
        // Сохраняем оригинальный стиль transform
        const originalStyle = scrollBody.style;
        
        // Перехватываем изменение transform
        const transformDescriptor = Object.getOwnPropertyDescriptor(originalStyle, 'transform') || 
                                    Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'transform');
        
        const webkitTransformDescriptor = Object.getOwnPropertyDescriptor(originalStyle, 'webkitTransform') || 
                                          Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'webkitTransform');
        
        // Функция для парсинга translateY из transform матрицы
        function getTranslateYFromTransform(transformValue) {
            if (!transformValue || transformValue === 'none') return 0;
            
            if (transformValue.indexOf('matrix') !== -1) {
                const parts = transformValue.match(/matrix.*?\((.+)\)/);
                if (parts && parts[1]) {
                    const values = parts[1].split(',').map(v => parseFloat(v.trim()));
                    return values[5] || 0;
                }
            }
            
            if (transformValue.indexOf('translate3d') !== -1) {
                const parts = transformValue.match(/translate3d\(([^,]+),([^,]+),([^)]+)\)/);
                if (parts && parts[2]) {
                    return parseFloat(parts[2]);
                }
            }
            
            if (transformValue.indexOf('translate(') !== -1) {
                const parts = transformValue.match(/translate\(([^,]+),([^)]+)\)/);
                if (parts && parts[2]) {
                    return parseFloat(parts[2]);
                }
            }
            
            return 0;
        }
        
        // Перехватываем установку transform
        Object.defineProperty(originalStyle, 'transform', {
            set: function(value) {
                if (transformDescriptor && transformDescriptor.set) {
                    transformDescriptor.set.call(this, value);
                } else {
                    this.setProperty('transform', value);
                }
                
                if (value) {
                    const yValue = getTranslateYFromTransform(value);
                    const shouldBlur = yValue < 0;
                    
                    if (shouldBlur !== isBlurred) {
                        isBlurred = shouldBlur;
                        background.classList.toggle('dim', shouldBlur);
                    }
                }
            },
            get: function() {
                if (transformDescriptor && transformDescriptor.get) {
                    return transformDescriptor.get.call(this);
                }
                return this.getPropertyValue('transform');
            },
            configurable: true
        });
        
        Object.defineProperty(originalStyle, 'webkitTransform', {
            set: function(value) {
                if (webkitTransformDescriptor && webkitTransformDescriptor.set) {
                    webkitTransformDescriptor.set.call(this, value);
                } else {
                    this.setProperty('-webkit-transform', value);
                }
                
                if (value) {
                    const yValue = getTranslateYFromTransform(value);
                    const shouldBlur = yValue < 0;
                    
                    if (shouldBlur !== isBlurred) {
                        isBlurred = shouldBlur;
                        background.classList.toggle('dim', shouldBlur);
                    }
                }
            },
            get: function() {
                if (webkitTransformDescriptor && webkitTransformDescriptor.get) {
                    return webkitTransformDescriptor.get.call(this);
                }
                return this.getPropertyValue('-webkit-transform');
            },
            configurable: true
        });
    }

    // Добавляем стили с ТЕНЯМИ для текста
    function addStyles() {
        $('#liquid-glass-styles').remove();
        
        const styles = `
        <style id="liquid-glass-styles">
        /* Эффект размытия при прокрутке - НО БЕЗ ЗАТЕМНЕНИЯ */
        .full-start__background.liquid-glass-target.dim {
            filter: blur(30px) !important;
            opacity: 1 !important;
            transition: filter 0.3s ease-out !important;
        }
        
        .full-start__background.liquid-glass-target {
            transition: filter 0.3s ease-out !important;
            opacity: 1 !important;
        }
        
        /* Убираем стандартное затемнение Lampa */
        .full-start__background.dim {
            opacity: 1 !important;
        }
        
        /* ===== ТЕНИ ДЛЯ ТЕКСТА ===== */
        /* Чтобы текст был читаем на размытом фоне */
        
        /* Основной текст описания */
        .full-descr__text {
            text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.9) !important;
            font-weight: 400 !important;
        }
        
        /* Мета-информация (дата, бюджет, страны) */
        .full-descr__info-name,
        .full-descr__info-body {
            text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.9) !important;
        }
        </style>
        `;
        
        $('head').append(styles);
    }

    // Инициализация
    function initializePlugin() {
        console.log('Liquid Glass with Text Shadow');

        addStyles();

        Lampa.Listener.follow('full', (event) => {
            if (event.type === 'complite') {
                const activity = event.object.activity;
                
                setTimeout(() => {
                    const bg = activity.render().find('.full-start__background');
                    bg.removeClass('dim');
                    bg.css('opacity', '1');
                }, 100);
                
                setTimeout(() => {
                    attachScrollBlur(activity);
                }, 500);
                
                setTimeout(() => {
                    attachScrollBlur(activity);
                }, 1000);
            }
        });
        
        Lampa.Listener.follow('full', (event) => {
            if (event.type === 'start') {
                setTimeout(() => {
                    $('.full-start__background').removeClass('dim');
                    $('.full-start__background').css('opacity', '1');
                }, 50);
            }
        });
    }

    if (window.appready) {
        initializePlugin();
    } else {
        Lampa.Listener.follow('app', (event) => {
            if (event.type === 'ready') {
                initializePlugin();
            }
        });
    }

})();
