include.css('view.less').done(function(resp) {


   function when(idfrs, callback) {
	  var wait = idfrs.length,
		  ondone = function() {
			if (--wait === 0) {
			   callback();
			}
		  };

	  for (var i = 0, length = idfrs.length; i < length; i++) {
		 idfrs[i].done(ondone);
	  }
   }



   mask.registerHandler('view', Compo({
	  constructor: function() {
		 (this.attr || (this.attr = {}))['class'] = 'view';
	  },
	  renderStart: function(model, container, cntx) {
		 this.nodes = jmask('.view').attr(this.attr).append(this.nodes);
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


		 var prisms = Compo.findAll(this, 'prism', 'compo');
		 if (prisms && prisms.length) {
			when(Compo.findAll(this, 'prism', 'compo'), this.update.bind(this, info));
			return;
		 }

		 this.update(info);

	  },
	  update: function(info) {
		 var scroller = Compo.find(this, 'scroller');
		 scroller && scroller.scroller && scroller.scroller.refresh();

		 if (info.anchor) {
			var element = this.$.find('a[name="' + info.anchor + '"]').get(0);

			if (scroller && scroller.scroller) {
			   scroller.scroller.scrollToElement(element, 100);
			}
		 }
	  },
	  activate: function() {
		 var scroller = Compo.find(this, 'scroller');
		 scroller && scroller.scroller && scroller.scroller.refresh();
	  }

   }));

});
