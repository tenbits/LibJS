
(function() {
    var replaces = null;
    mask.registerHandler('formatter:pre', Compo({
        constructor: function() {
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
        renderStart: function(values, container, cntx) {
            this.makePre(this.nodes);
        }
    }));



	if (ruqq.info.engine.name !== 'webkit' || true){
		mask.registerHandler('scroller', Compo({
			renderStart: function(model, container,cntx){


				jmask(this)
				.tag('div') //
				.addClass('scroller') //
				.children() //
				.wrapAll('.scroller-container');


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
