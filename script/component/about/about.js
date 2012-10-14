include.load('about.mask').css('about.css').done(function(r) {

    mask.registerHandler('aboutView',Class({
        Base: mask.getHandler('view'),
        attr: {
            template: r.load[0]
        }
    }));

    r = null;
});