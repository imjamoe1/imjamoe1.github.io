(function() {
    console.log('SIMPLE STUDIO PLUGIN STARTED');
    
    // Просто добавляем кнопку вручную через 3 секунды после загрузки карточки
    setTimeout(function test() {
        var container = document.querySelector('.full-descr__tags');
        if (!container) {
            console.log('Container not found, retrying...');
            setTimeout(test, 1000);
            return;
        }
        
        console.log('Container found, adding test button');
        
        var testBtn = document.createElement('div');
        testBtn.textContent = 'TEST STUDIO';
        testBtn.style.cssText = 'background: red; color: white; padding: 10px; margin: 5px; display: inline-block;';
        testBtn.onclick = function() { alert('Test button works!'); };
        
        container.appendChild(testBtn);
    }, 3000);
})();
