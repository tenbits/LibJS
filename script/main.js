
window.onerror = function(){
	console.log(arguments);
};

include.routes({
	controller: '/script/controller/{0}.js',
	uicontrol: '/script/control/{0}.js',
	script: '/script/{0}.js'
}).js({
	ruqq: ['dom/jquery', 'ruqq.base', 'utils', 'routes', 'browser.detect'],
	lib: ['mask', 'ranimate'],

	compo: ['scroller', 'prism', 'datePicker', 'timePicker', 'layout', 'list'],
	script: ['utils/maskUtils', 'pages', 'apiViewer/apiViewer'],
	controller: ['viewsManager', 'view', 'default'],
	uicontrol: ['radioButtons', 'pageActivity'],

}).ready(function() {

	var w = window;

	window.model = {

			menuModel: [{
				title: 'About',
				items: [{
					view: 'about',
					title: 'About'
				}, {
					view: 'feedback',
					title: 'Feedback',
					controller: 'default'
				}]
			}, {
				title: 'Library',
				items: [{
					view: 'class',
					title: 'ClassJS'
				}, {
					view: 'mask',
					title: 'MaskJS',
					items: [{
						view: 'sys',
						title: 'Sys'
					},{
						view: 'mask-binding',
						title: 'Binding'
					},{
						view: 'mask-j',
						title: 'jMask'
					},{
						view: 'mask-compo',
						title: 'Compo'
					},{
						title: '',
						'class': 'hr'
					},{
						title: 'Live Test',
						navigate: '/mask-try/'
					},{
						title: 'Html To Mask',
						navigate: '/html2mask/'
					}]
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
					////items: [{
					////	view: 'ruqq/routing',
					////	title: 'Routing'
					////}, {
					////	view: 'ruqq/array',
					////	title: 'Array Helper'
					////}, {
					////	view: 'ruqq/object',
					////	title: 'Object Helper'
					////}, ]
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
				}]
			}]
		};

	var App = Compo({
		attr: {
			template: '#layout'
		},
		compos: {
			menuHelp: '$: .menu-help',
			menu: ['$: menu',
			{
				'click: .viewTitle': function(e) {
					var view = $(e.target).data('view');
					if (view){
						w.routes.navigate(view);
						return;
					}
					var navigate = $(e.target).data('navigate');
					if (navigate){
						window.location.href = navigate;
					}
				},
				'click: h3.badge': function() {
					this.compos.menuHelp.css('opacity', 1);
				},
				'mouseleave': function() {
					this.compos.menuHelp.css('opacity', 0);
				}
			}]
		},
	});

	w.routes.add('/:view/?:category/?:anchor', function(current) {
		w.viewsManager.show(current);
	});

	w.app = Compo.initialize(App, model, document.body);

	w.viewsManager.show(w.routes.current() || {
		view: 'about'
	});



	if (ruqq.info.browser.name == 'msie'){
		var version = parseFloat(ruqq.info.browser.version);
		if (version <= 8){
			var dom = mask.render('.ie9Alert > "Sorry, website optimization is comming soon for IE < 9."');
			document.body.appendChild(dom);
		}
	}

});
