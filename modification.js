 (function () {
    'use strict';
	
    Lampa.Utils.putScriptAsync([
//	    'https://legalaiz.github.io/plugins/bylampa_addons.js?v=' + Math.random(),
	    './plugins/bylampa_addons.js?v=' + Math.random(),		
		'./plugins/tricks_new.js?v=' + Math.random(),
		'./plugins/hacktv.js?v=' + Math.random(),		
	    'https://bylampa.github.io/addon.js?v=' + Math.random(),
//	    'http://lampa.run.place/themes.js?v=' + Math.random(),
	    'https://bylampa.github.io/cub_off.js?v=' + Math.random()
    ], function () {});

    var timer = setInterval(function(){
        if(typeof Lampa !== 'undefined'){
            clearInterval(timer);

            if(!Lampa.Storage.get('set','false')) start_set();
		 
        }
    },200);
	
    function start_set(){
             Lampa.Storage.set('set','true');
             Lampa.Storage.set('keyboard_type', 'integrate');
             Lampa.Storage.set('start_page', 'main');
             Lampa.Storage.set('source', 'cub');
	     Lampa.Storage.set('background', 'false');
	     Lampa.Storage.set('animation', 'false');
	     Lampa.Storage.set('mask', 'false');
	     Lampa.Storage.set('player_normalization', 'true');
	     Lampa.Storage.set('player_timecode', 'ask');
	     Lampa.Storage.set('screensaver', 'false');
	     Lampa.Storage.set('pages_save_total', '3');
    } 

})();
 
 
 (function () {
    'use strict';
	
    Lampa.Utils.putScriptAsync([
	//	'https://legalaiz.github.io/plugins/bylampa_addons.js?v=' + Math.random(),
	//	'https://bwa.to?mod=f&conf=https://bwa.to/settings/cors.json'
    ], function () {});

    var timer = setInterval(function(){
        if(typeof Lampa !== 'undefined'){
            clearInterval(timer);

            if(!Lampa.Storage.get('set','false')) start_set();
		 
        }
    },200);
	
    function start_set(){
             Lampa.Storage.set('set','true');
             Lampa.Storage.set('keyboard_type', 'integrate');
             Lampa.Storage.set('start_page', 'main');
             Lampa.Storage.set('source', 'tmdb');
	     Lampa.Storage.set('background', 'false');
	     Lampa.Storage.set('animation', 'false');
	     Lampa.Storage.set('mask', 'false');
	     Lampa.Storage.set('player_normalization', 'false');
	     Lampa.Storage.set('player_timecode', 'ask');
	     Lampa.Storage.set('screensaver', 'false');
	     Lampa.Storage.set('pages_save_total', '3');
	     Lampa.Storage.set('NoTrailerMainPage', 'true');
	     Lampa.Storage.set('Reloadbutton', 'true');
	     Lampa.Storage.set('KeyboardSwitchOff', 'SwitchOff_UA');
	     Lampa.Storage.set('protocol', 'https');
	     Lampa.Storage.set('start_page', 'last');
	     Lampa.Storage.set('start_page', 'last');
	     Lampa.Storage.set('God', 'enabled');
	     window.god_enabled = true;
	     window.localStorage.setItem('remove_white_and_demo', 'true');
    } 

})();