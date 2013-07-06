(function() {

	var pages = {
		'about': {
			title: 'About',
			controller: 'about',
			styles: 'about',
			menuHidden: true
		},
		'feedback': {
			title: 'Feedback'
		},
		'class': {
			view: 'class',
			title: 'ClassJS'
		},
		'mask': {
			title: 'MaskJS',
			controller: 'mask'
		},
		'include': {
			title: 'IncludeJS'
		},
		'includeBuilder': {
			view: 'includeBuilder'
		},
		
		'utest': {
			view: 'utest'
		},

		'mask-j': {
			title: 'mask.J'
		},
		'mask-binding': {
			title: 'mask.Binding'
		},
		'mask-compo': {
			title: 'mask.Compo'
		},

		'sys': {
			title: 'Handler: Percent'
		},


		'ruqq': {
			title: 'RuqqJS'
		},
		'mask-animation': {
			title: 'Animations'
		},

		'compos': {
			title: 'Component',
			controller: 'compos'
		}

	};

	window.Page = {
		getInfo: function(id){
			return pages[id];
		},
		resolve: function(id, callback) {
			var info = pages[id];

			if (!info) {
				console.error('No Page with ID:', id);
				return;
			}

			var controller = '/script/controller/default.js',
				template = String.format('/pages/libs/%1/%2.mask', id, id),
				styles;

			if (info.controller){
				controller = String.format('/pages/libs/#{controller}/#{controller}.js', info);
			}
			if (info.styles) {
				var ext = DEBUG ? 'less' : 'css';
				styles = String.format('/pages/libs/%1/%1.%2', info.styles, ext);
			}

			var res = include
				.instance()
				.js(controller + '::Controller')
				.load(template + '::Template');
				
			if (info.styles) 
				res.css(styles);
			
				
			res.done(function(resp){
					callback(resp.Controller, resp.load.Template);
				});

		}
	}

}());
