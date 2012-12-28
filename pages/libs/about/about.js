include.load('about.mask').css('about.css').done(function(resp) {


    mask.registerHandler('aboutView',Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'aboutView',
            template: resp.load.about
        }
    }));

    resp = null;
});