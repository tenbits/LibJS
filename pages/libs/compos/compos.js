include.load('compos.mask').done(function(r) {

	var tags = {};
	var TagItem = Class({
		render: function(tag, template, container, scroller) {
			this.scroller = scroller;
			this.container = container;

			template = "div data-tag='" + tag + "' { " + template + " }";
			container.appendChild(mask.renderDom(template, null, null, this));

			var prism = Compo.findCompo(this, 'prism');
			if (prism) {
				prism.done(this.update.bind(this));
			} else {
				this.update();
			}
			return this;
		},
		update: function() {
			this.scroller.scroller.refresh();

			var route = routes.current();
			if (route && route.anchor) {
				var element = $(this.container).find('a[name="' + route.anchor + '"]').get(0);

				this.scroller.scroller.scrollToElement(element, 100);
			}
		}
	});
    
    

	function doSwitch($current, $next, $container) {

		$current.removeClass('active');
		$next.addClass('active');
		
		new ruqq.animate.Model({
			model: 'opacity | .3 > 1 | 300ms' //				
		}).start($container.parent()[0]);
		
	}

	mask.registerHandler('composView', Class({
		Base: mask.getHandler('view'),
		attr: {
			id: 'composView',
			template: r.load[0]
		},
		compos: {
			'$panel': '$: .container',
			'scroller': 'compo: scroller'
		},
		section: function(route) {

			var tag = route.category,
                item = tags[tag];
                
			if (item) {
				this.show(tag);
				item.update();
			} else {
				this.load(tag);
			}
		},
		load: function(tag) {
			this.$.parent().css('opacity', '.3');
			$.get('pages/tags/' + tag + '/' + tag + '.mask').then(function(response) {

                var item = new TagItem().render(tag, response, this.compos.$panel[0], this.compos.scroller);
				tags[tag] = item;
				
                this.show(tag);                
                item.update();
			}.bind(this));
		},
		show: function(tag) {

			var $current = this.compos.$panel.children('.active'),
				$next = this.compos.$panel.children('[data-tag=' + tag + ']');


			if ($current.length) {
				doSwitch($current, $next, this.$);
			} else {
				this.$.parent().css('opacity', '1');
				$next.addClass('active');
			}
			return;
		}
	}));

	window.tags = tags;

	r = null;
});