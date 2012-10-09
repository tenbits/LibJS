include.js('prism.lib.js').css('prism.lib.css').done(function() {
    mask.registerHandler('prism', Class({
        Base: Compo,
        Construct: function() {
            this.attr = { language: 'javascript' };
        },
        render: function(values, container, cntx) {
            this.tagName = 'pre';
            
            var _class = 'language-' + this.attr.language;            
            this.attr.class = _class + ' ' + (this.attr.class || '');            
            this.nodes = {
                tagName: 'code',
                attr: {
                    class: _class
                },
                nodes: this.nodes
            };
            
            Compo.prototype.render.call(this, values, container, cntx);

            if (this.attr.src != null) {
                include.ajax(this.attr.src).done(function(r) {
                    this.$.find('code').html(r.ajax[0]);
                    this._highlight();
                }.bind(this));
            }else {
                this._highlight();
            }
        },
        _highlight: function(){
            Prism.highlightElement(this.$.find('code').get(0));
            var scroller = Compo.find(this, 'scroller', 'up');
            scroller && (scroller = scroller.scroller) && scroller.refresh();
        }
    }));
});