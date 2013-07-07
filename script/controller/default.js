include.load('default.mask').done(function(resp) {

	mask.render(resp.load['default']);
	
	
	function when(dfrs, callback) {
		var count = dfrs.length;
		
		for (var i = 0, x, imax = dfrs.length; i < imax; i++){
			x = dfrs[i];
			
			x.done(function(){
				if (--count === 0) {
					callback();
				}
			});
		}
	}

	window.DefaultController = Compo({
		//tagName: 'div',
		//attr: {
		//	'class': 'view'
		//},
		compos: {
			radio_sideMenu: 'compo: .side-menu',
			radio_radioButtons: 'compo: .radioButtons'
		},
		
		onRenderStart: function(model, cntx){
			this.viewName = this.attr.id.replace('View', '');
			
			this.cntx = {};
		},
		
		onRenderEnd: function(elements, model, cntx){
			var $tabs = jmask(this).find(':tabs');
			
			var compos = this.compos;
			
			$tabs.each(function(x){
				if (x.attr.id == null)
					return;
				
				compos['tabs' + x.attr.id] = x;
			});
			
			this.cntx = cntx;
		},
		
		events: {
			'changed: .radioButtons': function(e, target) {
				var path = this.viewName + '/' + target.getAttribute('name');
				
				window.routes.navigate(path);
			},
			'changed: .group': function(event, target){
				
				var category = target.getAttribute('name');
				
				var path = this.viewName
					+ '/'
					+ this.compos.radio_radioButtons.getActiveName()
					+ '/'
					+ category;
				
				window.routes.navigate(path);
			}
		},
		
		slots: {
			'-tabChanged': function(sender, name){
				
				var $group = this.$.find('.group.-show'),
					radio = $group.compo();
					
				if (radio) {
					radio.setActive(name, false);
				}
				
			}
		},
		
		getCurrentTabName: function(){
			var $active = this.$.find('.tabPanel > .active');
			
			return $active.data('name');
		},
		
		showTab: function(name){
			if (this.compos.radio_radioButtons) {
				this.compos.radio_radioButtons.setActive(name);
			}
			
			if (this.compos.radio_sideMenu) {
				this.compos.radio_sideMenu.setActive(name);
			}
			
			this.$.find('.tabPanel > .active').removeClass('active');
			this.$.find('.tabPanel > .' + name).addClass('active');

		},
		
		showSection: function(name){
			
			var $sideMenu = this.$.find('.side-menu');
		
			if ($sideMenu.length === 0)
				return;
		
			if (!$sideMenu.compo().getActiveName()) 
				return;
			
			
			
			var $group = $sideMenu.find('.group.-show');
				
			
				
			if ($group.length === 0) 
				return;
			
			
			if (this.cntx && this.cntx.promise && this.cntx.promise.length) {
				var that = this,
					dfrs = this.cntx.promise.splice(0);
				when(dfrs, function(){
					that.showSection(name);
				})
				
				return true;
			}
			
			
			var groupName = $group.attr('name'),
				group = $group.compo();
			
			if (!name) {
				name = group.getList()[0];
			}
			
			
			
			group.setActive(name);
			
			var tabs = this
				.compos['tabs' + groupName];
				
			tabs.setActive(name);
			
			return true;
		},
		
		section: function(info) {
			if (!info.category) {
				info.category = this.defaultCategory || 'info';
			}
			
			this.showTab(info.category);
			
			
			var hasSections = this.showSection(info.anchor);
			
			window
				.compos
				.menu[hasSections ? 'blur' : 'focus']();

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
