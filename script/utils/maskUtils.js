(function() {
    var replaces = null;
    mask.registerHandler('formatter:pre', Class({
        Construct: function() {
            if (replaces == null) {
                replaces = {
                    regexps: [/\\n/g, /\\t/g],
                    values: ['\n', '    ']
                };
            }
        },
        makePre: function(nodes) {
            var isarray = nodes instanceof Array,
                length = isarray ? nodes.length : 1,
                x = null;
            for (var i = 0; isarray ? i < length : i < 1; i++) {
				x = isarray ? nodes[i] : nodes;
                if (x.content != null) {
                    x.content = x.content.replace(replaces.regexps[0], '\n').replace(replaces.regexps[1], '    ');
                }
                if (x.nodes != null) {
                    this.makePre(x.nodes);
                }
            }
        },
        render: function(values, container, cntx) {
            this.makePre(this.nodes);
            mask.renderDom(this.nodes, values, container, cntx);
        }
    }));
	
	
	
	if (ruqq.info.engine.name !== 'webkit'){
		mask.registerHandler('scroller',Class({
			render: function(model, container,cntx){
				this.tagName = 'div';
				this.attr['class'] = (this.attr['class'] ? this.attr['class'] + ' ' : '') + 'scroller';
				this.nodes = {
					tagName: 'div',
					attr: {
						'class': 'scroller-container'
					},
					nodes: this.nodes
				};
				Compo.render(this, model, container, cntx);
				
				
				this.attr = null;
				this.tagName = null;
				
				this.scroller = {
					refresh: function(){},
					scrollToElement: function(element){
						var scrollTo = $(element),
							container = this.$;
						container.scrollTop(
							scrollTo.offset().top - container.offset().top + container.scrollTop()
						);
					}.bind(this),
					scrollTo: function(x, y){
						this.$.scrollTop(y);
						this.$.scrollLeft(x);
					}.bind(this)
				}
				
				return this;
			}
		}))
	}
	
}());