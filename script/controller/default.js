include.load('default.mask').done(function(resp) {

	mask.render(resp.load['default']);

	window.DefaultController = Compo({
		constructor: function() {
			(this.attr || (this.attr = {}))['class'] = 'view';
		},
		onRenderStart: function(model, cntx, container) {
			this.tagName = 'div';
		},
		events: {
			'changed: .radioButtons': function(e, target) {
				var name = this.attr.id.replace('View', '');
				window.routes.navigate(name + '/' + target.name);
			}
		},

		tab: function(name) {
			this.$.find('.tabPanel > .active').removeClass('active');
			this.$.find('.tabPanel > .' + name).addClass('active');

			var scroller = Compo.find(this, 'scroller');
			if (scroller && (scroller = scroller.scroller)) {
				scroller.scrollTo(0, 0);
				scroller.refresh();
			}

		},

		section: function(info) {
			if (!info.category) {
				info.category = this.defaultCategory || 'info';
			}

			var buttons = Compo.find(this, '.radioButtons');

			if (buttons) {
				buttons.setActive(info.category);
				this.tab(info.category);
			}


			this.update(info);

		},
		update: function(info) {
			var scroller = Compo.find(this, 'scroller');
			scroller && scroller.scroller && scroller.scroller.refresh();

			if (info.anchor) {
				var element = this.$.find('a[name="' + info.anchor + '"]').get(0);

				if (element && scroller && scroller.scroller) {
					scroller.scroller.scrollToElement(element, 100);
				}
			}
		},
		activate: function() {
			var scroller = Compo.find(this, 'scroller');
			scroller && scroller.scroller && scroller.scroller.refresh();
		}
	});

	include.exports = window.DefaultController;
})
