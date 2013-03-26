mask.registerHandler('radioButtons', Compo({
    events: {
        'click: button:not(.active)': function(e) {
            var $this = $(e.target);
            $this.parent().children('.active').removeClass('active');
            $this.addClass('active');
            this.$.trigger('changed', e.target);
        }
    },
    onRenderStart: function() {
        jmask(this).tag('div').addClass('radioButtons');
    },

    setActive: function(name){
        var button = this.$.find('[name='+name+']');

        button.parent().children('.active').removeClass('active');
        button.addClass('active');
    }
}));
