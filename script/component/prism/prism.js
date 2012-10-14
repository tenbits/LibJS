include.load('prism.mask').done(function(r) {

    mask.registerHandler('prismView', Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'prismView',
            template: r.load[0]
        },
        defaultCategory: 'api'
    }));
});