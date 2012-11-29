include.load('compo.mask').done(function(r) {
    mask.registerHandler('compoView', Class({
        
        /** Extends View Class*/
        Base: mask.getHandler('view'),
        attr: {
            id: 'compoView',
            template: r.load[0]
        }
    }));
});