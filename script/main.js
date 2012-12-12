console.log("loading - " + typeof include.cfg);

window.onerror = function(){
	console.log(arguments);
}

include.cfg({
	lockedToFolder: true	
}).routes({
	controller: '/script/component/{0}.js',
	uicontrol: '/script/control/{0}.js'
}).js({
	framework: ['dom/jquery', 'ruqq.base', 'utils', 'routes'],
	lib: ['compo','ranimate'],

	compo: ['scroller', 'prism', 'datePicker', 'timePicker', 'layout', 'list', 'utils'],
	controller: ['viewsManager', 'view'],
	uicontrol: ['radioButtons', 'pageActivity'],
	'': ['/script/utils/maskUtils.js']
}).ready(function() {

	var w = window,
		model = {

			menuModel: [{
				title: 'About',
				items: [{
					view: 'about',
					title: 'About'
				}/*, {
					view: 'blog',
					title: 'Blog'
				}*/]
			}, {
				title: 'Library',
				items: [{
					view: 'class',
					title: 'ClassJS'
				}, {
					view: 'mask',
					title: 'MaskJS'
				}, {
					view: 'include',
					title: 'IncludeJS'
				}, {
					view: 'includeBuilder',
					title: 'IncludeJS.Builder'
				}, {
					view: 'compo',
					title: 'CompoJS'
				}, {
					view: 'ruqq',
					title: 'RuqqJS',
					items: [{
						view: 'ruqq/routing',
						title: 'Routing'
					}, {
						view: 'ruqq/arr',
						title: 'Array Helper'
					}, {
						view: 'ruqq/obj',
						title: 'Object Helper'
					}, ]
				},{
					view: 'ranimate',
					title: 'RAnimateJS',					
				},

				]
			}, {
				title: 'Component',
				items: [{
					view: 'compos/scroller',
					title: 'scroller;'
				}, {
					view: 'compos/prism',
					title: 'prism;'
				}, {
					view: 'compos/datePicker',
					title: 'datePicker;'
				}, {
					view: 'compos/timePicker',
					title: 'timePicker;'
				}],
				hint: '... more in near future'
			}, {
				title: 'Pre/Post Processing',
				'class': 'badge',
				items: [{
					view: 'compos/layout',
					title: 'layout;'
				}, {
					view: 'compos/dualbind',
					title: 'dualbind;'
				}, {
					view: 'compos/validate',
					title: 'validate;'
				}]
			}]
		};



	Compo.config.setDOMLibrary($);

	w.app = new(Class({
		Base: Compo,
		attr: {
			template: '#layout'
		},
		compos: {
			menuHelp: '$: .menu-help',
			menu: ['$: menu',
			{
				'click: .viewTitle': function(e) {
					console.log('mouseup');
					var view = $(e.target).data('view');
					routes.navigate(view);
				},
				'click: h3.badge': function() {
					this.compos.menuHelp.css('opacity', 1);
				},
				'mouseleave': function() {
					this.compos.menuHelp.css('opacity', 0);
				}
			}]
		},
	}));


	w.app.render(model).insert(document.body);

	w.routes.add('/:view/?:category/?:anchor', function(current) {
		console.log('current', current);
		viewsManager.show(current);
	});

	viewsManager.show(w.routes.current() || {
		view: 'about'
	});



});