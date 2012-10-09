/** Load PrismJS Library */
include.js('prism.js').css('prism.css').done(function() {
    mask.registerHandler('prism', Class({
        Base: Compo,
        Construct: function() {
            /** set default language to javascript */
            this.attr = { language: 'javascript' };
        },
        render: function(values, container, cntx) {
            /** create template markup for prism: pre.language > code.language */
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
            
            /* render html markup */
            Compo.prototype.render.call(this, values, container, cntx);

            if (this.attr.src != null) {
                /** Load Code from File if src attribute specified */
                $.get(this.attr.src, function(response) {
                    this.$.find('code').html(response);
                    this._highlight();
                }.bind(this));
            }else {
                /** Highlight Text Node Content
                    (example)
                    prism > "var a = 10;"
                    "var a = 10;" is highlighted
                */
                this._highlight();
            }
        },
        _highlight: function(){
            Prism.highlightElement(this.$.find('code').get(0));
            /** refresh scroller (if any)*/
            var scroller = Compo.findCompo(this, 'scroller', 'up');
            scroller && (scroller = scroller.scroller) && scroller.refresh();
        }
    }));
});