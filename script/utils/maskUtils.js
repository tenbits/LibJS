(function() {
	var replaces = null;
	mask.registerHandler('formatter:pre', Class({
		makePre: function(string) {
			var lines = string.trim().split('\n'),
				max = 0,
				prfx;

			if (lines.length < 2) {
				return string;
			}

			for (var i = 0, x, imax = lines.length; i < imax; i++) {

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

			for (var i = 0, imax = lines.length; i < imax; i++) {
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

			for (var i = 0, x, imax = this.nodes.length; i < imax; i++) {
				x = this.nodes[i];

				if (x.content) {
					x.content = this.makePre(x.content);
				}
			}
		}
	}));




	if (ruqq.info.engine.name !== 'webkit' || true) {

		mask.registerHandler('scroller', Compo({
			//slots: {
			//	domInsert: function(){
			//		this.inserted = true;
			//		
			//		var dfr = this.deferred;
			//		if (dfr) {
			//			var imax = dfr.length,
			//				i = 0,
			//				fn, args;
			//				
			//			for (; i < imax; i++){
			//				
			//				fn = dfr[i][0];
			//				args = dfr[i][1];
			//			
			//				fn.apply(this, args);	
			//			}
			//			
			//		}
			//		
			//	}
			//},
			renderStart: function(model, container, cntx) {
				this.animateDismiss = 0;

				jmask(this)
					.tag('div') 
					.addClass('scroller') 
					.children() 
					.wrapAll('.scroller-container');

				var that = this;
				

				this.scroller = {
					refresh: function() {
						
						that.inserted = true;

						var dfr = that.deferred;
						
						that.deferred = null;
						
						if (dfr) {
							var fn = dfr[0],
								args = dfr[1];

							setTimeout(function(){
								that.scroller[fn].apply(that, args);
							},0);
						}
						
						
					},
					scrollToElement: function(element) {
												
						if (that.inserted !== true) {
							that.deferred = ['scrollToElement', [element]];
							return;
						}
						
						var scrollTo = $(element),
							container = that.$,
							scrollTop = scrollTo.offset().top
								- container.offset().top
								+ container.scrollTop()
								+ (that.attr.dtop << 0);
							
						container.scrollTop(scrollTop);
					},
					scrollTo: function(x, y) {

						that.animateDismiss = 1;
						that.$.scrollTop(y);
						that.$.scrollLeft(x);
					}
				}

				return this;
			},
			
			//bind: function(event, callback){
			//	
			//	switch (event) {
			//		case 'scroll':
			//			//if (this.$)
			//			//	this.$.scroll(callback);
			//			//else
			//			//	this._defer('on', [event, callback]);
			//			this.on(event, '', callback);
			//			return;
			//	}
			//	
			//},
			
			_defer: function(fn, args){
				if (this.deferred == null) 
					this.deferred = [];
				
				this.deferred.push([fn, args]);
			},
			
			onRenderEnd: function() {
				var that = this;
				
				//////this.$.scroll(function() {
				//////	if (--that.animateDismiss > -1) {
				//////		return;
				//////	}
				//////
				//////	var scrolled = this.scrollTop,
				//////		total = this.scrollHeight - this.offsetHeight - 1,
				//////		time = 200,
				//////		d = 5;
				//////
				//////	if (scrolled === 0 || scrolled >= total) {
				//////
				//////
				//////
				//////		if (this.last != null) {
				//////			var ds = this.last - scrolled;
				//////
				//////			ds < 0 && (ds *= -1);
				//////
				//////			d += ds;
				//////			d > 70 && (d = 70);
				//////
				//////		}
				//////
				//////		scrolled >= total && (d *= -1);
				//////
				//////
				//////
				//////		mask.animate(this, {
				//////			model: 'transform | translateY(0px) > translateY(' + d + 'px) | ' + time + 'ms ease-out',
				//////			next: 'transform | > translateY(0) | ' + time + 'ms ease-in'
				//////		});
				//////	}
				//////
				//////	this.last = scrolled;
				//////});
			}
		}))
	}

}());
