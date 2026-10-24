(function () {
    'use strict';

    var API_KEY = 'Y73Q7RV-G3348Y1-M4XXJWC-SWJ9CF5';
    var API_BASE = 'https://api.poiskkino.dev/v1.4/movie';
    var CACHE_TTL = 20 * 60 * 60 * 1000; // 20 часов
    var CACHE_KEY = 'plafon_ru_platforms_cache';

    var PLATFORMS = [
        { id: 'okko', title: 'Okko', provider: 'Okko', index: 10 },
        { id: 'start', title: 'START', provider: 'START', index: 11 },
        { id: 'amediateka', title: 'Amediateka', provider: 'Amediateka', index: 12 },
        { id: 'ivi', title: 'IVI', provider: 'Иви', index: 13 },
        { id: 'wink', title: 'Wink', provider: 'Wink', index: 14 },
        { id: 'premier', title: 'PREMIER', provider: 'PREMIER', index: 15 },
        { id: 'kion', title: 'КИОН', provider: 'КИОН', index: 16 },
        { id: 'sts', title: 'СТС', provider: 'СТС', index: 17 },
        { id: 'smotrim', title: 'Смотрим', provider: 'Смотрим', index: 18 },
        { id: 'netflix', title: 'Netflix', provider: 'Netflix', index: 19 },
        { id: 'disney', title: 'Disney+', provider: 'Disney+', index: 20 },
        { id: 'prime', title: 'Prime Video', provider: 'Prime Video', index: 21 },
        { id: 'kphd', title: 'Kinopoisk HD', provider: 'Kinopoisk HD', index: 22 }
    ];

    // Строка "Рекомендации по просмотренному" (recomend_watch) не входит в желаемый
    // список владельца — отключаем программно, чтобы не лазить в настройки руками.
    function disableUnwantedRows() {
        try { Lampa.Storage.set('content_rows_recomend_watch', 'false'); } catch (e) {}
    }

    function fetchPlatform(provider, onSuccess, onError) {
        var url = API_BASE +
            '?selectFields=name&selectFields=poster&selectFields=rating&selectFields=year' +
            '&selectFields=externalId&selectFields=type' +
            '&limit=30&sortField=rating.kp&sortType=-1' +
            '&watchability.items.name=' + encodeURIComponent(provider);

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('X-API-KEY', API_KEY);
        xhr.timeout = 15000;
        xhr.onload = function () {
            if (xhr.status === 200) {
                try {
                    var json = JSON.parse(xhr.responseText);
                    onSuccess(json.docs || []);
                } catch (e) {
                    onError(e);
                }
            } else onError(new Error('HTTP ' + xhr.status));
        };
        xhr.onerror = function () { onError(new Error('network error')); };
        xhr.ontimeout = function () { onError(new Error('timeout')); };
        xhr.send();
    }

    function docToCard(doc) {
        if (!doc.externalId || !doc.externalId.tmdb) return null;
        if (!doc.poster || !doc.poster.url) return null;

        var isTv = doc.type === 'tv-series' || doc.type === 'animated-series';

        return {
            id: doc.externalId.tmdb,
            source: 'tmdb',
            method: isTv ? 'tv' : 'movie',
            title: doc.name,
            name: doc.name,
            original_title: doc.name,
            poster: doc.poster.url,
            vote_average: doc.rating && doc.rating.kp ? doc.rating.kp : 0,
            release_date: doc.year ? (doc.year + '-01-01') : '',
            first_air_date: doc.year ? (doc.year + '-01-01') : ''
        };
    }

    function getCache() {
        try { return Lampa.Storage.get(CACHE_KEY, {}) || {}; }
        catch (e) { return {}; }
    }

    function setCache(cache) {
        try { Lampa.Storage.set(CACHE_KEY, cache); } catch (e) {}
    }

    // ContentRows.call() вызывает row.call(params, screen) СИНХРОННО и ждёт в ответ
    // функцию (не результат) — эта функция уже получает настоящий ready-колбэк и
    // может звать его асинхронно. Два уровня функций обязательны, один уровень
    // молча проваливается (ready внутри на самом деле оказывается params).
    function rowLoader(platform) {
        return function (params, screen) {
            return function (ready) {
                var cache = getCache();
                var entry = cache[platform.id];
                var now = Date.now();

                if (entry && entry.ts && (now - entry.ts) < CACHE_TTL && entry.cards && entry.cards.length) {
                    ready({ results: entry.cards });
                    return;
                }

                fetchPlatform(platform.provider, function (docs) {
                    var cards = docs.map(docToCard).filter(Boolean);

                    if (!cards.length && entry && entry.cards && entry.cards.length) {
                        // сеть подвела, но есть старый кэш — лучше показать его, чем пустую строку
                        ready({ results: entry.cards });
                        return;
                    }

                    cache[platform.id] = { ts: now, cards: cards };
                    setCache(cache);
                    ready({ results: cards });
                }, function () {
                    if (entry && entry.cards && entry.cards.length) ready({ results: entry.cards });
                    else ready({ results: [] });
                });
            };
        };
    }

    function init() {
        disableUnwantedRows();

        PLATFORMS.forEach(function (platform) {
            Lampa.ContentRows.add({
                name: 'plafon_' + platform.id,
                title: platform.title,
                screen: ['main'],
                index: platform.index,
                call: rowLoader(platform)
            });
        });
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });
})();
