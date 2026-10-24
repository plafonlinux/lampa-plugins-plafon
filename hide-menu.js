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

    function init() {
        hideSideMenu();

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') hookPlayButton(e.body);
        });
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });
})();
