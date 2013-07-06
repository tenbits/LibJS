
window.onerror = function(){
	console.log(arguments);
};

include.routes({
	controller: '/script/controller/{0}.js',
	uicontrol: '/script/control/{0}.js',
	script: '/script/{0}.js',
	
	appcompo: '/script/compo/{0}/{1}.js'
}).js({
	ruqq: ['dom/jquery', 'ruqq.base', 'utils', 'routes', 'browser.detect', 'arr'],
	lib: ['mask', 'mask.animation'],

	compo: [
		'scroller',
		'prism',
		'datePicker',
		'timePicker',
		'layout',
		'list',
		'tabs',
		'radio'
	],
	script: ['utils/maskUtils', 'pages', 'apiViewer/apiViewer', 'downloader/downloader'],
	controller: ['viewsManager', 'view', 'default'],
	uicontrol: ['radioButtons', 'pageActivity'],
	
	appcompo: ['menu']
})

.load('/pages/libs/about/about.mask')


.ready(function() {

	routes.add('/:view/?:category/?:anchor', function(current) {
		window.viewsManager.show(current);
	});


	var currentRoute = routes.current() || {
			view: 'about'
		},
		pageInfo = Page.getInfo(currentRoute.view);
		
	
		
	window.compos = {};

	window.model = {
			menuHidden: pageInfo.menuHidden,
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
						view: 'mask-j',
						title: 'jMask'
					},{
						view: 'mask-compo',
						title: 'Compo'
					},{
						view: 'mask-binding',
						title: 'Binding'
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
					view: 'mask-animation',
					title: 'Mask.Animation',
				}, {
					view: 'include',
					title: 'IncludeJS'
				}, {
					view: 'includeBuilder',
					title: 'IncludeJS.Builder'
				},{
					view: 'utest',
					title: 'UTest'
				}, {
					view: 'ruqq',
					title: 'RuqqJS'
				}]
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
					
					var view = $(e.currentTarget).data('view');
					if (view){
						window.routes.navigate(view);
						return;
					}
					var navigate = $(e.currentTarget).data('navigate');
					if (navigate){
						window.location.href = navigate;
					}
				},
				'click: h3.badge': function() {
					this.compos.menuHelp.show();
				},
				'mouseleave': function() {
					this.compos.menuHelp.hide();
				}
			}]
		},
	});


	window.app = Compo.initialize(App, model, document.body);

	window.viewsManager.show(currentRoute);



	if (ruqq.info.browser.name == 'msie'){
		var version = parseFloat(ruqq.info.browser.version);
		if (version <= 8){
			var dom = mask.render('.ie9Alert > "Sorry, website optimization is comming soon for IE < 9."');
			document.body.appendChild(dom);
		}
	}

});
