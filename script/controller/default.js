include.load('default.mask').done(function(resp) {

	mask.render(resp.load['default']);

	window.DefaultController = Compo({
		tagName: 'div',
		attr: {
			'class': 'view'
		},
		compos: {
			sideMenu: 'compo: .side-menu',
			
			radioButtons: 'compo: .radioButtons'
		},
		
		onRenderStart: function(){
			this.viewName = this.attr.id.replace('View', '');
		},
		
		events: {
			'changed: .radioButtons': function(e, target) {
				var path = this.viewName + '/' + target.name;
				
				window.routes.navigate(path);
			},
			'changed: .group': function(event, target){
				
				var category = target.name;
				
				var path = this.viewName
					+ '/'
					+ this.compos.radioButtons.getActiveName()
					+ '/'
					+ category;
				
				window.routes.navigate(path);
			}
		},
		
		getCurrentTabName: function(){
			var $active = this.$.find('.tabPanel > .active');
			
			return $active.data('name');
		},
		
		tab: function(name) {
			this.$.find('.tabPanel > .active').removeClass('active');
			this.$.find('.tabPanel > .' + name).addClass('active');

			var hasCategories;
			
			if (this.compos.sideMenu) {
				this.compos.sideMenu.setActive(name);
				
				hasCategories = this.compos.sideMenu.has(name);
			}
			
			
			
			window
				.compos
				.menu[hasCategories ? 'blur' : 'focus']();
			
			
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
