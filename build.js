
global.config = {
	// 'settings': {
	// 	io: {
	// 		extensions: {
	// 			js: ['condcomments:read', 'importer:read']
	// 		}
	// 	}
	// },
	'build': {
		file: "index.dev.html",
		outputMain: "index.html",
		outputSources: "index.build/",
		version: '1.1',
		minify: false
	},
	
	'libs': [{
		action: 'copy',
		files: {
			'../class/lib/class.js'			: 'libs/class/class.js',
			'../class/lib/class.min.js'		: 'libs/class/class.min.js',
			
			'../include/lib/include.js'		: 'libs/include/include.js',
			'../include/lib/include.min.js'	: 'libs/include/include.min.js',
			
			'../include/lib/include.node.js'	: 'libs/include/include.node.js',
			

			'../mask/lib/mask.js'				: 'libs/mask/mask.js',
			'../mask/lib/mask.min.js'			: 'libs/mask/mask.min.js',
			'../mask/lib/mask.node.js'			: 'libs/mask/mask.node.js',
			'../compos/layout/lib/layout.js'	: 'libs/mask/handlers/layout.js',
			
			'../mask.animation/lib/mask.animation.js'		: 'libs/mask/mask.animation.js',
			'../mask.animation/lib/mask.animation.min.js'	: 'libs/mask/mask.animation.min.js',
			
			'../ruqq/lib/routes.js'	: 'libs/ruqq/routes.js',
			'../ruqq/lib/arr.js'	: 'libs/ruqq/arr.js',
			'../ruqq/lib/utils.js'	: 'libs/ruqq/utils.js',
		}
	}, {
		action: 'custom',
		script: 'tools/libs-minify.js'
	}],

	
	'defaults': ['build']
};




function JSHint() {

	return {
		options: {
			curly: true,
			eqeqeq: true,
			forin: false,
			immed: true,
			latedef: true,
			newcap: true,
			noarg: true,
			noempty: true,
			nonew: true,
			expr: true,
			regexp: true,
			undef: true,
			unused: true,
			strict: true,
			trailing: true,

			boss: true,
			eqnull: true,
			es5: true,
			lastsemic: true,
			browser: true,
			node: true,
			onevar: false,
			evil: true,
			sub: true,
		},
		globals: {
			define: true,
			require: true,
		}
	};
}
