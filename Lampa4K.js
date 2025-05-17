(function () {
    if (!window.Plugin) {
        console.error('Plugin system not available');
        return;
    }

    Plugin.register('kino4_fix', {
        title: '4Kino.cc FIX',
        version: '1.0.3',
        icon: 'https://4kino.cc/favicon.ico',
        author: '4K Films',
        description: 'Исправленная версия плагина для 4kino.cc',
        priority: 90,
        types: ['movie', 'tv'],
        onload: function () {
            try {
                Lampa.ApiSource.add({
                    key: 'kino4_fix',
                    name: '4Kino FIX',
                    menu: true,
                    type: ['movie', 'tv'],
                    search: true,
                    handler: async (params) => {
                        try {
                            const page = params.page || 1;
                            const url = `https://4kino.cc/page/${page}/?s=${encodeURIComponent(params.query || '')}`;
                            const html = await Lampa.Utils.fetchProxy(url, {
                                headers: {
                                    'Referer': 'https://4kino.cc/',
                                    'User-Agent': 'Mozilla/5.0'
                                }
                            });

                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            
                            const items = Array.from(doc.querySelectorAll('.shortstory')).map(el => ({
                                title: el.querySelector('.title')?.textContent?.trim() || 'Без названия',
                                poster: el.querySelector('img')?.getAttribute('src') || '',
                                url: el.querySelector('a')?.href || ''
                            }));

                            return {
                                results: items.filter(i => i.url),
                                hasMore: items.length >= 20
                            };
                        } catch (e) {
                            console.error('[Kino4] Handler error:', e);
                            return { results: [] };
                        }
                    },
                    details: async (url) => {
                        try {
                            const html = await Lampa.Utils.fetchProxy(url, {
                                headers: {
                                    'Referer': url,
                                    'User-Agent': 'Mozilla/5.0'
                                }
                            });
                            
                            const doc = new DOMParser().parseFromString(html, 'text/html');
                            const players = Array.from(doc.querySelectorAll('iframe[src*="player"], [id*="player"] script'))
                                .map(el => {
                                    let src = el.getAttribute('src') || '';
                                    if (!src && el.tagName === 'SCRIPT') {
                                        const match = el.textContent.match(/src:\s*["'](.*?)["']/);
                                        src = match ? match[1] : '';
                                    }
                                    return src.startsWith('//') ? 'https:' + src : src;
                                })
                                .filter(src => src.includes('//'));

                            return {
                                title: doc.querySelector('h1')?.textContent?.trim() || 'Фильм',
                                description: doc.querySelector('.fdesc')?.textContent?.trim() || '',
                                videos: players.map((src, index) => ({
                                    file: src,
                                    quality: src.includes('1080') ? 'FHD' : 'HD',
                                    label: `Источник ${index + 1}`
                                }))
                            };
                        } catch (e) {
                            console.error('[Kino4] Details error:', e);
                            return { videos: [] };
                        }
                    }
                });
            } catch (e) {
                console.error('[Kino4] Plugin init error:', e);
            }
        }
    });
})();
