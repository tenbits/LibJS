mask.registerHandler(':radioButtons', Compo({
    events: {
        'click: button:not(.active)': function(event){
            this.$.children('.active').removeClass('active');
            this.$.trigger('changed', e.target);

            $(e.currentTarget).addClass('active');
        }
    },
    onRenderStart: function() {
        jmask(this).tag('div').addClass('radioButtons');
    }
}));
