(function () {
    if (!window.Plugin) return;

    Plugin.register('kino4', {
        title: '4Kino.cc',
        version: '1.0',
        author: '4K Films',
        description: 'Просмотр фильмов с 4kino.cc',
        types: ['movie', 'tv'],
        onload: function () {
            Lampa.ApiSource.add('kino4', {
                title: '4kino.cc',
                handler: function (params, oncomplete, onerror) {
                    // Загрузка списка фильмов
                    fetch('https://4kino.cc/page/1/')
                        .then(res => res.text())
                        .then(html => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            const items = [...doc.querySelectorAll('.shortstory')].map(el => {
                                const link = el.querySelector('a')?.href;
                                const title = el.querySelector('.title')?.innerText;
                                const poster = el.querySelector('img')?.src;
                                return { title, poster, url: link };
                            });
                            oncomplete(items);
                        })
                        .catch(onerror);
                },
                details: function (url, oncomplete, onerror) {
                    fetch(url)
                        .then(res => res.text())
                        .then(html => {
                            const playerUrls = [...html.matchAll(/src=["'](\/\/[a-z0-9.:\/_-]+player.*?)["']/gi)]
                                .map(m => 'https:' + m[1]);

                            const videos = playerUrls.map((link, i) => ({
                                file: link,
                                quality: 'auto',
                                label: `Плеер #${i + 1}`
                            }));

                            oncomplete({
                                title: 'Фильм',
                                description: 'Просмотр с 4kino.cc',
                                videos
                            });
                        })
                        .catch(onerror);
                }
            });
        }
    });
})();
