include.load('class.mask').done(function(r) {

    mask.registerHandler('classView', Class({
        Base: Compo,
        attr: {
            id: 'classView',
            template: r.load[0]
        },
        events: {
            'changed: .radioButtons': function(e) {
                this.$.find('.tabPanel > .active').removeClass('active');
                this.$.find('.tabPanel > .' + e.data.name).addClass('active');
                
                Compo.find(this, 'scroller').scroller.refresh();
            }
        },
        activate: function() {
            Compo.find(this, 'scroller').scroller.refresh();
        }
    }));

});