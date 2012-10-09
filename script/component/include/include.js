include.load(['include.mask']).css('include.css').done(function(r) {

    mask.registerHandler('includeView', Class({
        Base: Compo,
        attr: {
            id: 'includeView',
            class: '3rows',
            template: r.load[0]
        },
        events: {
            'changed: .radioButtons': function(e) {
                this.$.find('.tabPanel > .active').removeClass('active');
                this.$.find('.tabPanel > .' + e.data.name).addClass('active');
                Compo.find(this, 'scroller').scroller.refresh();
            },
            'click: ul > li': function(e) {
                console.log('clicked');
                var href = '#' + e.target.innerText.replace(/[\s\(\)]/g, '');
                var scroller = Compo.find(this, 'scroller').scroller;
                scroller.scrollToElement(this.$.find('a[href="' + href + '"]').get(0), 100);
            }
        },
        activate: function() {

        }
    }));
});