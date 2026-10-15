(function () {
  'use strict';

  // EXIT
  function exitStart() {
    let exiting = false;

    function exitItem(object) {
      return object && object.items ? object.items.find((item) => item.out === true) : null;
    }

    const originalSelectShow = Lampa.Select.show;

    Lampa.Select.show = function (object) {
      const item = exitItem(object);

      if (item && typeof object.onSelect === 'function') {
        if (exiting) return;
        exiting = true;

        object.onSelect(item);

        setTimeout(() => { exiting = false; }, 1000);
        return;
      }

      return originalSelectShow.apply(this, arguments);
    };
  }

  // INIT
  function start() {
    exitStart();
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') start(); });

})();
