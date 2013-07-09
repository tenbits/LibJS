(function(){
	
	/** "Best Documentation is in simple, but full use case with comments" */

	include
		/**
		 *	[.js](name=js)
		 * Load javascript files
		 * @argument
		 * 		1. String - IncludeUrl:
		 * 			a) 	"folder/file.js",
		 * 				"./folder/file.js"
		 * 				- relative to current included javascript file
		 * 			
		 * 			
		 * 			b) "/folder/file.js" - relative to current loaded html file
		 * 		2. [String,...] - IncludedUrl, @see &uarr;
		 * 		3. { route: String|[String,...] } - @see .cfg,
		 * 			if route == '' @see 1. and 2. &uarr;
		 */
		.js({
			lib: ['linq','mask'],
		})
		
		.js('/builder.js','helper.js')
		
		/**
		 *	[.css](name=css)
		 * 	Load css files
		 *  @arguments - @see .js 
		 */
		.css({
			styles: ['main','theme/dark']
		})
		
		/**
		 *	[.load](name=load)
		 *	Load{XMLHTTPRequest}
		 *	@arguments - @see .js (same url handling)
		 */
		.load('/data/description.txt')
		
		/**
		 *	[.ajax](name=ajax)
		 *	Ajax{XMLHTTPRequest}
		 *	same as .load, but its data is not embedded in release. @see Building Project
		 *	@arguments - @see .js (same url handling)
		 */
		.ajax('/user/tenbits/news')
		
		/**
		 *	[.embed](name=embed)
		 *	Loading script that will be not included in build by IncludeJS.Builder
		 */
		.embed('http://example.com/script.js')
		
		/**
		 *	[.lazy](name=lazy)
		 *	Lazy Module
		 *	@argument {xpath: url}
		 *
		 *	url - @see .js
		 *	xpath - is object path in 'window' - use dot for nested objects,
		 *			example 'some.namespace.myobj'
		 *
		 *	Under the hood __defineGetter__ is used,
		 *	as soon as you make call to this object, the source is eval-ed,
		 *	and the last statement is applied to self.
		 *
		 *	From example below, notification.js script is not evaluated
		 *	until you call window.ui.notification.show('Hello');
		 *
		 */
		.lazy({
			'ui.notification': '/scripts/ui/notification.js'
		})

		/**
		 *	[.done](name=done)
		 *	Fire callback fn when all upper resources and also subresources are loaded
		 */		
		.done(function() { console.log('done'); })
		
		
		/**
		 *	[.ready](name=ready)
		 *	Same as .done, but additionally it waits (if not yet) for DOMContentLoaded
		 */
		.ready(function() { console.log('dom ready'); });
		
	/** .cfg -  */
	
	include
		/**
		 *	[.cfg](name=cfg)
		 *	Routing is mad-simple yet - {name} will be replaced with supplied value
		 *
		 *	In case of .css({styles: 'theme/dark'}) we become 'app/styles/theme/dark.css'
		 */
		.cfg({
			/**
			 *	Root Path to use for all resources, @default: NULL
			 */
			path: '/resource/',
			/**
			 *	@default false.
			 *		(is same as : .cfg({path: getDir(window.location)}))
			 *		With true, when you are on
			 *			{domain}/folder/second/index.html
			 *		path '/script.js' means -> '/folder/second/script.js',
			 *		and not '{domain}/script.js'
			 */
			lockedToFolder: false,
			/**
			 *	with FALSE - scripts will be loaded with script tag
			 *		this is slower, but best for development, as by errors
			 *		you see the file and line number
			 *	with TRUE - scripts will be loaded with XMLHttpRequest and
			 *		evaluated with eval()
			 *		its much faster, as scripts will be loaded in async mode,
			 *		but in browser you'll see no fileName by errors
			 */
			eval: true,

			/**
			*  Define Custom Resource Loader 
			*  Resource will be loaded with XMLHttpRequest and then handled with defined loader.
			*     For example: Coffee Loader will compile coffeescript to javascript before processing
			*/
			loader: {
				/** @key - file extension
				 *  @value - route to the loader - (it will be loaded also with includejs)
				 */
				coffee: {
					lib: 'include/loader/coffee/loader'
				},
				json: {
					process: function(fileContent){
						return JSON.parse(fileContent);
					}
				}
			},
			
			/**
			 *	Enable NodeJS exports object per resource
			 *
			 *	Are aliases for include.exports = ...
			 *
			 *	@default FALSE
			 */
			modules: true
		})
		
		/**
		 *	[.routes](name=routes)
		 *
		 *	For a namespace you define some formatted route, ex.: '/lib/{0}/{1}.js',
		 *	then template path for this route can be - ex.: 'jquery/mywidget'.
		 *	If you specify less "breadcrumbs" as needed, for example
		 *	for this path: 'jquery' - this url will be resolved as '/lib/jquery/jquery.js'
		 *	
		 *	Note that forward slash means, that the resource path is relative to
		 *		applications root path, as without that forward slash this path will be
		 *		relative to current resource's path.
		 */
		.routes({
			/**
			 *	Resolve example:
			 *		{lib: 'jquery/mywidget'} -> /.reference/jquery/mywidget.js
			 *		{lib: 'jquery'} -> /.reference/jquery/jquery.js
			 */
			lib: '/.reference/{0}/{1}.js',
			/**
			 *	Resolve example:
			 *		{style: 'form/dark'} -> styles/form/dark.css
			 */
			style: '/sctyles/{0}.css'			
		})
		
		/**
		 *	Create new Include Instance
		 */		
		.instance();



		/**
		 *	Define exports
		 *
		 *	It can be any instance - {Function} {Object} {String} ...
		 *
		 *	This is optional, and can be then accessed by parent resource in
		 *	.done/.ready callback.
		 *	*/
		
		include.exports = function(){ /* ... */ }
		
		/**
		 *	If you use autoreload feature of includejs.builder, then
		 *	specify reload function of current resource, then this wll be fired if resource file has changed.
		 *	Default: If *.js file changes, then complete window reload occures
		 */
		include.reload = function(newSource){
			/** ... some unload logic ... */
			eval(newSource);
			/** ... some init logic ... */
		}
	}
}());