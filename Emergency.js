// Emergency page JS
(function(){
    function initCloseButton(){
        var btn = document.getElementById('close-btn');
        if(!btn) return;
        btn.addEventListener('click', function(){
            try{ window.close(); }catch(e){}
            window.location.href = 'Index.html';
        });
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', initCloseButton);
    } else {
        initCloseButton();
    }
})();
