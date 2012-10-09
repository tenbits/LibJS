mask.registerHandler('radioButtons', Class({
    Base: Compo,
    Construct: function() {            
        this.on('button:not(.active)', function(e) {
            var $this = $(e.target);
            $this.parent().children('.active').removeClass('active');
            $this.addClass('active');
            this.$.trigger('changed', e.target);
        }.bind(this));              
    },
    render: function() {
        this.tagName = 'div';
        this.attr.class = 'radioButtons ' + (this.attr.class || '');
        Compo.prototype.render.apply(this, arguments);
    }
}));
