window.L = include.exports = {
	env: 'browser',
	compression: 'min',
	namespace: 'atma',
	
	size: '-',
	
	libs: [{
			env: 'both',
			file: 'class/class.js',
			name: 'ClassJS',
			enabled: true,
			exports: ['Class']
		},
		{
			env: 'browser',
			file: 'include/include.js',
			name: 'IncludeJS',
			enabled: true,
			exports: ['include']
		},
		{
			env: 'node',
			file: 'include/include.node.js',
			name: 'IncludeJS.Node',
			enabled: true,
			exports: ['include']
		},
		{
			env: 'browser',
			file: 'mask/mask.js',
			name: 'MaskJS',
			enabled: true,
			exports: ['mask', 'jmask','Compo'],
			modules: [{
					env: 'browser',
					name: 'layout',
					enabled: true,
					file: 'mask/handlers/layout.js'
				}
			]
		},
		{
			env: 'node',
			file: 'mask/mask.node.js',
			name: 'MaskJS.Node',
			enabled: true,
			exports: ['mask','jmask', 'Compo'],
			modules: [{
					env: 'node',
					name: 'layout',
					enabled: true,
					file: 'mask/handlers/layout.js'
				}
			]
		},
		{
			env: 'browser',
			file: 'mask/mask.animation.js',
			name: 'Mask.Animation',
			enabled: true,
			exports: ['mask.animate']
		},
		{
			env: 'both',
			file: 'ruqq/arr.js',
			name: 'Ruqq.Arr',
			enabled: false,
			exports: ['ruqq.arr']
		},
		{
			env: 'browser',
			file: 'ruqq/routes.js',
			name: 'Ruqq.Routes',
			enabled: false,
			exports: ['routes']
		},
		
	]
	
};