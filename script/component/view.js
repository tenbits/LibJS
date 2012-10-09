include.css('view.css').done(function() {

     mask.registerHandler('view', Class({
        Base: Compo,
        Construct: function() {            
            this.attr = {
                class: 'view'
            }            
        },
        render: function(values, container, cntx){
            this.tagName = 'div';
            if (values.id) this.attr.id = values.id;
            
            if (values.active) this.attr.class += ' active';
            
            
            this.nodes = {
                tagName: values.id
            };
            console.log('render view', values.id);
            
            Compo.prototype.render.apply(this, arguments);
        }
    }));    
});