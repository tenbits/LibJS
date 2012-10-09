console.log('about');
include.load('about.mask').css('about.css').done(function(r) {

    console.log('LL', r);
    
    mask.registerHandler('aboutView',Class({
        Base: Compo,
        attr: {
            template: r.load[0]
        },
        activate: function() {
            Compo.find(this, 'scroller').scroller.refresh();
        }
    }));

    r = null;
});