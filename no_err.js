(function() {
    'use strict';
	var waitFor = function waitFor(){
		var interval = setInterval(function(){
			if (typeof Lampa.Noty.show == 'function'){
				var _originalShow = Lampa.Noty.show;  
				Lampa.Noty.show = function (noty, options) {
					if (noty.includes("Script error.")) {
					  return;
					}
					return _originalShow.call(this, noty, options || {});
				  };
				clearInterval(interval);
			}
		}, 100);
	}

	if (window.appready) waitFor();
	else {
        Lampa.Listener.follow('app', function(e) {
			if (e.type == 'ready') waitFor();
		})
    }
})()
