/** Load PrismJS Library */
include.js('prism.js').css('prism.css').done(function() {

    function highlight(compo){
        window.Prism.highlightElement(compo.$.find('code').get(0));

        /** refresh scroller (if any)*/
        var scroller = this.closest(':scroller');
        scroller && (scroller = scroller.scroller) && scroller.refresh();
    }

    mask.registerHandler(':prism', Compo({

        constructor: function() {
            /** set default language to javascript */
            this.attr = { language: 'javascript' };
        },
        onRenderStart: function(model, cntx, container) {
            /** create template markup for prism: pre.language > code.language */
            var _class = 'language-' + this.attr.language

            this.nodes = jmask('pre.language-' + _class + ' > code.' + _class)
            .children()
            .mask(this.nodes)
            .end()
        },
        onRenderEnd: function(){
            if (this.attr.src != null) {
                /** Load Code from File if src attribute specified */
                $.get(this.attr.src, function(response) {
                    this.$.find('code').html(response);

                    highlight(this);
                }.bind(this));
            }else {
                /** Highlight Text Node Content
                    (example)
                    prism > "var a = 10;"
                    "var a = 10;" is highlighted
                */
                highlight(this);
            }
        }
    }));
});
