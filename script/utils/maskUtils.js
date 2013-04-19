
(function() {
    var replaces = null;
    mask.registerHandler('formatter:pre', Class({
        makePre: function(string) {
            var lines = string.trim().split('\n'), max = 0, prfx;

			if (lines.length < 2) {
				return string;
			}

			for(var i = 0, x, imax = lines.length; i < imax; i++){

				var match = /^[\t ]+/.exec(lines[i]);

				if (match && match[0].length > 0) {
					if (max === 0 || match[0].length < max) {
						max = match[0].length;
					}
				}
			}

			if (!max) {
				return string;
			}

			for(var i = 0, imax = lines.length; i < imax; i++){
				prfx = lines[i].substring(0, max);
				if (/^\s*$/.exec(prfx)) {
					lines[i] = lines[i].substring(max);
				}
			}

			return lines.join('\n');
        },
        renderStart: function(values, container, cntx) {
			if (this.nodes == null) {
				return;
			}

            for(var i = 0, x, imax = this.nodes.length; i < imax; i++){
				x = this.nodes[i];

				if (x.content) {
					x.content = this.makePre(x.content);
				}
			}
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
