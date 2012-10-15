include.load('ruqq.mask').done(function(r) {

    mask.registerHandler('ruqqView', Class({
        Base: mask.getHandler('view'),
        attr: {
            template: r.load[0],
            id: 'ruqqView'
        }
    }));

});