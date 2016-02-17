(function($){
    // Determine if we on iPhone or iPad
    var isiOS = false;
    var agent = window.navigator.platform.toLowerCase();
    if(agent.indexOf('iphone') >= 0 || agent.indexOf('ipad') >= 0){
        isiOS = true;
    }
 
    $.fn.doubletap = function(onDoubleTapCallback, onTapCallback, delay){
        var eventName, action;
        delay = delay == null? 500 : delay;
        eventName = isiOS == true? 'touchend' : 'click';
        //eventName = 'click';
 
        $(this).bind(eventName, function(event){
            var now = new Date().getTime();
            var lastTouch = $(this).data('lastTouch') || now + 1 /** the first time this will make delta a negative number */;
            var delta = now - lastTouch;
            clearTimeout(action);
            if(delta<500 && delta>0){
                if(onDoubleTapCallback != null && typeof onDoubleTapCallback == 'function'){
                    onDoubleTapCallback(event);
                }
            }else{
                $(this).data('lastTouch', now);
                action = setTimeout(function(evt){
                    if(onTapCallback != null && typeof onTapCallback == 'function'){
                        onTapCallback(evt);
                    }
                    clearTimeout(action);     // clear the timeout
                }, delay, [event]);
            }
            $(this).data('lastTouch', now);
        });
    };
})(jQuery);
