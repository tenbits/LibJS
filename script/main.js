window.onerror = function(e, a, b) {
	console.error(arguments, typeof a.stack);
}

include.cfg({
	lockedToFolder: true,
	controller: '/script/component/{name}.js',
	uicontrol: '/script/control/{name}.js'
}).js({
	framework: ['es5shim', 'dom/jquery', 'ruqq.base', 'utils', 'animation'],
	lib: 'compo'
}).wait().js({
	compo: ['scroller', 'prism'],
	controller: ['viewsManager', 'view'],
	uicontrol: ['radioButtons', 'pageActivity'],
	'': '/script/handler/routes.js'
}).ready(function() {
	
	include.js({
		compo: ['datePicker','timePicker']
	});

	mask.registerHandler('html', Class({
		render: function(values, container) {
			var source = null;
			if (this.attr.source != null) source = document.getElementById(this.attr.source).innerHTML;
			if (this.nodes && this.nodes.content != null) source = this.nodes.content;

			var $div = document.createElement('div');
			$div.innerHTML = source;
			for (var key in this.attr) {
				$div.setAttribute(key, this.attr[key]);
			}
			container.appendChild($div);
		}
	}));


	var w = window,
		views = {
			scrollerView: 'Scroller',
			prismView: 'Prism',
			datePickerView: 'Date Picker',
			timePickerView: 'Time Picker',
			formsView: 'Forms',


			aboutView: 'About',
			classView: 'ClassJS',
			maskView: 'MaskJS',
			includeView: 'IncludeJS',
			includeBuilderView: 'IncludeJS.Builder',
			compoView: 'CompoJS',
			ruqqView: 'RuqqJS',
			
			bindingsView: 'Bindings'
		},
		aggr = function(keys, fn) {
			var arr = [];
			if (keys == null) keys = Object.keys(views);
			for (var i = 0; i < keys.length; i++) arr.push(fn(keys[i], views[keys[i]]));
			return arr;
		};

	var model = {
		libraries: aggr(['classView', 'maskView', 'includeView', 'includeBuilderView', 'compoView', 'ruqqView'], function(key, x) {
			return {
				id: key,
				name: x.name || x
			}
		}),
		components: aggr(['scrollerView', 'prismView', 'datePickerView', 'timePickerView'], function(key, x) {
			return {
				id: key,
				name: x.name || x
			}
		}),
		processors: aggr(['bindingsView'], function(key, x){
			return {
				id: key,
				name: x.name || x
			}
		})
	};




	Compo.config.setDOMLibrary($);

	w.app = new(Class({
		Base: Compo,
		attr: {
			template: '#layout'
		},
		compos: {
			menuHelp: '$: .menu-help',
			menu:  ['$: menu', {				
				'click: li' : function(e) {
					var view = $(e.target).data('view');
					routes.set(view.replace('View', ''));
				},
				'click: h3' : function(){
					this.compos.menuHelp.css('opacity',1);
				},
				'mouseleave': function(){
					this.compos.menuHelp.css('opacity',0);
				}
			}]
		},		
	}));


	w.app.render(model).insert(document.body);

	w.routes = new Routes({
		match: /([\w]+)(\/([\w]+))?(\/([\w]+))?/,
		param: 'view=$1View&category=$3&anchor=$5',
		callback: viewsManager.show.bind(viewsManager)
	});





	viewsManager.show(w.routes.current() || {
		view: 'aboutView'
	});



});