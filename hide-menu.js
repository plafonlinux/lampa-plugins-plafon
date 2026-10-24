(function () {
    'use strict';

    // Скрыть боковое меню — поиск и настройки уже есть в шапке.
    function hideSideMenu() {
        var style = document.createElement('style');
        style.textContent = '.menu { display: none !important; }';
        document.head.appendChild(style);
    }

    // "Смотреть" -> сразу Filmix, без промежуточного меню выбора источника
    // (трейлеры не нужны, Filmix единственный реальный источник).
    function hookPlayButton(root) {
        var play = root.find('.button--play');
        if (!play.length) return;

        play.off('hover:enter');
        play.on('hover:enter', function () {
            var btns = root.find('.buttons--container > .full-start__button').not('.hide');
            var filmix = btns.filter(function () {
                return /filmix/i.test($(this).text());
            }).first();

            if (filmix.length) filmix.trigger('hover:enter');
            else if (btns.length) btns.first().trigger('hover:enter');
        });
    }

    // Шапка: оставляем только Поиск / Аккаунт / Перезапуск / Настройки, в этом порядке.
    // Дату-часы, "!" (уведомления) и любые прочие значки (три точки и т.п.) прячем.
    // Иконка "Перезапуск" (sync-плагин) без известного класса — ищем по ключевым
    // словам refresh/sync/reload в самой иконке; если не нашли — просто её не показываем,
    // лучше не гадать и не подхватывать что-то постороннее вроде "ещё" (три точки).
    function tidyHeader() {
        var actions = $('.head__actions');
        if (!actions.length) return;

        $('.head__time').hide();
        actions.css('display', 'flex');

        actions.children('.head__action').each(function () {
            var el = $(this);
            var href = el.find('use').attr('xlink:href') || el.find('use').attr('href') || '';

            if (el.hasClass('open--search')) { el.css('order', 1); return; }
            if (el.hasClass('open--profile')) { el.css('order', 2); return; }
            if (href.indexOf('sprite-settings') !== -1) { el.css('order', 4); return; }
            if (/refresh|sync|reload/i.test(href)) { el.css('order', 3); return; }

            el.hide();
        });
    }

    function init() {
        // ВРЕМЕННО отключено — нужен доступ к боковому меню, чтобы дойти до
        // Настройки → Консоль и прочитать диагностику. Включим обратно после.
        // hideSideMenu();

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') hookPlayButton(e.body);
        });

        // Иконки других плагинов (поиск/настройки/профиль/sync) добавляются
        // асинхронно при старте — пробуем несколько раз с паузой.
        var tries = 0;
        var timer = setInterval(function () {
            tidyHeader();
            tries++;
            if (tries >= 10) clearInterval(timer);
        }, 500);
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });
})();
