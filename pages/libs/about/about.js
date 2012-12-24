include.load('about.mask').css('about.css').done(function(resp) {

	console.log('resp', resp);

    mask.registerHandler('aboutView',Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'aboutView',
            template: resp.load.about
        }
    }));

    resp = null;
});