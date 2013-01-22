include.js({
	'lib': 'ranimate'
}).done(function() {

	var Helper = {
		doSwitch: function($current, $next) {
			$current.removeClass('active');
			$next.addClass('active');


			var prfx = ruqq.info.cssprefix;
			ruqq.animate($next, {
				property: 'opacity',
				valueFrom: '0',
				valueTo: '.9',
				duration: 500,
				timing: 'cubic-bezier(.58,1.54,.59,.75)'
			});
		}
	},
	currentCompo;


	var ViewsManager = Class({
		Base: Compo,
		Construct: function() {
			window.viewsManager = this;
		},
		render: function(values, container, cntx) {
			this.nodes = mask.compile('list value="views" > view;');
			this.tagName = 'div';
			Compo.render(this, values, container, cntx);
		},
		load: function(info) {

			var activity = Compo.findCompo(window.app, 'pageActivity').show(),
				name = info.view.replace('View', '');

			window.Page.resolve(name, function(controller, template){

				controller.prototype.attr = {
					template: template,
					id: name
				};

				mask.registerHandler(name + 'View', controller);

				this.append(name + 'View', {});

				activity.hide();


				var compo = Compo.findCompo(this,  name + 'View');//'#' + name);
				if (compo == null) {
					console.error('Cannt be loaded', name);
					return;
				}

				this.performShow(compo, info);

			}.bind(this));

		},
		show: function(info) {

			var $menu = $(document.getElementsByTagName('menu'));

			$menu.find('.selected').removeClass('selected');
			$menu.find('[data-view="'+info.view+'"]').addClass('selected');

			

			var compo = Compo.findCompo(this, info.view + 'View');
			if (compo == null) {
				this.$.children('.active').removeClass('active');
				this.load(info);
				return;
			}

			this.performShow(compo, info);
		},
		performShow: function(compo, info) {

			compo.section(info);

			if (compo == currentCompo) {
				return;
			}

			currentCompo = compo;

			if (this.$) {
				Helper.doSwitch(this.$.children('.active'), compo.$);
			}
			compo.activate && compo.activate();

			info = Page.getInfo(info.view);

			if (info && info.title){
				document.title = info.title;
			}
		}
	});

	mask.registerHandler('viewsManager', ViewsManager);

});
