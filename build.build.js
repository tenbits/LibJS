<!DOCTYPE HTML>
global.config = {
	'settings': {
		io: {
			extensions: {
				js: ['condcomments:read', 'importer:read']
			}
		}
	},
	'build': {
		file: "index.dev.html",
		outputMain: "index.html",
		outputSources: "index.build/",
		version: '1.1',
		minify: true
	},
	
	'libs': {
		action: 'copy',
		files: {
			'../class/lib/class.js'		: 'libs/class/class.js',
			'../include/lib/include.js'	: 'libs/include/include.js',
			'../mask/lib/mask.js'		: 'libs/mask/mask.js',
			'../mask/lib/mask.node.js'	: 'libs/mask/mask.node.js',
			
			'../mask.animation/lib/mask.animation.js': 'libs/mask/mask.animation.js',
			
			'../ruqq/lib/routes.js'	: 'libs/ruqq/routes.js',
			'../ruqq/lib/arr.js'	: 'libs/ruqq/arr.js',
			'../ruqq/lib/util.js'	: 'libs/ruqq/util.js',
		}
	},

	
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
