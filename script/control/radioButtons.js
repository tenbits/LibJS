mask.registerHandler('radioButtons', Compo({
    tagName: 'div',
    attr: {
        'class' : 'radioButtons'
    },
    events: {
        'click: button:not(.active)': function(e) {
            var $this = $(e.target);
            $this.parent().children('.active').removeClass('active');
            $this.addClass('active');
            this.$.trigger('changed', e.target);
        }
    },
    
    setActive: function(name){
        var button = this.$.find('[name="'+name+'"]');

        button.parent().children('.active').removeClass('active');
        button.addClass('active');
    },
    
    getActiveName: function(){
        return this.$.find('.active').attr('name');
    }
}));