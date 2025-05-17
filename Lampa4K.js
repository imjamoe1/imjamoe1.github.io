(function () {
    if (!window.Plugin) return;

    Plugin.register('kino4', {
        title: '4Kino.cc',
        version: '1.0.1',
        icon: 'https://4kino.cc/favicon.ico',
        author: '4K Films',
        description: 'Просмотр фильмов с 4kino.cc',
        priority: 100, // Приоритет в списке
        types: ['movie', 'tv'],
        onload: function () {
            Lampa.ApiSource.add({
                key: 'kino4', 
                name: '4kino.cc',
                menu: true, // Показывать в основном меню
                type: ['movie', 'tv'],
                search: true, // Включить поиск
                handler: async (params) => {
                    try {
                        const html = await Lampa.Utils.fetchProxy('https://4kino.cc/page/' + (params.page || 1) + '/');
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        
                        return {
                            results: Array.from(doc.querySelectorAll('.shortstory')).map(el => ({
                                title: el.querySelector('.title')?.textContent,
                                poster: el.querySelector('img')?.getAttribute('src'),
                                url: el.querySelector('a')?.href
                            })),
                            hasMore: !!doc.querySelector('.pagination .current + a')
                        }
                    } catch (e) {
                        console.error('Kino4 error:', e);
                        return { results: [] };
                    }
                },
                details: async (url) => {
                    try {
                        const html = await Lampa.Utils.fetchProxy(url);
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        
                        return {
                            title: doc.querySelector('h1')?.textContent,
                            description: doc.querySelector('.fdesc')?.textContent,
                            videos: Array.from(doc.querySelectorAll('iframe[src*="player"]')).map(iframe => ({
                                file: iframe.src.startsWith('//') ? 'https:' + iframe.src : iframe.src,
                                quality: 'HD'
                            }))
                        }
                    } catch (e) {
                        console.error('Kino4 details error:', e);
                        return { videos: [] };
                    }
                }
            });
        }
    });
})();
