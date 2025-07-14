
(() => {
    const burpSounds = [
        'https://www.fesliyanstudios.com/play-mp3/387',
        'https://www.fesliyanstudios.com/play-mp3/388',
        'https://www.fesliyanstudios.com/play-mp3/389'
    ];

    const drunkBackground = 'https://www.fesliyanstudios.com/play-mp3/6360';

    function playSound(url) {
        const audio = new Audio(url);
        audio.volume = 0.6;
        audio.play();
    }

    function playRandomBurp() {
        const sound = burpSounds[Math.floor(Math.random() * burpSounds.length)];
        playSound(sound);
    }

    function startDrunkBackground() {
        const audio = new Audio(drunkBackground);
        audio.loop = true;
        audio.volume = 0.3;
        audio.play();
    }

    Lampa.Listener.follow('app', function (event) {
        if (event.type === 'start') {
            startDrunkBackground();
        }
    });

    document.addEventListener('keydown', playRandomBurp);
    document.addEventListener('click', playRandomBurp);

    console.log('Плагин "Пьяная отрыжка" загружен!');
})();
