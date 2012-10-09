include
    .js('prism/prism.lib.js')
    .css(['style/main.css', 'prism/prism.lib.css'])
    .done(function() {
        mask.registerHandler('highlight', Class({
            Base: Compo,
            Extends: CompoUtils,
            Construct: function(){
                this.compos = {
                    header: '$: header'
                }  
            },            
            events: {
                'click: header': function(e) {
                    this.compos.header.toggleClass('closed');
                }
            },
            render: function(values, container, cntx) {
                var code = this.nodes.content,
                    attr = this.attr;
                /** Готовим container */
                this.addClass('highlight');
                this.tagName = 'div';
                /** Готовом структуру компоненты */
                this.nodes = mask.compile('header; pre class="language-#{language}" > code class="language-#{language}";');
                
                Compo.find(this.nodes, 'code', null, 'node').nodes = {
                    /** Передаем код который должен быть подсвеченым */
                    content: code
                };
                /** Отдаем родителю завершить рендеринг */
                Compo.prototype.render.call(this, this.attr, container, cntx);
                /** Подсвечиваем код*/
                Prism.highlightElement(this.$.find('code').get(0));
            }
        }))
});