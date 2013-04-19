(function() {

	var pages = {
		'about': {
			title: 'About'
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

		'mask-j': {
			title: 'mask.J'
		},
		'mask-binding': {
			title: 'mask.Binding'
		},
		'sys': {
			title: 'Handler: Percent'
		},


		'ruqq': {
			title: 'RuqqJS'
		},
		'mask-animation': {
			title: 'Animations',
			controller: 'mask-animation'
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
				template = String.format('/pages/libs/%1/%2.mask', id, id);

			if (info.controller){
				controller = String.format('/pages/libs/#{controller}/#{controller}.js', info);
			}

			include.instance().js(controller + '::Controller').load(template + '::Template').done(function(resp){
				callback(resp.Controller, resp.load.Template);
			});

		}
	}

}());
