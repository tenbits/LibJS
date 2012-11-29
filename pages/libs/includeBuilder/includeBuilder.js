include.load('includeBuilder.mask').done(function(r) {

    mask.registerHandler('includeBuilderView', Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'includeBuilderView',
            template: r.load[0]
        }
    }));    
});