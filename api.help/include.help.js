void function(){
	
	/** "Best Documentation is in simple, but full use case with comments" */

	include
		/**
		 *	[.js](#.js)
		 * Load javascript files
		 * @argument
		 * 		1. String - IncludeUrl:
		 * 			a) "folder/file.js" - relative to current included javascript file
		 * 			b) "/folder/file.js" - relative to current loaded html file
		 * 		2. [String,...] - IncludedUrl, @see &uarr;
		 * 		3. { route: String|[String,...] } - @see .cfg, if route == '' @see 1. and 2. &uarr;
		 */
		.js({
			lib: ['linq','mask'],
			'': ['/builder.js','helper.js']
		})
		
		/**
		 *	[.css](#.css)
		 * 	Load css files
		 *  @arguments - @see .js 
		 */
		.css({
			styles: ['main','theme/dark']
		})
		
		/**
		 *	[.load](#.load)
		 *	Load{XMLHTTPRequest}
		 *	@arguments - @see .js (same url handling)
		 */
		.load('/data/description.txt')
		
		/**
		 *	[.ajax](#.ajax)
		 *	Ajax{XMLHTTPRequest}
		 *	same as .load, but its data is not embedded in release. @see Building Project
		 *	@arguments - @see .js (same url handling)
		 */
		.ajax('/user/tenbits/news')
		
		/**
		 *	[.embed](#.embed)
		 *	Loading script with script-tag, while .js loads first and than evals source.
		 *	This usually used to load cross-domain scripts.
		 *	(i) Nested dependencies couldnt be handled jet
		 */
		.embed('http://example.com/script.js')
		
		/**
		 *	[.lazy](#.lazy)
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
		 *	[.wait](#.wait)
		 * 	Wait until all upper resources are loaded, and continue to load
		 * 	all resources that will be included after this function.
		 * 	(example)
		 * 	include.js('a.js').wait().inlucde(['b1.js','b2.js']).done(onAandBsLoaded);
		 * 	(we use it for) if 'a.js' is our application framework and every bN.js needs it,
		 * 	we use wait() so that the framework is already loaded when evaluating bN.js
		 */
		.wait()
		
		/**
		 *	[.done](#.done)
		 *	Fire callback fn when all upper resources and also subresources are loaded
		 */		
		.done(function() { console.log('done'); })
		
		
		/**
		 *	[.ready](#.ready)
		 *	Same as .done, but additionally it waits (if not yet) for DOMContentLoaded
		 */
		.ready(function() { console.log('dom ready'); });
		
	/** .cfg - define routing */
	
	include
		/**
		 *	[.cfg](#.cfg)
		 *	Routing is mad-simple yet - {name} will be replaced with supplied value
		 *
		 *	In case of .css({styles: 'theme/dark'}) we become 'app/styles/theme/dark.css'
		 */
		.cfg({
			lib: 'file:///c:/dev/libs/{name}/lib/{name}.js',
			styles: 'app/styles/{name}.css'
		});
		
	}
}();