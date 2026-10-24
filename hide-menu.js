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
    // Дату-часы и "!" (уведомления) прячем. Иконка "Перезапуск" — отдельный плагин
    // (cub_sync.js), у него нет известного класса — определяем его как первый
    // неопознанный значок, остальные лишние (если появятся) тоже прячем.
    function tidyHeader() {
        var actions = $('.head__actions');
        if (!actions.length) return;

        $('.head__time').hide();
        actions.css('display', 'flex');

        var known = [];

        actions.children('.head__action').each(function () {
            var el = $(this);
            var href = el.find('use').attr('xlink:href') || el.find('use').attr('href') || '';

            if (el.hasClass('open--search')) { el.css('order', 1); known.push(this); }
            else if (el.hasClass('open--profile')) { el.css('order', 2); known.push(this); }
            else if (href.indexOf('sprite-settings') !== -1) { el.css('order', 4); known.push(this); }
            else if (href.indexOf('sprite-bell') !== -1) { el.hide(); known.push(this); }
        });

        var restartAssigned = false;
        actions.children('.head__action').each(function () {
            if (known.indexOf(this) !== -1) return;
            if (!restartAssigned) { $(this).css('order', 3); restartAssigned = true; }
            else $(this).hide();
        });
    }

    function init() {
        hideSideMenu();

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
