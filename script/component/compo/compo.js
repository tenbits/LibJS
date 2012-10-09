include.js({
    compo: 'scroller'
}).load('compo.mask').done(function(r) {

    mask.registerHandler('compoView', Class({
        Base: Compo,
        attr: {
            id: 'compoView',
            template: r.load[0]
        },
        events: {
            'changed: .radioButtons': function(e) {
                this.$.find('.tabPanel > .active').removeClass('active');
                this.$.find('.tabPanel > .' + e.data.name).addClass('active');
                
                Compo.find(this, 'scroller').scroller.refresh();
            },
            'click: li > code': function(e){
                var id = e.target.innerText./*replace(/^\.+/,'').*/replace(/\(.+/,'')
                
                scroller = Compo.find(this, 'scroller').scroller;                    
                scroller.scrollToElement(this.$.find('a[href="#' + id + '"]').get(0), 100);
            }
        },
        activate: function() {
            Compo.find(this, 'scroller').scroller.refresh();
        }
    }));
});