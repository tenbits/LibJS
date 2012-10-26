mask.registerHandler('radioButtons', Class({
    Base: Compo,
    events: {
        'click: button:not(.active)': function(e) {
            var $this = $(e.target);
            $this.parent().children('.active').removeClass('active');
            $this.addClass('active');
            this.$.trigger('changed', e.target);
        }
    },
    render: function() {
        this.tagName = 'div';
        this.attr.class = 'radioButtons ' + (this.attr.class || '');
        Compo.prototype.render.apply(this, arguments);
    },
    
    setActive: function(name){
        var button = this.$.find('[name='+name+']');
        
        button.parent().children('.active').removeClass('active');
        button.addClass('active');
    }
}));
