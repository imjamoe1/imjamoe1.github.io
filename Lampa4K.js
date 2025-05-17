(function() {
    'use strict';
    
    // Проверка окружения
    if (!window.Plugin || !window.Lampa) {
        console.error('[4Kino] Lampa API не найдена');
        return;
    }

    // Конфигурация
    const config = {
        name: '4Kino Fix',
        key: 'kino4_ultimate',
        domain: 'https://4kino.cc',
        selectors: {
            list: '.shortstory',
            title: '.title',
            poster: 'img',
            link: 'a[href]',
            player: 'iframe[src*="player"], [id*="player"]'
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://4kino.cc/'
        }
    };

    // Регистрация плагина
    Plugin.register(config.key, {
        title: config.name,
        version: '2.0.0',
        icon: `${config.domain}/favicon.ico`,
        author: 'Lampa Community',
        description: 'Фиксированная версия плагина для 4kino.cc',
        priority: 100,
        types: ['movie', 'tv'],
        onload: function() {
            try {
                // Инициализация источника
                Lampa.ApiSource.add({
                    key: config.key,
                    name: config.name,
                    menu: true,
                    type: ['movie', 'tv'],
                    search: true,

                    // Загрузка списка
                    handler: async (params) => {
                        try {
                            const page = params.page || 1;
                            const search = params.query ? `/?s=${encodeURIComponent(params.query)}` : '';
                            const url = `${config.domain}/page/${page}${search}`;
                            
                            const html = await Lampa.Utils.fetchProxy(url, {
                                headers: config.headers,
                                timeout: 15000
                            });

                            const dom = new DOMParser().parseFromString(html, 'text/html');
                            const items = Array.from(dom.querySelectorAll(config.selectors.list));

                            return {
                                results: items.map(item => ({
                                    title: item.querySelector(config.selectors.title)?.textContent.trim() || 'Без названия',
                                    poster: item.querySelector(config.selectors.poster)?.src || '',
                                    url: item.querySelector(config.selectors.link)?.href || ''
                                })).filter(i => i.url),
                                
                                hasMore: !!dom.querySelector('.pagination .current + a')
                            };
                        } catch (e) {
                            Lampa.Notify.show('Ошибка загрузки списка', 3000);
                            console.error('[4Kino] Handler Error:', e);
                            return {results: []};
                        }
                    },

                    // Загрузка деталей
                    details: async (url) => {
                        try {
                            const html = await Lampa.Utils.fetchProxy(url, {
                                headers: {...config.headers, Referer: url},
                                timeout: 20000
                            });

                            const dom = new DOMParser().parseFromString(html, 'text/html');
                            
                            // Поиск плееров
                            const players = Array.from(dom.querySelectorAll(config.selectors.player))
                                .map(player => {
                                    let src = player.src || '';
                                    if (!src && player.tagName === 'SCRIPT') {
                                        const match = player.textContent.match(/(https?:)?\/\/[^\s'"]+/);
                                        src = match ? match[0] : '';
                                    }
                                    return src.startsWith('//') ? `https:${src}` : src;
                                })
                                .filter(src => src.includes('//'));

                            return {
                                title: dom.querySelector('h1')?.textContent.trim() || 'Фильм',
                                description: dom.querySelector('.fdesc')?.textContent.trim() || '',
                                videos: players.map((src, index) => ({
                                    file: src,
                                    quality: src.includes('1080') ? 'FHD' : 'HD',
                                    label: `Плеер ${index + 1}`
                                }))
                            };
                        } catch (e) {
                            Lampa.Notify.show('Ошибка загрузки видео', 3000);
                            console.error('[4Kino] Details Error:', e);
                            return {videos: []};
                        }
                    }
                });
            } catch (e) {
                console.error('[4Kino] Plugin Init Error:', e);
            }
        }
    });
})();
