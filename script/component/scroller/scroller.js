include.load('scroller.mask').done(function(r) {

    mask.registerHandler('scrollerView', Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'scrollerView',
            template: r.load[0]
        },
        defaultCategory: 'api'
    }));
});