include.load('class.mask').done(function(r) {

    mask.registerHandler('classView', Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'classView',
            template: r.load['class']
        }
    }));

});