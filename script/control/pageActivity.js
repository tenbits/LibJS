(function() {


	var I = ruqq.info,
		vendor = null,
		initVendorStrings = function() {
			vendor = {
				TransitionProperty: I.prefix + 'TransitionProperty',
				Transform: I.prefix + 'Transform',
				Transition: I.prefix + 'Transition',
				cssTransform: I.cssprefix + 'transform'
			};
		};


	mask.registerHandler(':spinner', Compo({
		onRenderStart: function(values, container, cntx) {
			this.currentPos = 0;
			this.tagName = 'div';

			var defaults = {
				width: 32,
				height: 32,
				image: '',
				top: '50%',
				left: '50%',
				marginLeft: -16,
				marginTop: -16
			};

			Object.defaults(this.attr, defaults);

			this.attr.marginTop = this.attr.height / -2;
			this.attr.marginLeft = this.attr.width / -2;
			if (I.supportTransitions) {
				this.attr.image = this.attr.image.replace('.png', '-single.png');
			}


			var _ = [ //
			'width:#{width}px;', //
			'height:#{height}px;', //
			'background:url(#{image}) 0 0 no-repeat;', //
			'position:absolute;', //
			'top:#{top};', //
			'left:#{left};', //
			'margin-left:#{marginLeft}px;', //
			'margin-top:#{marginTop}px;', //
			'z-index:9999999;', //
			'display:none;', //
			];

			this.attr.style = String.format(_.join(''), this.attr);

			Object.clear(this.attr, defaults);
		},
		start: function() {
			if (this.interval) {
				return;
			}


			var style = this.$.get(0).style;
			if (I.supportTransitions) {
				if (vendor == null) {
					initVendorStrings();
				}


				style[vendor.TransitionProperty] = 'none';
				style[vendor.Transform] = 'rotate(0deg)';

				setTimeout(function() {
					style[vendor.Transition] = vendor.cssTransform + ' 3s linear';
					style[vendor.Transform] = 'rotate(720deg)';
				}, 1);

				this.interval = setInterval(function() {
					style[vendor.TransitionProperty] = 'none';
					style[vendor.Transform] = 'rotate(0deg)';

					setTimeout(function() {
						style[vendor.Transition] = vendor.cssTransform + ' 3s linear';
						style[vendor.Transform] = 'rotate(720deg)';
					}, 0);
				}, 3000);

			} else {
				//this.interval = setInterval(function() {
				//    this.currentPos += this.data.height;
				//    if (this.currentPos > this.data.height * this.data.frames - 1) {
				//        this.currentPos = 0;
				//    }
				//    this.$.css('background-position', '0px -' + this.currentPos + 'px');
				//}.bind(this), 100);
			}
		},
		stop: function() {
			if (I.supportTransitions) {
				var style = this.$.get(0).style;
				style[vendor.TransitionProperty] = 'none';
				style[vendor.Transform] = 'rotate(0deg)';
			}

			if (this.interval == null) {
				console.warn('Stop spinner but interval is null !!!');
				return;
			}
			clearInterval(this.interval);
			this.interval = null;
		},
		show: function() {
			this.start();
			this.$.show();
			return this;
		},
		hide: function() {
			this.stop();
			this.$.hide();
			return this;
		},
		isActive: function() {
			return this.interval != null;
		}
	}));


	mask.registerHandler(':pageActivity', Compo({
		constructor: function() {
			this.compos = {
				'spinner': 'compo: :spinner'
			};
		},
		onRenderStart: function() {

			jmask(this).tag('div').css({
				position: 'absolute',
				top: '0px',
				left: '0px',
				right: '0px',
				bottom: '0px',
				display: 'none',
				zIndex: 999999
			}).append(':spinner').children().attr({
				image: 'images/128x128_spinner.png',
				width: 128,
				height: 128,
				frames: 12
			});
		},
		show: function() {
			this.$.show();
			this.compos.spinner.show();
			return this;
		},
		hide: function() {
			this.$.hide();
			this.compos.spinner.hide();
			return this;
		}
	}));

})();
