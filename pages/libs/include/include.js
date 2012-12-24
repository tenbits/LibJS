include.load(['include.mask']).css('include.css').done(function(r) {

    mask.registerHandler('includeView', Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'includeView',
            template: r.load.include
        }
    }));
});