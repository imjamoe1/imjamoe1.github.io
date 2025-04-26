(function(){
    "use strict";

    function saveOrder(ids){
        localStorage.setItem('plugin_order', JSON.stringify(ids));
    }

    function loadOrder(){
        try {
            return JSON.parse(localStorage.getItem('plugin_order')) || [];
        } catch(e) {
            return [];
        }
    }

    function applyOrder(container, items){
        let order = loadOrder();
        if(order.length){
            order.forEach(id => {
                let el = container.querySelector(`[data-id="${id}"]`);
                if(el) container.appendChild(el);
            });
        }
    }

    function makeSortable(container){
        let isDragging = false;
        let dragged;

        container.addEventListener('dragstart', function(e){
            if(e.target.closest('.card')){
                dragged = e.target.closest('.card');
                isDragging = true;
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        container.addEventListener('dragover', function(e){
            if(isDragging){
                e.preventDefault();
                let target = e.target.closest('.card');
                if(target && target !== dragged){
                    let rect = target.getBoundingClientRect();
                    let next = (e.clientY - rect.top) > (rect.height / 2);
                    container.insertBefore(dragged, next ? target.nextSibling : target);
                }
            }
        });

        container.addEventListener('drop', function(e){
            if(isDragging){
                e.preventDefault();
                let ids = Array.from(container.querySelectorAll('.card')).map(el => el.dataset.id);
                saveOrder(ids);
                isDragging = false;
            }
        });
    }

    function start(){
        let interval = setInterval(()=>{
            let container = document.querySelector('.content__body > .category-full');
            if(container){
                clearInterval(interval);

                // Добавляем уникальные ID если их нет
                container.querySelectorAll('.card').forEach((el, index)=>{
                    if(!el.dataset.id){
                        el.dataset.id = 'item_' + index;
                    }
                    el.setAttribute('draggable', 'true');
                });

                applyOrder(container, container.querySelectorAll('.card'));
                makeSortable(container);

                console.log('%cPlugin Order: Loaded successfully','color: green;');
            }
        }, 500);
    }

    if(window.appready) start();
    else document.addEventListener('DOMContentLoaded', start);

})();
