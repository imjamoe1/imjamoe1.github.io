/* TorBox Lampa Plugin - Stable Version for Android TV */
(function () {
    'use strict';

    const PLUGIN_ID = 'torbox_lampa_plugin_stable';
    if (window[PLUGIN_ID]) return;
    window[PLUGIN_ID] = true;

    // ───────────────────── UTILS ───────────────────────────────
    const Utils = {
        escapeHtml(str = '') {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        formatBytes(bytes = 0, speed = false) {
            const B = Number(bytes);
            if (isNaN(B) || B === 0) return speed ? '0 KB/s' : '0 B';
            const k = 1024;
            const sizes = speed
                ? ['B/s', 'KB/s', 'MB/s', 'GB/s']
                : ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(B) / Math.log(k));
            return (B / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
        },
        formatTime(sec = 0) {
            const s = parseInt(sec, 10);
            if (isNaN(s) || s < 0) return 'н/д';
            if (s === Infinity || s > 2592000) return '∞';
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const r = Math.floor(s % 60);
            return [h ? h + 'ч' : null, m ? m + 'м' : null, r + 'с']
                .filter(Boolean)
                .join(' ');
        },
        formatAge(iso) {
            if (!iso) return 'н/д';
            const d = new Date(iso);
            if (isNaN(d)) return 'н/д';
            const diff = Math.floor((Date.now() - d) / 1000);
            const m = Math.floor(diff / 60);
            const h = Math.floor(m / 60);
            const days = Math.floor(h / 24);
            if (diff < 60) return diff + ' сек. назад';
            if (m < 60) return m + ' хв. назад';
            if (h < 24) return h + ' год. назад';
            return days + ' д. назад';
        },
        getQualityLabel(title = '', raw) {
            if (raw?.info?.quality) return raw.info.quality + 'p';
            if (/2160p|4K|UHD/i.test(title)) return '4K';
            if (/1080p|FHD/i.test(title)) return 'FHD';
            if (/720p|HD/i.test(title)) return 'HD';
            return 'SD';
        },
        naturalSort(a, b) {
            const re = /(\d+)/g;
            const aParts = a.name.split(re);
            const bParts = b.name.split(re);
            for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                if (i % 2) {
                    const diff = parseInt(aParts[i], 10) - parseInt(bParts[i], 10);
                    if (diff) return diff;
                } else if (aParts[i] !== bParts[i]) {
                    return aParts[i].localeCompare(bParts[i]);
                }
            }
            return a.name.length - b.name.length;
        },
        safeUpperCase(str) {
            return str ? String(str).toUpperCase() : '';
        }
    };

    // ───────────────────── STORAGE ─────────────────────────────
    const safeStorage = (() => {
        try {
            localStorage.setItem('__torbox_test', '1');
            localStorage.removeItem('__torbox_test');
            return localStorage;
        } catch {
            const mem = {};
            return {
                getItem: k => (k in mem ? mem[k] : null),
                setItem: (k, v) => { mem[k] = String(v); },
                removeItem: k => { delete mem[k]; },
                clear: () => { Object.keys(mem).forEach(k => delete mem[k]); }
            };
        }
    })();

    const Store = {
        get(key, def = null) {
            const v = safeStorage.getItem(key);
            return v !== null ? v : def;
        },
        set(key, val) {
            safeStorage.setItem(key, String(val));
        }
    };

    // ───────────────────── CACHE ────────────────────────────────
    const Cache = (() => {
        const map = new Map();
        const LIMIT = 128;
        const TTL_MS = 600000;
        return {
            get(k) {
                if (!map.has(k)) return null;
                const o = map.get(k);
                if (Date.now() - o.ts > TTL_MS) {
                    map.delete(k);
                    return null;
                }
                map.delete(k);
                map.set(k, o);
                return o.val;
            },
            set(k, v) {
                if (map.has(k)) map.delete(k);
                map.set(k, { ts: Date.now(), val: v });
                if (map.size > LIMIT) map.delete(map.keys().next().value);
            },
            clear() {
                map.clear();
            }
        };
    })();

    // ───────────────────── CONFIG ──────────────────────────────
    const Config = (() => {
        const DEF = {
            proxyUrl: 'https://corsproxy.io/?',
            apiKey: '',
            directConnection: false
        };
        const CFG = {
            get debug() { return Store.get('torbox_debug', '0') === '1'; },
            set debug(v) { Store.set('torbox_debug', v ? '1' : '0'); },
            get proxyUrl() { return Store.get('torbox_proxy_url') || DEF.proxyUrl; },
            set proxyUrl(v) { Store.set('torbox_proxy_url', v); },
            get apiKey() {
                const b64 = Store.get('torbox_api_key_b64', '');
                if (!b64) return DEF.apiKey;
                try { return atob(b64); } 
                catch { Store.set('torbox_api_key_b64', ''); return DEF.apiKey; }
            },
            set apiKey(v) {
                if (!v) return Store.set('torbox_api_key_b64', '');
                Store.set('torbox_api_key_b64', btoa(v));
            },
            get directConnection() { return Store.get('torbox_direct', '0') === '1'; },
            set directConnection(v) { Store.set('torbox_direct', v ? '1' : '0'); }
        };
        const LOG = (...a) => CFG.debug && console.log('[TorBox]', ...a);
        const PUBLIC_PARSERS = [
            { name: 'Viewbox', url: 'jacred.viewbox.dev', key: 'viewbox' },
            { name: 'Jacred', url: 'jacred.xyz', key: '' }
        ];
        const ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7L12 2L21 7V17L12 22L3 17V7Z" stroke="currentColor" stroke-width="2"/><path d="M12 22V12" stroke="currentColor" stroke-width="2"/><path d="M21 7L12 12L3 7" stroke="currentColor" stroke-width="2"/></svg>`;
        return { CFG, LOG, PUBLIC_PARSERS, ICON, DEF };
    })();
    const { CFG, LOG, PUBLIC_PARSERS, ICON } = Config;

    // ───────────────────── API ─────────────────────────────────
    const Api = (() => {
        const MAIN = 'https://api.torbox.app/v1/api';
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000;

        const _process = (txt, status) => {
            if (status === 401) throw { type: 'auth', message: '401 – Неверный API-ключ' };
            if (status === 403) throw { type: 'auth', message: '403 – Доступ запрещен' };
            if (status === 429) throw { type: 'network', message: '429 – Слишком много запросов' };
            if (status >= 500) throw { type: 'network', message: `Ошибка сервера (${status})` };
            if (status >= 400) throw { type: 'network', message: `Ошибка клиента (${status})` };
            if (!txt) throw { type: 'api', message: 'Пустой ответ от сервера' };
            
            try {
                if (typeof txt === 'string' && txt.startsWith('http')) return { success: true, url: txt };
                const j = typeof txt === 'object' ? txt : JSON.parse(txt);
                if (j?.success === false) throw { 
                    type: 'api', 
                    message: j.detail || j.message || 'Неизвестная ошибка API' 
                };
                return j;
            } catch (e) {
                throw { type: 'api', message: 'Некорректный JSON в ответе' };
            }
        };

        const request = async (url, opt = {}, signal, retryCount = 0) => {
            const TIMEOUT_MS = 20000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
            
            try {
                let targetUrl = url;
                let options = { ...opt };
                
                // Настройка прокси
                if (!CFG.directConnection) {
                    if (!CFG.proxyUrl) throw { type: 'config', message: 'Прокси не настроен' };
                    
                    const proxyUrl = new URL(CFG.proxyUrl.includes('?') ? 
                        `${CFG.proxyUrl}${encodeURIComponent(url)}` : 
                        `${CFG.proxyUrl}?${encodeURIComponent(url)}`);
                    
                    targetUrl = proxyUrl.toString();
                    options.headers = options.headers || {};
                    delete options.headers['Authorization'];
                }

                // Добавляем API-ключ
                if (options.is_torbox_api !== false && CFG.apiKey) {
                    options.headers = options.headers || {};
                    options.headers['X-Api-Key'] = CFG.apiKey;
                }

                const response = await fetch(targetUrl, {
                    ...options,
                    signal: controller.signal,
                    referrerPolicy: 'no-referrer',
                    mode: 'cors'
                });

                clearTimeout(timeoutId);
                return await _process(await response.text(), response.status);

            } catch (e) {
                clearTimeout(timeoutId);
                
                if (e.name === 'AbortError') {
                    if (!signal || !signal.aborted) throw { 
                        type: 'network', 
                        message: `Таймаут запроса (${TIMEOUT_MS/1000} сек)` 
                    };
                    throw e;
                }

                // Повторяем запрос при сетевых ошибках
                const isNetworkError = [
                    'Failed to fetch',
                    'NetworkError',
                    'TypeError: Failed to fetch'
                ].some(err => e.message.includes(err));

                if (retryCount < MAX_RETRIES && isNetworkError) {
                    await new Promise(r => setTimeout(r, RETRY_DELAY * (retryCount + 1)));
                    return request(url, opt, signal, retryCount + 1);
                }

                throw { 
                    type: 'network', 
                    message: isNetworkError ? 
                        'Не удалось подключиться. Проверьте интернет и настройки прокси.' : 
                        e.message,
                    details: {
                        url: url,
                        proxyUsed: !CFG.directConnection,
                        proxyUrl: CFG.proxyUrl
                    }
                };
            }
        };

        const testConnection = async () => {
            try {
                const testUrl = `${MAIN}/system/status`;
                const response = await request(testUrl, { method: 'GET' });
                return { 
                    success: true, 
                    ping: response.ping,
                    server: response.server,
                    version: response.version 
                };
            } catch (e) {
                return { 
                    success: false, 
                    error: e.message,
                    details: e.details
                };
            }
        };

        const searchPublicTrackers = async (movie, signal) => {
            for (const p of PUBLIC_PARSERS) {
                const qs = new URLSearchParams({
                    apikey: p.key,
                    Query: `${movie.title} ${movie.year || ''}`.trim(),
                    title: movie.title,
                    title_original: movie.original_title,
                    Category: '2000,5000'
                });
                if (movie.year) qs.append('year', movie.year);
                
                try {
                    const u = `https://${p.url}/api/v2.0/indexers/all/results?${qs}`;
                    const j = await request(u, { 
                        method: 'GET', 
                        is_torbox_api: false 
                    }, signal);
                    
                    if (j?.Results?.length) return j.Results;
                } catch (err) {
                    LOG('Parser fail', p.name, err.message);
                }
            }
            throw { type: 'api', message: 'Публичные парсеры недоступны' };
        };

        const checkCached = async (hashes, signal) => {
            if (!hashes.length) return {};
            const data = {};
            
            for (let i = 0; i < hashes.length; i += 100) {
                const chunk = hashes.slice(i, i + 100);
                const qs = new URLSearchParams();
                chunk.forEach(h => qs.append('hash', h));
                qs.append('format', 'object');
                
                try {
                    const r = await request(`${MAIN}/torrents/checkcached?${qs}`, { 
                        method: 'GET' 
                    }, signal);
                    if (r?.data) Object.assign(data, r.data);
                } catch (e) {
                    LOG('checkCached error', e.message);
                }
            }
            return data;
        };

        const addMagnet = (magnet, signal) => {
            const fd = new FormData();
            fd.append('magnet', magnet);
            fd.append('seed', '3');
            return request(`${MAIN}/torrents/createtorrent`, { 
                method: 'POST', 
                body: fd 
            }, signal);
        };

        const myList = async (id, s) => {
            const json = await request(`${MAIN}/torrents/mylist?id=${id}`, { 
                method: 'GET' 
            }, s);
            return json?.data ? Array.isArray(json.data) ? json : { ...json, data: [json.data] } : json;
        };

        const requestDl = (tid, fid, s) => {
            const qs = new URLSearchParams({
                torrent_id: tid,
                file_id: fid
            });
            return request(`${MAIN}/torrents/requestdl?${qs}`, { 
                method: 'GET'
            }, s);
        };

        return { 
            searchPublicTrackers, 
            checkCached, 
            addMagnet, 
            myList, 
            requestDl,
            testConnection
        };
    })();

    const ErrorHandler = {
        show(t, e) {
            let message = e.message || 'Неизвестная ошибка';
            let details = '';
            
            if (e.details) {
                if (e.details.proxyUrl) details += `Прокси: ${e.details.proxyUrl}<br>`;
                if (e.details.url) details += `URL: ${e.details.url}<br>`;
                if (e.details.originalError) details += `Ошибка: ${e.details.originalError}`;
            }
            
            const html = `
                <div style="margin-bottom: ${details ? '8px' : '0'}">${message}</div>
                ${details ? `<div style="font-size:0.9em;opacity:0.8;">${details}</div>` : ''}
            `;
            
            Lampa.Noty.show(html, { 
                type: 'error',
                timeout: 8000,
                html: true
            });
            
            LOG('ERR', t, e);
        }
    };

    // ───────────────────── MAIN COMPONENT ──────────────────────
    function MainComponent(object) {
        let scroll = new Lampa.Scroll({mask: true, over: true, step: 250});
        let files = new Lampa.Explorer(object);
        let filter = new Lampa.Filter(object);
        let last;
        let abort = new AbortController();
        let initialized = false;
        
        this.activity = object.activity;

        let sort_types = [
            { key: 'seeders', title: 'По сидам (убыв.)', field: 'last_known_seeders', reverse: true },
            { key: 'size_desc', title: 'По размеру (убыв.)', field: 'size', reverse: true },
            { key: 'size_asc', title: 'По размеру (возр.)', field: 'size', reverse: false },
            { key: 'age', title: 'По дате добавления', field: 'publish_date', reverse: true }
        ];
        
        let defaultFilters = { 
            quality: 'all', 
            tracker: 'all', 
            video_type: 'all', 
            translation: 'all', 
            lang: 'all', 
            video_codec: 'all', 
            audio_codec: 'all' 
        };
        
        let state = {
            all_torrents: [],
            sort: Store.get('torbox_sort_method', 'seeders'),
            filters: JSON.parse(Store.get('torbox_filters_v2', JSON.stringify(defaultFilters))),
            last_hash: null,
        };

        const procRaw = (raw, hash, cachedSet) => {
            const v = raw.ffprobe?.find(s => s.codec_type === 'video');
            const a = raw.ffprobe?.filter(s => s.codec_type === 'audio') || [];
            
            return {
                title: Utils.escapeHtml(raw.Title),
                raw_title: raw.Title,
                size: raw.Size,
                magnet: raw.MagnetUri,
                hash,
                last_known_seeders: raw.Seeders,
                last_known_peers: raw.Peers || raw.Leechers,
                trackers: (raw.Tracker || '').split(/, ?/).filter(Boolean),
                icon: cachedSet.has(hash.toLowerCase()) ? '⚡' : '☁️',
                cached: cachedSet.has(hash.toLowerCase()),
                publish_date: raw.PublishDate,
                age: Utils.formatAge(raw.PublishDate),
                quality: Utils.getQualityLabel(raw.Title, raw),
                video_type: raw.info?.videotype?.toLowerCase(),
                voices: raw.info?.voices,
                video_codec: v?.codec_name,
                video_resolution: v ? `${v.width}x${v.height}` : null,
                audio_langs: [...new Set(a.map(s => s.tags?.language).filter(Boolean))],
                audio_codecs: [...new Set(a.map(s => s.codec_name).filter(Boolean))],
                has_hdr: /hdr/i.test(raw.Title) || raw.info?.videotype?.toLowerCase() === 'hdr',
                has_dv: /dv|dolby vision/i.test(raw.Title) || raw.info?.videotype?.toLowerCase() === 'dovi',
                raw_data: raw,
                info_formated: `[${Utils.getQualityLabel(raw.Title, raw)}] ${Utils.formatBytes(raw.Size)} | 🟢<span style="color:var(--color-good);">${raw.Seeders || 0}</span> / 🔴<span style="color:var(--color-bad);">${raw.Peers || 0}</span>`,
                meta_formated: `Трекеры: ${(raw.Tracker || '').split(/, ?/)[0] || 'н/д'} | Добавлено: ${Utils.formatAge(raw.PublishDate) || 'н/д'}`,
                tech_bar_html: this.buildTechBar(raw)
            };
        };

        this.buildTechBar = function(raw) {
            const tag = (txt, cls) => txt ? `<div class="torbox-item__tech-item torbox-item__tech-item--${cls}">${txt}</div>` : '';
            let html = '';
            
            // Видео информация
            const v = raw.ffprobe?.find(s => s.codec_type === 'video');
            if (v) {
                if (v.width && v.height) html += tag(`${v.width}x${v.height}`, 'res');
                if (v.codec_name) html += tag(Utils.safeUpperCase(v.codec_name), 'codec');
            }
            
            // HDR/DV
            if (/hdr/i.test(raw.Title) || raw.info?.videotype?.toLowerCase() === 'hdr') {
                html += tag('HDR', 'hdr');
            }
            if (/dv|dolby vision/i.test(raw.Title) || raw.info?.videotype?.toLowerCase() === 'dovi') {
                html += tag('Dolby Vision', 'dv');
            }
            
            // Аудио дорожки
            const audioStreams = raw.ffprobe?.filter(s => s.codec_type === 'audio') || [];
            audioStreams.forEach((s, i) => {
                let lang = Utils.safeUpperCase(s.tags?.language || s.tags?.LANGUAGE || '');
                if ((!lang || lang === 'UND') && raw.info?.voices?.[i]) {
                    lang = Utils.safeUpperCase(raw.info.voices[i]);
                }
                
                const codec = Utils.safeUpperCase(s.codec_name || '');
                const layout = s.channel_layout || '';
                
                const text = [lang, codec, layout].filter(Boolean).join(' ');
                if (text) html += tag(text, 'audio');
            });
            
            return html ? `<div class="torbox-item__tech-bar">${html}</div>` : '';
        };

        const search = (force = false) => {
            abort.abort();
            abort = new AbortController();
            const signal = abort.signal;
            
            this.activity.loader(true);
            this.reset();
            
            const key = `torbox_hybrid_${object.movie.id || object.movie.imdb_id}`;
            if (!force && Cache.get(key)) {
                state.all_torrents = Cache.get(key);
                this.build();
                this.activity.loader(false);
                return;
            }

            this.empty('Получение списка...');

            Api.searchPublicTrackers(object.movie, signal)
                .then(raw => {
                    if (signal.aborted) return;
                    if (!Array.isArray(raw)) throw new Error('Некорректный ответ');
                    if (!raw.length) return this.empty('Нет результатов');
                    
                    const withHash = raw.map(r => {
                        const m = r.MagnetUri?.match(/urn:btih:([a-fA-F0-9]{40})/i);
                        return m ? { raw: r, hash: m[1] } : null;
                    }).filter(Boolean);
                    
                    if (!withHash.length) return this.empty('Нет валидных торрентов');
                    
                    this.empty(`Проверка кэша (${withHash.length})...`);
                    return Api.checkCached(withHash.map(x => x.hash), signal);
                })
                .then(cached => {
                    if (signal.aborted) return;
                    
                    const cachedSet = new Set(Object.keys(cached).map(h => h.toLowerCase()));
                    state.all_torrents = withHash.map(({ raw, hash }) => procRaw(raw, hash, cachedSet));
                    Cache.set(key, state.all_torrents);
                    this.build();
                })
                .catch(err => {
                    if (signal.aborted) return;
                    this.empty(err.message || 'Ошибка');
                    ErrorHandler.show(err.type || 'unknown', err);
                })
                .finally(() => {
                    this.activity.loader(false);
                });
        };

        const play = async (torrent_data, file) => {
            try {
                const dlResponse = await Api.requestDl(torrent_data.id, file.id);
                const link = dlResponse.url || dlResponse.data;
                if (!link) throw { type: 'api', message: 'Не удалось получить ссылку' };
                
                const mid = object.movie.imdb_id || object.movie.id;
                Store.set(`torbox_last_torrent_${mid}`, torrent_data.hash);
                Store.set(`torbox_last_played_${mid}`, String(file.id));
                
                Lampa.Player.play({
                    url: link,
                    title: file.name || object.movie.title,
                    poster: Lampa.Utils.cardImgBackgroundBlur(object.movie)
                });

                Lampa.Player.callback(() => {
                    Lampa.Activity.machine.back();
                });
            } catch (e) {
                ErrorHandler.show(e.type || 'unknown', e);
            }
        };

        const onTorrentClick = async (torrent) => {
            if (!torrent.magnet) {
                return ErrorHandler.show('validation', { message: 'Нет magnet-ссылки' });
            }
        
            Lampa.Loading.start(undefined, 'Добавление торрента...');
            abort = new AbortController();
            
            try {
                // Проверка соединения перед загрузкой
                const test = await Api.testConnection();
                if (!test.success) {
                    throw { 
                        type: 'network', 
                        message: 'Проблемы с соединением',
                        details: test.details
                    };
                }

                const res = await Api.addMagnet(torrent.magnet, abort.signal);
                const tid = res.data?.torrent_id || res.data?.id;
                if (!tid) throw { type: 'api', message: 'Не получен ID торрента' };
                
                const data = await track(tid, abort.signal);
                data.hash = torrent.hash;
                
                Lampa.Loading.stop();
                selectFile(data);
            } catch (e) {
                Lampa.Loading.stop();
                if (e.name !== 'AbortError') {
                    ErrorHandler.show(e.type || 'unknown', e);
                }
            }
        };
        
        const track = (id, signal) => {
            return new Promise((resolve, reject) => {
                let active = true;
                const cancel = () => {
                    if (active) {
                        active = false;
                        signal.removeEventListener('abort', cancel);
                        Lampa.Loading.stop();
                        reject({ name: 'AbortError' });
                    }
                };
                signal.addEventListener('abort', cancel);
        
                const poll = async () => {
                    if (!active) return;
                    
                    try {
                        const d = (await Api.myList(id, signal)).data?.[0];
                        if (!d) {
                            if (active) setTimeout(poll, 10000);
                            return;
                        }
                        
                        const isReady = d.download_state === 'completed' || 
                                       d.download_finished || 
                                       d.files?.length;
                        
                        if (isReady) {
                            active = false;
                            signal.removeEventListener('abort', cancel);
                            resolve(d);
                        } else {
                            const perc = (parseFloat(d.progress) * 100).toFixed(2);
                            const speed = Utils.formatBytes(d.download_speed, true);
                            const eta = Utils.formatTime(d.eta);
                            
                            $('.loading-layer .loading-layer__text').text(
                                `Загрузка: ${perc}% | ${speed} | 👤 ${d.seeds || 0}/${d.peers || 0} | ⏳ ${eta}`
                            );
                            
                            if (active) setTimeout(poll, 10000);
                        }
                    } catch (e) {
                        if (active) {
                            active = false;
                            signal.removeEventListener('abort', cancel);
                            reject(e);
                        }
                    }
                };
                
                poll();
            });
        };
        
        const selectFile = (torrent_data) => {
            const vids = torrent_data.files
                .filter(f => /\.(mkv|mp4|avi)$/i.test(f.name))
                .sort(Utils.naturalSort);
                
            if (!vids.length) {
                return ErrorHandler.show('validation', { message: 'Нет видеофайлов' });
            }
            
            if (vids.length === 1) {
                return play(torrent_data, vids[0]);
            }
            
            Lampa.Select.show({
                title: 'Выберите файл',
                items: vids.map(file => ({
                    title: file.name,
                    size: Utils.formatBytes(file.size),
                    file: file
                })),
                onSelect: (a) => play(torrent_data, a.file),
                onBack: () => Lampa.Controller.toggle('content')
            });
        };

        this.create = function () {
            this.activity.loader(false);
            scroll.body().addClass('torbox-list-container');
            files.appendFiles(scroll.render());
            files.appendHead(filter.render());
            scroll.minus(files.render().find('.explorer__files-head'));
            return this.render();
        };

        this.render = function(){
            return files.render();
        };

        this.empty = function(msg) {
            scroll.clear();
            scroll.append(Lampa.Template.get('torbox_empty', { 
                message: msg || 'Торренты не найдены' 
            }));
            Lampa.Controller.enable('content');
        };
        
        this.reset = function() {
            last = false;
            scroll.clear();
            scroll.reset();
        };

        this.build = function() {
            this.buildFilter();
            this.draw(this.applyFiltersSort());
        };

        this.buildFilter = function () {
            const build = (key, title, arr) => {
                const uni = [...new Set(arr.flat().filter(Boolean))].sort();
                const items = ['all', ...uni].map(v => ({ 
                    title: v === 'all' ? 'Все' : Utils.safeUpperCase(v), 
                    value: v, 
                    selected: state.filters[key] === v 
                }));
                const sub = state.filters[key] === 'all' ? 'Все' : Utils.safeUpperCase(state.filters[key]);
                return { title, subtitle: sub, items, stype: key };
            };
    
            const f_items = [
                build('quality', 'Качество', state.all_torrents.map(t => t.quality)),
                build('video_type', 'Тип видео', state.all_torrents.map(t => t.video_type)),
                build('translation', 'Перевод', state.all_torrents.map(t => t.voices)),
                build('lang', 'Язык аудио', state.all_torrents.map(t => t.audio_langs)),
                build('video_codec', 'Видео кодек', state.all_torrents.map(t => t.video_codec)),
                build('audio_codec', 'Аудио кодек', state.all_torrents.map(t => t.audio_codecs)),
                build('tracker', 'Трекер', state.all_torrents.map(t => t.trackers)),
                { title: 'Сбросить фильтры', reset: true },
                { title: 'Обновить список', refresh: true }
            ];
            
            filter.set('filter', f_items);
            filter.render().find('.filter--filter span').text('Фильтр');
            
            const subTitles = f_items
                .filter(f => f.stype && state.filters[f.stype] !== 'all')
                .map(f => `${f.title}: ${state.filters[f.stype]}`);
                
            filter.chosen('filter', subTitles);

            const sort_items = sort_types.map(i => ({ 
                ...i, 
                selected: i.key === state.sort 
            }));
            
            filter.set('sort', sort_items);
            filter.render().find('.filter--sort span').text('Сортировка');
            filter.chosen('sort', [(sort_types.find(s => s.key === state.sort) || {}).title]);
        };

        this.applyFiltersSort = function () {
            let list = state.all_torrents.filter(t => {
                for (const key in state.filters) {
                    if (state.filters[key] === 'all') continue;
                    
                    const value = t[key];
                    if (Array.isArray(value)) {
                        if (!value.includes(state.filters[key])) return false;
                    } else {
                        if (value !== state.filters[key]) return false;
                    }
                }
                return true;
            });
            
            const s = sort_types.find(s => s.key === state.sort);
            if (s) {
                list.sort((a, b) => {
                    let va = a[s.field] || 0;
                    let vb = b[s.field] || 0;
                    
                    if (s.field === 'publish_date') {
                        va = va ? new Date(va).getTime() : 0;
                        vb = vb ? new Date(vb).getTime() : 0;
                    }
                    
                    return s.reverse ? vb - va : va - vb;
                });
            }
            
            return list;
        };
        
        this.draw = function (items) {
            last = false;
            scroll.clear();

            if (!items.length) {
                return this.empty('Нет результатов по фильтрам');
            }
        
            const lastKey = `torbox_last_torrent_${object.movie.imdb_id || object.movie.id}`;
            const lastHash = Store.get(lastKey, null);

            items.forEach(item_data => {
                const item = Lampa.Template.get('torbox_item', item_data);
                
                if (lastHash && item_data.hash === lastHash) {
                    item.addClass('torbox-item--last-played');
                }

                item.on('hover:focus', (e) => {
                    last = e.target;
                    state.last_hash = item_data.hash;
                    scroll.update($(e.target), true);
                })
                .on('hover:enter', () => onTorrentClick(item_data))
                .on('hover:long', () => {
                    Lampa.Select.show({
                        title: 'Действия',
                        items: [{ title: 'Скопировать Magnet' }],
                        onSelect: () => {
                            Lampa.Utils.copyTextToClipboard(item_data.magnet);
                            Lampa.Noty.show('Magnet скопирован');
                            Lampa.Controller.toggle('content');
                        },
                        onBack: () => Lampa.Controller.toggle('content')
                    });
                });
                
                scroll.append(item);
            });

            const focusElement = scroll.render().find(
                state.last_hash ? `[data-hash="${state.last_hash}"]` : '.selector'
            ).first();
            
            if (focusElement.length) {
                last = focusElement[0];
            }
            
            Lampa.Controller.enable('content');
        };

        this.initialize = function () {
            Lampa.Controller.add('content', {
                toggle: () => {
                    Lampa.Controller.collectionSet(filter.render(), scroll.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                up: () => {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: () => {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                left: () => {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: () => {
                    if (Navigator.canmove('right')) Navigator.move('right');
                    else filter.show('Фильтр', 'filter');
                },
                back: this.back
            });
            
            Lampa.Controller.toggle('content');

            filter.onSelect = (type, a, b) => {
                Lampa.Select.close();
                
                if (type === 'sort') {
                    state.sort = a.key;
                    Store.set('torbox_sort_method', a.key);
                } 
                else if (type === 'filter') {
                    if (a.refresh) return search(true);
                    if (a.reset) state.filters = JSON.parse(JSON.stringify(defaultFilters));
                    else if (a.stype) state.filters[a.stype] = b.value;
                    Store.set('torbox_filters_v2', JSON.stringify(state.filters));
                }
                
                state.last_hash = null;
                this.build();
            };
            
            filter.onBack = () => this.start();
            if (filter.addButtonBack) filter.addButtonBack();
            
            this.empty('Загрузка...');
            search();
        };

        this.reinit = function() {
            this.destroy();
            this.activity = object.activity;
            this.initialize();
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            
            if (!initialized) {
                initialized = true;
                this.initialize();
            } else {
                this.reinit();
            }
            
            Lampa.Controller.enable('content');
        };
        
        this.back = function() {
            abort.abort();
            Lampa.Activity.backward();
        };
        
        this.destroy = function () {
            abort.abort();
            Lampa.Controller.clear('content');
            if (scroll) scroll.destroy();
            if (files) files.destroy();
            if (filter) filter.destroy();
            scroll = files = filter = last = null;
            initialized = false;
        };

        this.pause = function() {};
        this.stop = function() {};
    }

    // ───────────────────── PLUGIN INIT ─────────────────────────
    (function () {
        const manifest = {
            type: 'video',
            version: '39.0.0',
            name: 'TorBox (Stable)',
            description: 'Плагин для просмотра торрентов через TorBox',
            component: 'torbox_main',
        };

        Lampa.Lang.add({
            torbox_watch: { ru: 'Смотреть через TorBox', en: 'Watch via TorBox', uk: 'Дивитися через TorBox' },
            title_torbox: { ru: 'TorBox', uk: 'TorBox', en: 'TorBox' },
        });

        function addTemplates() {
            Lampa.Template.add('torbox_item', `
                <div class="torbox-item selector" data-hash="{hash}">
                    <div class="torbox-item__title">{icon} {title}</div>
                    <div class="torbox-item__main-info">{info_formated}</div>
                    <div class="torbox-item__meta">{meta_formated}</div>
                    {tech_bar_html}
                </div>
            `);
            
            Lampa.Template.add('torbox_empty', `
                <div class="empty">
                    <div class="empty__text">{message}</div>
                </div>
            `);
        }

        function addSettings() {
            if (!Lampa.SettingsApi) return;
            
            Lampa.SettingsApi.addComponent({ 
                component: 'torbox_enh', 
                name: 'TorBox (Stable)', 
                icon: ICON 
            });
            
            const settings = [
                { 
                    k: 'torbox_proxy_url', 
                    n: 'URL CORS-прокси', 
                    d: `По умолчанию: ${Config.DEF.proxyUrl}`, 
                    t: 'input', 
                    v: CFG.proxyUrl 
                },
                { 
                    k: 'torbox_api_key', 
                    n: 'API-Key', 
                    d: 'Ваш ключ API TorBox', 
                    t: 'input', 
                    v: CFG.apiKey 
                },
                { 
                    k: 'torbox_direct', 
                    n: 'Прямое соединение', 
                    d: 'Без использования прокси (требует CORS)', 
                    t: 'trigger', 
                    v: CFG.directConnection 
                },
                { 
                    k: 'torbox_debug', 
                    n: 'Debug-режим', 
                    d: 'Логирование в консоль', 
                    t: 'trigger', 
                    v: CFG.debug 
                },
                {
                    k: 'torbox_test_conn',
                    n: 'Проверить соединение',
                    d: 'Тест подключения к TorBox',
                    t: 'button'
                }
            ];

            settings.forEach(p => {
                if (p.t === 'button') {
                    Lampa.SettingsApi.addParam({
                        component: 'torbox_enh',
                        param: { name: p.k, type: p.t, values: '' },
                        field: { name: p.n, description: p.d },
                        onAction: async () => {
                            Lampa.Noty.show('Проверка соединения...', { timeout: 3000 });
                            
                            try {
                                const result = await Api.testConnection();
                                if (result.success) {
                                    Lampa.Noty.show(`Соединение OK! Версия: ${result.version}`, { 
                                        type: 'success',
                                        timeout: 5000
                                    });
                                } else {
                                    Lampa.Noty.show(`Ошибка: ${result.error}`, {
                                        type: 'error',
                                        timeout: 7000
                                    });
                                }
                            } catch (e) {
                                Lampa.Noty.show(`Ошибка теста: ${e.message}`, {
                                    type: 'error',
                                    timeout: 7000
                                });
                            }
                        }
                    });
                } else {
                    Lampa.SettingsApi.addParam({
                        component: 'torbox_enh',
                        param: { name: p.k, type: p.t, values: '', default: p.v },
                        field: { name: p.n, description: p.d },
                        onChange: v => {
                            const val = typeof v === 'object' ? v.value : v;
                            
                            if (p.k === 'torbox_proxy_url') CFG.proxyUrl = String(val).trim();
                            else if (p.k === 'torbox_api_key') CFG.apiKey = String(val).trim();
                            else if (p.k === 'torbox_direct') CFG.directConnection = Boolean(val);
                            else if (p.k === 'torbox_debug') CFG.debug = Boolean(val);
                        },
                        onRender: f => {
                            if (p.k === 'torbox_api_key') {
                                f.find('input').attr('type', 'password');
                            }
                        }
                    });
                }
            });
        }

        function boot() {
            Lampa.Component.add('torbox_main', MainComponent);
            addTemplates();
            addSettings();

            Lampa.Listener.follow('full', e => {
                if (e.type !== 'complite' || !e.data.movie) return;
                
                const root = e.object.activity.render();
                if (!root?.length || root.find('.view--torbox').length) return;
                
                const btn = $(`
                    <div class="full-start__button selector view--torbox" data-subtitle="TorBox">
                        ${ICON}<span>TorBox</span>
                    </div>
                `);
                
                btn.on('hover:enter', () => {
                    Lampa.Activity.push({ 
                        component: 'torbox_main', 
                        title: `${Lampa.Lang.translate('title_torbox')} - ${e.data.movie.title || e.data.movie.name}`, 
                        movie: e.data.movie 
                    });
                });
                
                const torrentBtn = root.find('.view--torrent');
                if (torrentBtn.length) {
                    torrentBtn.after(btn);
                } else {
                    root.find('.full-start__play').after(btn);
                }
            });

            const css = `
                .torbox-list-container { 
                    display: block; 
                    padding: 1em; 
                }
                .torbox-item { 
                    padding: 1em 1.2em; 
                    margin: 0 0 1em 0; 
                    border-radius: .8em; 
                    background: var(--color-background-light); 
                    cursor: pointer; 
                    transition: all .3s; 
                    border: 2px solid transparent; 
                    overflow: hidden; 
                }
                .torbox-item:last-child { 
                    margin-bottom: 0; 
                }
                .torbox-item--last-played { 
                    border-left: 4px solid var(--color-second); 
                    background: rgba(var(--color-second-rgb), .1); 
                }
                .torbox-item:hover, 
                .torbox-item.focus { 
                    background: var(--color-primary); 
                    color: var(--color-background); 
                    transform: scale(1.01); 
                    border-color: rgba(255, 255, 255, .3); 
                    box-shadow: 0 4px 20px rgba(0, 0, 0, .2); 
                }
                .torbox-item:hover .torbox-item__tech-bar, 
                .torbox-item.focus .torbox-item__tech-bar { 
                    background: rgba(0, 0, 0, .2); 
                }
                .torbox-item__title { 
                    font-weight: 600; 
                    margin-bottom: .3em; 
                    font-size: 1.1em; 
                    line-height: 1.3; 
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis; 
                }
                .torbox-item__main-info { 
                    font-size: .95em; 
                    opacity: .9; 
                    line-height: 1.4; 
                    margin-bottom: .3em; 
                }
                .torbox-item__meta { 
                    font-size: .9em; 
                    opacity: .7; 
                    line-height: 1.4; 
                    margin-bottom: .8em; 
                }
                .torbox-item__tech-bar { 
                    display: flex; 
                    flex-wrap: wrap; 
                    gap: .6em; 
                    margin: 0 -1.2em -1em -1.2em; 
                    padding: .6em 1.2em; 
                    background: rgba(0, 0, 0, .1); 
                    font-size: .85em; 
                    font-weight: 500; 
                    transition: background .3s; 
                }
                .torbox-item__tech-item { 
                    padding: .2em .5em; 
                    border-radius: .4em; 
                    color: #fff; 
                }
                .torbox-item__tech-item--res { 
                    background: #3b82f6; 
                }
                .torbox-item__tech-item--codec { 
                    background: #16a34a; 
                }
                .torbox-item__tech-item--audio { 
                    background: #f97316; 
                }
                .torbox-item__tech-item--hdr { 
                    background: linear-gradient(45deg, #ff8c00, #ffa500); 
                }
                .torbox-item__tech-item--dv { 
                    background: linear-gradient(45deg, #4b0082, #8a2be2); 
                }
            `;
            
            const style = document.createElement('style');
            style.id = 'torbox-styles';
            style.textContent = css;
            document.head.appendChild(style);

            Lampa.Manifest.plugins[manifest.name] = manifest;
            LOG('TorBox Stable v39.0.0 ready');
        }

        if (window.Lampa?.Activity) {
            boot();
        } else {
            const LampaBoot = Lampa.Listener.follow('app', (e) => {
                if (e.type == 'ready') {
                    boot();
                    Lampa.Listener.remove('app', LampaBoot);
                }
            });
        }
    })();
})();
