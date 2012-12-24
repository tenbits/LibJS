if (typeof Function.prototype.bind === 'undefined') {
	Function.prototype.bind = function() {
		if (arguments.length < 2 && typeof arguments[0] == "undefined") {
			return this;
		}
		var __method = this,
			args = Array.prototype.slice.call(arguments),
			object = args.shift();
		return function() {
			return __method.apply(object, args.concat(Array.prototype.slice.call(arguments)));
		};
	};
}

if (typeof Object.defineProperty === 'undefined') {
	if (({}).__defineGetter__ !== 'undefined') {
		Object.defineProperty = function(obj, prop, data) {
			if (data.set) {
				obj.__defineSetter__(prop, data.set);
			}
			if (data.get) {
				obj.__defineGetter__(prop, data.get);
			}
		};
	}
}

if (typeof Date.now === 'undefined') {
	Date.now = function() {
		return new Date().getTime();
	};
}

if (typeof window.requestAnimationFrame === 'undefined') {
	window.requestAnimationFrame = (function() {
		var w = window;
		return w.requestAnimationFrame || //
		w.webkitRequestAnimationFrame || //
		w.mozRequestAnimationFrame || //
		w.oRequestAnimationFrame || //
		w.msRequestAnimationFrame || //
		function(callback) {
			return setTimeout(callback, 17);
		};
	}());
}
;(function(global) {

	var helper = {
		each: function(arr, fn) {
			if (arr instanceof Array) {
				for (var i = 0; i < arr.length; i++) {
					fn(arr[i]);
				}
				return;
			}
			fn(arr);
		},
		extendProto: function(proto, x) {
			var prototype;
			if (x == null) {
				return;
			}
			switch (typeof x) {
			case 'function':
				prototype = x.prototype;
				break;
			case 'object':
				prototype = x;
				break;
			default:
				return;
			}
			for (var key in prototype) {
				proto[key] = prototype[key];
			}
		},

		extendClass: function(_class, _base, _extends, original) {
			
			if (typeof original !== 'object') {
				return;
			}

			this.extendPrototype = original['__proto__'] == null ? this.protoLess : this.proto;
			this.extendPrototype(_class, _base, _extends, original);
		},
		proto: function(_class, _base, _extends, original) {
			var prototype = original,
				proto = original;
			
			prototype.constructor = _class.prototype.constructor;
			
			if (_extends != null) {
				proto['__proto__'] = {};
				
				helper.each(_extends, function(x) {					
					helper.extendProto(proto['__proto__'], x);
				});
				proto = proto['__proto__'];
			}
			
			if (_base != null) {
				proto['__proto__'] = _base.prototype;
			}

			_class.prototype = prototype;			
		},
		/** browser that doesnt support __proto__ */
		protoLess: function(_class, _base, _extends, original) {

			if (_base != null) {
				var proto = {},
					tmp = function(){};
					
				tmp.prototype = _base.prototype;
				
				_class.prototype = new tmp();				
				_class.prototype.constructor = _class;
			}
			
			helper.extendProto(_class.prototype, original);
			
			
			if (_extends != null) {				
				helper.each(_extends, function(x){
					var a = {};
					helper.extendProto(a, x);
					delete a.constructor;
					for(var key in a){
						_class.prototype[key] = a[key];
					}
				});				
			}
		}
	};

	global.Class = function(data) {
		var _base = data.Base,
			_extends = data.Extends,
			_static = data.Static,
			_construct = data.Construct,
			_class = null,
			key;
			
		if (_base != null) {
			delete data.Base;
		}
		if (_extends != null) {
			delete data.Extends;
		}
		if (_static != null) {
			delete data.Static;
		}
		if (_construct != null) {
			delete data.Construct;
		}
		
		
		if (_base == null && _extends == null) {
			if (_construct == null)   {
				_class = function() {};
			}
			else {
				_class = _construct;
			}
			
			data.constructor = _class.prototype.constructor;
			
			if (_static != null) {
				for (key in _static) {
					_class[key] = _static[key];
				}
			}
	
			_class.prototype = data;
			return _class;

		}
		
		_class = function() {
			
			if (_extends != null){				
				var isarray = _extends instanceof Array,
					length = isarray ? _extends.length : 1,
					x = null;
				for (var i = 0; isarray ? i < length : i < 1; i++) {
					x = isarray ? _extends[i] : _extends;
					if (typeof x === 'function') {
						x.apply(this, arguments);
					}
				}				
			}
			
			if (_base != null) {								
				_base.apply(this, arguments);			
			}
			
			if (_construct != null) {
				var r = _construct.apply(this, arguments);
				if (r != null) {
					return r;
				}
			}
			return this;
		};
		
		if (_static != null)  {
			for (key in _static) {
				_class[key] = _static[key];
			}
		}
		
		
		helper.extendClass(_class, _base, _extends, data);
		
		
		data = null;
		_static = null;
		
		return _class;
	};



}(typeof window === 'undefined' ? global : window));

;
var __eval = function(source, include) {
	"use strict";
	
	var iparams = include.route.params;
	return eval(source);
};

;(function(global, document) {

	"use strict";
	
	


/**
 *	.cfg
 *		: path :=	root path. @default current working path, im browser window.location;
 *		: eval := in node.js this conf. is forced
 *		: lockedToFolder := makes current url as root path
 *			Example "/script/main.js" within this window.location "{domain}/apps/1.html"
 *			will become "{domain}/apps/script/main.js" instead of "{domain}/script/main.js"
 */

var bin = {},
	isWeb = !! (global.location && global.location.protocol && /^https?:/.test(global.location.protocol)),
	cfg = {
		eval: document == null
	},	
	handler = {},
	hasOwnProp = {}.hasOwnProperty,
	//-currentParent = null,
	XMLHttpRequest = global.XMLHttpRequest;
	

var Helper = { /** TODO: improve url handling*/
	uri: {
		getDir: function(url) {
			var index = url.lastIndexOf('/');
			return index == -1 ? '' : url.substring(index + 1, -index);
		},
		/** @obsolete */
		resolveCurrent: function() {
			var scripts = document.querySelectorAll('script');
			return scripts[scripts.length - 1].getAttribute('src');
		},
		resolveUrl: function(url, parent) {
			if (cfg.path && url[0] == '/') {
				url = cfg.path + url.substring(1);
			}
			if (url[0] == '/') {
				if (isWeb === false || cfg.lockedToFolder === true) {
					return url.substring(1);
				}
				return url;
			}
			switch (url.substring(0, 5)) {
			case 'file:':
			case 'http:':
				return url;
			}

			if (parent != null && parent.location != null) {
				return parent.location + url;
			}
			return url;
		}
	},
	extend: function(target) {
		for(var i = 1; i< arguments.length; i++){
			var source = arguments[i];
			if (typeof source === 'function'){
				source = source.prototype;
			}
			for (var key in source) {
				target[key] = source[key];
			}
		}
		return target;
	},
	invokeEach: function(arr, args) {
		if (arr == null) {
			return;
		}
		if (arr instanceof Array) {
			for (var i = 0, x, length = arr.length; i < length; i++) {
				x = arr[i];
				if (typeof x === 'function'){
					(args != null ? x.apply(this, args) : x());
				}
			}
		}
	},
	doNothing: function(fn) {
		typeof fn == 'function' && fn();
	},
	reportError: function(e) {
		console.error('IncludeJS Error:', e, e.message, e.url);
		typeof handler.onerror == 'function' && handler.onerror(e);
	},
	ensureArray: function(obj, xpath) {
		if (!xpath) {
			return obj;
		}
		var arr = xpath.split('.');
		while (arr.length - 1) {
			var key = arr.shift();
			obj = obj[key] || (obj[key] = {});
		}
		return (obj[arr.shift()] = []);
	},
	xhr: function(url, callback) {
		var xhr = new XMLHttpRequest(),
			s = Date.now();
		xhr.onreadystatechange = function() {
			xhr.readyState == 4 && callback && callback(url, xhr.responseText);
		};
		
		xhr.open('GET', url, true);
		xhr.send();
	}
};
var RoutesLib = function() {

	var routes = {},
		regexpAlias = /(\w+)\.\w+$/;

	return {
		/**
		 *	@param route {String} = Example: '.reference/libjs/{0}/{1}.js'
		 */
		register: function(namespace, route) {

			routes[namespace] = route instanceof Array ? route : route.split(/[\{\}]/g);

		},

		/**
		 *	@param {String} template = Example: 'scroller/scroller.min?ui=black'
		 */
		resolve: function(namespace, template) {
			var questionMark = template.indexOf('?'),
				aliasIndex = template.indexOf('::'),
				alias, path, params, route, i, x, length;
				
			
			if (~aliasIndex){
				alias = template.substring(aliasIndex + 2);
				template = template.substring(0, aliasIndex);
			}
			
			if (~questionMark) {
				var arr = template.substring(questionMark + 1).split('&');

				params = {};
				for (i = 0, length = arr.length; i < length; i++) {
					x = arr[i].split('=');
					params[x[0]] = x[1];
				}

				template = template.substring(0, questionMark);
			}

			template = template.split('/');
			route = routes[namespace];
			
			if (route == null){
				return {
					path: template.join('/'),
					params: params,
					alias: alias
				};
			}
			
			path = route[0];
			
			for (i = 1; i < route.length; i++) {
				if (i % 2 === 0) {
					path += route[i];
				} else {
					/** if template provides less "breadcrumbs" than needed -
					 * take always the last one for failed peaces */
					
					var index = route[i] << 0;
					if (index > template.length - 1) {
						index = template.length - 1;
					}
					
					
					
					path += template[index];
					
					if (i == route.length - 2){
						for(index++;index < template.length; index++){
							path += '/' + template[index];
						}
					}
				}
			}

			return {
				path: path,
				params: params,
				alias: alias
			};
		},

		/**
		 *	@arg includeData :
		 *	1. string - URL to resource
		 *	2. array - URLs to resources
		 *	3. object - {route: x} - route defines the route template to resource,
		 *		it must be set before in include.cfg.
		 *		example:
		 *			include.cfg('net','scripts/net/{name}.js')
		 *			include.js({net: 'downloader'}) // -> will load scipts/net/downloader.js
		 *	@arg namespace - route in case of resource url template, or namespace in case of LazyModule
		 *
		 *	@arg fn - callback function, which receives namespace|route, url to resource and ?id in case of not relative url
		 *	@arg xpath - xpath string of a lazy object 'object.sub.and.othersub';
		 */
		each: function(type, includeData, fn, namespace, xpath) {
			var key;

			if (includeData == null) {
				console.error('Include Item has no Data', type, namespace);
				return;
			}

			if (type == 'lazy' && xpath == null) {
				for (key in includeData) {
					this.each(type, includeData[key], fn, null, key);
				}
				return;
			}
			if (includeData instanceof Array) {
				for (var i = 0; i < includeData.length; i++) {
					this.each(type, includeData[i], fn, namespace, xpath);
				}
				return;
			}
			if (typeof includeData === 'object') {
				for (key in includeData) {
					if (hasOwnProp.call(includeData, key)) {
						this.each(type, includeData[key], fn, key, xpath);
					}
				}
				return;
			}

			if (typeof includeData === 'string') {
				var x = this.resolve(namespace, includeData);
				if (namespace){
					namespace += '.' + includeData;
				}				
				
				fn(namespace, x, xpath);
				return;
			}

			console.error('Include Package is invalid', arguments);
		},

		getRoutes: function(){
			return routes;
		},
		
		parseAlias: function(resource){
			var url = resource.url,
				result = regexpAlias.exec(url);
			
			return result && result[1];			
		}
	};
	
};

var Routes = RoutesLib();


/*{test}

console.log(JSON.stringify(Routes.resolve(null,'scroller.js::Scroller')));

Routes.register('lib', '.reference/libjs/{0}/lib/{1}.js');
console.log(JSON.stringify(Routes.resolve('lib','scroller::Scroller')));
console.log(JSON.stringify(Routes.resolve('lib','scroller/scroller.mobile?ui=black')));

Routes.register('framework', '.reference/libjs/framework/{0}.js');
console.log(JSON.stringify(Routes.resolve('framework','dom/jquery')));


*/
var Events = (function(document) {
	if (document == null) {
		return {
			ready: Helper.doNothing,
			load: Helper.doNothing
		};
	}
	var readycollection = [],
		loadcollection = null,
		timer = Date.now();

	document.onreadystatechange = function() {
		if (/complete|interactive/g.test(document.readyState) === false) {
			return;
		}
		if (timer) {
			console.log('DOMContentLoader', document.readyState, Date.now() - timer, 'ms');
		}
		Events.ready = Helper.doNothing;

		Helper.invokeEach(readycollection);
		readycollection = null;
		

		if (document.readyState == 'complete') {
			Events.load = Helper.doNothing;
			Helper.invokeEach(loadcollection);
			loadcollection = null;
		}
	};

	return {
		ready: function(callback) {
			readycollection.unshift(callback);
		},
		load: function(callback) {
			(loadcollection || (loadcollection = [])).unshift(callback);
		}
	};
})(document);
var IncludeDeferred = function() {
	this.callbacks = [];
};

IncludeDeferred.prototype = {
	/**	state observer */

	on: function(state, callback) {
		state <= this.state ? callback(this) : this.callbacks.unshift({
			state: state,
			callback: callback
		});
		return this;
	},
	readystatechanged: function(state) {
		this.state = state;
		for (var i = 0, x, length = this.callbacks.length; i < length; i++) {
			x = this.callbacks[i];
			
			if (x.state > this.state || x.callback == null) {
				continue;
			}
			x.callback(this);
			x.callback = null;
		}
	},

	/** idefer */

	ready: function(callback) {
		return this.on(4, function() {
			Events.ready(this.resolve.bind(this, callback));
		}.bind(this));
	},
	/** assest loaded and window is loaded */
	loaded: function(callback) {
		return this.on(4, function() {
			Events.load(callback);
		});
	},
	/** assets loaded */
	done: function(callback) {		
		return this.on(4, this.resolve.bind(this, callback));
	},
	resolve: function(callback) {		
		callback(this.response);		
	}
};
var Include = function(){};
Include.prototype = {
	setCurrent: function(resource) {
		
		var r = new Resource('js', {path: resource.id}, resource.namespace, null, null, resource.id);
		if (r.state != 4){
			console.error("Current Resource should be loaded");
		}
		
		global.include = r;
		
	},
	incl: function(type, pckg) {

		if (this instanceof Resource) {
			return this.include(type, pckg);
		}
		var r = new Resource();
		
		return r.include(type, pckg);		
	},
	js: function(pckg) {
		return this.incl('js', pckg);
	},
	css: function(pckg) {
		return this.incl('css', pckg);
	},
	load: function(pckg) {
		return this.incl('load', pckg);
	},
	ajax: function(pckg) {
		return this.incl('ajax', pckg);
	},
	embed: function(pckg) {
		return this.incl('embed', pckg);
	},
	lazy: function(pckg) {
		return this.incl('lazy', pckg);
	},

	cfg: function(arg) {
		switch (typeof arg) {
		case 'object':
			for (var key in arg) {
				cfg[key] = arg[key];				
			}
			break;
		case 'string':
			if (arguments.length == 1){
				return cfg[arg];
			}
			if (arguments.length == 2) {
				cfg[arg] = arguments[1];
			}
			break;
		case 'undefined':
			return cfg;
		}
		return this;
	},
	routes: function(arg){
		if (arg == null){
			return Routes.getRoutes();
		}
		for (var key in arg) {
			Routes.register(key, arg[key]);
		}
		return this;
	},
	promise: function(namespace) {
		var arr = namespace.split('.'),
			obj = global;
		while (arr.length) {
			var key = arr.shift();
			obj = obj[key] || (obj[key] = {});
		}
		return obj;
	},
	register: function(_bin) {		
		for (var key in _bin) {
			for (var i = 0; i < _bin[key].length; i++) {
				var id = _bin[key][i].id,
					url = _bin[key][i].url,
					namespace = _bin[key][i].namespace,
					resource = new Resource();

				resource.state = 4;
				resource.namespace = namespace;
				resource.type = key;

				if (url) {
					if (url[0] == '/') {
						url = url.substring(1);
					}
					resource.location = Helper.uri.getDir(url);
				}

				switch (key) {
				case 'load':
				case 'lazy':						
					var container = document.querySelector('#includejs-' + id.replace(/\W/g,''));
					if (container == null) {
						console.error('"%s" Data was not embedded into html', id);
						return;
					}
					resource.exports = container.innerHTML;						
					break;
				}
				(bin[key] || (bin[key] = {}))[id] = resource;
			}
		}
	}
};
var ScriptStack = (function() {

	var head, currentResource, stack = [],
		loadScript = function(url, callback) {
			//console.log('load script', url);
			var tag = document.createElement('script');
			tag.type = 'application/javascript';
			tag.src = url;
			tag.onload = tag.onerror = callback;

			(head || (head = document.querySelector('head'))).appendChild(tag);
		},
		afterScriptRun = function(resource) {
			var includes = resource.includes;

			if (includes != null && includes.length) {
				for (var i = 0; i < includes.length; i++) {
					if (includes[i].state != 4) {
						return;
					}
				}
			}			
			
			resource.readystatechanged(4);
		},
		loadByEmbedding = function() {
			if (stack.length === 0) {
				return;
			}

			if (currentResource != null){
				return;
			}


			var resource = (currentResource = stack[0]);

			if (resource.state === 1) {
				return;
			}

			resource.state = 1;

			global.include = resource;
			
			
			global.iparams = resource.route.params;
			
			
			loadScript(resource.url, function(e) {
				if (e.type == 'error'){
					console.log('Script Loaded Error', resource.url);					
				}
				for (var i = 0, length = stack.length; i < length; i++) {
					if (stack[i] === resource) {
						stack.splice(i, 1);
						break;
					}
				}
				resource.state = 3;
				afterScriptRun(resource);

				currentResource = null;
				loadByEmbedding();
			});
		},
		processByEval = function() {
			if (stack.length === 0){
				return;
			}
			if (currentResource != null){
				return;
			}

			var resource = stack[0];
			if (resource && resource.state > 2) {
				currentResource = resource;
				resource.state = 1;

				//console.log('evaling', resource.url, stack.length);			
				try {
					__eval(resource.source, resource);
				} catch (error) {
					error.url = resource.url;
					Helper.reportError(error);
				}
				for (var i = 0, x, length = stack.length; i < length; i++) {
					x = stack[i];
					if (x == resource) {
						stack.splice(i, 1);
						break;
					}
				}
				resource.state = 3;
				afterScriptRun(resource);

				currentResource = null;
				processByEval();
			}
		};


	return {
		load: function(resource, parent) {

			//console.log('LOAD', resource.url, 'parent:',parent ? parent.url : '');

			var added = false;
			if (parent) {
				for (var i = 0, length = stack.length; i < length; i++) {
					if (stack[i] === parent) {
						stack.splice(i, 0, resource);
						added = true;
						break;
					}
				}
			}

			if (!added) {
				stack.push(resource);
			}

			if (cfg.eval) {
				Helper.xhr(resource.url, function(url, response) {
					if (!response) {
						console.error('Not Loaded:', url);
					}

					resource.source = response;
					resource.readystatechanged(3);
					//	process next
					processByEval();
				});
			} else {
				loadByEmbedding();
			}

		},
		afterScriptRun: afterScriptRun
	};
})();
var Resource = function(type, route, namespace, xpath, parent, id) {
		Include.call(this);
		IncludeDeferred.call(this);

		////if (type == null) {
		////	this.state = 3;
		////	return this;
		////}
		
		var url = route && route.path;
		
		if (url != null) {
			this.url = url = Helper.uri.resolveUrl(url, parent);
		}
		
		this.route = route;
		this.namespace = namespace;
		this.type = type;
		this.xpath = xpath;
		
		
		
		if (id == null && url){
			id = (url[0] == '/' ? '' : '/') + url;
		}
		
		
		var resource = bin[type] && bin[type][id];		
		if (resource) {
			resource.route = route;			
			return resource;
		}
		
		if (url == null){
			this.state = 3;
			return this;
		}
		
		
		this.location = Helper.uri.getDir(url);



		(bin[type] || (bin[type] = {}))[id] = this;

		var tag;
		switch (type) {
		case 'js':
			ScriptStack.load(this, parent);
			
			break;
		case 'ajax':
		case 'load':
		case 'lazy':
			Helper.xhr(url, this.onXHRLoaded.bind(this));
			break;
		case 'css':
			this.state = 4;

			tag = document.createElement('link');
			tag.href = url;
			tag.rel = "stylesheet";
			tag.type = "text/css";
			break;
		case 'embed':
			tag = document.createElement('script');
			tag.type = 'application/javascript';
			tag.src = url;
			tag.onload = tag.onerror = this.readystatechanged.bind(this, 4);			
			break;
		}
		if (tag != null) {
			document.querySelector('head').appendChild(tag);
			tag = null;
		}
		return this;
	};

Resource.prototype = Helper.extend({}, IncludeDeferred, Include, {
	include: function(type, pckg) {
		//-this.state = 1;
		this.state = this.state >= 3 ? 3 : 1;

		if (this.includes == null) {
			this.includes = [];
		}


		Routes.each(type, pckg, function(namespace, route, xpath) {
			var resource = new Resource(type, route, namespace, xpath, this);

			this.includes.push(resource);

			resource.index = this.calcIndex(type, namespace);
			resource.on(4, this.childLoaded.bind(this));
		}.bind(this));

		return this;
	},
	/** Deprecated
	 *	Use Resource Alias instead
	 */
	calcIndex: function(type, namespace) {
		if (this.response == null) {
			this.response = {};
		}
		switch (type) {
		case 'js':
		case 'load':
		case 'ajax':
			var key = type + 'Index';
			if (this.response[key] == null) {
				this.response[key] = -1;
			}
			return ++this.response[key];
		}
		return -1;
	},

	childLoaded: function(resource) {


		if (resource && resource.exports) {

			var type = resource.type;
			switch (type) {
			case 'js':
			case 'load':
			case 'ajax':
				
				var alias = resource.route.alias || Routes.parseAlias(resource),
					obj = type == 'js' ? this.response : (this.response[type] || (this.response[type] = {}));
				
				
				if (alias){
					obj[alias] = resource.exports;
					break;
				}else{
					console.warn('Resource Alias is Not defined', resource);
				}
				
				///////@TODO - obsolete - use only alias				
				//////var obj = (this.response[resource.type] || (this.response[resource.type] = []));
				//////
				//////if (resource.namespace != null) {
				//////	obj = Helper.ensureArray(obj, resource.namespace);
				//////}
				//////obj[resource.index] = resource.exports;
				break;
			}
		}

		var includes = this.includes;
		if (includes && includes.length) {
			if (this.state < 3/* && this.url != null */){
				/** resource still loading/include is in process, but one of sub resources are already done */
				return;
			}
			for (var i = 0; i < includes.length; i++) {
				if (includes[i].state != 4) {
					return;
				}
			}
		}

		this.readystatechanged(4);

	},

	onXHRLoaded: function(url, response) {
		if (response) {
			switch (this.type) {
			case 'load':
			case 'ajax':
				this.exports = response;
				break;
			case 'lazy':
				LazyModule.create(this.xpath, response);
				break;
			}
			
		} else {
			console.warn('Resource cannt be loaded', this.url);
		}

		this.readystatechanged(4);
	}

});
var LazyModule = {
	create: function(xpath, code) {
		var arr = xpath.split('.'),
			obj = global,
			module = arr[arr.length - 1];
		while (arr.length > 1) {
			var prop = arr.shift();
			obj = obj[prop] || (obj[prop] = {});
		}
		arr = null;

		Object.defineProperty(obj, module, {
			get: function() {

				delete obj[module];
				try {
					var r = __eval(code, global.include);
					if (!(r == null || r instanceof Resource)){
						obj[module] = r;
					}
				} catch (error) {
					error.xpath = xpath;
					Helper.reportError(error);
				} finally {
					code = null;
					xpath = null;
					return obj[module];
				}
			}
		});
	}
};

global.include = new Include();

global.includeLib = {
	Helper: Helper,
	Routes: RoutesLib,
	Resource: Resource,
	ScriptStack: ScriptStack
};

})(typeof window === 'undefined' ? global : window, typeof document == 'undefined' ? null : document);
;include.register({"css":[{"id":"/style/menu.css","url":"style/menu.css","namespace":""},{"id":"/style/main.css","url":"style/main.css","namespace":""},{"id":"/script/component/view.css","url":"view.css"},{"id":"/.reference/libjs/compos/timePicker/lib/css/mobiscroll.css","url":"css/mobiscroll.css"},{"id":"/.reference/libjs/compos/datePicker/lib/css/android.css","url":"css/android.css"},{"id":"/.reference/libjs/compos/prism/lib/prism.lib.css","url":"prism.lib.css"}],"js":[{"id":"/.reference/libjs/ruqq/lib/es5shim.js","url":".reference/libjs/ruqq/lib/es5shim.js","namespace":""},{"id":"/.reference/libjs/class/lib/class.js","url":".reference/libjs/class/lib/class.js","namespace":""},{"id":"/.reference/libjs/include/lib/include.js","url":".reference/libjs/include/lib/include.js","namespace":""},{"id":"/include.routes.js","url":"include.routes.js","namespace":""},{"id":"/.reference/libjs/framework/lib/dom/jquery.js","url":"/.reference/libjs/framework/lib/dom/jquery.js","namespace":"framework.dom/jquery"},{"id":"/.reference/libjs/framework/lib/ruqq.base.js","url":"/.reference/libjs/framework/lib/ruqq.base.js","namespace":"framework.ruqq.base"},{"id":"/.reference/libjs/framework/lib/utils.js","url":"/.reference/libjs/framework/lib/utils.js","namespace":"framework.utils"},{"id":"/.reference/libjs/framework/lib/routes.js","url":"/.reference/libjs/framework/lib/routes.js","namespace":"framework.routes"},{"id":"/.reference/libjs/framework/lib/browser.detect.js","url":"/.reference/libjs/framework/lib/browser.detect.js","namespace":"framework.browser.detect"},{"id":"/.reference/libjs/mask/lib/mask.js","url":"/.reference/libjs/mask/lib/mask.js","namespace":"lib.mask"},{"id":"/.reference/libjs/compo/lib/compo.js","url":"/.reference/libjs/compo/lib/compo.js","namespace":"lib.compo"},{"id":"/.reference/libjs/ranimate/lib/ranimate.js","url":"/.reference/libjs/ranimate/lib/ranimate.js","namespace":"lib.ranimate"},{"id":"/.reference/libjs/compos/scroller/lib/iscroll-full.js","url":"iscroll-full.js"},{"id":"/.reference/libjs/compos/scroller/lib/scroller.js","url":"/.reference/libjs/compos/scroller/lib/scroller.js","namespace":"compo.scroller"},{"id":"/.reference/libjs/compos/prism/lib/prism.lib.js","url":"prism.lib.js"},{"id":"/.reference/libjs/compos/prism/lib/prism.js","url":"/.reference/libjs/compos/prism/lib/prism.js","namespace":"compo.prism"},{"id":"/.reference/libjs/compos/datePicker/lib/js/glDatePicker.min.js","url":"js/glDatePicker.min.js"},{"id":"/.reference/libjs/compos/datePicker/lib/datePicker.js","url":"/.reference/libjs/compos/datePicker/lib/datePicker.js","namespace":"compo.datePicker"},{"id":"/.reference/libjs/compos/timePicker/lib/js/mobiscroll.js","url":"js/mobiscroll.js"},{"id":"/.reference/libjs/compos/timePicker/lib/timePicker.js","url":"/.reference/libjs/compos/timePicker/lib/timePicker.js","namespace":"compo.timePicker"},{"id":"/.reference/libjs/compos/layout/lib/layout.js","url":"/.reference/libjs/compos/layout/lib/layout.js","namespace":"compo.layout"},{"id":"/.reference/libjs/compos/list/lib/list.js","url":"/.reference/libjs/compos/list/lib/list.js","namespace":"compo.list"},{"id":"/.reference/libjs/compos/utils/lib/utils.js","url":"/.reference/libjs/compos/utils/lib/utils.js","namespace":"compo.utils"},{"id":"/script/component/viewsManager.js","url":"/script/component/viewsManager.js","namespace":"controller.viewsManager"},{"id":"/script/component/view.js","url":"/script/component/view.js","namespace":"controller.view"},{"id":"/script/control/radioButtons.js","url":"/script/control/radioButtons.js","namespace":"uicontrol.radioButtons"},{"id":"/script/control/pageActivity.js","url":"/script/control/pageActivity.js","namespace":"uicontrol.pageActivity"},{"id":"/script/utils/maskUtils.js","url":"/script/utils/maskUtils.js","namespace":""},{"id":"/script/main.js","url":"script/main.js","namespace":""}]});
;include.setCurrent({ id: '/include.routes.js', namespace: '', url: '/include.routes.js'});
;window['DEBUG'] = true;

include.routes({
     "lib": "/.reference/libjs/{0}/lib/{1}.js",
     "framework": "/.reference/libjs/framework/lib/{0}.js",
     "compo": "/.reference/libjs/compos/{0}/lib/{1}.js"
}).cfg({
	lockedToFolder: true	
});


if (DEBUG){
	include.embed({
		lib: 'include/include.autoreload'
	});
}
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/framework/lib/dom/jquery.js', namespace: 'framework.dom/jquery', url: '/.reference/libjs/framework/lib/dom/jquery.js'});
;/*! jQuery v1.8.2 jquery.com | jquery.org/license */
(function(a,b){function G(a){var b=F[a]={};return p.each(a.split(s),function(a,c){b[c]=!0}),b}function J(a,c,d){if(d===b&&a.nodeType===1){var e="data-"+c.replace(I,"-$1").toLowerCase();d=a.getAttribute(e);if(typeof d=="string"){try{d=d==="true"?!0:d==="false"?!1:d==="null"?null:+d+""===d?+d:H.test(d)?p.parseJSON(d):d}catch(f){}p.data(a,c,d)}else d=b}return d}function K(a){var b;for(b in a){if(b==="data"&&p.isEmptyObject(a[b]))continue;if(b!=="toJSON")return!1}return!0}function ba(){return!1}function bb(){return!0}function bh(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function bi(a,b){do a=a[b];while(a&&a.nodeType!==1);return a}function bj(a,b,c){b=b||0;if(p.isFunction(b))return p.grep(a,function(a,d){var e=!!b.call(a,d,a);return e===c});if(b.nodeType)return p.grep(a,function(a,d){return a===b===c});if(typeof b=="string"){var d=p.grep(a,function(a){return a.nodeType===1});if(be.test(b))return p.filter(b,d,!c);b=p.filter(b,d)}return p.grep(a,function(a,d){return p.inArray(a,b)>=0===c})}function bk(a){var b=bl.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}function bC(a,b){return a.getElementsByTagName(b)[0]||a.appendChild(a.ownerDocument.createElement(b))}function bD(a,b){if(b.nodeType!==1||!p.hasData(a))return;var c,d,e,f=p._data(a),g=p._data(b,f),h=f.events;if(h){delete g.handle,g.events={};for(c in h)for(d=0,e=h[c].length;d<e;d++)p.event.add(b,c,h[c][d])}g.data&&(g.data=p.extend({},g.data))}function bE(a,b){var c;if(b.nodeType!==1)return;b.clearAttributes&&b.clearAttributes(),b.mergeAttributes&&b.mergeAttributes(a),c=b.nodeName.toLowerCase(),c==="object"?(b.parentNode&&(b.outerHTML=a.outerHTML),p.support.html5Clone&&a.innerHTML&&!p.trim(b.innerHTML)&&(b.innerHTML=a.innerHTML)):c==="input"&&bv.test(a.type)?(b.defaultChecked=b.checked=a.checked,b.value!==a.value&&(b.value=a.value)):c==="option"?b.selected=a.defaultSelected:c==="input"||c==="textarea"?b.defaultValue=a.defaultValue:c==="script"&&b.text!==a.text&&(b.text=a.text),b.removeAttribute(p.expando)}function bF(a){return typeof a.getElementsByTagName!="undefined"?a.getElementsByTagName("*"):typeof a.querySelectorAll!="undefined"?a.querySelectorAll("*"):[]}function bG(a){bv.test(a.type)&&(a.defaultChecked=a.checked)}function bY(a,b){if(b in a)return b;var c=b.charAt(0).toUpperCase()+b.slice(1),d=b,e=bW.length;while(e--){b=bW[e]+c;if(b in a)return b}return d}function bZ(a,b){return a=b||a,p.css(a,"display")==="none"||!p.contains(a.ownerDocument,a)}function b$(a,b){var c,d,e=[],f=0,g=a.length;for(;f<g;f++){c=a[f];if(!c.style)continue;e[f]=p._data(c,"olddisplay"),b?(!e[f]&&c.style.display==="none"&&(c.style.display=""),c.style.display===""&&bZ(c)&&(e[f]=p._data(c,"olddisplay",cc(c.nodeName)))):(d=bH(c,"display"),!e[f]&&d!=="none"&&p._data(c,"olddisplay",d))}for(f=0;f<g;f++){c=a[f];if(!c.style)continue;if(!b||c.style.display==="none"||c.style.display==="")c.style.display=b?e[f]||"":"none"}return a}function b_(a,b,c){var d=bP.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function ca(a,b,c,d){var e=c===(d?"border":"content")?4:b==="width"?1:0,f=0;for(;e<4;e+=2)c==="margin"&&(f+=p.css(a,c+bV[e],!0)),d?(c==="content"&&(f-=parseFloat(bH(a,"padding"+bV[e]))||0),c!=="margin"&&(f-=parseFloat(bH(a,"border"+bV[e]+"Width"))||0)):(f+=parseFloat(bH(a,"padding"+bV[e]))||0,c!=="padding"&&(f+=parseFloat(bH(a,"border"+bV[e]+"Width"))||0));return f}function cb(a,b,c){var d=b==="width"?a.offsetWidth:a.offsetHeight,e=!0,f=p.support.boxSizing&&p.css(a,"boxSizing")==="border-box";if(d<=0||d==null){d=bH(a,b);if(d<0||d==null)d=a.style[b];if(bQ.test(d))return d;e=f&&(p.support.boxSizingReliable||d===a.style[b]),d=parseFloat(d)||0}return d+ca(a,b,c||(f?"border":"content"),e)+"px"}function cc(a){if(bS[a])return bS[a];var b=p("<"+a+">").appendTo(e.body),c=b.css("display");b.remove();if(c==="none"||c===""){bI=e.body.appendChild(bI||p.extend(e.createElement("iframe"),{frameBorder:0,width:0,height:0}));if(!bJ||!bI.createElement)bJ=(bI.contentWindow||bI.contentDocument).document,bJ.write("<!doctype html><html><body>"),bJ.close();b=bJ.body.appendChild(bJ.createElement(a)),c=bH(b,"display"),e.body.removeChild(bI)}return bS[a]=c,c}function ci(a,b,c,d){var e;if(p.isArray(b))p.each(b,function(b,e){c||ce.test(a)?d(a,e):ci(a+"["+(typeof e=="object"?b:"")+"]",e,c,d)});else if(!c&&p.type(b)==="object")for(e in b)ci(a+"["+e+"]",b[e],c,d);else d(a,b)}function cz(a){return function(b,c){typeof b!="string"&&(c=b,b="*");var d,e,f,g=b.toLowerCase().split(s),h=0,i=g.length;if(p.isFunction(c))for(;h<i;h++)d=g[h],f=/^\+/.test(d),f&&(d=d.substr(1)||"*"),e=a[d]=a[d]||[],e[f?"unshift":"push"](c)}}function cA(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h,i=a[f],j=0,k=i?i.length:0,l=a===cv;for(;j<k&&(l||!h);j++)h=i[j](c,d,e),typeof h=="string"&&(!l||g[h]?h=b:(c.dataTypes.unshift(h),h=cA(a,c,d,e,h,g)));return(l||!h)&&!g["*"]&&(h=cA(a,c,d,e,"*",g)),h}function cB(a,c){var d,e,f=p.ajaxSettings.flatOptions||{};for(d in c)c[d]!==b&&((f[d]?a:e||(e={}))[d]=c[d]);e&&p.extend(!0,a,e)}function cC(a,c,d){var e,f,g,h,i=a.contents,j=a.dataTypes,k=a.responseFields;for(f in k)f in d&&(c[k[f]]=d[f]);while(j[0]==="*")j.shift(),e===b&&(e=a.mimeType||c.getResponseHeader("content-type"));if(e)for(f in i)if(i[f]&&i[f].test(e)){j.unshift(f);break}if(j[0]in d)g=j[0];else{for(f in d){if(!j[0]||a.converters[f+" "+j[0]]){g=f;break}h||(h=f)}g=g||h}if(g)return g!==j[0]&&j.unshift(g),d[g]}function cD(a,b){var c,d,e,f,g=a.dataTypes.slice(),h=g[0],i={},j=0;a.dataFilter&&(b=a.dataFilter(b,a.dataType));if(g[1])for(c in a.converters)i[c.toLowerCase()]=a.converters[c];for(;e=g[++j];)if(e!=="*"){if(h!=="*"&&h!==e){c=i[h+" "+e]||i["* "+e];if(!c)for(d in i){f=d.split(" ");if(f[1]===e){c=i[h+" "+f[0]]||i["* "+f[0]];if(c){c===!0?c=i[d]:i[d]!==!0&&(e=f[0],g.splice(j--,0,e));break}}}if(c!==!0)if(c&&a["throws"])b=c(b);else try{b=c(b)}catch(k){return{state:"parsererror",error:c?k:"No conversion from "+h+" to "+e}}}h=e}return{state:"success",data:b}}function cL(){try{return new a.XMLHttpRequest}catch(b){}}function cM(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function cU(){return setTimeout(function(){cN=b},0),cN=p.now()}function cV(a,b){p.each(b,function(b,c){var d=(cT[b]||[]).concat(cT["*"]),e=0,f=d.length;for(;e<f;e++)if(d[e].call(a,b,c))return})}function cW(a,b,c){var d,e=0,f=0,g=cS.length,h=p.Deferred().always(function(){delete i.elem}),i=function(){var b=cN||cU(),c=Math.max(0,j.startTime+j.duration-b),d=1-(c/j.duration||0),e=0,f=j.tweens.length;for(;e<f;e++)j.tweens[e].run(d);return h.notifyWith(a,[j,d,c]),d<1&&f?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:p.extend({},b),opts:p.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:cN||cU(),duration:c.duration,tweens:[],createTween:function(b,c,d){var e=p.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(e),e},stop:function(b){var c=0,d=b?j.tweens.length:0;for(;c<d;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;cX(k,j.opts.specialEasing);for(;e<g;e++){d=cS[e].call(j,a,k,j.opts);if(d)return d}return cV(j,k),p.isFunction(j.opts.start)&&j.opts.start.call(a,j),p.fx.timer(p.extend(i,{anim:j,queue:j.opts.queue,elem:a})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}function cX(a,b){var c,d,e,f,g;for(c in a){d=p.camelCase(c),e=b[d],f=a[c],p.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=p.cssHooks[d];if(g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}}function cY(a,b,c){var d,e,f,g,h,i,j,k,l=this,m=a.style,n={},o=[],q=a.nodeType&&bZ(a);c.queue||(j=p._queueHooks(a,"fx"),j.unqueued==null&&(j.unqueued=0,k=j.empty.fire,j.empty.fire=function(){j.unqueued||k()}),j.unqueued++,l.always(function(){l.always(function(){j.unqueued--,p.queue(a,"fx").length||j.empty.fire()})})),a.nodeType===1&&("height"in b||"width"in b)&&(c.overflow=[m.overflow,m.overflowX,m.overflowY],p.css(a,"display")==="inline"&&p.css(a,"float")==="none"&&(!p.support.inlineBlockNeedsLayout||cc(a.nodeName)==="inline"?m.display="inline-block":m.zoom=1)),c.overflow&&(m.overflow="hidden",p.support.shrinkWrapBlocks||l.done(function(){m.overflow=c.overflow[0],m.overflowX=c.overflow[1],m.overflowY=c.overflow[2]}));for(d in b){f=b[d];if(cP.exec(f)){delete b[d];if(f===(q?"hide":"show"))continue;o.push(d)}}g=o.length;if(g){h=p._data(a,"fxshow")||p._data(a,"fxshow",{}),q?p(a).show():l.done(function(){p(a).hide()}),l.done(function(){var b;p.removeData(a,"fxshow",!0);for(b in n)p.style(a,b,n[b])});for(d=0;d<g;d++)e=o[d],i=l.createTween(e,q?h[e]:0),n[e]=h[e]||p.style(a,e),e in h||(h[e]=i.start,q&&(i.end=i.start,i.start=e==="width"||e==="height"?1:0))}}function cZ(a,b,c,d,e){return new cZ.prototype.init(a,b,c,d,e)}function c$(a,b){var c,d={height:a},e=0;b=b?1:0;for(;e<4;e+=2-b)c=bV[e],d["margin"+c]=d["padding"+c]=a;return b&&(d.opacity=d.width=a),d}function da(a){return p.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1}var c,d,e=a.document,f=a.location,g=a.navigator,h=a.jQuery,i=a.$,j=Array.prototype.push,k=Array.prototype.slice,l=Array.prototype.indexOf,m=Object.prototype.toString,n=Object.prototype.hasOwnProperty,o=String.prototype.trim,p=function(a,b){return new p.fn.init(a,b,c)},q=/[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source,r=/\S/,s=/\s+/,t=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,u=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,v=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,w=/^[\],:{}\s]*$/,x=/(?:^|:|,)(?:\s*\[)+/g,y=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,z=/"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,A=/^-ms-/,B=/-([\da-z])/gi,C=function(a,b){return(b+"").toUpperCase()},D=function(){e.addEventListener?(e.removeEventListener("DOMContentLoaded",D,!1),p.ready()):e.readyState==="complete"&&(e.detachEvent("onreadystatechange",D),p.ready())},E={};p.fn=p.prototype={constructor:p,init:function(a,c,d){var f,g,h,i;if(!a)return this;if(a.nodeType)return this.context=this[0]=a,this.length=1,this;if(typeof a=="string"){a.charAt(0)==="<"&&a.charAt(a.length-1)===">"&&a.length>=3?f=[null,a,null]:f=u.exec(a);if(f&&(f[1]||!c)){if(f[1])return c=c instanceof p?c[0]:c,i=c&&c.nodeType?c.ownerDocument||c:e,a=p.parseHTML(f[1],i,!0),v.test(f[1])&&p.isPlainObject(c)&&this.attr.call(a,c,!0),p.merge(this,a);g=e.getElementById(f[2]);if(g&&g.parentNode){if(g.id!==f[2])return d.find(a);this.length=1,this[0]=g}return this.context=e,this.selector=a,this}return!c||c.jquery?(c||d).find(a):this.constructor(c).find(a)}return p.isFunction(a)?d.ready(a):(a.selector!==b&&(this.selector=a.selector,this.context=a.context),p.makeArray(a,this))},selector:"",jquery:"1.8.2",length:0,size:function(){return this.length},toArray:function(){return k.call(this)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a,b,c){var d=p.merge(this.constructor(),a);return d.prevObject=this,d.context=this.context,b==="find"?d.selector=this.selector+(this.selector?" ":"")+c:b&&(d.selector=this.selector+"."+b+"("+c+")"),d},each:function(a,b){return p.each(this,a,b)},ready:function(a){return p.ready.promise().done(a),this},eq:function(a){return a=+a,a===-1?this.slice(a):this.slice(a,a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(k.apply(this,arguments),"slice",k.call(arguments).join(","))},map:function(a){return this.pushStack(p.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){return this.prevObject||this.constructor(null)},push:j,sort:[].sort,splice:[].splice},p.fn.init.prototype=p.fn,p.extend=p.fn.extend=function(){var a,c,d,e,f,g,h=arguments[0]||{},i=1,j=arguments.length,k=!1;typeof h=="boolean"&&(k=h,h=arguments[1]||{},i=2),typeof h!="object"&&!p.isFunction(h)&&(h={}),j===i&&(h=this,--i);for(;i<j;i++)if((a=arguments[i])!=null)for(c in a){d=h[c],e=a[c];if(h===e)continue;k&&e&&(p.isPlainObject(e)||(f=p.isArray(e)))?(f?(f=!1,g=d&&p.isArray(d)?d:[]):g=d&&p.isPlainObject(d)?d:{},h[c]=p.extend(k,g,e)):e!==b&&(h[c]=e)}return h},p.extend({noConflict:function(b){return a.$===p&&(a.$=i),b&&a.jQuery===p&&(a.jQuery=h),p},isReady:!1,readyWait:1,holdReady:function(a){a?p.readyWait++:p.ready(!0)},ready:function(a){if(a===!0?--p.readyWait:p.isReady)return;if(!e.body)return setTimeout(p.ready,1);p.isReady=!0;if(a!==!0&&--p.readyWait>0)return;d.resolveWith(e,[p]),p.fn.trigger&&p(e).trigger("ready").off("ready")},isFunction:function(a){return p.type(a)==="function"},isArray:Array.isArray||function(a){return p.type(a)==="array"},isWindow:function(a){return a!=null&&a==a.window},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return a==null?String(a):E[m.call(a)]||"object"},isPlainObject:function(a){if(!a||p.type(a)!=="object"||a.nodeType||p.isWindow(a))return!1;try{if(a.constructor&&!n.call(a,"constructor")&&!n.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}var d;for(d in a);return d===b||n.call(a,d)},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},error:function(a){throw new Error(a)},parseHTML:function(a,b,c){var d;return!a||typeof a!="string"?null:(typeof b=="boolean"&&(c=b,b=0),b=b||e,(d=v.exec(a))?[b.createElement(d[1])]:(d=p.buildFragment([a],b,c?null:[]),p.merge([],(d.cacheable?p.clone(d.fragment):d.fragment).childNodes)))},parseJSON:function(b){if(!b||typeof b!="string")return null;b=p.trim(b);if(a.JSON&&a.JSON.parse)return a.JSON.parse(b);if(w.test(b.replace(y,"@").replace(z,"]").replace(x,"")))return(new Function("return "+b))();p.error("Invalid JSON: "+b)},parseXML:function(c){var d,e;if(!c||typeof c!="string")return null;try{a.DOMParser?(e=new DOMParser,d=e.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c))}catch(f){d=b}return(!d||!d.documentElement||d.getElementsByTagName("parsererror").length)&&p.error("Invalid XML: "+c),d},noop:function(){},globalEval:function(b){b&&r.test(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(A,"ms-").replace(B,C)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,c,d){var e,f=0,g=a.length,h=g===b||p.isFunction(a);if(d){if(h){for(e in a)if(c.apply(a[e],d)===!1)break}else for(;f<g;)if(c.apply(a[f++],d)===!1)break}else if(h){for(e in a)if(c.call(a[e],e,a[e])===!1)break}else for(;f<g;)if(c.call(a[f],f,a[f++])===!1)break;return a},trim:o&&!o.call("﻿ ")?function(a){return a==null?"":o.call(a)}:function(a){return a==null?"":(a+"").replace(t,"")},makeArray:function(a,b){var c,d=b||[];return a!=null&&(c=p.type(a),a.length==null||c==="string"||c==="function"||c==="regexp"||p.isWindow(a)?j.call(d,a):p.merge(d,a)),d},inArray:function(a,b,c){var d;if(b){if(l)return l.call(b,a,c);d=b.length,c=c?c<0?Math.max(0,d+c):c:0;for(;c<d;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,c){var d=c.length,e=a.length,f=0;if(typeof d=="number")for(;f<d;f++)a[e++]=c[f];else while(c[f]!==b)a[e++]=c[f++];return a.length=e,a},grep:function(a,b,c){var d,e=[],f=0,g=a.length;c=!!c;for(;f<g;f++)d=!!b(a[f],f),c!==d&&e.push(a[f]);return e},map:function(a,c,d){var e,f,g=[],h=0,i=a.length,j=a instanceof p||i!==b&&typeof i=="number"&&(i>0&&a[0]&&a[i-1]||i===0||p.isArray(a));if(j)for(;h<i;h++)e=c(a[h],h,d),e!=null&&(g[g.length]=e);else for(f in a)e=c(a[f],f,d),e!=null&&(g[g.length]=e);return g.concat.apply([],g)},guid:1,proxy:function(a,c){var d,e,f;return typeof c=="string"&&(d=a[c],c=a,a=d),p.isFunction(a)?(e=k.call(arguments,2),f=function(){return a.apply(c,e.concat(k.call(arguments)))},f.guid=a.guid=a.guid||p.guid++,f):b},access:function(a,c,d,e,f,g,h){var i,j=d==null,k=0,l=a.length;if(d&&typeof d=="object"){for(k in d)p.access(a,c,k,d[k],1,g,e);f=1}else if(e!==b){i=h===b&&p.isFunction(e),j&&(i?(i=c,c=function(a,b,c){return i.call(p(a),c)}):(c.call(a,e),c=null));if(c)for(;k<l;k++)c(a[k],d,i?e.call(a[k],k,c(a[k],d)):e,h);f=1}return f?a:j?c.call(a):l?c(a[0],d):g},now:function(){return(new Date).getTime()}}),p.ready.promise=function(b){if(!d){d=p.Deferred();if(e.readyState==="complete")setTimeout(p.ready,1);else if(e.addEventListener)e.addEventListener("DOMContentLoaded",D,!1),a.addEventListener("load",p.ready,!1);else{e.attachEvent("onreadystatechange",D),a.attachEvent("onload",p.ready);var c=!1;try{c=a.frameElement==null&&e.documentElement}catch(f){}c&&c.doScroll&&function g(){if(!p.isReady){try{c.doScroll("left")}catch(a){return setTimeout(g,50)}p.ready()}}()}}return d.promise(b)},p.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){E["[object "+b+"]"]=b.toLowerCase()}),c=p(e);var F={};p.Callbacks=function(a){a=typeof a=="string"?F[a]||G(a):p.extend({},a);var c,d,e,f,g,h,i=[],j=!a.once&&[],k=function(b){c=a.memory&&b,d=!0,h=f||0,f=0,g=i.length,e=!0;for(;i&&h<g;h++)if(i[h].apply(b[0],b[1])===!1&&a.stopOnFalse){c=!1;break}e=!1,i&&(j?j.length&&k(j.shift()):c?i=[]:l.disable())},l={add:function(){if(i){var b=i.length;(function d(b){p.each(b,function(b,c){var e=p.type(c);e==="function"&&(!a.unique||!l.has(c))?i.push(c):c&&c.length&&e!=="string"&&d(c)})})(arguments),e?g=i.length:c&&(f=b,k(c))}return this},remove:function(){return i&&p.each(arguments,function(a,b){var c;while((c=p.inArray(b,i,c))>-1)i.splice(c,1),e&&(c<=g&&g--,c<=h&&h--)}),this},has:function(a){return p.inArray(a,i)>-1},empty:function(){return i=[],this},disable:function(){return i=j=c=b,this},disabled:function(){return!i},lock:function(){return j=b,c||l.disable(),this},locked:function(){return!j},fireWith:function(a,b){return b=b||[],b=[a,b.slice?b.slice():b],i&&(!d||j)&&(e?j.push(b):k(b)),this},fire:function(){return l.fireWith(this,arguments),this},fired:function(){return!!d}};return l},p.extend({Deferred:function(a){var b=[["resolve","done",p.Callbacks("once memory"),"resolved"],["reject","fail",p.Callbacks("once memory"),"rejected"],["notify","progress",p.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return p.Deferred(function(c){p.each(b,function(b,d){var f=d[0],g=a[b];e[d[1]](p.isFunction(g)?function(){var a=g.apply(this,arguments);a&&p.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f+"With"](this===e?c:this,[a])}:c[f])}),a=null}).promise()},promise:function(a){return a!=null?p.extend(a,d):d}},e={};return d.pipe=d.then,p.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[a^1][2].disable,b[2][2].lock),e[f[0]]=g.fire,e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=k.call(arguments),d=c.length,e=d!==1||a&&p.isFunction(a.promise)?d:0,f=e===1?a:p.Deferred(),g=function(a,b,c){return function(d){b[a]=this,c[a]=arguments.length>1?k.call(arguments):d,c===h?f.notifyWith(b,c):--e||f.resolveWith(b,c)}},h,i,j;if(d>1){h=new Array(d),i=new Array(d),j=new Array(d);for(;b<d;b++)c[b]&&p.isFunction(c[b].promise)?c[b].promise().done(g(b,j,c)).fail(f.reject).progress(g(b,i,h)):--e}return e||f.resolveWith(j,c),f.promise()}}),p.support=function(){var b,c,d,f,g,h,i,j,k,l,m,n=e.createElement("div");n.setAttribute("className","t"),n.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",c=n.getElementsByTagName("*"),d=n.getElementsByTagName("a")[0],d.style.cssText="top:1px;float:left;opacity:.5";if(!c||!c.length)return{};f=e.createElement("select"),g=f.appendChild(e.createElement("option")),h=n.getElementsByTagName("input")[0],b={leadingWhitespace:n.firstChild.nodeType===3,tbody:!n.getElementsByTagName("tbody").length,htmlSerialize:!!n.getElementsByTagName("link").length,style:/top/.test(d.getAttribute("style")),hrefNormalized:d.getAttribute("href")==="/a",opacity:/^0.5/.test(d.style.opacity),cssFloat:!!d.style.cssFloat,checkOn:h.value==="on",optSelected:g.selected,getSetAttribute:n.className!=="t",enctype:!!e.createElement("form").enctype,html5Clone:e.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",boxModel:e.compatMode==="CSS1Compat",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,boxSizingReliable:!0,pixelPosition:!1},h.checked=!0,b.noCloneChecked=h.cloneNode(!0).checked,f.disabled=!0,b.optDisabled=!g.disabled;try{delete n.test}catch(o){b.deleteExpando=!1}!n.addEventListener&&n.attachEvent&&n.fireEvent&&(n.attachEvent("onclick",m=function(){b.noCloneEvent=!1}),n.cloneNode(!0).fireEvent("onclick"),n.detachEvent("onclick",m)),h=e.createElement("input"),h.value="t",h.setAttribute("type","radio"),b.radioValue=h.value==="t",h.setAttribute("checked","checked"),h.setAttribute("name","t"),n.appendChild(h),i=e.createDocumentFragment(),i.appendChild(n.lastChild),b.checkClone=i.cloneNode(!0).cloneNode(!0).lastChild.checked,b.appendChecked=h.checked,i.removeChild(h),i.appendChild(n);if(n.attachEvent)for(k in{submit:!0,change:!0,focusin:!0})j="on"+k,l=j in n,l||(n.setAttribute(j,"return;"),l=typeof n[j]=="function"),b[k+"Bubbles"]=l;return p(function(){var c,d,f,g,h="padding:0;margin:0;border:0;display:block;overflow:hidden;",i=e.getElementsByTagName("body")[0];if(!i)return;c=e.createElement("div"),c.style.cssText="visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px",i.insertBefore(c,i.firstChild),d=e.createElement("div"),c.appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",f=d.getElementsByTagName("td"),f[0].style.cssText="padding:0;margin:0;border:0;display:none",l=f[0].offsetHeight===0,f[0].style.display="",f[1].style.display="none",b.reliableHiddenOffsets=l&&f[0].offsetHeight===0,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",b.boxSizing=d.offsetWidth===4,b.doesNotIncludeMarginInBodyOffset=i.offsetTop!==1,a.getComputedStyle&&(b.pixelPosition=(a.getComputedStyle(d,null)||{}).top!=="1%",b.boxSizingReliable=(a.getComputedStyle(d,null)||{width:"4px"}).width==="4px",g=e.createElement("div"),g.style.cssText=d.style.cssText=h,g.style.marginRight=g.style.width="0",d.style.width="1px",d.appendChild(g),b.reliableMarginRight=!parseFloat((a.getComputedStyle(g,null)||{}).marginRight)),typeof d.style.zoom!="undefined"&&(d.innerHTML="",d.style.cssText=h+"width:1px;padding:1px;display:inline;zoom:1",b.inlineBlockNeedsLayout=d.offsetWidth===3,d.style.display="block",d.style.overflow="visible",d.innerHTML="<div></div>",d.firstChild.style.width="5px",b.shrinkWrapBlocks=d.offsetWidth!==3,c.style.zoom=1),i.removeChild(c),c=d=f=g=null}),i.removeChild(n),c=d=f=g=h=i=n=null,b}();var H=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,I=/([A-Z])/g;p.extend({cache:{},deletedIds:[],uuid:0,expando:"jQuery"+(p.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){return a=a.nodeType?p.cache[a[p.expando]]:a[p.expando],!!a&&!K(a)},data:function(a,c,d,e){if(!p.acceptData(a))return;var f,g,h=p.expando,i=typeof c=="string",j=a.nodeType,k=j?p.cache:a,l=j?a[h]:a[h]&&h;if((!l||!k[l]||!e&&!k[l].data)&&i&&d===b)return;l||(j?a[h]=l=p.deletedIds.pop()||p.guid++:l=h),k[l]||(k[l]={},j||(k[l].toJSON=p.noop));if(typeof c=="object"||typeof c=="function")e?k[l]=p.extend(k[l],c):k[l].data=p.extend(k[l].data,c);return f=k[l],e||(f.data||(f.data={}),f=f.data),d!==b&&(f[p.camelCase(c)]=d),i?(g=f[c],g==null&&(g=f[p.camelCase(c)])):g=f,g},removeData:function(a,b,c){if(!p.acceptData(a))return;var d,e,f,g=a.nodeType,h=g?p.cache:a,i=g?a[p.expando]:p.expando;if(!h[i])return;if(b){d=c?h[i]:h[i].data;if(d){p.isArray(b)||(b in d?b=[b]:(b=p.camelCase(b),b in d?b=[b]:b=b.split(" ")));for(e=0,f=b.length;e<f;e++)delete d[b[e]];if(!(c?K:p.isEmptyObject)(d))return}}if(!c){delete h[i].data;if(!K(h[i]))return}g?p.cleanData([a],!0):p.support.deleteExpando||h!=h.window?delete h[i]:h[i]=null},_data:function(a,b,c){return p.data(a,b,c,!0)},acceptData:function(a){var b=a.nodeName&&p.noData[a.nodeName.toLowerCase()];return!b||b!==!0&&a.getAttribute("classid")===b}}),p.fn.extend({data:function(a,c){var d,e,f,g,h,i=this[0],j=0,k=null;if(a===b){if(this.length){k=p.data(i);if(i.nodeType===1&&!p._data(i,"parsedAttrs")){f=i.attributes;for(h=f.length;j<h;j++)g=f[j].name,g.indexOf("data-")||(g=p.camelCase(g.substring(5)),J(i,g,k[g]));p._data(i,"parsedAttrs",!0)}}return k}return typeof a=="object"?this.each(function(){p.data(this,a)}):(d=a.split(".",2),d[1]=d[1]?"."+d[1]:"",e=d[1]+"!",p.access(this,function(c){if(c===b)return k=this.triggerHandler("getData"+e,[d[0]]),k===b&&i&&(k=p.data(i,a),k=J(i,a,k)),k===b&&d[1]?this.data(d[0]):k;d[1]=c,this.each(function(){var b=p(this);b.triggerHandler("setData"+e,d),p.data(this,a,c),b.triggerHandler("changeData"+e,d)})},null,c,arguments.length>1,null,!1))},removeData:function(a){return this.each(function(){p.removeData(this,a)})}}),p.extend({queue:function(a,b,c){var d;if(a)return b=(b||"fx")+"queue",d=p._data(a,b),c&&(!d||p.isArray(c)?d=p._data(a,b,p.makeArray(c)):d.push(c)),d||[]},dequeue:function(a,b){b=b||"fx";var c=p.queue(a,b),d=c.length,e=c.shift(),f=p._queueHooks(a,b),g=function(){p.dequeue(a,b)};e==="inprogress"&&(e=c.shift(),d--),e&&(b==="fx"&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return p._data(a,c)||p._data(a,c,{empty:p.Callbacks("once memory").add(function(){p.removeData(a,b+"queue",!0),p.removeData(a,c,!0)})})}}),p.fn.extend({queue:function(a,c){var d=2;return typeof a!="string"&&(c=a,a="fx",d--),arguments.length<d?p.queue(this[0],a):c===b?this:this.each(function(){var b=p.queue(this,a,c);p._queueHooks(this,a),a==="fx"&&b[0]!=="inprogress"&&p.dequeue(this,a)})},dequeue:function(a){return this.each(function(){p.dequeue(this,a)})},delay:function(a,b){return a=p.fx?p.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,c){var d,e=1,f=p.Deferred(),g=this,h=this.length,i=function(){--e||f.resolveWith(g,[g])};typeof a!="string"&&(c=a,a=b),a=a||"fx";while(h--)d=p._data(g[h],a+"queueHooks"),d&&d.empty&&(e++,d.empty.add(i));return i(),f.promise(c)}});var L,M,N,O=/[\t\r\n]/g,P=/\r/g,Q=/^(?:button|input)$/i,R=/^(?:button|input|object|select|textarea)$/i,S=/^a(?:rea|)$/i,T=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,U=p.support.getSetAttribute;p.fn.extend({attr:function(a,b){return p.access(this,p.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){p.removeAttr(this,a)})},prop:function(a,b){return p.access(this,p.prop,a,b,arguments.length>1)},removeProp:function(a){return a=p.propFix[a]||a,this.each(function(){try{this[a]=b,delete this[a]}catch(c){}})},addClass:function(a){var b,c,d,e,f,g,h;if(p.isFunction(a))return this.each(function(b){p(this).addClass(a.call(this,b,this.className))});if(a&&typeof a=="string"){b=a.split(s);for(c=0,d=this.length;c<d;c++){e=this[c];if(e.nodeType===1)if(!e.className&&b.length===1)e.className=a;else{f=" "+e.className+" ";for(g=0,h=b.length;g<h;g++)f.indexOf(" "+b[g]+" ")<0&&(f+=b[g]+" ");e.className=p.trim(f)}}}return this},removeClass:function(a){var c,d,e,f,g,h,i;if(p.isFunction(a))return this.each(function(b){p(this).removeClass(a.call(this,b,this.className))});if(a&&typeof a=="string"||a===b){c=(a||"").split(s);for(h=0,i=this.length;h<i;h++){e=this[h];if(e.nodeType===1&&e.className){d=(" "+e.className+" ").replace(O," ");for(f=0,g=c.length;f<g;f++)while(d.indexOf(" "+c[f]+" ")>=0)d=d.replace(" "+c[f]+" "," ");e.className=a?p.trim(d):""}}}return this},toggleClass:function(a,b){var c=typeof a,d=typeof b=="boolean";return p.isFunction(a)?this.each(function(c){p(this).toggleClass(a.call(this,c,this.className,b),b)}):this.each(function(){if(c==="string"){var e,f=0,g=p(this),h=b,i=a.split(s);while(e=i[f++])h=d?h:!g.hasClass(e),g[h?"addClass":"removeClass"](e)}else if(c==="undefined"||c==="boolean")this.className&&p._data(this,"__className__",this.className),this.className=this.className||a===!1?"":p._data(this,"__className__")||""})},hasClass:function(a){var b=" "+a+" ",c=0,d=this.length;for(;c<d;c++)if(this[c].nodeType===1&&(" "+this[c].className+" ").replace(O," ").indexOf(b)>=0)return!0;return!1},val:function(a){var c,d,e,f=this[0];if(!arguments.length){if(f)return c=p.valHooks[f.type]||p.valHooks[f.nodeName.toLowerCase()],c&&"get"in c&&(d=c.get(f,"value"))!==b?d:(d=f.value,typeof d=="string"?d.replace(P,""):d==null?"":d);return}return e=p.isFunction(a),this.each(function(d){var f,g=p(this);if(this.nodeType!==1)return;e?f=a.call(this,d,g.val()):f=a,f==null?f="":typeof f=="number"?f+="":p.isArray(f)&&(f=p.map(f,function(a){return a==null?"":a+""})),c=p.valHooks[this.type]||p.valHooks[this.nodeName.toLowerCase()];if(!c||!("set"in c)||c.set(this,f,"value")===b)this.value=f})}}),p.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){var b,c,d,e,f=a.selectedIndex,g=[],h=a.options,i=a.type==="select-one";if(f<0)return null;c=i?f:0,d=i?f+1:h.length;for(;c<d;c++){e=h[c];if(e.selected&&(p.support.optDisabled?!e.disabled:e.getAttribute("disabled")===null)&&(!e.parentNode.disabled||!p.nodeName(e.parentNode,"optgroup"))){b=p(e).val();if(i)return b;g.push(b)}}return i&&!g.length&&h.length?p(h[f]).val():g},set:function(a,b){var c=p.makeArray(b);return p(a).find("option").each(function(){this.selected=p.inArray(p(this).val(),c)>=0}),c.length||(a.selectedIndex=-1),c}}},attrFn:{},attr:function(a,c,d,e){var f,g,h,i=a.nodeType;if(!a||i===3||i===8||i===2)return;if(e&&p.isFunction(p.fn[c]))return p(a)[c](d);if(typeof a.getAttribute=="undefined")return p.prop(a,c,d);h=i!==1||!p.isXMLDoc(a),h&&(c=c.toLowerCase(),g=p.attrHooks[c]||(T.test(c)?M:L));if(d!==b){if(d===null){p.removeAttr(a,c);return}return g&&"set"in g&&h&&(f=g.set(a,d,c))!==b?f:(a.setAttribute(c,d+""),d)}return g&&"get"in g&&h&&(f=g.get(a,c))!==null?f:(f=a.getAttribute(c),f===null?b:f)},removeAttr:function(a,b){var c,d,e,f,g=0;if(b&&a.nodeType===1){d=b.split(s);for(;g<d.length;g++)e=d[g],e&&(c=p.propFix[e]||e,f=T.test(e),f||p.attr(a,e,""),a.removeAttribute(U?e:c),f&&c in a&&(a[c]=!1))}},attrHooks:{type:{set:function(a,b){if(Q.test(a.nodeName)&&a.parentNode)p.error("type property can't be changed");else if(!p.support.radioValue&&b==="radio"&&p.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}},value:{get:function(a,b){return L&&p.nodeName(a,"button")?L.get(a,b):b in a?a.value:null},set:function(a,b,c){if(L&&p.nodeName(a,"button"))return L.set(a,b,c);a.value=b}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,f,g,h=a.nodeType;if(!a||h===3||h===8||h===2)return;return g=h!==1||!p.isXMLDoc(a),g&&(c=p.propFix[c]||c,f=p.propHooks[c]),d!==b?f&&"set"in f&&(e=f.set(a,d,c))!==b?e:a[c]=d:f&&"get"in f&&(e=f.get(a,c))!==null?e:a[c]},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):R.test(a.nodeName)||S.test(a.nodeName)&&a.href?0:b}}}}),M={get:function(a,c){var d,e=p.prop(a,c);return e===!0||typeof e!="boolean"&&(d=a.getAttributeNode(c))&&d.nodeValue!==!1?c.toLowerCase():b},set:function(a,b,c){var d;return b===!1?p.removeAttr(a,c):(d=p.propFix[c]||c,d in a&&(a[d]=!0),a.setAttribute(c,c.toLowerCase())),c}},U||(N={name:!0,id:!0,coords:!0},L=p.valHooks.button={get:function(a,c){var d;return d=a.getAttributeNode(c),d&&(N[c]?d.value!=="":d.specified)?d.value:b},set:function(a,b,c){var d=a.getAttributeNode(c);return d||(d=e.createAttribute(c),a.setAttributeNode(d)),d.value=b+""}},p.each(["width","height"],function(a,b){p.attrHooks[b]=p.extend(p.attrHooks[b],{set:function(a,c){if(c==="")return a.setAttribute(b,"auto"),c}})}),p.attrHooks.contenteditable={get:L.get,set:function(a,b,c){b===""&&(b="false"),L.set(a,b,c)}}),p.support.hrefNormalized||p.each(["href","src","width","height"],function(a,c){p.attrHooks[c]=p.extend(p.attrHooks[c],{get:function(a){var d=a.getAttribute(c,2);return d===null?b:d}})}),p.support.style||(p.attrHooks.style={get:function(a){return a.style.cssText.toLowerCase()||b},set:function(a,b){return a.style.cssText=b+""}}),p.support.optSelected||(p.propHooks.selected=p.extend(p.propHooks.selected,{get:function(a){var b=a.parentNode;return b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex),null}})),p.support.enctype||(p.propFix.enctype="encoding"),p.support.checkOn||p.each(["radio","checkbox"],function(){p.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value}}}),p.each(["radio","checkbox"],function(){p.valHooks[this]=p.extend(p.valHooks[this],{set:function(a,b){if(p.isArray(b))return a.checked=p.inArray(p(a).val(),b)>=0}})});var V=/^(?:textarea|input|select)$/i,W=/^([^\.]*|)(?:\.(.+)|)$/,X=/(?:^|\s)hover(\.\S+|)\b/,Y=/^key/,Z=/^(?:mouse|contextmenu)|click/,$=/^(?:focusinfocus|focusoutblur)$/,_=function(a){return p.event.special.hover?a:a.replace(X,"mouseenter$1 mouseleave$1")};p.event={add:function(a,c,d,e,f){var g,h,i,j,k,l,m,n,o,q,r;if(a.nodeType===3||a.nodeType===8||!c||!d||!(g=p._data(a)))return;d.handler&&(o=d,d=o.handler,f=o.selector),d.guid||(d.guid=p.guid++),i=g.events,i||(g.events=i={}),h=g.handle,h||(g.handle=h=function(a){return typeof p!="undefined"&&(!a||p.event.triggered!==a.type)?p.event.dispatch.apply(h.elem,arguments):b},h.elem=a),c=p.trim(_(c)).split(" ");for(j=0;j<c.length;j++){k=W.exec(c[j])||[],l=k[1],m=(k[2]||"").split(".").sort(),r=p.event.special[l]||{},l=(f?r.delegateType:r.bindType)||l,r=p.event.special[l]||{},n=p.extend({type:l,origType:k[1],data:e,handler:d,guid:d.guid,selector:f,needsContext:f&&p.expr.match.needsContext.test(f),namespace:m.join(".")},o),q=i[l];if(!q){q=i[l]=[],q.delegateCount=0;if(!r.setup||r.setup.call(a,e,m,h)===!1)a.addEventListener?a.addEventListener(l,h,!1):a.attachEvent&&a.attachEvent("on"+l,h)}r.add&&(r.add.call(a,n),n.handler.guid||(n.handler.guid=d.guid)),f?q.splice(q.delegateCount++,0,n):q.push(n),p.event.global[l]=!0}a=null},global:{},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,q,r=p.hasData(a)&&p._data(a);if(!r||!(m=r.events))return;b=p.trim(_(b||"")).split(" ");for(f=0;f<b.length;f++){g=W.exec(b[f])||[],h=i=g[1],j=g[2];if(!h){for(h in m)p.event.remove(a,h+b[f],c,d,!0);continue}n=p.event.special[h]||{},h=(d?n.delegateType:n.bindType)||h,o=m[h]||[],k=o.length,j=j?new RegExp("(^|\\.)"+j.split(".").sort().join("\\.(?:.*\\.|)")+"(\\.|$)"):null;for(l=0;l<o.length;l++)q=o[l],(e||i===q.origType)&&(!c||c.guid===q.guid)&&(!j||j.test(q.namespace))&&(!d||d===q.selector||d==="**"&&q.selector)&&(o.splice(l--,1),q.selector&&o.delegateCount--,n.remove&&n.remove.call(a,q));o.length===0&&k!==o.length&&((!n.teardown||n.teardown.call(a,j,r.handle)===!1)&&p.removeEvent(a,h,r.handle),delete m[h])}p.isEmptyObject(m)&&(delete r.handle,p.removeData(a,"events",!0))},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(c,d,f,g){if(!f||f.nodeType!==3&&f.nodeType!==8){var h,i,j,k,l,m,n,o,q,r,s=c.type||c,t=[];if($.test(s+p.event.triggered))return;s.indexOf("!")>=0&&(s=s.slice(0,-1),i=!0),s.indexOf(".")>=0&&(t=s.split("."),s=t.shift(),t.sort());if((!f||p.event.customEvent[s])&&!p.event.global[s])return;c=typeof c=="object"?c[p.expando]?c:new p.Event(s,c):new p.Event(s),c.type=s,c.isTrigger=!0,c.exclusive=i,c.namespace=t.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+t.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,m=s.indexOf(":")<0?"on"+s:"";if(!f){h=p.cache;for(j in h)h[j].events&&h[j].events[s]&&p.event.trigger(c,d,h[j].handle.elem,!0);return}c.result=b,c.target||(c.target=f),d=d!=null?p.makeArray(d):[],d.unshift(c),n=p.event.special[s]||{};if(n.trigger&&n.trigger.apply(f,d)===!1)return;q=[[f,n.bindType||s]];if(!g&&!n.noBubble&&!p.isWindow(f)){r=n.delegateType||s,k=$.test(r+s)?f:f.parentNode;for(l=f;k;k=k.parentNode)q.push([k,r]),l=k;l===(f.ownerDocument||e)&&q.push([l.defaultView||l.parentWindow||a,r])}for(j=0;j<q.length&&!c.isPropagationStopped();j++)k=q[j][0],c.type=q[j][1],o=(p._data(k,"events")||{})[c.type]&&p._data(k,"handle"),o&&o.apply(k,d),o=m&&k[m],o&&p.acceptData(k)&&o.apply&&o.apply(k,d)===!1&&c.preventDefault();return c.type=s,!g&&!c.isDefaultPrevented()&&(!n._default||n._default.apply(f.ownerDocument,d)===!1)&&(s!=="click"||!p.nodeName(f,"a"))&&p.acceptData(f)&&m&&f[s]&&(s!=="focus"&&s!=="blur"||c.target.offsetWidth!==0)&&!p.isWindow(f)&&(l=f[m],l&&(f[m]=null),p.event.triggered=s,f[s](),p.event.triggered=b,l&&(f[m]=l)),c.result}return},dispatch:function(c){c=p.event.fix(c||a.event);var d,e,f,g,h,i,j,l,m,n,o=(p._data(this,"events")||{})[c.type]||[],q=o.delegateCount,r=k.call(arguments),s=!c.exclusive&&!c.namespace,t=p.event.special[c.type]||{},u=[];r[0]=c,c.delegateTarget=this;if(t.preDispatch&&t.preDispatch.call(this,c)===!1)return;if(q&&(!c.button||c.type!=="click"))for(f=c.target;f!=this;f=f.parentNode||this)if(f.disabled!==!0||c.type!=="click"){h={},j=[];for(d=0;d<q;d++)l=o[d],m=l.selector,h[m]===b&&(h[m]=l.needsContext?p(m,this).index(f)>=0:p.find(m,this,null,[f]).length),h[m]&&j.push(l);j.length&&u.push({elem:f,matches:j})}o.length>q&&u.push({elem:this,matches:o.slice(q)});for(d=0;d<u.length&&!c.isPropagationStopped();d++){i=u[d],c.currentTarget=i.elem;for(e=0;e<i.matches.length&&!c.isImmediatePropagationStopped();e++){l=i.matches[e];if(s||!c.namespace&&!l.namespace||c.namespace_re&&c.namespace_re.test(l.namespace))c.data=l.data,c.handleObj=l,g=((p.event.special[l.origType]||{}).handle||l.handler).apply(i.elem,r),g!==b&&(c.result=g,g===!1&&(c.preventDefault(),c.stopPropagation()))}}return t.postDispatch&&t.postDispatch.call(this,c),c.result},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return a.which==null&&(a.which=b.charCode!=null?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,c){var d,f,g,h=c.button,i=c.fromElement;return a.pageX==null&&c.clientX!=null&&(d=a.target.ownerDocument||e,f=d.documentElement,g=d.body,a.pageX=c.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),a.pageY=c.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?c.toElement:i),!a.which&&h!==b&&(a.which=h&1?1:h&2?3:h&4?2:0),a}},fix:function(a){if(a[p.expando])return a;var b,c,d=a,f=p.event.fixHooks[a.type]||{},g=f.props?this.props.concat(f.props):this.props;a=p.Event(d);for(b=g.length;b;)c=g[--b],a[c]=d[c];return a.target||(a.target=d.srcElement||e),a.target.nodeType===3&&(a.target=a.target.parentNode),a.metaKey=!!a.metaKey,f.filter?f.filter(a,d):a},special:{load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(a,b,c){p.isWindow(this)&&(this.onbeforeunload=c)},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null)}}},simulate:function(a,b,c,d){var e=p.extend(new p.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?p.event.trigger(e,null,b):p.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},p.event.handle=p.event.dispatch,p.removeEvent=e.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){var d="on"+b;a.detachEvent&&(typeof a[d]=="undefined"&&(a[d]=null),a.detachEvent(d,c))},p.Event=function(a,b){if(this instanceof p.Event)a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?bb:ba):this.type=a,b&&p.extend(this,b),this.timeStamp=a&&a.timeStamp||p.now(),this[p.expando]=!0;else return new p.Event(a,b)},p.Event.prototype={preventDefault:function(){this.isDefaultPrevented=bb;var a=this.originalEvent;if(!a)return;a.preventDefault?a.preventDefault():a.returnValue=!1},stopPropagation:function(){this.isPropagationStopped=bb;var a=this.originalEvent;if(!a)return;a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=bb,this.stopPropagation()},isDefaultPrevented:ba,isPropagationStopped:ba,isImmediatePropagationStopped:ba},p.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){p.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj,g=f.selector;if(!e||e!==d&&!p.contains(d,e))a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b;return c}}}),p.support.submitBubbles||(p.event.special.submit={setup:function(){if(p.nodeName(this,"form"))return!1;p.event.add(this,"click._submit keypress._submit",function(a){var c=a.target,d=p.nodeName(c,"input")||p.nodeName(c,"button")?c.form:b;d&&!p._data(d,"_submit_attached")&&(p.event.add(d,"submit._submit",function(a){a._submit_bubble=!0}),p._data(d,"_submit_attached",!0))})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&p.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){if(p.nodeName(this,"form"))return!1;p.event.remove(this,"._submit")}}),p.support.changeBubbles||(p.event.special.change={setup:function(){if(V.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")p.event.add(this,"propertychange._change",function(a){a.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),p.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1),p.event.simulate("change",this,a,!0)});return!1}p.event.add(this,"beforeactivate._change",function(a){var b=a.target;V.test(b.nodeName)&&!p._data(b,"_change_attached")&&(p.event.add(b,"change._change",function(a){this.parentNode&&!a.isSimulated&&!a.isTrigger&&p.event.simulate("change",this.parentNode,a,!0)}),p._data(b,"_change_attached",!0))})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox")return a.handleObj.handler.apply(this,arguments)},teardown:function(){return p.event.remove(this,"._change"),!V.test(this.nodeName)}}),p.support.focusinBubbles||p.each({focus:"focusin",blur:"focusout"},function(a,b){var c=0,d=function(a){p.event.simulate(b,a.target,p.event.fix(a),!0)};p.event.special[b]={setup:function(){c++===0&&e.addEventListener(a,d,!0)},teardown:function(){--c===0&&e.removeEventListener(a,d,!0)}}}),p.fn.extend({on:function(a,c,d,e,f){var g,h;if(typeof a=="object"){typeof c!="string"&&(d=d||c,c=b);for(h in a)this.on(h,c,d,a[h],f);return this}d==null&&e==null?(e=c,d=c=b):e==null&&(typeof c=="string"?(e=d,d=b):(e=d,d=c,c=b));if(e===!1)e=ba;else if(!e)return this;return f===1&&(g=e,e=function(a){return p().off(a),g.apply(this,arguments)},e.guid=g.guid||(g.guid=p.guid++)),this.each(function(){p.event.add(this,a,e,d,c)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,c,d){var e,f;if(a&&a.preventDefault&&a.handleObj)return e=a.handleObj,p(a.delegateTarget).off(e.namespace?e.origType+"."+e.namespace:e.origType,e.selector,e.handler),this;if(typeof a=="object"){for(f in a)this.off(f,c,a[f]);return this}if(c===!1||typeof c=="function")d=c,c=b;return d===!1&&(d=ba),this.each(function(){p.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},live:function(a,b,c){return p(this.context).on(a,this.selector,b,c),this},die:function(a,b){return p(this.context).off(a,this.selector||"**",b),this},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return arguments.length===1?this.off(a,"**"):this.off(b,a||"**",c)},trigger:function(a,b){return this.each(function(){p.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0])return p.event.trigger(a,b,this[0],!0)},toggle:function(a){var b=arguments,c=a.guid||p.guid++,d=0,e=function(c){var e=(p._data(this,"lastToggle"+a.guid)||0)%d;return p._data(this,"lastToggle"+a.guid,e+1),c.preventDefault(),b[e].apply(this,arguments)||!1};e.guid=c;while(d<b.length)b[d++].guid=c;return this.click(e)},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),p.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){p.fn[b]=function(a,c){return c==null&&(c=a,a=null),arguments.length>0?this.on(b,null,a,c):this.trigger(b)},Y.test(b)&&(p.event.fixHooks[b]=p.event.keyHooks),Z.test(b)&&(p.event.fixHooks[b]=p.event.mouseHooks)}),function(a,b){function bc(a,b,c,d){c=c||[],b=b||r;var e,f,i,j,k=b.nodeType;if(!a||typeof a!="string")return c;if(k!==1&&k!==9)return[];i=g(b);if(!i&&!d)if(e=P.exec(a))if(j=e[1]){if(k===9){f=b.getElementById(j);if(!f||!f.parentNode)return c;if(f.id===j)return c.push(f),c}else if(b.ownerDocument&&(f=b.ownerDocument.getElementById(j))&&h(b,f)&&f.id===j)return c.push(f),c}else{if(e[2])return w.apply(c,x.call(b.getElementsByTagName(a),0)),c;if((j=e[3])&&_&&b.getElementsByClassName)return w.apply(c,x.call(b.getElementsByClassName(j),0)),c}return bp(a.replace(L,"$1"),b,c,d,i)}function bd(a){return function(b){var c=b.nodeName.toLowerCase();return c==="input"&&b.type===a}}function be(a){return function(b){var c=b.nodeName.toLowerCase();return(c==="input"||c==="button")&&b.type===a}}function bf(a){return z(function(b){return b=+b,z(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function bg(a,b,c){if(a===b)return c;var d=a.nextSibling;while(d){if(d===b)return-1;d=d.nextSibling}return 1}function bh(a,b){var c,d,f,g,h,i,j,k=C[o][a];if(k)return b?0:k.slice(0);h=a,i=[],j=e.preFilter;while(h){if(!c||(d=M.exec(h)))d&&(h=h.slice(d[0].length)),i.push(f=[]);c=!1;if(d=N.exec(h))f.push(c=new q(d.shift())),h=h.slice(c.length),c.type=d[0].replace(L," ");for(g in e.filter)(d=W[g].exec(h))&&(!j[g]||(d=j[g](d,r,!0)))&&(f.push(c=new q(d.shift())),h=h.slice(c.length),c.type=g,c.matches=d);if(!c)break}return b?h.length:h?bc.error(a):C(a,i).slice(0)}function bi(a,b,d){var e=b.dir,f=d&&b.dir==="parentNode",g=u++;return b.first?function(b,c,d){while(b=b[e])if(f||b.nodeType===1)return a(b,c,d)}:function(b,d,h){if(!h){var i,j=t+" "+g+" ",k=j+c;while(b=b[e])if(f||b.nodeType===1){if((i=b[o])===k)return b.sizset;if(typeof i=="string"&&i.indexOf(j)===0){if(b.sizset)return b}else{b[o]=k;if(a(b,d,h))return b.sizset=!0,b;b.sizset=!1}}}else while(b=b[e])if(f||b.nodeType===1)if(a(b,d,h))return b}}function bj(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function bk(a,b,c,d,e){var f,g=[],h=0,i=a.length,j=b!=null;for(;h<i;h++)if(f=a[h])if(!c||c(f,d,e))g.push(f),j&&b.push(h);return g}function bl(a,b,c,d,e,f){return d&&!d[o]&&(d=bl(d)),e&&!e[o]&&(e=bl(e,f)),z(function(f,g,h,i){if(f&&e)return;var j,k,l,m=[],n=[],o=g.length,p=f||bo(b||"*",h.nodeType?[h]:h,[],f),q=a&&(f||!b)?bk(p,m,a,h,i):p,r=c?e||(f?a:o||d)?[]:g:q;c&&c(q,r,h,i);if(d){l=bk(r,n),d(l,[],h,i),j=l.length;while(j--)if(k=l[j])r[n[j]]=!(q[n[j]]=k)}if(f){j=a&&r.length;while(j--)if(k=r[j])f[m[j]]=!(g[m[j]]=k)}else r=bk(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):w.apply(g,r)})}function bm(a){var b,c,d,f=a.length,g=e.relative[a[0].type],h=g||e.relative[" "],i=g?1:0,j=bi(function(a){return a===b},h,!0),k=bi(function(a){return y.call(b,a)>-1},h,!0),m=[function(a,c,d){return!g&&(d||c!==l)||((b=c).nodeType?j(a,c,d):k(a,c,d))}];for(;i<f;i++)if(c=e.relative[a[i].type])m=[bi(bj(m),c)];else{c=e.filter[a[i].type].apply(null,a[i].matches);if(c[o]){d=++i;for(;d<f;d++)if(e.relative[a[d].type])break;return bl(i>1&&bj(m),i>1&&a.slice(0,i-1).join("").replace(L,"$1"),c,i<d&&bm(a.slice(i,d)),d<f&&bm(a=a.slice(d)),d<f&&a.join(""))}m.push(c)}return bj(m)}function bn(a,b){var d=b.length>0,f=a.length>0,g=function(h,i,j,k,m){var n,o,p,q=[],s=0,u="0",x=h&&[],y=m!=null,z=l,A=h||f&&e.find.TAG("*",m&&i.parentNode||i),B=t+=z==null?1:Math.E;y&&(l=i!==r&&i,c=g.el);for(;(n=A[u])!=null;u++){if(f&&n){for(o=0;p=a[o];o++)if(p(n,i,j)){k.push(n);break}y&&(t=B,c=++g.el)}d&&((n=!p&&n)&&s--,h&&x.push(n))}s+=u;if(d&&u!==s){for(o=0;p=b[o];o++)p(x,q,i,j);if(h){if(s>0)while(u--)!x[u]&&!q[u]&&(q[u]=v.call(k));q=bk(q)}w.apply(k,q),y&&!h&&q.length>0&&s+b.length>1&&bc.uniqueSort(k)}return y&&(t=B,l=z),x};return g.el=0,d?z(g):g}function bo(a,b,c,d){var e=0,f=b.length;for(;e<f;e++)bc(a,b[e],c,d);return c}function bp(a,b,c,d,f){var g,h,j,k,l,m=bh(a),n=m.length;if(!d&&m.length===1){h=m[0]=m[0].slice(0);if(h.length>2&&(j=h[0]).type==="ID"&&b.nodeType===9&&!f&&e.relative[h[1].type]){b=e.find.ID(j.matches[0].replace(V,""),b,f)[0];if(!b)return c;a=a.slice(h.shift().length)}for(g=W.POS.test(a)?-1:h.length-1;g>=0;g--){j=h[g];if(e.relative[k=j.type])break;if(l=e.find[k])if(d=l(j.matches[0].replace(V,""),R.test(h[0].type)&&b.parentNode||b,f)){h.splice(g,1),a=d.length&&h.join("");if(!a)return w.apply(c,x.call(d,0)),c;break}}}return i(a,m)(d,b,f,c,R.test(a)),c}function bq(){}var c,d,e,f,g,h,i,j,k,l,m=!0,n="undefined",o=("sizcache"+Math.random()).replace(".",""),q=String,r=a.document,s=r.documentElement,t=0,u=0,v=[].pop,w=[].push,x=[].slice,y=[].indexOf||function(a){var b=0,c=this.length;for(;b<c;b++)if(this[b]===a)return b;return-1},z=function(a,b){return a[o]=b==null||b,a},A=function(){var a={},b=[];return z(function(c,d){return b.push(c)>e.cacheLength&&delete a[b.shift()],a[c]=d},a)},B=A(),C=A(),D=A(),E="[\\x20\\t\\r\\n\\f]",F="(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",G=F.replace("w","w#"),H="([*^$|!~]?=)",I="\\["+E+"*("+F+")"+E+"*(?:"+H+E+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+G+")|)|)"+E+"*\\]",J=":("+F+")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:"+I+")|[^:]|\\\\.)*|.*))\\)|)",K=":(even|odd|eq|gt|lt|nth|first|last)(?:\\("+E+"*((?:-\\d)?\\d*)"+E+"*\\)|)(?=[^-]|$)",L=new RegExp("^"+E+"+|((?:^|[^\\\\])(?:\\\\.)*)"+E+"+$","g"),M=new RegExp("^"+E+"*,"+E+"*"),N=new RegExp("^"+E+"*([\\x20\\t\\r\\n\\f>+~])"+E+"*"),O=new RegExp(J),P=/^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,Q=/^:not/,R=/[\x20\t\r\n\f]*[+~]/,S=/:not\($/,T=/h\d/i,U=/input|select|textarea|button/i,V=/\\(?!\\)/g,W={ID:new RegExp("^#("+F+")"),CLASS:new RegExp("^\\.("+F+")"),NAME:new RegExp("^\\[name=['\"]?("+F+")['\"]?\\]"),TAG:new RegExp("^("+F.replace("w","w*")+")"),ATTR:new RegExp("^"+I),PSEUDO:new RegExp("^"+J),POS:new RegExp(K,"i"),CHILD:new RegExp("^:(only|nth|first|last)-child(?:\\("+E+"*(even|odd|(([+-]|)(\\d*)n|)"+E+"*(?:([+-]|)"+E+"*(\\d+)|))"+E+"*\\)|)","i"),needsContext:new RegExp("^"+E+"*[>+~]|"+K,"i")},X=function(a){var b=r.createElement("div");try{return a(b)}catch(c){return!1}finally{b=null}},Y=X(function(a){return a.appendChild(r.createComment("")),!a.getElementsByTagName("*").length}),Z=X(function(a){return a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!==n&&a.firstChild.getAttribute("href")==="#"}),$=X(function(a){a.innerHTML="<select></select>";var b=typeof a.lastChild.getAttribute("multiple");return b!=="boolean"&&b!=="string"}),_=X(function(a){return a.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",!a.getElementsByClassName||!a.getElementsByClassName("e").length?!1:(a.lastChild.className="e",a.getElementsByClassName("e").length===2)}),ba=X(function(a){a.id=o+0,a.innerHTML="<a name='"+o+"'></a><div name='"+o+"'></div>",s.insertBefore(a,s.firstChild);var b=r.getElementsByName&&r.getElementsByName(o).length===2+r.getElementsByName(o+0).length;return d=!r.getElementById(o),s.removeChild(a),b});try{x.call(s.childNodes,0)[0].nodeType}catch(bb){x=function(a){var b,c=[];for(;b=this[a];a++)c.push(b);return c}}bc.matches=function(a,b){return bc(a,null,null,b)},bc.matchesSelector=function(a,b){return bc(b,null,null,[a]).length>0},f=bc.getText=function(a){var b,c="",d=0,e=a.nodeType;if(e){if(e===1||e===9||e===11){if(typeof a.textContent=="string")return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=f(a)}else if(e===3||e===4)return a.nodeValue}else for(;b=a[d];d++)c+=f(b);return c},g=bc.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?b.nodeName!=="HTML":!1},h=bc.contains=s.contains?function(a,b){var c=a.nodeType===9?a.documentElement:a,d=b&&b.parentNode;return a===d||!!(d&&d.nodeType===1&&c.contains&&c.contains(d))}:s.compareDocumentPosition?function(a,b){return b&&!!(a.compareDocumentPosition(b)&16)}:function(a,b){while(b=b.parentNode)if(b===a)return!0;return!1},bc.attr=function(a,b){var c,d=g(a);return d||(b=b.toLowerCase()),(c=e.attrHandle[b])?c(a):d||$?a.getAttribute(b):(c=a.getAttributeNode(b),c?typeof a[b]=="boolean"?a[b]?b:null:c.specified?c.value:null:null)},e=bc.selectors={cacheLength:50,createPseudo:z,match:W,attrHandle:Z?{}:{href:function(a){return a.getAttribute("href",2)},type:function(a){return a.getAttribute("type")}},find:{ID:d?function(a,b,c){if(typeof b.getElementById!==n&&!c){var d=b.getElementById(a);return d&&d.parentNode?[d]:[]}}:function(a,c,d){if(typeof c.getElementById!==n&&!d){var e=c.getElementById(a);return e?e.id===a||typeof e.getAttributeNode!==n&&e.getAttributeNode("id").value===a?[e]:b:[]}},TAG:Y?function(a,b){if(typeof b.getElementsByTagName!==n)return b.getElementsByTagName(a)}:function(a,b){var c=b.getElementsByTagName(a);if(a==="*"){var d,e=[],f=0;for(;d=c[f];f++)d.nodeType===1&&e.push(d);return e}return c},NAME:ba&&function(a,b){if(typeof b.getElementsByName!==n)return b.getElementsByName(name)},CLASS:_&&function(a,b,c){if(typeof b.getElementsByClassName!==n&&!c)return b.getElementsByClassName(a)}},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(V,""),a[3]=(a[4]||a[5]||"").replace(V,""),a[2]==="~="&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),a[1]==="nth"?(a[2]||bc.error(a[0]),a[3]=+(a[3]?a[4]+(a[5]||1):2*(a[2]==="even"||a[2]==="odd")),a[4]=+(a[6]+a[7]||a[2]==="odd")):a[2]&&bc.error(a[0]),a},PSEUDO:function(a){var b,c;if(W.CHILD.test(a[0]))return null;if(a[3])a[2]=a[3];else if(b=a[4])O.test(b)&&(c=bh(b,!0))&&(c=b.indexOf(")",b.length-c)-b.length)&&(b=b.slice(0,c),a[0]=a[0].slice(0,c)),a[2]=b;return a.slice(0,3)}},filter:{ID:d?function(a){return a=a.replace(V,""),function(b){return b.getAttribute("id")===a}}:function(a){return a=a.replace(V,""),function(b){var c=typeof b.getAttributeNode!==n&&b.getAttributeNode("id");return c&&c.value===a}},TAG:function(a){return a==="*"?function(){return!0}:(a=a.replace(V,"").toLowerCase(),function(b){return b.nodeName&&b.nodeName.toLowerCase()===a})},CLASS:function(a){var b=B[o][a];return b||(b=B(a,new RegExp("(^|"+E+")"+a+"("+E+"|$)"))),function(a){return b.test(a.className||typeof a.getAttribute!==n&&a.getAttribute("class")||"")}},ATTR:function(a,b,c){return function(d,e){var f=bc.attr(d,a);return f==null?b==="!=":b?(f+="",b==="="?f===c:b==="!="?f!==c:b==="^="?c&&f.indexOf(c)===0:b==="*="?c&&f.indexOf(c)>-1:b==="$="?c&&f.substr(f.length-c.length)===c:b==="~="?(" "+f+" ").indexOf(c)>-1:b==="|="?f===c||f.substr(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d){return a==="nth"?function(a){var b,e,f=a.parentNode;if(c===1&&d===0)return!0;if(f){e=0;for(b=f.firstChild;b;b=b.nextSibling)if(b.nodeType===1){e++;if(a===b)break}}return e-=d,e===c||e%c===0&&e/c>=0}:function(b){var c=b;switch(a){case"only":case"first":while(c=c.previousSibling)if(c.nodeType===1)return!1;if(a==="first")return!0;c=b;case"last":while(c=c.nextSibling)if(c.nodeType===1)return!1;return!0}}},PSEUDO:function(a,b){var c,d=e.pseudos[a]||e.setFilters[a.toLowerCase()]||bc.error("unsupported pseudo: "+a);return d[o]?d(b):d.length>1?(c=[a,a,"",b],e.setFilters.hasOwnProperty(a.toLowerCase())?z(function(a,c){var e,f=d(a,b),g=f.length;while(g--)e=y.call(a,f[g]),a[e]=!(c[e]=f[g])}):function(a){return d(a,0,c)}):d}},pseudos:{not:z(function(a){var b=[],c=[],d=i(a.replace(L,"$1"));return d[o]?z(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)if(f=g[h])a[h]=!(b[h]=f)}):function(a,e,f){return b[0]=a,d(b,null,f,c),!c.pop()}}),has:z(function(a){return function(b){return bc(a,b).length>0}}),contains:z(function(a){return function(b){return(b.textContent||b.innerText||f(b)).indexOf(a)>-1}}),enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&!!a.checked||b==="option"&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},parent:function(a){return!e.pseudos.empty(a)},empty:function(a){var b;a=a.firstChild;while(a){if(a.nodeName>"@"||(b=a.nodeType)===3||b===4)return!1;a=a.nextSibling}return!0},header:function(a){return T.test(a.nodeName)},text:function(a){var b,c;return a.nodeName.toLowerCase()==="input"&&(b=a.type)==="text"&&((c=a.getAttribute("type"))==null||c.toLowerCase()===b)},radio:bd("radio"),checkbox:bd("checkbox"),file:bd("file"),password:bd("password"),image:bd("image"),submit:be("submit"),reset:be("reset"),button:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&a.type==="button"||b==="button"},input:function(a){return U.test(a.nodeName)},focus:function(a){var b=a.ownerDocument;return a===b.activeElement&&(!b.hasFocus||b.hasFocus())&&(!!a.type||!!a.href)},active:function(a){return a===a.ownerDocument.activeElement},first:bf(function(a,b,c){return[0]}),last:bf(function(a,b,c){return[b-1]}),eq:bf(function(a,b,c){return[c<0?c+b:c]}),even:bf(function(a,b,c){for(var d=0;d<b;d+=2)a.push(d);return a}),odd:bf(function(a,b,c){for(var d=1;d<b;d+=2)a.push(d);return a}),lt:bf(function(a,b,c){for(var d=c<0?c+b:c;--d>=0;)a.push(d);return a}),gt:bf(function(a,b,c){for(var d=c<0?c+b:c;++d<b;)a.push(d);return a})}},j=s.compareDocumentPosition?function(a,b){return a===b?(k=!0,0):(!a.compareDocumentPosition||!b.compareDocumentPosition?a.compareDocumentPosition:a.compareDocumentPosition(b)&4)?-1:1}:function(a,b){if(a===b)return k=!0,0;if(a.sourceIndex&&b.sourceIndex)return a.sourceIndex-b.sourceIndex;var c,d,e=[],f=[],g=a.parentNode,h=b.parentNode,i=g;if(g===h)return bg(a,b);if(!g)return-1;if(!h)return 1;while(i)e.unshift(i),i=i.parentNode;i=h;while(i)f.unshift(i),i=i.parentNode;c=e.length,d=f.length;for(var j=0;j<c&&j<d;j++)if(e[j]!==f[j])return bg(e[j],f[j]);return j===c?bg(a,f[j],-1):bg(e[j],b,1)},[0,0].sort(j),m=!k,bc.uniqueSort=function(a){var b,c=1;k=m,a.sort(j);if(k)for(;b=a[c];c++)b===a[c-1]&&a.splice(c--,1);return a},bc.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},i=bc.compile=function(a,b){var c,d=[],e=[],f=D[o][a];if(!f){b||(b=bh(a)),c=b.length;while(c--)f=bm(b[c]),f[o]?d.push(f):e.push(f);f=D(a,bn(e,d))}return f},r.querySelectorAll&&function(){var a,b=bp,c=/'|\\/g,d=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,e=[":focus"],f=[":active",":focus"],h=s.matchesSelector||s.mozMatchesSelector||s.webkitMatchesSelector||s.oMatchesSelector||s.msMatchesSelector;X(function(a){a.innerHTML="<select><option selected=''></option></select>",a.querySelectorAll("[selected]").length||e.push("\\["+E+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),a.querySelectorAll(":checked").length||e.push(":checked")}),X(function(a){a.innerHTML="<p test=''></p>",a.querySelectorAll("[test^='']").length&&e.push("[*^$]="+E+"*(?:\"\"|'')"),a.innerHTML="<input type='hidden'/>",a.querySelectorAll(":enabled").length||e.push(":enabled",":disabled")}),e=new RegExp(e.join("|")),bp=function(a,d,f,g,h){if(!g&&!h&&(!e||!e.test(a))){var i,j,k=!0,l=o,m=d,n=d.nodeType===9&&a;if(d.nodeType===1&&d.nodeName.toLowerCase()!=="object"){i=bh(a),(k=d.getAttribute("id"))?l=k.replace(c,"\\$&"):d.setAttribute("id",l),l="[id='"+l+"'] ",j=i.length;while(j--)i[j]=l+i[j].join("");m=R.test(a)&&d.parentNode||d,n=i.join(",")}if(n)try{return w.apply(f,x.call(m.querySelectorAll(n),0)),f}catch(p){}finally{k||d.removeAttribute("id")}}return b(a,d,f,g,h)},h&&(X(function(b){a=h.call(b,"div");try{h.call(b,"[test!='']:sizzle"),f.push("!=",J)}catch(c){}}),f=new RegExp(f.join("|")),bc.matchesSelector=function(b,c){c=c.replace(d,"='$1']");if(!g(b)&&!f.test(c)&&(!e||!e.test(c)))try{var i=h.call(b,c);if(i||a||b.document&&b.document.nodeType!==11)return i}catch(j){}return bc(c,null,null,[b]).length>0})}(),e.pseudos.nth=e.pseudos.eq,e.filters=bq.prototype=e.pseudos,e.setFilters=new bq,bc.attr=p.attr,p.find=bc,p.expr=bc.selectors,p.expr[":"]=p.expr.pseudos,p.unique=bc.uniqueSort,p.text=bc.getText,p.isXMLDoc=bc.isXML,p.contains=bc.contains}(a);var bc=/Until$/,bd=/^(?:parents|prev(?:Until|All))/,be=/^.[^:#\[\.,]*$/,bf=p.expr.match.needsContext,bg={children:!0,contents:!0,next:!0,prev:!0};p.fn.extend({find:function(a){var b,c,d,e,f,g,h=this;if(typeof a!="string")return p(a).filter(function(){for(b=0,c=h.length;b<c;b++)if(p.contains(h[b],this))return!0});g=this.pushStack("","find",a);for(b=0,c=this.length;b<c;b++){d=g.length,p.find(a,this[b],g);if(b>0)for(e=d;e<g.length;e++)for(f=0;f<d;f++)if(g[f]===g[e]){g.splice(e--,1);break}}return g},has:function(a){var b,c=p(a,this),d=c.length;return this.filter(function(){for(b=0;b<d;b++)if(p.contains(this,c[b]))return!0})},not:function(a){return this.pushStack(bj(this,a,!1),"not",a)},filter:function(a){return this.pushStack(bj(this,a,!0),"filter",a)},is:function(a){return!!a&&(typeof a=="string"?bf.test(a)?p(a,this.context).index(this[0])>=0:p.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){var c,d=0,e=this.length,f=[],g=bf.test(a)||typeof a!="string"?p(a,b||this.context):0;for(;d<e;d++){c=this[d];while(c&&c.ownerDocument&&c!==b&&c.nodeType!==11){if(g?g.index(c)>-1:p.find.matchesSelector(c,a)){f.push(c);break}c=c.parentNode}}return f=f.length>1?p.unique(f):f,this.pushStack(f,"closest",a)},index:function(a){return a?typeof a=="string"?p.inArray(this[0],p(a)):p.inArray(a.jquery?a[0]:a,this):this[0]&&this[0].parentNode?this.prevAll().length:-1},add:function(a,b){var c=typeof a=="string"?p(a,b):p.makeArray(a&&a.nodeType?[a]:a),d=p.merge(this.get(),c);return this.pushStack(bh(c[0])||bh(d[0])?d:p.unique(d))},addBack:function(a){return this.add(a==null?this.prevObject:this.prevObject.filter(a))}}),p.fn.andSelf=p.fn.addBack,p.each({parent:function(a){var b=a.parentNode;return b&&b.nodeType!==11?b:null},parents:function(a){return p.dir(a,"parentNode")},parentsUntil:function(a,b,c){return p.dir(a,"parentNode",c)},next:function(a){return bi(a,"nextSibling")},prev:function(a){return bi(a,"previousSibling")},nextAll:function(a){return p.dir(a,"nextSibling")},prevAll:function(a){return p.dir(a,"previousSibling")},nextUntil:function(a,b,c){return p.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return p.dir(a,"previousSibling",c)},siblings:function(a){return p.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return p.sibling(a.firstChild)},contents:function(a){return p.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:p.merge([],a.childNodes)}},function(a,b){p.fn[a]=function(c,d){var e=p.map(this,b,c);return bc.test(a)||(d=c),d&&typeof d=="string"&&(e=p.filter(d,e)),e=this.length>1&&!bg[a]?p.unique(e):e,this.length>1&&bd.test(a)&&(e=e.reverse()),this.pushStack(e,a,k.call(arguments).join(","))}}),p.extend({filter:function(a,b,c){return c&&(a=":not("+a+")"),b.length===1?p.find.matchesSelector(b[0],a)?[b[0]]:[]:p.find.matches(a,b)},dir:function(a,c,d){var e=[],f=a[c];while(f&&f.nodeType!==9&&(d===b||f.nodeType!==1||!p(f).is(d)))f.nodeType===1&&e.push(f),f=f[c];return e},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var bl="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",bm=/ jQuery\d+="(?:null|\d+)"/g,bn=/^\s+/,bo=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bp=/<([\w:]+)/,bq=/<tbody/i,br=/<|&#?\w+;/,bs=/<(?:script|style|link)/i,bt=/<(?:script|object|embed|option|style)/i,bu=new RegExp("<(?:"+bl+")[\\s/>]","i"),bv=/^(?:checkbox|radio)$/,bw=/checked\s*(?:[^=]|=\s*.checked.)/i,bx=/\/(java|ecma)script/i,by=/^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g,bz={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},bA=bk(e),bB=bA.appendChild(e.createElement("div"));bz.optgroup=bz.option,bz.tbody=bz.tfoot=bz.colgroup=bz.caption=bz.thead,bz.th=bz.td,p.support.htmlSerialize||(bz._default=[1,"X<div>","</div>"]),p.fn.extend({text:function(a){return p.access(this,function(a){return a===b?p.text(this):this.empty().append((this[0]&&this[0].ownerDocument||e).createTextNode(a))},null,a,arguments.length)},wrapAll:function(a){if(p.isFunction(a))return this.each(function(b){p(this).wrapAll(a.call(this,b))});if(this[0]){var b=p(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&a.firstChild.nodeType===1)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){return p.isFunction(a)?this.each(function(b){p(this).wrapInner(a.call(this,b))}):this.each(function(){var b=p(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=p.isFunction(a);return this.each(function(c){p(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){p.nodeName(this,"body")||p(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(a){(this.nodeType===1||this.nodeType===11)&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,!0,function(a){(this.nodeType===1||this.nodeType===11)&&this.insertBefore(a,this.firstChild)})},before:function(){if(!bh(this[0]))return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this)});if(arguments.length){var a=p.clean(arguments);return this.pushStack(p.merge(a,this),"before",this.selector)}},after:function(){if(!bh(this[0]))return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling)});if(arguments.length){var a=p.clean(arguments);return this.pushStack(p.merge(this,a),"after",this.selector)}},remove:function(a,b){var c,d=0;for(;(c=this[d])!=null;d++)if(!a||p.filter(a,[c]).length)!b&&c.nodeType===1&&(p.cleanData(c.getElementsByTagName("*")),p.cleanData([c])),c.parentNode&&c.parentNode.removeChild(c);return this},empty:function(){var a,b=0;for(;(a=this[b])!=null;b++){a.nodeType===1&&p.cleanData(a.getElementsByTagName("*"));while(a.firstChild)a.removeChild(a.firstChild)}return this},clone:function(a,b){return a=a==null?!1:a,b=b==null?a:b,this.map(function(){return p.clone(this,a,b)})},html:function(a){return p.access(this,function(a){var c=this[0]||{},d=0,e=this.length;if(a===b)return c.nodeType===1?c.innerHTML.replace(bm,""):b;if(typeof a=="string"&&!bs.test(a)&&(p.support.htmlSerialize||!bu.test(a))&&(p.support.leadingWhitespace||!bn.test(a))&&!bz[(bp.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(bo,"<$1></$2>");try{for(;d<e;d++)c=this[d]||{},c.nodeType===1&&(p.cleanData(c.getElementsByTagName("*")),c.innerHTML=a);c=0}catch(f){}}c&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(a){return bh(this[0])?this.length?this.pushStack(p(p.isFunction(a)?a():a),"replaceWith",a):this:p.isFunction(a)?this.each(function(b){var c=p(this),d=c.html();c.replaceWith(a.call(this,b,d))}):(typeof a!="string"&&(a=p(a).detach()),this.each(function(){var b=this.nextSibling,c=this.parentNode;p(this).remove(),b?p(b).before(a):p(c).append(a)}))},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,d){a=[].concat.apply([],a);var e,f,g,h,i=0,j=a[0],k=[],l=this.length;if(!p.support.checkClone&&l>1&&typeof j=="string"&&bw.test(j))return this.each(function(){p(this).domManip(a,c,d)});if(p.isFunction(j))return this.each(function(e){var f=p(this);a[0]=j.call(this,e,c?f.html():b),f.domManip(a,c,d)});if(this[0]){e=p.buildFragment(a,this,k),g=e.fragment,f=g.firstChild,g.childNodes.length===1&&(g=f);if(f){c=c&&p.nodeName(f,"tr");for(h=e.cacheable||l-1;i<l;i++)d.call(c&&p.nodeName(this[i],"table")?bC(this[i],"tbody"):this[i],i===h?g:p.clone(g,!0,!0))}g=f=null,k.length&&p.each(k,function(a,b){b.src?p.ajax?p.ajax({url:b.src,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0}):p.error("no ajax"):p.globalEval((b.text||b.textContent||b.innerHTML||"").replace(by,"")),b.parentNode&&b.parentNode.removeChild(b)})}return this}}),p.buildFragment=function(a,c,d){var f,g,h,i=a[0];return c=c||e,c=!c.nodeType&&c[0]||c,c=c.ownerDocument||c,a.length===1&&typeof i=="string"&&i.length<512&&c===e&&i.charAt(0)==="<"&&!bt.test(i)&&(p.support.checkClone||!bw.test(i))&&(p.support.html5Clone||!bu.test(i))&&(g=!0,f=p.fragments[i],h=f!==b),f||(f=c.createDocumentFragment(),p.clean(a,c,f,d),g&&(p.fragments[i]=h&&f)),{fragment:f,cacheable:g}},p.fragments={},p.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){p.fn[a]=function(c){var d,e=0,f=[],g=p(c),h=g.length,i=this.length===1&&this[0].parentNode;if((i==null||i&&i.nodeType===11&&i.childNodes.length===1)&&h===1)return g[b](this[0]),this;for(;e<h;e++)d=(e>0?this.clone(!0):this).get(),p(g[e])[b](d),f=f.concat(d);return this.pushStack(f,a,g.selector)}}),p.extend({clone:function(a,b,c){var d,e,f,g;p.support.html5Clone||p.isXMLDoc(a)||!bu.test("<"+a.nodeName+">")?g=a.cloneNode(!0):(bB.innerHTML=a.outerHTML,bB.removeChild(g=bB.firstChild));if((!p.support.noCloneEvent||!p.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!p.isXMLDoc(a)){bE(a,g),d=bF(a),e=bF(g);for(f=0;d[f];++f)e[f]&&bE(d[f],e[f])}if(b){bD(a,g);if(c){d=bF(a),e=bF(g);for(f=0;d[f];++f)bD(d[f],e[f])}}return d=e=null,g},clean:function(a,b,c,d){var f,g,h,i,j,k,l,m,n,o,q,r,s=b===e&&bA,t=[];if(!b||typeof b.createDocumentFragment=="undefined")b=e;for(f=0;(h=a[f])!=null;f++){typeof h=="number"&&(h+="");if(!h)continue;if(typeof h=="string")if(!br.test(h))h=b.createTextNode(h);else{s=s||bk(b),l=b.createElement("div"),s.appendChild(l),h=h.replace(bo,"<$1></$2>"),i=(bp.exec(h)||["",""])[1].toLowerCase(),j=bz[i]||bz._default,k=j[0],l.innerHTML=j[1]+h+j[2];while(k--)l=l.lastChild;if(!p.support.tbody){m=bq.test(h),n=i==="table"&&!m?l.firstChild&&l.firstChild.childNodes:j[1]==="<table>"&&!m?l.childNodes:[];for(g=n.length-1;g>=0;--g)p.nodeName(n[g],"tbody")&&!n[g].childNodes.length&&n[g].parentNode.removeChild(n[g])}!p.support.leadingWhitespace&&bn.test(h)&&l.insertBefore(b.createTextNode(bn.exec(h)[0]),l.firstChild),h=l.childNodes,l.parentNode.removeChild(l)}h.nodeType?t.push(h):p.merge(t,h)}l&&(h=l=s=null);if(!p.support.appendChecked)for(f=0;(h=t[f])!=null;f++)p.nodeName(h,"input")?bG(h):typeof h.getElementsByTagName!="undefined"&&p.grep(h.getElementsByTagName("input"),bG);if(c){q=function(a){if(!a.type||bx.test(a.type))return d?d.push(a.parentNode?a.parentNode.removeChild(a):a):c.appendChild(a)};for(f=0;(h=t[f])!=null;f++)if(!p.nodeName(h,"script")||!q(h))c.appendChild(h),typeof h.getElementsByTagName!="undefined"&&(r=p.grep(p.merge([],h.getElementsByTagName("script")),q),t.splice.apply(t,[f+1,0].concat(r)),f+=r.length)}return t},cleanData:function(a,b){var c,d,e,f,g=0,h=p.expando,i=p.cache,j=p.support.deleteExpando,k=p.event.special;for(;(e=a[g])!=null;g++)if(b||p.acceptData(e)){d=e[h],c=d&&i[d];if(c){if(c.events)for(f in c.events)k[f]?p.event.remove(e,f):p.removeEvent(e,f,c.handle);i[d]&&(delete i[d],j?delete e[h]:e.removeAttribute?e.removeAttribute(h):e[h]=null,p.deletedIds.push(d))}}}}),function(){var a,b;p.uaMatch=function(a){a=a.toLowerCase();var b=/(chrome)[ \/]([\w.]+)/.exec(a)||/(webkit)[ \/]([\w.]+)/.exec(a)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(a)||/(msie) ([\w.]+)/.exec(a)||a.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(a)||[];return{browser:b[1]||"",version:b[2]||"0"}},a=p.uaMatch(g.userAgent),b={},a.browser&&(b[a.browser]=!0,b.version=a.version),b.chrome?b.webkit=!0:b.webkit&&(b.safari=!0),p.browser=b,p.sub=function(){function a(b,c){return new a.fn.init(b,c)}p.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.sub=this.sub,a.fn.init=function c(c,d){return d&&d instanceof p&&!(d instanceof a)&&(d=a(d)),p.fn.init.call(this,c,d,b)},a.fn.init.prototype=a.fn;var b=a(e);return a}}();var bH,bI,bJ,bK=/alpha\([^)]*\)/i,bL=/opacity=([^)]*)/,bM=/^(top|right|bottom|left)$/,bN=/^(none|table(?!-c[ea]).+)/,bO=/^margin/,bP=new RegExp("^("+q+")(.*)$","i"),bQ=new RegExp("^("+q+")(?!px)[a-z%]+$","i"),bR=new RegExp("^([-+])=("+q+")","i"),bS={},bT={position:"absolute",visibility:"hidden",display:"block"},bU={letterSpacing:0,fontWeight:400},bV=["Top","Right","Bottom","Left"],bW=["Webkit","O","Moz","ms"],bX=p.fn.toggle;p.fn.extend({css:function(a,c){return p.access(this,function(a,c,d){return d!==b?p.style(a,c,d):p.css(a,c)},a,c,arguments.length>1)},show:function(){return b$(this,!0)},hide:function(){return b$(this)},toggle:function(a,b){var c=typeof a=="boolean";return p.isFunction(a)&&p.isFunction(b)?bX.apply(this,arguments):this.each(function(){(c?a:bZ(this))?p(this).show():p(this).hide()})}}),p.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=bH(a,"opacity");return c===""?"1":c}}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":p.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(!a||a.nodeType===3||a.nodeType===8||!a.style)return;var f,g,h,i=p.camelCase(c),j=a.style;c=p.cssProps[i]||(p.cssProps[i]=bY(j,i)),h=p.cssHooks[c]||p.cssHooks[i];if(d===b)return h&&"get"in h&&(f=h.get(a,!1,e))!==b?f:j[c];g=typeof d,g==="string"&&(f=bR.exec(d))&&(d=(f[1]+1)*f[2]+parseFloat(p.css(a,c)),g="number");if(d==null||g==="number"&&isNaN(d))return;g==="number"&&!p.cssNumber[i]&&(d+="px");if(!h||!("set"in h)||(d=h.set(a,d,e))!==b)try{j[c]=d}catch(k){}},css:function(a,c,d,e){var f,g,h,i=p.camelCase(c);return c=p.cssProps[i]||(p.cssProps[i]=bY(a.style,i)),h=p.cssHooks[c]||p.cssHooks[i],h&&"get"in h&&(f=h.get(a,!0,e)),f===b&&(f=bH(a,c)),f==="normal"&&c in bU&&(f=bU[c]),d||e!==b?(g=parseFloat(f),d||p.isNumeric(g)?g||0:f):f},swap:function(a,b,c){var d,e,f={};for(e in b)f[e]=a.style[e],a.style[e]=b[e];d=c.call(a);for(e in b)a.style[e]=f[e];return d}}),a.getComputedStyle?bH=function(b,c){var d,e,f,g,h=a.getComputedStyle(b,null),i=b.style;return h&&(d=h[c],d===""&&!p.contains(b.ownerDocument,b)&&(d=p.style(b,c)),bQ.test(d)&&bO.test(c)&&(e=i.width,f=i.minWidth,g=i.maxWidth,i.minWidth=i.maxWidth=i.width=d,d=h.width,i.width=e,i.minWidth=f,i.maxWidth=g)),d}:e.documentElement.currentStyle&&(bH=function(a,b){var c,d,e=a.currentStyle&&a.currentStyle[b],f=a.style;return e==null&&f&&f[b]&&(e=f[b]),bQ.test(e)&&!bM.test(b)&&(c=f.left,d=a.runtimeStyle&&a.runtimeStyle.left,d&&(a.runtimeStyle.left=a.currentStyle.left),f.left=b==="fontSize"?"1em":e,e=f.pixelLeft+"px",f.left=c,d&&(a.runtimeStyle.left=d)),e===""?"auto":e}),p.each(["height","width"],function(a,b){p.cssHooks[b]={get:function(a,c,d){if(c)return a.offsetWidth===0&&bN.test(bH(a,"display"))?p.swap(a,bT,function(){return cb(a,b,d)}):cb(a,b,d)},set:function(a,c,d){return b_(a,c,d?ca(a,b,d,p.support.boxSizing&&p.css(a,"boxSizing")==="border-box"):0)}}}),p.support.opacity||(p.cssHooks.opacity={get:function(a,b){return bL.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=p.isNumeric(b)?"alpha(opacity="+b*100+")":"",f=d&&d.filter||c.filter||"";c.zoom=1;if(b>=1&&p.trim(f.replace(bK,""))===""&&c.removeAttribute){c.removeAttribute("filter");if(d&&!d.filter)return}c.filter=bK.test(f)?f.replace(bK,e):f+" "+e}}),p(function(){p.support.reliableMarginRight||(p.cssHooks.marginRight={get:function(a,b){return p.swap(a,{display:"inline-block"},function(){if(b)return bH(a,"marginRight")})}}),!p.support.pixelPosition&&p.fn.position&&p.each(["top","left"],function(a,b){p.cssHooks[b]={get:function(a,c){if(c){var d=bH(a,b);return bQ.test(d)?p(a).position()[b]+"px":d}}}})}),p.expr&&p.expr.filters&&(p.expr.filters.hidden=function(a){return a.offsetWidth===0&&a.offsetHeight===0||!p.support.reliableHiddenOffsets&&(a.style&&a.style.display||bH(a,"display"))==="none"},p.expr.filters.visible=function(a){return!p.expr.filters.hidden(a)}),p.each({margin:"",padding:"",border:"Width"},function(a,b){p.cssHooks[a+b]={expand:function(c){var d,e=typeof c=="string"?c.split(" "):[c],f={};for(d=0;d<4;d++)f[a+bV[d]+b]=e[d]||e[d-2]||e[0];return f}},bO.test(a)||(p.cssHooks[a+b].set=b_)});var cd=/%20/g,ce=/\[\]$/,cf=/\r?\n/g,cg=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,ch=/^(?:select|textarea)/i;p.fn.extend({serialize:function(){return p.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?p.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||ch.test(this.nodeName)||cg.test(this.type))}).map(function(a,b){var c=p(this).val();return c==null?null:p.isArray(c)?p.map(c,function(a,c){return{name:b.name,value:a.replace(cf,"\r\n")}}):{name:b.name,value:c.replace(cf,"\r\n")}}).get()}}),p.param=function(a,c){var d,e=[],f=function(a,b){b=p.isFunction(b)?b():b==null?"":b,e[e.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};c===b&&(c=p.ajaxSettings&&p.ajaxSettings.traditional);if(p.isArray(a)||a.jquery&&!p.isPlainObject(a))p.each(a,function(){f(this.name,this.value)});else for(d in a)ci(d,a[d],c,f);return e.join("&").replace(cd,"+")};var cj,ck,cl=/#.*$/,cm=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,cn=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,co=/^(?:GET|HEAD)$/,cp=/^\/\//,cq=/\?/,cr=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,cs=/([?&])_=[^&]*/,ct=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,cu=p.fn.load,cv={},cw={},cx=["*/"]+["*"];try{ck=f.href}catch(cy){ck=e.createElement("a"),ck.href="",ck=ck.href}cj=ct.exec(ck.toLowerCase())||[],p.fn.load=function(a,c,d){if(typeof a!="string"&&cu)return cu.apply(this,arguments);if(!this.length)return this;var e,f,g,h=this,i=a.indexOf(" ");return i>=0&&(e=a.slice(i,a.length),a=a.slice(0,i)),p.isFunction(c)?(d=c,c=b):c&&typeof c=="object"&&(f="POST"),p.ajax({url:a,type:f,dataType:"html",data:c,complete:function(a,b){d&&h.each(d,g||[a.responseText,b,a])}}).done(function(a){g=arguments,h.html(e?p("<div>").append(a.replace(cr,"")).find(e):a)}),this},p.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){p.fn[b]=function(a){return this.on(b,a)}}),p.each(["get","post"],function(a,c){p[c]=function(a,d,e,f){return p.isFunction(d)&&(f=f||e,e=d,d=b),p.ajax({type:c,url:a,data:d,success:e,dataType:f})}}),p.extend({getScript:function(a,c){return p.get(a,b,c,"script")},getJSON:function(a,b,c){return p.get(a,b,c,"json")},ajaxSetup:function(a,b){return b?cB(a,p.ajaxSettings):(b=a,a=p.ajaxSettings),cB(a,b),a},ajaxSettings:{url:ck,isLocal:cn.test(cj[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":cx},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":p.parseJSON,"text xml":p.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:cz(cv),ajaxTransport:cz(cw),ajax:function(a,c){function y(a,c,f,i){var k,s,t,u,w,y=c;if(v===2)return;v=2,h&&clearTimeout(h),g=b,e=i||"",x.readyState=a>0?4:0,f&&(u=cC(l,x,f));if(a>=200&&a<300||a===304)l.ifModified&&(w=x.getResponseHeader("Last-Modified"),w&&(p.lastModified[d]=w),w=x.getResponseHeader("Etag"),w&&(p.etag[d]=w)),a===304?(y="notmodified",k=!0):(k=cD(l,u),y=k.state,s=k.data,t=k.error,k=!t);else{t=y;if(!y||a)y="error",a<0&&(a=0)}x.status=a,x.statusText=(c||y)+"",k?o.resolveWith(m,[s,y,x]):o.rejectWith(m,[x,y,t]),x.statusCode(r),r=b,j&&n.trigger("ajax"+(k?"Success":"Error"),[x,l,k?s:t]),q.fireWith(m,[x,y]),j&&(n.trigger("ajaxComplete",[x,l]),--p.active||p.event.trigger("ajaxStop"))}typeof a=="object"&&(c=a,a=b),c=c||{};var d,e,f,g,h,i,j,k,l=p.ajaxSetup({},c),m=l.context||l,n=m!==l&&(m.nodeType||m instanceof p)?p(m):p.event,o=p.Deferred(),q=p.Callbacks("once memory"),r=l.statusCode||{},t={},u={},v=0,w="canceled",x={readyState:0,setRequestHeader:function(a,b){if(!v){var c=a.toLowerCase();a=u[c]=u[c]||a,t[a]=b}return this},getAllResponseHeaders:function(){return v===2?e:null},getResponseHeader:function(a){var c;if(v===2){if(!f){f={};while(c=cm.exec(e))f[c[1].toLowerCase()]=c[2]}c=f[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){return v||(l.mimeType=a),this},abort:function(a){return a=a||w,g&&g.abort(a),y(0,a),this}};o.promise(x),x.success=x.done,x.error=x.fail,x.complete=q.add,x.statusCode=function(a){if(a){var b;if(v<2)for(b in a)r[b]=[r[b],a[b]];else b=a[x.status],x.always(b)}return this},l.url=((a||l.url)+"").replace(cl,"").replace(cp,cj[1]+"//"),l.dataTypes=p.trim(l.dataType||"*").toLowerCase().split(s),l.crossDomain==null&&(i=ct.exec(l.url.toLowerCase())||!1,l.crossDomain=i&&i.join(":")+(i[3]?"":i[1]==="http:"?80:443)!==cj.join(":")+(cj[3]?"":cj[1]==="http:"?80:443)),l.data&&l.processData&&typeof l.data!="string"&&(l.data=p.param(l.data,l.traditional)),cA(cv,l,c,x);if(v===2)return x;j=l.global,l.type=l.type.toUpperCase(),l.hasContent=!co.test(l.type),j&&p.active++===0&&p.event.trigger("ajaxStart");if(!l.hasContent){l.data&&(l.url+=(cq.test(l.url)?"&":"?")+l.data,delete l.data),d=l.url;if(l.cache===!1){var z=p.now(),A=l.url.replace(cs,"$1_="+z);l.url=A+(A===l.url?(cq.test(l.url)?"&":"?")+"_="+z:"")}}(l.data&&l.hasContent&&l.contentType!==!1||c.contentType)&&x.setRequestHeader("Content-Type",l.contentType),l.ifModified&&(d=d||l.url,p.lastModified[d]&&x.setRequestHeader("If-Modified-Since",p.lastModified[d]),p.etag[d]&&x.setRequestHeader("If-None-Match",p.etag[d])),x.setRequestHeader("Accept",l.dataTypes[0]&&l.accepts[l.dataTypes[0]]?l.accepts[l.dataTypes[0]]+(l.dataTypes[0]!=="*"?", "+cx+"; q=0.01":""):l.accepts["*"]);for(k in l.headers)x.setRequestHeader(k,l.headers[k]);if(!l.beforeSend||l.beforeSend.call(m,x,l)!==!1&&v!==2){w="abort";for(k in{success:1,error:1,complete:1})x[k](l[k]);g=cA(cw,l,c,x);if(!g)y(-1,"No Transport");else{x.readyState=1,j&&n.trigger("ajaxSend",[x,l]),l.async&&l.timeout>0&&(h=setTimeout(function(){x.abort("timeout")},l.timeout));try{v=1,g.send(t,y)}catch(B){if(v<2)y(-1,B);else throw B}}return x}return x.abort()},active:0,lastModified:{},etag:{}});var cE=[],cF=/\?/,cG=/(=)\?(?=&|$)|\?\?/,cH=p.now();p.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=cE.pop()||p.expando+"_"+cH++;return this[a]=!0,a}}),p.ajaxPrefilter("json jsonp",function(c,d,e){var f,g,h,i=c.data,j=c.url,k=c.jsonp!==!1,l=k&&cG.test(j),m=k&&!l&&typeof i=="string"&&!(c.contentType||"").indexOf("application/x-www-form-urlencoded")&&cG.test(i);if(c.dataTypes[0]==="jsonp"||l||m)return f=c.jsonpCallback=p.isFunction(c.jsonpCallback)?c.jsonpCallback():c.jsonpCallback,g=a[f],l?c.url=j.replace(cG,"$1"+f):m?c.data=i.replace(cG,"$1"+f):k&&(c.url+=(cF.test(j)?"&":"?")+c.jsonp+"="+f),c.converters["script json"]=function(){return h||p.error(f+" was not called"),h[0]},c.dataTypes[0]="json",a[f]=function(){h=arguments},e.always(function(){a[f]=g,c[f]&&(c.jsonpCallback=d.jsonpCallback,cE.push(f)),h&&p.isFunction(g)&&g(h[0]),h=g=b}),"script"}),p.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){return p.globalEval(a),a}}}),p.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),p.ajaxTransport("script",function(a){if(a.crossDomain){var c,d=e.head||e.getElementsByTagName("head")[0]||e.documentElement;return{send:function(f,g){c=e.createElement("script"),c.async="async",a.scriptCharset&&(c.charset=a.scriptCharset),c.src=a.url,c.onload=c.onreadystatechange=function(a,e){if(e||!c.readyState||/loaded|complete/.test(c.readyState))c.onload=c.onreadystatechange=null,d&&c.parentNode&&d.removeChild(c),c=b,e||g(200,"success")},d.insertBefore(c,d.firstChild)},abort:function(){c&&c.onload(0,1)}}}});var cI,cJ=a.ActiveXObject?function(){for(var a in cI)cI[a](0,1)}:!1,cK=0;p.ajaxSettings.xhr=a.ActiveXObject?function(){return!this.isLocal&&cL()||cM()}:cL,function(a){p.extend(p.support,{ajax:!!a,cors:!!a&&"withCredentials"in a})}(p.ajaxSettings.xhr()),p.support.ajax&&p.ajaxTransport(function(c){if(!c.crossDomain||p.support.cors){var d;return{send:function(e,f){var g,h,i=c.xhr();c.username?i.open(c.type,c.url,c.async,c.username,c.password):i.open(c.type,c.url,c.async);if(c.xhrFields)for(h in c.xhrFields)i[h]=c.xhrFields[h];c.mimeType&&i.overrideMimeType&&i.overrideMimeType(c.mimeType),!c.crossDomain&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");try{for(h in e)i.setRequestHeader(h,e[h])}catch(j){}i.send(c.hasContent&&c.data||null),d=function(a,e){var h,j,k,l,m;try{if(d&&(e||i.readyState===4)){d=b,g&&(i.onreadystatechange=p.noop,cJ&&delete cI[g]);if(e)i.readyState!==4&&i.abort();else{h=i.status,k=i.getAllResponseHeaders(),l={},m=i.responseXML,m&&m.documentElement&&(l.xml=m);try{l.text=i.responseText}catch(a){}try{j=i.statusText}catch(n){j=""}!h&&c.isLocal&&!c.crossDomain?h=l.text?200:404:h===1223&&(h=204)}}}catch(o){e||f(-1,o)}l&&f(h,j,l,k)},c.async?i.readyState===4?setTimeout(d,0):(g=++cK,cJ&&(cI||(cI={},p(a).unload(cJ)),cI[g]=d),i.onreadystatechange=d):d()},abort:function(){d&&d(0,1)}}}});var cN,cO,cP=/^(?:toggle|show|hide)$/,cQ=new RegExp("^(?:([-+])=|)("+q+")([a-z%]*)$","i"),cR=/queueHooks$/,cS=[cY],cT={"*":[function(a,b){var c,d,e=this.createTween(a,b),f=cQ.exec(b),g=e.cur(),h=+g||0,i=1,j=20;if(f){c=+f[2],d=f[3]||(p.cssNumber[a]?"":"px");if(d!=="px"&&h){h=p.css(e.elem,a,!0)||c||1;do i=i||".5",h=h/i,p.style(e.elem,a,h+d);while(i!==(i=e.cur()/g)&&i!==1&&--j)}e.unit=d,e.start=h,e.end=f[1]?h+(f[1]+1)*c:c}return e}]};p.Animation=p.extend(cW,{tweener:function(a,b){p.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");var c,d=0,e=a.length;for(;d<e;d++)c=a[d],cT[c]=cT[c]||[],cT[c].unshift(b)},prefilter:function(a,b){b?cS.unshift(a):cS.push(a)}}),p.Tween=cZ,cZ.prototype={constructor:cZ,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(p.cssNumber[c]?"":"px")},cur:function(){var a=cZ.propHooks[this.prop];return a&&a.get?a.get(this):cZ.propHooks._default.get(this)},run:function(a){var b,c=cZ.propHooks[this.prop];return this.options.duration?this.pos=b=p.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):cZ.propHooks._default.set(this),this}},cZ.prototype.init.prototype=cZ.prototype,cZ.propHooks={_default:{get:function(a){var b;return a.elem[a.prop]==null||!!a.elem.style&&a.elem.style[a.prop]!=null?(b=p.css(a.elem,a.prop,!1,""),!b||b==="auto"?0:b):a.elem[a.prop]},set:function(a){p.fx.step[a.prop]?p.fx.step[a.prop](a):a.elem.style&&(a.elem.style[p.cssProps[a.prop]]!=null||p.cssHooks[a.prop])?p.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},cZ.propHooks.scrollTop=cZ.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},p.each(["toggle","show","hide"],function(a,b){var c=p.fn[b];p.fn[b]=function(d,e,f){return d==null||typeof d=="boolean"||!a&&p.isFunction(d)&&p.isFunction(e)?c.apply(this,arguments):this.animate(c$(b,!0),d,e,f)}}),p.fn.extend({fadeTo:function(a,b,c,d){return this.filter(bZ).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=p.isEmptyObject(a),f=p.speed(b,c,d),g=function(){var b=cW(this,p.extend({},a),f);e&&b.stop(!0)};return e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,c,d){var e=function(a){var b=a.stop;delete a.stop,b(d)};return typeof a!="string"&&(d=c,c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,c=a!=null&&a+"queueHooks",f=p.timers,g=p._data(this);if(c)g[c]&&g[c].stop&&e(g[c]);else for(c in g)g[c]&&g[c].stop&&cR.test(c)&&e(g[c]);for(c=f.length;c--;)f[c].elem===this&&(a==null||f[c].queue===a)&&(f[c].anim.stop(d),b=!1,f.splice(c,1));(b||!d)&&p.dequeue(this,a)})}}),p.each({slideDown:c$("show"),slideUp:c$("hide"),slideToggle:c$("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){p.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),p.speed=function(a,b,c){var d=a&&typeof a=="object"?p.extend({},a):{complete:c||!c&&b||p.isFunction(a)&&a,duration:a,easing:c&&b||b&&!p.isFunction(b)&&b};d.duration=p.fx.off?0:typeof d.duration=="number"?d.duration:d.duration in p.fx.speeds?p.fx.speeds[d.duration]:p.fx.speeds._default;if(d.queue==null||d.queue===!0)d.queue="fx";return d.old=d.complete,d.complete=function(){p.isFunction(d.old)&&d.old.call(this),d.queue&&p.dequeue(this,d.queue)},d},p.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},p.timers=[],p.fx=cZ.prototype.init,p.fx.tick=function(){var a,b=p.timers,c=0;for(;c<b.length;c++)a=b[c],!a()&&b[c]===a&&b.splice(c--,1);b.length||p.fx.stop()},p.fx.timer=function(a){a()&&p.timers.push(a)&&!cO&&(cO=setInterval(p.fx.tick,p.fx.interval))},p.fx.interval=13,p.fx.stop=function(){clearInterval(cO),cO=null},p.fx.speeds={slow:600,fast:200,_default:400},p.fx.step={},p.expr&&p.expr.filters&&(p.expr.filters.animated=function(a){return p.grep(p.timers,function(b){return a===b.elem}).length});var c_=/^(?:body|html)$/i;p.fn.offset=function(a){if(arguments.length)return a===b?this:this.each(function(b){p.offset.setOffset(this,a,b)});var c,d,e,f,g,h,i,j={top:0,left:0},k=this[0],l=k&&k.ownerDocument;if(!l)return;return(d=l.body)===k?p.offset.bodyOffset(k):(c=l.documentElement,p.contains(c,k)?(typeof k.getBoundingClientRect!="undefined"&&(j=k.getBoundingClientRect()),e=da(l),f=c.clientTop||d.clientTop||0,g=c.clientLeft||d.clientLeft||0,h=e.pageYOffset||c.scrollTop,i=e.pageXOffset||c.scrollLeft,{top:j.top+h-f,left:j.left+i-g}):j)},p.offset={bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;return p.support.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(p.css(a,"marginTop"))||0,c+=parseFloat(p.css(a,"marginLeft"))||0),{top:b,left:c}},setOffset:function(a,b,c){var d=p.css(a,"position");d==="static"&&(a.style.position="relative");var e=p(a),f=e.offset(),g=p.css(a,"top"),h=p.css(a,"left"),i=(d==="absolute"||d==="fixed")&&p.inArray("auto",[g,h])>-1,j={},k={},l,m;i?(k=e.position(),l=k.top,m=k.left):(l=parseFloat(g)||0,m=parseFloat(h)||0),p.isFunction(b)&&(b=b.call(a,c,f)),b.top!=null&&(j.top=b.top-f.top+l),b.left!=null&&(j.left=b.left-f.left+m),"using"in b?b.using.call(a,j):e.css(j)}},p.fn.extend({position:function(){if(!this[0])return;var a=this[0],b=this.offsetParent(),c=this.offset(),d=c_.test(b[0].nodeName)?{top:0,left:0}:b.offset();return c.top-=parseFloat(p.css(a,"marginTop"))||0,c.left-=parseFloat(p.css(a,"marginLeft"))||0,d.top+=parseFloat(p.css(b[0],"borderTopWidth"))||0,d.left+=parseFloat(p.css(b[0],"borderLeftWidth"))||0,{top:c.top-d.top,left:c.left-d.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||e.body;while(a&&!c_.test(a.nodeName)&&p.css(a,"position")==="static")a=a.offsetParent;return a||e.body})}}),p.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,c){var d=/Y/.test(c);p.fn[a]=function(e){return p.access(this,function(a,e,f){var g=da(a);if(f===b)return g?c in g?g[c]:g.document.documentElement[e]:a[e];g?g.scrollTo(d?p(g).scrollLeft():f,d?f:p(g).scrollTop()):a[e]=f},a,e,arguments.length,null)}}),p.each({Height:"height",Width:"width"},function(a,c){p.each({padding:"inner"+a,content:c,"":"outer"+a},function(d,e){p.fn[e]=function(e,f){var g=arguments.length&&(d||typeof e!="boolean"),h=d||(e===!0||f===!0?"margin":"border");return p.access(this,function(c,d,e){var f;return p.isWindow(c)?c.document.documentElement["client"+a]:c.nodeType===9?(f=c.documentElement,Math.max(c.body["scroll"+a],f["scroll"+a],c.body["offset"+a],f["offset"+a],f["client"+a])):e===b?p.css(c,d,e,h):p.style(c,d,e,h)},c,g?e:b,g,null)}})}),a.jQuery=a.$=p,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return p})})(window);
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/framework/lib/ruqq.base.js', namespace: 'framework.ruqq.base', url: '/.reference/libjs/framework/lib/ruqq.base.js'});
;(function() {
   "use strict";

   var w = window,
       r = typeof w.ruqq === 'undefined' ? (w.ruqq = {}) : ruqq;

   r.doNothing = function() {
      return false;
   };


   
   
   (function(r) {
      var div = document.createElement('div'),
          I = r.info || {};
      r.info = I;

      I.hasTouchSupport = (function() {
         if ('createTouch' in document) {
            return true;
         }
         try {
            return !!document.createEvent("TouchEvent").initTouchEvent;
         } catch (error) {
            return false;
         }
      }());
      I.prefix = (function() {
         if ('transition' in div.style) {
            return '';
         }
         if ('webkitTransition' in div.style) {
            return 'webkit';
         }
         if ('MozTransition' in div.style) {
            return 'Moz';
         }
         if ('OTransition' in div.style) {
            return 'O';
         }
         if ('msTransition' in div.style) {
            return 'ms';
         }
         return '';
      }());
      I.cssprefix = I.prefix ? '-' + I.prefix.toLowerCase() + '-' : '';
      I.supportTransitions = I.prefix + 'TransitionProperty' in div.style;

   }(r));


   return r;

}());
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/framework/lib/utils.js', namespace: 'framework.utils', url: '/.reference/libjs/framework/lib/utils.js'});
;(function() {
    var _cache = {};

    /**
     *  @augments
     *      1. {String}, {Value},{Value} ... = Template: '%1,%2'
     *      2. {String}, {Object} = Template: '#{key} #{key2}'
     */
    String.format = function(str) {
        if (typeof arguments[1] != 'object') {
            for (var i = 1; i < arguments.length; i++) {
                var regexp = (_cache[i] || (_cache[i] = new RegExp('%' + i, 'g')));
                str = str.replace(regexp, arguments[i]);
            }
            return str;
        }

        var output = '',
            lastIndex = 0,
            obj = arguments[1];
        while (1) {
            var index = str.indexOf('#{', lastIndex);
            if (index == -1){
                break;
            }
            output += str.substring(lastIndex, index);
            var end = str.indexOf('}', index);

            output += obj[str.substring(index + 2, end)];
            lastIndex = ++end;
        }
        output += str.substring(lastIndex);
        return output;
    };


    Object.defaults = function(obj, def) {
        for (var key in def) {
            if (obj[key] == null) {
                obj[key] = def[key];
            }
        }
        return obj;
    };
    
    Object.clear = function(obj, arg) {
        if (arg instanceof Array) {
            for (var i = 0, x, length = arg.length; i < length; i++) {
                x = arg[i];
                if (x in obj) {
                    delete obj[x];
                }
            }
        } else if (typeof arg === 'object') {
            for (var key in arg) {
                if (key in obj) {
                    delete obj[key];
                }
            }
        }
        return obj;
    };

    Object.extend = function(target, source) {
        if (target == null) {
            target = {};
        }
        if (source == null) {
            return target;
        }
        for (var key in source) {
            if (source[key] != null) {
                target[key] = source[key];
            }
        }
        return target;
    };

    Object.getProperty = function(o, chain) {
        if (typeof o !== 'object' || chain == null) {
            return o;
        }
        if (typeof chain === 'string') {
            chain = chain.split('.');
        }
        if (chain.length === 1) {
            return o[chain[0]];
        }
        return Object.getProperty(o[chain.shift()], chain);
    };

    Object.setProperty = function(o, xpath, value) {
        var arr = xpath.split('.'),
            obj = o,
            key = arr[arr.length - 1];
        while (arr.length > 1) {
            var prop = arr.shift();
            obj = obj[prop] || (obj[prop] = {});
        }
        obj[key] = value;
    };

    Object.lazyProperty = function(o, xpath, fn) {
        var arr = xpath.split('.'),
            obj = o,
            lazy = arr[arr.length - 1];
        while (arr.length > 1) {
            var prop = arr.shift();
            obj = obj[prop] || (obj[prop] = {});
        }
        arr = null;
        obj.__defineGetter__(lazy, function() {
            delete obj[lazy];
            obj[lazy] = fn();
            fn = null;
            return obj[lazy];
        });
    };

    Object.observe = function(obj, property, callback) {
        if (obj.__observers == null) {
            //-obj.__observers = {};
            Object.defineProperty(obj, '__observers', {
                value: {},
                enumerable: false
            });
        }
        if (obj.__observers[property]) {
            obj.__observers[property].push(callback);
            return;
        }
        (obj.__observers[property] || (obj.__observers[property] = [])).push(callback);

        var chain = property.split('.'),
            parent = obj,
            key = property;

        if (chain.length > 1) {
            key = chain.pop();
            parent = Object.getProperty(obj, chain);
        }

        var value = parent[key];
        Object.defineProperty(parent, key, {
            get: function() {
                return value;
            },
            set: function(x) {
                value = x;
                
                var observers = obj.__observers[property];
                for (var i = 0, length = observers.length; i < length; i++) {
                    observers[i](x);                    
                }
            }
        });
    };


    Date.format = function(date, format) {
        if (!format) {
            format = "MM/dd/yyyy";
        }

        function pad(value) {
            return value > 9 ? value : '0' + value;
        }
        format = format.replace("MM", pad(date.getMonth() + 1));
        var _year = date.getFullYear();
        if (format.indexOf("yyyy") > -1) {
            format = format.replace("yyyy", _year);
        }
        else if (format.indexOf("yy") > -1) {
            format = format.replace("yy", _year.toString().substr(2, 2));
        }

        format = format.replace("dd", pad(date.getDate()));

        if (format.indexOf("HH") > -1) {
            format = format.replace("HH", pad(date.getHours()));
        }
        if (format.indexOf("mm") > -1) {
            format = format.replace("mm", pad(date.getMinutes()));
        }
        if (format.indexOf("ss") > -1) {
            format = format.replace("ss", pad(date.getSeconds()));
        }
        return format;
    };


    // obsolete - is it indeed useful ? === (create delegate)
    Function.invoke = function() {
        var arr = Array.prototype.slice.call(arguments),
            obj = arr.shift(),
            fn = arr.shift();
        return function() {
            return obj[fn].apply(obj, arr);
        };

    };

}());
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/framework/lib/routes.js', namespace: 'framework.routes', url: '/.reference/libjs/framework/lib/routes.js'});
;(function(w) {
    
    /** convert line parameters to object. : 'e=10' to {e:10} */
    var deserialize = function(line) {
        var o = {};
        if (!line) {
            return o;
        }
        for (var item, i, parts = line.split('&');
        (item = parts[(i = -~i) - 1]) && (item = item.split('=')) && (item.length == 2);) {
            o[item[0]] = item[1];
        }
        return o;
    };

    /** parse route.match(string '/:route1/:route2') into route object */
    var parse = (function() {
        function regexpify(line) {
            return line.replace(/([\\\[\]\(\)])/g, '\\$1');
        }


        var part = {
            ':': '(/([\\w]+))',
            '?': '(/([\\w]+))?'
        };

        return function(route) {
            var parts = route.match.split('/'),
                param = '',
                regexpIndex = 2;

            for (var i = 0, x, length = parts.length; i < length; i++) {
                x = parts[i];
                if (!x) {
                    parts.splice(i, 1);
                    i--;
                    length--;
                    continue;
                }

                var c = x[0];
                switch (c) {
                case ':':
                case '?':
                    parts[i] = part[c];
                    param += (param ? '&' : '') + x.substring(c == ':' ? 1 : 2) + '=$' + regexpIndex;
                    regexpIndex += 2;
                    continue;
                }
                parts[i] = '/' + regexpify(x);
            }

            route.match = new RegExp('^' + parts.join(''));
            route.param = param;
            return route;
        };
    }());

    var match = function(routes) {
        if (!routes) {
            return null;
        }

        var hash = (w.location.hash || '').replace(/^#\/?/, '/');
        for (var i = 0, x, length = routes.length; i < length; i++) {
            x = routes[i];
            var result = x.match.exec(hash);
            if (!result || !result.length) {
                continue;
            }

            x.hash = hash;
            return x;
        }
        return null;
    };
    
    /**
     *      route = {Object} = 
     *      {
     *              match: {regexp},
     *              param: {querystring} // 'key=$1&key2=$2'
     *      }
     *
     *      route = {String} = '/:key/value'
     */
    w.routes = new new Class({
        Construct: function() {
            window.onhashchange = this.hashchanged.bind(this);
        },
        hashchanged: function() {
            var x;
            (x = match(this.routes)) && x.callback(deserialize(x.hash.replace(x.match, x.param)));
        },
        add: function(routes) {
            if (routes == null) {
                return;
            }
            if (typeof routes === 'string') {
                this.add({
                    match: routes,
                    callback: arguments[1]
                });
                return;
            }

            var isarray = routes instanceof Array,
                length = isarray ? routes.length : 1,
                x = null;
            for (var i = 0; isarray ? i < length : i < 1; i++) {
                x = isarray ? routes[i] : routes;
                
                if (typeof x.match === 'string') {
                    parse(x);
                }
                (this.routes || (this.routes = [])).push(x);
            }


        },
        navigate: function(hash) {
            w.location.hash = !hash ? '' : ((hash[0] == '/' ? '' : '/') + hash);
        },
        current: function() {
            var x;
            return (x = match(this.routes)) && deserialize(x.hash.replace(x.match, x.param));
        }
    });




}(window));
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/framework/lib/browser.detect.js', namespace: 'framework.browser.detect', url: '/.reference/libjs/framework/lib/browser.detect.js'});
;(function() {

	if (typeof navigator == 'undefined') {
		return;
	}

	var w = window,
		r = typeof w.ruqq === 'undefined' ? (w.ruqq = {}) : ruqq,
		info = r.info || (r.info = {}),
		ua = navigator.userAgent,
		_object, _prop1, _prop2;

	function use(container, prop1, prop2) {
		_object = container;
		_prop1 = prop1;
		_prop2 = prop2;
	}

	function has(str, value, regexp) {
		if (ua.indexOf(str) == -1) {
			return false;
		}
		_object[_prop1] = value;

		if (regexp && _prop2) {
			var match = regexp.exec(ua);
			if (match && match.length > 1) {
				_object[_prop2] = match[1];
			}
		}
		return true;
	}


	use(info.platform = {}, 'name');
	if (!( //
	has('Windows', 'win') || //
	has('Mac', 'mac') || //
	has('Linux', 'linux') || //
	has('iPhone', 'iphone') || //
	has('Android', 'android'))) {
		info.platform.name = 'unknown'
	}

	use(info.browser = {}, 'name', 'version')
	if (!( //
	has('MSIE', 'msie', /MSIE (\d+(\.\d+)*)/) || //
	has('Firefox', 'firefox', /Firefox\/(\d+(\.\d+)*)/) || //
	has('Safari', 'safari', /Version\/(\d+(\.\d+)*)/) || //
	has('Opera', 'opera', /Version\/? ?(\d+(\.\d+)*)/))) {
		info.browser.name = 'unknown';
		info.browser.version = 0;
	}
	has('Chrome', 'chrome', /Chrome\/(\d+(\.\d+)*)/);


	use(info.engine = {}, 'name', 'version');
	if (!( //
	has('Trident', 'trident', /Trident\/(\d+(\.\d+)*)/) || //
	has('Gecko', 'gecko', /rv:(\d+(\.\d+)*)/) || //
	has('Presto', 'presto', /Presto\/(\d+(\.\d+)*)/) || //
	has('Opera', 'opera', /Version\/? ?(\d+(\.\d+)*)/))) {
		info.engine.name = 'unknown';
		info.engine.version = 0;
	}
	has('WebKit', 'webkit', /WebKit\/(\d+(\.\d+)*)/);

}());
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/mask/lib/mask.js', namespace: 'lib.mask', url: '/.reference/libjs/mask/lib/mask.js'});
;
;(function (global, document) {

	"use strict";
var
	regexpWhitespace = /\s/g,
	regexpLinearCondition = /([!]?['"A-Za-z0-9_\-\.]+)([!<>=]{1,2})?([^\|&]+)?([\|&]{2})?/g,
	regexpEscapedChar = {
		"'": /\\'/g,
		'"': /\\"/g,
		'{': /\\\{/g,
		'>': /\\>/g,
		';': /\\>/g
	},
	regexpTabsAndNL = /[\t\n\r]{1,}/g,
	regexpMultipleSpaces = / {2,}/g,


	hasOwnProp = {}.hasOwnProperty;
var Helper = {
	extend: function (target, source) {
		var key;

		if (source == null) {
			return target;
		}
		if (target == null) {
			target = {};
		}
		for (key in source) {
			if (hasOwnProp.call(source, key)) {
				target[key] = source[key];
			}
		}
		return target;
	},

	getProperty: function (o, chain) {
		var value = o,
			props,
			key, i, length;

		if (typeof o !== 'object' || chain == null) {
			return o;
		}
		if (typeof chain === 'string') {
			props = chain.split('.');
		}

		for (i = 0, length = props.length; i < length; i++) {
			key = props[i];
			value = value[key];
			if (!value) {
				return value;
			}
		}

		return value;
	},

	templateFunction: function (arr, o) {
		var output = '',
			even = true,
			utility, value, index,
			key, i, length;

		for (i = 0, length = arr.length; i < length; i++) {
			if (even) {
				output += arr[i];
			}
			else {
				key = arr[i];
				value = null;
				index = key.indexOf(':');

				if (~index) {
					utility = index > 0 ? key.substring(0, index).replace(regexpWhitespace, '') : '';
					if (utility === '') {
						utility = 'condition';
					}

					key = key.substring(index + 1);
					value = typeof ValueUtilities[utility] === 'function' ? ValueUtilities[utility](key, o) : null;
				}
				else {
					value = Helper.getProperty(o, key);
				}

				output += value == null ? '' : value;
			}

			even = !even;
		}

		return output;
	}
};

function Template(template) {
	this.template = template;
	this.index = 0;
	this.length = template.length;
}

Template.prototype = {
	next: function () {
		this.index++;
		return this;
	},
	skipWhitespace: function () {
		//regexpNoWhitespace.lastIndex = this.index;
		//var result = regexpNoWhitespace.exec(this.template);
		//if (result){
		//    this.index = result.index;
		//}
		//return this;

		var template = this.template,
			index = this.index,
			length = this.length;

		for (; index < length; index++) {
			if (template.charCodeAt(index) !== 32 /*' '*/) {
				break;
			}
		}

		this.index = index;

		return this;
	},

	skipToChar: function (c) {
		var template = this.template,
			index;

		do {
			index = template.indexOf(c, this.index);
		}
		while (~index && template.charCodeAt(index - 1) !== 92 /*'\\'*/);

		this.index = index;

		return this;
	},

//	skipToAny: function (chars) {
//		var r = regexp[chars];
//		if (r == null) {
//			console.error('Unknown regexp %s: Create', chars);
//			r = (regexp[chars] = new RegExp('[' + chars + ']', 'g'));
//		}
//
//		r.lastIndex = this.index;
//		var result = r.exec(this.template);
//		if (result != null) {
//			this.index = result.index;
//		}
//		return this;
//	},

	skipToAttributeBreak: function () {

//		regexpAttrEnd.lastIndex = ++this.index;
//		var result;
//		do {
//			result = regexpAttrEnd.exec(this.template);
//			if (result != null) {
//				if (result[0] == '#' && this.template.charCodeAt(this.index + 1) === 123) {
//					regexpAttrEnd.lastIndex += 2;
//					continue;
//				}
//				this.index = result.index;
//				break;
//			}
//		} while (result != null)
//		return this;

		var template = this.template,
			index = this.index,
			length = this.length,
			c;
		do {
			c = template.charCodeAt(++index);
			// if c == # && next() == { - continue */
			if (c === 35 && template.charCodeAt(index + 1) === 123) {
				index++;
				c = null;
			}
		}
		while (c !== 46 && c !== 35 && c !== 62 && c !== 123 && c !== 32 && c !== 59 && index < length);
		//while(!== ".#>{ ;");

		this.index = index;

		return this;
	},

	sliceToChar: function (c) {
		var template = this.template,
			index = this.index,
			start = index,
			isEscaped = false,
			value, nindex;

		while ((nindex = template.indexOf(c, index)) > -1) {
			index = nindex;
			if (template.charCodeAt(index - 1) !== 92 /*'\\'*/) {
				break;
			}
			isEscaped = true;
			index++;
		}

		value = template.substring(start, index);

		this.index = index;

		return isEscaped ? value.replace(regexpEscapedChar[c], c) : value;

		//-return this.skipToChar(c).template.substring(start, this.index);
	}

//	,
//	sliceToAny: function (chars) {
//		var start = this.index;
//		return this.skipToAny(chars).template.substring(start, this.index);
//	}
};

function ICustomTag() {
	this.attr = {};
}

ICustomTag.prototype.render = function (values, stream) {
	//-return stream instanceof Array ? Builder.buildHtml(this.nodes, values, stream) : Builder.buildDom(this.nodes, values, stream);
	return Builder.build(this.nodes, values, stream);
};

var CustomTags = (function () {

	var renderICustomTag = ICustomTag.prototype.render;

	function List() {
		this.attr = {};
	}

	List.prototype.render = function (values, container, cntx) {
		var attr = this.attr,
			attrTemplate = attr.template,
			value = Helper.getProperty(values, attr.value),
			nodes,
			template,
			i, length;

		if (!(value instanceof Array)) {
			return container;
		}


		if (attrTemplate != null) {
			template = document.querySelector(attrTemplate).innerHTML;
			this.nodes = nodes = Mask.compile(template);
		}


		if (this.nodes == null) {
			return container;
		}

		//- var fn = Builder[container.buffer != null ? 'buildHtml' : 'buildDom'];

		for (i = 0, length = value.length; i < length; i++) {
			Builder.build(this.nodes, value[i], container, cntx);
		}

		return container;
	};


	function Visible() {
		this.attr = {};
	}

	Visible.prototype.render = function (values, container, cntx) {
		if (!ValueUtilities.out.isCondition(this.attr.check, values)) {
			return container;
		}
		else {
			return renderICustomTag.call(this, values, container, cntx);
		}
	};


	function Binding() {
		this.attr = {};
	}

	Binding.prototype.render = function () {
		// lazy self definition

		var
			objectDefineProperty = Object.defineProperty,
			supportsDefineProperty = false,
			watchedObjects,
			ticker;

		// test for support
		if (objectDefineProperty) {
			try {
				supportsDefineProperty = Object.defineProperty({}, 'x', {get: function () {
					return true;
				}}).x;
			}
			catch (e) {
				supportsDefineProperty = false;
			}
		}
		else {
			if (Object.prototype.__defineGetter__) {
				objectDefineProperty = function (obj, prop, desc) {
					if (hasOwnProp.call(desc, 'get')) {
						obj.__defineGetter__(prop, desc.get);
					}
					if (hasOwnProp.call(desc, 'set')) {
						obj.__defineSetter__(prop, desc.set);
					}
				};

				supportsDefineProperty = true;
			}
		}

		// defining polyfill
		if (!supportsDefineProperty) {
			watchedObjects = [];

			objectDefineProperty = function (obj, prop, desc) {
				var
					objectWrapper,
					found = false,
					i, length;

				for (i = 0, length = watchedObjects.length; i < length; i++) {
					objectWrapper = watchedObjects[i];
					if (objectWrapper.obj === obj) {
						found = true;
						break;
					}
				}

				if (!found) {
					objectWrapper = watchedObjects[i] = {obj: obj, props: {}};
				}

				objectWrapper.props[prop] = {
					value: obj[prop],
					set: desc.set
				};
			};

			ticker = function () {
				var
					objectWrapper,
					i, length,
					props,
					prop,
					propObj,
					newValue;

				for (i = 0, length = watchedObjects.length; i < length; i++) {
					objectWrapper = watchedObjects[i];
					props = objectWrapper.props;

					for (prop in props) {
						if (hasOwnProp.call(props, prop)) {
							propObj = props[prop];
							newValue = objectWrapper.obj[prop];
							if (newValue !== propObj.value) {
								propObj.set.call(null, newValue);
							}
						}
					}
				}

				setTimeout(ticker, 16);
			};

			ticker();
		}


		return (Binding.prototype.render = function (values, container) {
			var
				attrValue = this.attr.value,
				value = values[attrValue];

			objectDefineProperty.call(Object, values, attrValue, {
				get: function () {
					return value;
				},
				set: function (x) {
					container.innerHTML = value = x;
				}
			});

			container.innerHTML = value;
			return container;
		}
			).apply(this, arguments);
	};

	return {
		all: {
			list: List,
			visible: Visible,
			bind: Binding
		}
	};

}());

var ValueUtilities = (function () {
	
	function getAssertionValue(value, model){
		var c = value.charCodeAt(0);
		if (c === 34 || c === 39) /* ' || " */{
			return value.substring(1, value.length - 1);
		} else if (c === 45 || (c > 47 && c < 58)) /* [=] || [number] */{
			return value << 0;
		} else {
			return Helper.getProperty(model, value);
		}
		return '';
	}

	var parseLinearCondition = function (line) {
			var cond = {
					assertions: []
				},
				buffer = {
					data: line.replace(regexpWhitespace, '')
				},
				match, expr;

			buffer.index = buffer.data.indexOf('?');

			if (buffer.index === -1) {
				console.error('Invalid Linear Condition: "?" is not found');
			}


			expr = buffer.data.substring(0, buffer.index);

			while ((match = regexpLinearCondition.exec(expr)) != null) {
				cond.assertions.push({
					join: match[4],
					left: match[1],
					sign: match[2],
					right: match[3]
				});
			}

			buffer.index++;
			parseCase(buffer, cond, 'case1');

			buffer.index++;
			parseCase(buffer, cond, 'case2');

			return cond;
		},
		parseCase = function (buffer, obj, key) {
			var c = buffer.data[buffer.index],
				end = null;

			if (c == null) {
				return;
			}
			if (c === '"' || c === "'") {
				end = buffer.data.indexOf(c, ++buffer.index);
				obj[key] = buffer.data.substring(buffer.index, end);
			} else {
				end = buffer.data.indexOf(':', buffer.index);
				if (end === -1) {
					end = buffer.data.length;
				}
				obj[key] = {
					value: buffer.data.substring(buffer.index, end)
				};
			}
			if (end != null) {
				buffer.index = ++end;
			}
		},
		isCondition = function (con, values) {
			if (typeof con === 'string') {
				con = parseLinearCondition(con);
			}
			var current = false,
				a,
				value1,
				value2,
				i,
				length;

			for (i = 0, length = con.assertions.length; i < length; i++) {
				a = con.assertions[i];
				if (a.right == null) {

					current = a.left.charCodeAt(0) === 33 ? !Helper.getProperty(values, a.left.substring(1)) : !!Helper.getProperty(values, a.left);

					if (current === true) {
						if (a.join === '&&') {
							continue;
						}
						break;
					}
					if (a.join === '||') {
						continue;
					}
					break;
				}

				value1 = getAssertionValue(a.left,values);
				value2 = getAssertionValue(a.right,values);
				switch (a.sign) {
					case '<':
						current = value1 < value2;
						break;
					case '<=':
						current = value1 <= value2;
						break;
					case '>':
						current = value1 > value2;
						break;
					case '>=':
						current = value1 >= value2;
						break;
					case '!=':
						current = value1 !== value2;
						break;
					case '==':
						current = value1 === value2;
						break;
				}

				if (current === true) {
					if (a.join === '&&') {
						continue;
					}
					break;
				}
				if (a.join === '||') {
					continue;
				}
				break;
			}
			return current;
		};

	return {
		condition: function (line, values) {
			var con = parseLinearCondition(line),
				result = isCondition(con, values) ? con.case1 : con.case2;

			if (result == null) {
				return '';
			}
			if (typeof result === 'string') {
				return result;
			}
			return Helper.getProperty(values, result.value);
		},
		out: {
			isCondition: isCondition,
			parse: parseLinearCondition
		}
	};
}());


var Parser = {
	toFunction: function (template) {

		var arr = template.split('#{'),
			length = arr.length,
			i;

		for (i = 1; i < length; i++) {
			var key = arr[i],
				index = key.indexOf('}');
			arr.splice(i, 0, key.substring(0, index));
			i++;
			length++;
			arr[i] = key.substring(index + 1);
		}

		template = null;
		return function (o) {
			return Helper.templateFunction(arr, o);
		};
	},
	parseAttributes: function (T, node) {

		var key, value, _classNames, quote, c, start, i;
		if (node.attr == null) {
			node.attr = {};
		}

		loop: for (; T.index < T.length;) {
			key = null;
			value = null;
			c = T.template.charCodeAt(T.index);
			switch (c) {
				case 32:
					//case 9: was replaced while compiling
					//case 10:
					T.index++;
					continue;

				//case '{;>':
				case 123:
				case 59:
				case 62:
					
					break loop;

				case 46:
					/* '.' */

					start = T.index + 1;
					T.skipToAttributeBreak();

					value = T.template.substring(start, T.index);

					_classNames = _classNames != null ? _classNames + ' ' + value : value;

					break;
				case 35:
					/* '#' */
					key = 'id';

					start = T.index + 1;
					T.skipToAttributeBreak();
					value = T.template.substring(start, T.index);

					break;
				default:
					start = (i = T.index);
					
					var whitespaceAt = null;
					do {
						c = T.template.charCodeAt(++i);
						if (whitespaceAt == null && c === 32){
							whitespaceAt = i;
						}
					}while(c !== 61 /* = */ && i <= T.length);
					
					key = T.template.substring(start, whitespaceAt || i);
					
					do {
						quote = T.template.charAt(++i);
					}
					while (quote === ' ');

					T.index = ++i;
					value = T.sliceToChar(quote);
					T.index++;
					break;
			}


			if (key != null) {
				//console.log('key', key, value);
				if (value.indexOf('#{') > -1) {
					value = T.serialize !== true ? this.toFunction(value) : {
						template: value
					};
				}
				node.attr[key] = value;
			}
		}
		if (_classNames != null) {
			node.attr['class'] = _classNames.indexOf('#{') > -1 ? (T.serialize !== true ? this.toFunction(_classNames) : {
				template: _classNames
			}) : _classNames;

		}
		

	},
	/** @out : nodes */
	parse: function (T) {
		var current = T;
		for (; T.index < T.length; T.index++) {
			var c = T.template.charCodeAt(T.index);
			switch (c) {
				case 32:
					continue;
				case 39:
				/* ' */
				case 34:
					/* " */

					T.index++;

					var content = T.sliceToChar(c === 39 ? "'" : '"');
					if (content.indexOf('#{') > -1) {
						content = T.serialize !== true ? this.toFunction(content) : {
							template: content
						};
					}

					var t = {
						content: content
					};
					if (current.nodes == null) {
						current.nodes = t;
					}
					else if (current.nodes.push == null) {
						current.nodes = [current.nodes, t];
					}
					else {
						current.nodes.push(t);
					}
					//-current.nodes.push(t);

					if (current.__single) {
						if (current == null) {
							continue;
						}
						current = current.parent;
						while (current != null && current.__single != null) {
							current = current.parent;
						}
					}
					continue;
				case 62:
					/* '>' */
					current.__single = true;
					continue;
				case 123:
					/* '{' */

					continue;
				case 59:
					/* ';' */
					/** continue if semi-column, but is not a single tag (else goto 125) */
					if (current.nodes != null) {
						continue;
					}
					/* falls through */
				case 125:
					/* '}' */
					if (current == null) {
						continue;
					}

					do {
						current = current.parent;
					}
					while (current != null && current.__single != null);

					continue;
			}

			var tagName = null;
			if (c === 46 /* . */ || c === 35 /* # */){
				tagName = 'div';
			}else{
				var start = T.index;
				do {
					c = T.template.charCodeAt(++T.index);
				}
				while (c !== 32 && c !== 35 && c !== 46 && c !== 59 && c !== 123 && c !== 62 && T.index <= T.length);
				/** while !: ' ', # , . , ; , { <*/
		
				tagName = T.template.substring(start, T.index);
			}

			if (tagName === '') {
				console.error('Parse Error: Undefined tag Name %d/%d %s', T.index, T.length, T.template.substring(T.index, T.index + 10));
			}

			var tag = {
				tagName: tagName,
				parent: current
			};

			if (current == null) {
				console.log('T', T, 'rest', T.template.substring(T.index));
			}

			if (current.nodes == null) {
				current.nodes = tag;
			}
			else if (current.nodes.push == null) {
				current.nodes = [current.nodes, tag];
			}
			else {
				current.nodes.push(tag);
			}
			//-if (current.nodes == null) current.nodes = [];
			//-current.nodes.push(tag);

			current = tag;

			this.parseAttributes(T, current);

			T.index--;
		}
		return T.nodes;
	},
	cleanObject: function (obj) {
		if (obj instanceof Array) {
			for (var i = 0; i < obj.length; i++) {
				this.cleanObject(obj[i]);
			}
			return obj;
		}
		delete obj.parent;
		delete obj.__single;

		if (obj.nodes != null) {
			this.cleanObject(obj.nodes);
		}

		return obj;
	}
};

var Builder = {
	build: function (nodes, values, container, cntx) {
		if (nodes == null) {
			return container;
		}

		if (container == null) {
			container = document.createDocumentFragment();
		}
		if (cntx == null) {
			cntx = {};
		}

		var isarray = nodes instanceof Array,
			length = isarray === true ? nodes.length : 1,
			i, node;

		for (i = 0; i < length; i++) {
			node = isarray === true ? nodes[i] : nodes;

			if (CustomTags.all[node.tagName] != null) {
				try {
					var Handler = CustomTags.all[node.tagName],
						custom = Handler instanceof Function ? new Handler(values) : Handler;

					custom.compoName = node.tagName;
					custom.nodes = node.nodes;
					/*	creating new attr object for custom handler, preventing collisions due to template caching */
					custom.attr = Helper.extend(custom.attr, node.attr);

					(cntx.components || (cntx.components = [])).push(custom);
					custom.parent = cntx;
					custom.render(values, container, custom);
				}catch(error){
					console.error('Custom Tag Handler:', node.tagName, error);
				}
				continue;
			}
			if (node.content != null) {
				container.appendChild(document.createTextNode(typeof node.content === 'function' ? node.content(values) : node.content));
				continue;
			}

			var tag = document.createElement(node.tagName),
				attr = node.attr;
			for (var key in attr) {
				if (hasOwnProp.call(attr, key) === true){
					var value = typeof attr[key] === 'function' ? attr[key](values) : attr[key];
					if (value) {
						tag.setAttribute(key, value);
					}
				}
			}

			if (node.nodes != null) {
				this.build(node.nodes, values, tag, cntx);
			}
			container.appendChild(tag);
		}
		return container;
	}
};

var cache = {},
	Mask = {

		/**
		 * @arg template - {template{string} | maskDOM{array}}
		 * @arg model - template values
		 * @arg container - optional, - place to renderDOM, @default - DocumentFragment
		 * @return container {@default DocumentFragment}
		 */
		render: function (template, model, container, cntx) {
			//////try {
			if (typeof template === 'string') {
				template = this.compile(template);
			}
			return Builder.build(template, model, container, cntx);
			//////} catch (e) {
			//////	console.error('maskJS', e.message, template);
			//////}
			//////return null;
		},
		/**
		 *@arg template - string to be parsed into maskDOM
		 *@arg serializeDOM - build raw maskDOM json, without template functions - used for storing compiled template
		 *@return maskDOM
		 */
		compile: function (template, serializeOnly) {
			if (hasOwnProp.call(cache, template)){
				/** if Object doesnt contains property that check is faster
					then "!=null" http://jsperf.com/not-in-vs-null/2 */
				return cache[template];
			}


			/** remove unimportant whitespaces */
			var T = new Template(template.replace(regexpTabsAndNL, '').replace(regexpMultipleSpaces, ' '));
			if (serializeOnly === true) {
				T.serialize = true;
			}

			return (cache[template] = Parser.parse(T));


		},
		registerHandler: function (tagName, TagHandler) {
			CustomTags.all[tagName] = TagHandler;
		},
		getHandler: function (tagName) {
			return tagName != null ? CustomTags.all[tagName] : CustomTags.all;
		},
		registerUtility: function (utilityName, fn) {
			ValueUtilities[utilityName] = fn;
		},
		serialize: function (template) {
			return Parser.cleanObject(this.compile(template, true));
		},
		deserialize: function (serialized) {
			var i, key, attr;
			if (serialized instanceof Array) {
				for (i = 0; i < serialized.length; i++) {
					this.deserialize(serialized[i]);
				}
				return serialized;
			}
			if (serialized.content != null) {
				if (serialized.content.template != null) {
					serialized.content = Parser.toFunction(serialized.content.template);
				}
				return serialized;
			}
			if (serialized.attr != null) {
				attr = serialized.attr;
				for (key in attr) {
					if (hasOwnProp.call(attr, key) === true){
						if (attr[key].template == null) {
							continue;
						}
						attr[key] = Parser.toFunction(attr[key].template);
					}
				}
			}
			if (serialized.nodes != null) {
				this.deserialize(serialized.nodes);
			}
			return serialized;
		},
		clearCache: function(key){
			if (typeof key === 'string'){
				delete cache[key];
			}else{
				cache = {};
			}
		},
		ICustomTag: ICustomTag,
		ValueUtils: ValueUtilities
	};


/** Obsolete - to keep backwards compatiable */
Mask.renderDom = Mask.render;


if (typeof module !== 'undefined' && module.exports) {
	module.exports = Mask;
}else{
	global.mask = Mask;
}

})(this, typeof document === 'undefined' ? null : document);
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compo/lib/compo.js', namespace: 'lib.compo', url: '/.reference/libjs/compo/lib/compo.js'});
;include.js({
	lib: 'mask'
}).done(function() {

	var w = window,
		domLib = typeof $ == 'undefined' ? null : $,
		regexp = {
			trailingSpaces: /^\s+/
		},
		Helper = {
			resolveDom: function(compo, values) {
				if (compo.nodes != null) {
					if (compo.tagName != null) {
						return compo;
					}

					return mask.renderDom(compo.nodes, values);
				}
				if (compo.attr.template != null) {
					var e;
					if (compo.attr.template[0] === '#') {
						e = document.getElementById(compo.attr.template.substring(1));
						if (e == null) {
							console.error('Template Element not Found:', compo.attr.template);
							return null;
						}
					}
					return mask.renderDom(e != null ? e.innerHTML : compo.attr.template, values);
				}
				return null;
			},
			ensureTemplate: function(compo) {
				if (compo.nodes != null) {
					return;
				}

				var template;
				if (compo.attr.template != null) {
					if (compo.attr.template[0] === '#') {
						template = this.templateById(compo.attr.template.substring(1));
					} else {
						template = compo.attr.template;
					}

					delete compo.attr.template;
				}
				if (typeof template == 'string') {
					template = mask.compile(template);
				}
				if (template != null) {
					compo.nodes = template;
					return;
				}

				return;
			},
			templateById: function(id) {
				var e = document.getElementById(id);
				if (e == null) {
					console.error('Template Element not Found:', id);
				}
				return e && e.innerHTML;
			},
			containerArray: function() {
				var arr = [];
				arr.appendChild = function(child) {
					this.push(child);
				};
				return arr;
			},
			parseSelector: function(selector, type, direction) {
				var key, prop, nextKey;

				if (key == null) {
					switch (selector[0]) {
					case '#':
						key = 'id';
						selector = selector.substring(1);
						prop = 'attr';
						break;
					case '.':
						key = 'class';
						selector = new RegExp('\\b' + selector.substring(1) + '\\b');
						prop = 'attr';
						break;
					default:
						key = type == 'node' ? 'tagName' : 'compoName';
						break;
					}
				}

				if (direction == 'up') {
					nextKey = 'parent';
				} else {
					nextKey = type == 'node' ? 'nodes' : 'components';
				}

				return {
					key: key,
					prop: prop,
					selector: selector,
					nextKey: nextKey
				};
			}
		},
		/**
		 *   Component Events. Fires only once.
		 *   Used for component Initialization.
		 *   Supported events:
		 *       DOMInsert
		 *       +custom
		 *   UI-Eevent exchange must be made over DOMLibrary
		 */
		Shots = { /** from parent to childs */
			emit: function(component, event, args) {
				if (component.listeners != null && event in component.listeners) {
					component.listeners[event].apply(component, args);
					delete component.listeners[event];
				}
				if (component.components instanceof Array) {
					for (var i = 0; i < component.components.length; i++) {
						Shots.emit(component.components[i], event, args);
					}
				}
			},
			on: function(component, event, fn) {
				if (component.listeners == null) {
					component.listeners = {};
				}
				component.listeners[event] = fn;
			}
		},
		Events_ = {
			on: function(component, events, $element) {
				if ($element == null) {
					$element = component.$;
				}

				var isarray = events instanceof Array,
					length = isarray ? events.length : 1;

				for (var i = 0, x; isarray ? i < length : i < 1; i++) {
					x = isarray ? events[i] : events;

					if (x instanceof Array) {
						$element.on.apply($element, x);
						continue;
					}


					for (var key in x) {
						var fn = typeof x[key] === 'string' ? component[x[key]] : x[key],
							parts = key.split(':');

						$element.on(parts[0] || 'click', parts.splice(1).join(':').trim() || null, fn.bind(component));
					}
				}
			}
		},
		Children_ = {
			select: function(component, compos) {
				for (var name in compos) {
					var data = compos[name],
						events = null,
						selector = null;

					if (data instanceof Array) {
						selector = data[0];
						events = data.splice(1);
					}
					if (typeof data == 'string') {
						selector = data;
					}
					if (data == null) {
						console.error('Unknown component child', name, compos[name]);
						return;
					}

					var index = selector.indexOf(':'),
						engine = selector.substring(0, index);

					engine = Compo.config.selectors[engine];

					if (engine == null) {
						component.compos[name] = component.$[0].querySelector(selector);
					} else {
						selector = selector.substring(++index).replace(regexp.trailingSpaces, '');
						component.compos[name] = engine(component, selector);
					}

					var element = component.compos[name];

					if (events != null) {
						if (element instanceof Compo) {
							element = element.$;
						}
						Events_.on(component, events, element);
					}
				}
			}
		};

	w.Compo = Class({
		/**
		 * @param - arg -
		 *      1. object - model object, receive from mask.renderDom
		 *      Custom Initialization:
		 *      2. String - template
		 * @param cntx
		 *      1. maskDOM context
		 */
		Construct: function(arg) {
			if (typeof arg === 'string') {
				var template = arg;
				if (template[0] == '#') {
					template = Helper.templateById(template.substring(1));
				}
				this.nodes = mask.compile(template);
			}

		},
		render: function(values, container, cntx) {
			Compo.render(this, values, container, cntx);
			return this;
		},
		insert: function(parent) {
			for (var i = 0; i < this.$.length; i++) {
				parent.appendChild(this.$[i]);
			}

			Shots.emit(this, 'DOMInsert');
			return this;
		},
		append: function(template, values, selector) {
			var parent;
			
			if (this.$ == null) {
				var dom = typeof template == 'string' ? mask.compile(template) : template;
					
				parent = selector ? Compo.findNode(this, selector) : this;
				if (parent.nodes == null) {
					this.nodes = dom;
				} else if (parent.nodes instanceof Array) {
					parent.nodes.push(dom);
				} else {
					parent.nodes = [this.nodes, dom];
				}

				return this;
			}
			var array = mask.renderDom(template, values, Helper.containerArray(), this);
			
			parent = selector ? this.$.find(selector) : this.$;
			for (var i = 0; i < array.length; i++) {
				parent.append(array[i]);
			}

			Shots.emit(this, 'DOMInsert');
			return this;
		},
		on: function() {
			var x = Array.prototype.slice.call(arguments);
			if (arguments.length < 3) {
				console.error('Invalid Arguments Exception @use .on(type,selector,fn)');
				return this;
			}

			if (this.$ != null) {
				Events_.on(this, [x]);
			}


			if (this.events == null) {
				this.events = [x];
			} else if (this.events instanceof Array) {
				this.events.push(x);
			} else {
				this.events = [x, this.events];
			}
			return this;
		},
		remove: function() {
			this.$ && this.$.remove();
			Compo.dispose(this);

			if (this.parent != null) {
				var i = this.parent.components.indexOf(this);
				this.parent.components.splice(i, 1);
			}

			return this;
		},
		Static: {
			render: function(compo, values, container, cntx) {
				if (cntx == null) {
					cntx = compo;
				}

				Helper.ensureTemplate(compo);

				var elements = mask.renderDom(compo.tagName == null ? compo.nodes : compo, values, Helper.containerArray(), cntx);
				compo.$ = domLib(elements);

				if (compo.events != null) {
					Events_.on(compo, compo.events);
				}
				if (compo.compos != null) {
					Children_.select(compo, compo.compos);
				}

				if (container != null) {
					for (var i = 0; i < elements.length; i++) {
						container.appendChild(elements[i]);
					}
				}
				return this;
			},
			config: {
				selectors: {
					'$': function(compo, selector) {
						var r = compo.$.find(selector);
						return r.length > 0 ? r : compo.$.filter(selector);
					},
					'compo': function(compo, selector) {
						var r = Compo.findCompo(compo, selector);
						return r;
					}
				},
				/**
				 @default, global $ is used
				 IDOMLibrary = {
				 {fn}(elements) - create dom-elements wrapper,
				 on(event, selector, fn) - @see jQuery 'on'
				 }
				 */
				setDOMLibrary: function(lib) {
					domLib = lib;
				}
			},
			match: function(compo, selector, type) {
				if (typeof selector === 'string') {
					if (type == null) {
						type = compo.compoName ? 'compo' : 'node';
					}
					selector = Helper.parseSelector(selector, type);
				}

				var obj = selector.prop ? compo[selector.prop] : compo;
				if (obj == null) {
					return false;
				}

				if (selector.selector.test != null) {
					if (selector.selector.test(obj[selector.key])) {
						return true;
					}
				} else {
					if (obj[selector.key] == selector.selector) {
						return true;
					}
				}

				return false;
			},
			find: function(compo, selector, direction, type) {
				if (compo == null || typeof compo === 'string') {
					console.warn('Invalid Compo', arguments);
					return null;
				}

				if (typeof selector === 'string') {
					if (type == null) {
						type = compo.compoName ? 'compo' : 'node';
					}
					selector = Helper.parseSelector(selector, type, direction);
				}
				if (compo instanceof Array) {
					for (var i = 0, x, length = compo.length; i < length; i++) {
						x = compo[i];
						var r = Compo.find(x, selector);
						if (r != null) {
							return r;
						}
					}
					return null;
				}
				if (Compo.match(compo, selector) === true) {
					return compo;
				}
				return (compo = compo[selector.nextKey]) && Compo.find(compo, selector);
			},
			findCompo: function(compo, selector, direction) {
				return Compo.find(compo, selector, direction, 'compo');

			},
			findNode: function(compo, selector, direction) {
				return Compo.find(compo, selector, direction, 'node');
			},
			dispose: function(compo) {
				compo.dispose && compo.dispose();
				if (this.components == null) {
					return;
				}
				for (var i = 0, length = compo.components.length; i < length; i++) {
					Compo.dispose(compo.components[i]);
				}
			},
			shots: Shots
		}
	});

	/** CompoUtils */
	var Traversing = {
		find: function(selector, type) {
			return Compo.find(this, selector, null, type || 'compo');
		},
		closest: function(selector, type) {
			return Compo.find(this, selector, 'up', type || 'compo');
		},
		all: function(selector, type) {
			var current = arguments[2] || this,
				arr = arguments[3] || [];

			if (typeof selector === 'string') {
				selector = Helper.parseSelector(selector, type);
			}


			if (Compo.match(current, selector)) {
				arr.push(current);
			}

			var childs = current[selector.nextKey];

			if (childs != null) {
				for (var i = 0; i < childs.length; i++) {
					this.all(selector, null, childs[i], arr);
				}
			}

			return arr;
		}
	};

	var Manipulate = {
		addClass: function(_class) {
			this.attr.class = this.attr.class ? this.attr.class + ' ' + _class : _class;
		}
	};

	w.CompoUtils = Class({
		Extends: [Traversing, Manipulate]
	});

});
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/ranimate/lib/ranimate.js', namespace: 'lib.ranimate', url: '/.reference/libjs/ranimate/lib/ranimate.js'});
;
include.js({
    framework: 'ruqq.base'
}).done(function() {
	"use strict";

var w = window,
    r = ruqq,
    prfx = r.info.cssprefix,
    vendorPrfx = r.info.prefix,
    getTransitionEndEvent = function() {
        var el = document.createElement('fakeelement'),
            transitions = {
                'transition': 'transitionend',
                'OTransition': 'oTransitionEnd',
                'MSTransition': 'msTransitionEnd',
                'MozTransition': 'transitionend',
                'WebkitTransition': 'webkitTransitionEnd'
            },
            event = null;

        for (var t in transitions) {
            if (el.style[t] !== undefined) {
                event = transitions[t];
                break;
            }
        }

        getTransitionEndEvent = function() {
            return event;
        };
        
        el = null;
        transitions = null;
        return getTransitionEndEvent();
    },
    I = {
        prop: prfx + 'transition-property',
        duration: prfx + 'transition-duration',
        timing: prfx + 'transition-timing-function',
        delay: prfx + 'transition-delay'
    };
var Animate = function (element, property, valueTo, duration, callback, valueFrom, timing) {

	var data = typeof property === 'string' ? {
		property: property,
		valueFrom: valueFrom,
		valueTo: valueTo,
		duration: duration,
		timing: timing,
		callback: callback
	} : property,
		$this = $(element);

	if (data.timing == null) {
		data.timing = 'linear';
	}
	if (data.duration == null) {
		data.duration = 300;
	}


	if (data.valueFrom != null) {
		var css = {};
		css[data.property] = data.valueFrom;
		css[prfx + 'transition-property'] = 'none';
		css[prfx + 'transition-duration'] = '0ms';

		$this.css(css);
	}
	setTimeout(function() {
		var css = {};
		css[data.property] = data.valueTo;
		css[prfx + 'transition-property'] = data.property;
		css[prfx + 'transition-duration'] = data.duration + 'ms';
		css[prfx + 'transition-timing-function'] = data.timing;

		$this.css(css);

		if (data.callback) {			
			var callback = function(){
					element.removeEventListener(getTransitionEndEvent(), callback, false);
					data.callback();
			};
			
			element.addEventListener(getTransitionEndEvent(), callback, false);					
		}
		
	}, 0);

	return this;
};



var TransformModel = (function() {
	var regexp = /([\w]+)\([^\)]+\)/g;

	function extract(str) {
		var props = null;
		regexp.lastIndex = 0;
		while (1) {
			var match = regexp.exec(str);
			if (!match) {
				return props;
			}
			(props || (props = {}))[match[1]] = match[0];
		}
	}

	function stringify(props) {
		var keys = Object.keys(props).sort().reverse();
		for (var i = 0; i < keys.length; i++) {
			keys[i] = props[keys[i]];
		}
		return keys.join(' ');
	}

	
	return Class({
		Construct: function() {
			this.transforms = {};
		},
		handle: function(data) {
			var start = extract(data.from),
				end = extract(data.to),
				prop = null;

			if (start) {
				for (prop in this.transforms) {
					if (prop in start === false) {
						//console.log('from', prop, this.transforms[prop]);
						start[prop] = this.transforms[prop];
					}
				}
				data.from = stringify(start);

				for (prop in start) {
					this.transforms[prop] = start[prop];
				}
			}

			for (prop in this.transforms) {
				if (prop in end === false) {
					end[prop] = this.transforms[prop];
				}
			}
			data.to = stringify(end);

			for (prop in end) {
				this.transforms[prop] = end[prop];
			}
		}
	});
})();

var ModelData = (function() {

	var vendorProperties = {
		'transform': null
	};

	function parse(model) {
		var arr = model.split(/ *\| */g),
			data = {},
			length = arr.length;

		data.prop = arr[0] in vendorProperties ? prfx + arr[0] : arr[0];


		var vals = arr[1].split(/ *> */);

		if (vals[0]) {
			data.from = vals[0];
		}

		data.to = vals[vals.length - 1];

		if (length > 2) {
			var info = /(\d+m?s)?\s*([a-z]+[^\s]*)?\s*(\d+m?s)?/.exec(arr[2]);
			if (info != null) {
				data.duration = info[1] || '200ms';
				data.timing = info[2] || 'linear';
				data.delay = info[3] || '0';
				
				return data;
			}
		}
		data.duration = '200ms';
		data.timing = 'linear';
		data.delay = '0';
		
		
		return data;
	}

	return Class({
		Construct: function(data, parent) {
			this.parent = parent;
			this.transformModel = parent && parent.transformModel || new TransformModel();

			var model = data.model || data;

			if (model instanceof Array) {
				this.model = [];
				for (var i = 0, length = model.length; i < length; i++) {
					this.model.push(new ModelData(model[i], this));
				}
			} else if (model instanceof Object) {
				this.model = [new ModelData(model, this)];
			} else if (typeof model === 'string') {
				this.model = parse(model);

				if (~this.model.prop.indexOf('transform')) {
					this.transformModel.handle(this.model);
				}
			}

			if (data.next != null) {
				this.next = new ModelData(data.next, this);
			}

			this.state = 0;
			this.modelCount = this.model instanceof Array ? this.model.length : 1;
			this.nextCount = 0;
			
			if (this.next != null) {
				this.nextCount = this.next instanceof Array ? this.next.length : 1;
			}
		},
		reset: function() {
			this.state = 0;
			this.modelCount = this.model instanceof Array ? this.model.length : 1;
			this.nextCount = 0;
			
			if (this.next != null) {
				this.nextCount = this.next instanceof Array ? this.next.length : 1;
			}

			var isarray = this.model instanceof Array,
				length = isarray ? this.model.length : 1,
				x = null;
			for (var i = 0; isarray ? i < length : i < 1; i++) {
				x = isarray ? this.model[i] : this.model;
				x.reset && x.reset();
			}
		},
		getNext: function() {
			//-console.log('getNext', this.state, this.modelCount, this.nextCount, this.model.prop, this);
			if (this.state === 0) {				
				this.state = 1;
				return this;
			}

			if (this.state == 1 && this.modelCount > 0) {
				--this.modelCount;
			}
			if (this.state == 1 && this.modelCount === 0) {
				this.state = 2;
				if (this.next) {
					return this.next;
				}
			}
			if (this.state == 2 && this.nextCount > 0) {
				--this.nextCount;
			}

			if (this.state == 2 && this.nextCount === 0 && this.parent) {
				return this.parent.getNext && this.parent.getNext();
			}
			return null;
		}
	});

})();





var Stack = Class({
	Construct: function() {
		this.arr = [];
	},
	put: function(modelData) {
		if (modelData == null) {
			return false;
		}

		var next = modelData.getNext(),
			result = false,
			length, i;

		if (next == null) {
			return false;
		}
		
		
		if (next instanceof Array) {			
			for (i = 0, length = next.length; i < length; i++) {
				if (this.put(next[i]) === true) {
					r = true;
				}
			}
			return r;
		}

		if (next.state === 0) {
			next.state = 1;
		}
		
		if (next.model instanceof Array) {
			r = false;
			for (i = 0, length = next.model.length; i < length; i++) {
				if (this.put(next.model[i]) === true) {
					r = true;
				}
			}
			return r;
		}
		
		
		/* Resolve css property if this already animating,
		 * as we start new animation with this prop */
		this.resolve(next.model.prop);
			
		this.arr.push(next);
		return true;
	},
	resolve: function(prop) {
		for (var i = 0, x, length = this.arr.length; i < length; i++) {
			x = this.arr[i];
			if (x.model.prop == prop) {
				//-console.log('resolve',prop, x);
				this.arr.splice(i, 1);
				return this.put(x);
			}
		}
		return false;
	},
	getCss: function(startCss, css) {
		var i, length, key, x;

		for (i = 0, length = this.arr.length; i < length; i++) {
			x = this.arr[i];
			if ('from' in x.model) {				
				startCss[x.model.prop] = x.model.from;
			}
			css[x.model.prop] = x.model.to;

			for (key in I) {
				(css[I[key]] || (css[I[key]] = [])).push(x.model[key]);
			}
		}
		for (key in I) {
			css[I[key]] = css[I[key]].join(',');
		}		
	},
	clear: function() {
		this.arr = [];
	}
});

var Model = Class({
	Construct: function(models) {
		this.stack = new Stack();
		this.model = new ModelData(models);
		this.transitionEnd = this.transitionEnd.bind(this);
		
	},
	start: function(element, onComplete) {
		this.onComplete = onComplete;
		var startCss = {},
			css = {};

		this.model.reset();
		this.stack.clear();
		this.stack.put(this.model);
		this.stack.getCss(startCss, css);



		element.addEventListener(getTransitionEndEvent(), this.transitionEnd, false);
		this.element = element;
		this.apply(startCss, css);
	},
	transitionEnd: function(event) {
		if (this.stack.resolve(event.propertyName) === true) {
			var startCss = {},
				css = {};
			this.stack.getCss(startCss, css);
			this.apply(startCss, css);
		} else {
			if (this.stack.arr.length < 1) {
				
				this.element.removeEventListener(getTransitionEndEvent(), this.transitionEnd, false);
				this.onComplete && this.onComplete();
			}			
		}
		
	},

	apply: function(startCss, css) {
		//-console.log('apply', startCss, css);
		startCss[prfx + 'transition'] = 'none';

		var style = this.element.style;
		if (startCss != null) {
			for (var key in startCss) {
				style.setProperty(key, startCss[key], '');
				//-style[key] = startCss[key];
			}
		}

		setTimeout(function() {
			for (var key in css){			
				style.setProperty(key, css[key], '');
			}
		}, 0);
	}
});
var Sprite = (function() {
	var keyframes = {},
		vendor = null,
		initVendorStrings = function() {
			vendor = {
				keyframes: "@" + vendorPrfx + "keyframes",
				AnimationIterationCount: vendorPrfx + 'AnimationIterationCount',
				AnimationDuration: vendorPrfx + 'AnimationDuration',
				AnimationTimingFunction: vendorPrfx + 'AnimationTimingFunction',
				AnimationFillMode: vendorPrfx + 'AnimationFillMode',
				AnimationName: vendorPrfx + 'AnimationName'
			};
		};
		
		return {
			/**
			 * {id, frameWidth, frames, frameStart?, property?}
			 */
			create: function(data) {
				if (vendor == null) {
					initVendorStrings();
				}
				if (keyframes[data.id] == null) {

					var pos = document.styleSheets[0].insertRule(vendor.keyframes + " " + data.id + " {}", 0),
						keyFrameAnimation = document.styleSheets[0].cssRules[pos],
						frames = data.frames - (data.frameStart || 0),
						step = 100 / frames | 0,
						property = data.property || 'background-position-x';

					for (var i = 0; i < frames; i++) {
						var rule = (step * (i + 1)) + '% { ' + property + ': ' + (-data.frameWidth * (i + (data.frameStart || 0))) + 'px}';
						keyFrameAnimation.insertRule(rule);
					}
					keyFrameAnimation.iterationCount = data.iterationCount;
					keyFrameAnimation.frameToStop = data.frameToStop;

					keyframes[data.id] = keyFrameAnimation;
				}
			},
			start: function($element, animationId, msperframe) {
				var style = $element.get(0).style;

				style[vendor.AnimationName] = 'none';
				setTimeout(function() {
					var keyframe = keyframes[animationId];

					if (style[vendor.AnimationFillMode] == 'forwards') {
						Sprite.stop($element);
						return;
					}
					$element.on(vendor + 'AnimationEnd', function() {
						var css;
						if (keyframe.frameToStop) {
							//TODO: now only last cssRule is taken
							var styles = keyframe.cssRules[keyframe.cssRules.length - 1].style;
							css = {};
							for (var i = 0; i < styles.length; i++) {
								css[styles[i]] = styles[styles[i]];
							}
						}
						Sprite.stop($element, css);
					});

					style[vendor.AnimationIterationCount] = keyframe.iterationCount || 1;
					style[vendor.AnimationDuration] = (keyframe.cssRules.length * msperframe) + 'ms';
					style[vendor.AnimationTimingFunction] = 'step-start';
					style[vendor.AnimationFillMode] = keyframe.frameToStop ? 'forwards' : 'none';
					style[vendor.AnimationName] = animationId;

				}, 0);
			},
			stop: function($element, css) {
				var style = $element.get(0).style;
				style[vendor.AnimationFillMode] = 'none';
				style[vendor.AnimationName] = '';
				if (css != null) {
					$element.css(css);
				}
			}
		};
})();
r.animate = Animate;
r.animate.Model = Model;
r.animate.sprite = Sprite;
});
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/scroller/lib/iscroll-full.js', namespace: '', url: '/.reference/libjs/compos/scroller/lib/iscroll-full.js'});
;/*!
 * iScroll v4.2.5 ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
(function(window, doc) {
	var m = Math,
		dummyStyle = doc.createElement('div').style,
		vendor = (function() {
			var vendors = 't,webkitT,MozT,msT,OT'.split(','),
				t, i = 0,
				l = vendors.length;

			for (; i < l; i++) {
				t = vendors[i] + 'ransform';
				if (t in dummyStyle) {
					return vendors[i].substr(0, vendors[i].length - 1);
				}
			}

			return false;
		})(),
		cssVendor = vendor ? '-' + vendor.toLowerCase() + '-' : '',

		// Style properties
		transform = prefixStyle('transform'),
		transitionProperty = prefixStyle('transitionProperty'),
		transitionDuration = prefixStyle('transitionDuration'),
		transformOrigin = prefixStyle('transformOrigin'),
		transitionTimingFunction = prefixStyle('transitionTimingFunction'),
		transitionDelay = prefixStyle('transitionDelay'),

		// Browser capabilities
		isAndroid = (/android/gi).test(navigator.appVersion),
		isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
		isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),

		has3d = prefixStyle('perspective') in dummyStyle,
		hasTouch = 'ontouchstart' in window && !isTouchPad,
		hasTransform = vendor !== false,
		hasTransitionEnd = prefixStyle('transition') in dummyStyle,

		RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
		START_EV = hasTouch ? 'touchstart' : 'mousedown',
		MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
		END_EV = hasTouch ? 'touchend' : 'mouseup',
		CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
		TRNEND_EV = (function() {
			if (vendor === false) return false;

			var transitionEnd = {
				'': 'transitionend',
				'webkit': 'webkitTransitionEnd',
				'Moz': 'transitionend',
				'O': 'otransitionend',
				'ms': 'MSTransitionEnd'
			};

			return transitionEnd[vendor];
		})(),

		nextFrame = (function() {
			return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
			function(callback) {
				return setTimeout(callback, 1);
			};
		})(),
		cancelFrame = (function() {
			return window.cancelRequestAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout;
		})(),

		// Helpers
		translateZ = has3d ? ' translateZ(0)' : '',

		// Constructor
		iScroll = function(el, options) {
			var that = this,
				i;

			that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
			that.wrapper.style.overflow = 'hidden';
			that.scroller = that.wrapper.children[0];

			// Default options
			that.options = {
				hScroll: true,
				vScroll: true,
				x: 0,
				y: 0,
				bounce: true,
				bounceLock: false,
				momentum: true,
				lockDirection: true,
				useTransform: true,
				useTransition: false,
				topOffset: 0,
				checkDOMChanges: false,
				// Experimental
				handleClick: true,

				// Scrollbar
				hScrollbar: true,
				vScrollbar: true,
				fixedScrollbar: isAndroid,
				hideScrollbar: isIDevice,
				fadeScrollbar: isIDevice && has3d,
				scrollbarClass: '',

				// Zoom
				zoom: false,
				zoomMin: 1,
				zoomMax: 4,
				doubleTapZoom: 2,
				wheelAction: 'scroll',

				// Snap
				snap: false,
				snapThreshold: 1,

				// Events
				onRefresh: null,
				onBeforeScrollStart: function(e) {
					e.preventDefault();
				},
				onScrollStart: null,
				onBeforeScrollMove: null,
				onScrollMove: null,
				onBeforeScrollEnd: null,
				onScrollEnd: null,
				onTouchEnd: null,
				onDestroy: null,
				onZoomStart: null,
				onZoom: null,
				onZoomEnd: null
			};

			// User defined options
			for (i in options) that.options[i] = options[i];

			// Set starting position
			that.x = that.options.x;
			that.y = that.options.y;

			// Normalize options
			that.options.useTransform = hasTransform && that.options.useTransform;
			that.options.hScrollbar = that.options.hScroll && that.options.hScrollbar;
			that.options.vScrollbar = that.options.vScroll && that.options.vScrollbar;
			that.options.zoom = that.options.useTransform && that.options.zoom;
			that.options.useTransition = hasTransitionEnd && that.options.useTransition;

			// Helpers FIX ANDROID BUG!
			// translate3d and scale doesn't work together!
			// Ignoring 3d ONLY WHEN YOU SET that.options.zoom
			if (that.options.zoom && isAndroid) {
				translateZ = '';
			}

			// Set some default styles
			that.scroller.style[transitionProperty] = that.options.useTransform ? cssVendor + 'transform' : 'top left';
			that.scroller.style[transitionDuration] = '0';
			that.scroller.style[transformOrigin] = '0 0';
			if (that.options.useTransition) that.scroller.style[transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';

			if (that.options.useTransform) that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px)' + translateZ;
			else that.scroller.style.cssText += ';position:absolute;top:' + that.y + 'px;left:' + that.x + 'px';

			if (that.options.useTransition) that.options.fixedScrollbar = true;

			that.refresh();

			that._bind(RESIZE_EV, window);
			that._bind(START_EV);
			if (!hasTouch) {
				if (that.options.wheelAction != 'none') {
					that._bind('DOMMouseScroll');
					that._bind('mousewheel');
				}
			}

			if (that.options.checkDOMChanges) that.checkDOMTime = setInterval(function() {
				that._checkDOMChanges();
			}, 500);
		};

	// Prototype
	iScroll.prototype = {
		enabled: true,
		x: 0,
		y: 0,
		steps: [],
		scale: 1,
		currPageX: 0,
		currPageY: 0,
		pagesX: [],
		pagesY: [],
		aniTime: null,
		wheelZoomCount: 0,

		handleEvent: function(e) {
			var that = this;
			switch (e.type) {
			case START_EV:
				if (!hasTouch && e.button !== 0) return;
				that._start(e);
				break;
			case MOVE_EV:
				that._move(e);
				break;
			case END_EV:
			case CANCEL_EV:
				that._end(e);
				break;
			case RESIZE_EV:
				that._resize();
				break;
			case 'DOMMouseScroll':
			case 'mousewheel':
				that._wheel(e);
				break;
			case TRNEND_EV:
				that._transitionEnd(e);
				break;
			}
		},

		_checkDOMChanges: function() {
			if (this.moved || this.zoomed || this.animating || (this.scrollerW == this.scroller.offsetWidth * this.scale && this.scrollerH == this.scroller.offsetHeight * this.scale)) return;

			this.refresh();
		},

		_scrollbar: function(dir) {
			var that = this,
				bar;

			if (!that[dir + 'Scrollbar']) {
				if (that[dir + 'ScrollbarWrapper']) {
					if (hasTransform) that[dir + 'ScrollbarIndicator'].style[transform] = '';
					that[dir + 'ScrollbarWrapper'].parentNode.removeChild(that[dir + 'ScrollbarWrapper']);
					that[dir + 'ScrollbarWrapper'] = null;
					that[dir + 'ScrollbarIndicator'] = null;
				}

				return;
			}

			if (!that[dir + 'ScrollbarWrapper']) {
				// Create the scrollbar wrapper
				bar = doc.createElement('div');

				if (that.options.scrollbarClass) bar.className = that.options.scrollbarClass + dir.toUpperCase();
				else bar.style.cssText = 'position:absolute;z-index:100;' + (dir == 'h' ? 'height:7px;bottom:1px;left:2px;right:' + (that.vScrollbar ? '7' : '2') + 'px' : 'width:7px;bottom:' + (that.hScrollbar ? '7' : '2') + 'px;top:2px;right:1px');

				bar.style.cssText += ';pointer-events:none;' + cssVendor + 'transition-property:opacity;' + cssVendor + 'transition-duration:' + (that.options.fadeScrollbar ? '350ms' : '0') + ';overflow:hidden;opacity:' + (that.options.hideScrollbar ? '0' : '1');

				that.wrapper.appendChild(bar);
				that[dir + 'ScrollbarWrapper'] = bar;

				// Create the scrollbar indicator
				bar = doc.createElement('div');
				if (!that.options.scrollbarClass) {
					bar.style.cssText = 'position:absolute;z-index:100;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);' + cssVendor + 'background-clip:padding-box;' + cssVendor + 'box-sizing:border-box;' + (dir == 'h' ? 'height:100%' : 'width:100%') + ';' + cssVendor + 'border-radius:3px;border-radius:3px';
				}
				bar.style.cssText += ';pointer-events:none;' + cssVendor + 'transition-property:' + cssVendor + 'transform;' + cssVendor + 'transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);' + cssVendor + 'transition-duration:0;' + cssVendor + 'transform: translate(0,0)' + translateZ;
				if (that.options.useTransition) bar.style.cssText += ';' + cssVendor + 'transition-timing-function:cubic-bezier(0.33,0.66,0.66,1)';

				that[dir + 'ScrollbarWrapper'].appendChild(bar);
				that[dir + 'ScrollbarIndicator'] = bar;
			}

			if (dir == 'h') {
				that.hScrollbarSize = that.hScrollbarWrapper.clientWidth;
				that.hScrollbarIndicatorSize = m.max(m.round(that.hScrollbarSize * that.hScrollbarSize / that.scrollerW), 8);
				that.hScrollbarIndicator.style.width = that.hScrollbarIndicatorSize + 'px';
				that.hScrollbarMaxScroll = that.hScrollbarSize - that.hScrollbarIndicatorSize;
				that.hScrollbarProp = that.hScrollbarMaxScroll / that.maxScrollX;
			} else {
				that.vScrollbarSize = that.vScrollbarWrapper.clientHeight;
				that.vScrollbarIndicatorSize = m.max(m.round(that.vScrollbarSize * that.vScrollbarSize / that.scrollerH), 8);
				that.vScrollbarIndicator.style.height = that.vScrollbarIndicatorSize + 'px';
				that.vScrollbarMaxScroll = that.vScrollbarSize - that.vScrollbarIndicatorSize;
				that.vScrollbarProp = that.vScrollbarMaxScroll / that.maxScrollY;
			}

			// Reset position
			that._scrollbarPos(dir, true);
		},

		_resize: function() {
			var that = this;
			setTimeout(function() {
				that.refresh();
			}, isAndroid ? 200 : 0);
		},

		_pos: function(x, y) {
			if (this.zoomed) return;

			x = this.hScroll ? x : 0;
			y = this.vScroll ? y : 0;

			if (this.options.useTransform) {
				this.scroller.style[transform] = 'translate(' + x + 'px,' + y + 'px) scale(' + this.scale + ')' + translateZ;
			} else {
				x = m.round(x);
				y = m.round(y);
				this.scroller.style.left = x + 'px';
				this.scroller.style.top = y + 'px';
			}

			this.x = x;
			this.y = y;

			this._scrollbarPos('h');
			this._scrollbarPos('v');
		},

		_scrollbarPos: function(dir, hidden) {
			var that = this,
				pos = dir == 'h' ? that.x : that.y,
				size;

			if (!that[dir + 'Scrollbar']) return;

			pos = that[dir + 'ScrollbarProp'] * pos;

			if (pos < 0) {
				if (!that.options.fixedScrollbar) {
					size = that[dir + 'ScrollbarIndicatorSize'] + m.round(pos * 3);
					if (size < 8) size = 8;
					that[dir + 'ScrollbarIndicator'].style[dir == 'h' ? 'width' : 'height'] = size + 'px';
				}
				pos = 0;
			} else if (pos > that[dir + 'ScrollbarMaxScroll']) {
				if (!that.options.fixedScrollbar) {
					size = that[dir + 'ScrollbarIndicatorSize'] - m.round((pos - that[dir + 'ScrollbarMaxScroll']) * 3);
					if (size < 8) size = 8;
					that[dir + 'ScrollbarIndicator'].style[dir == 'h' ? 'width' : 'height'] = size + 'px';
					pos = that[dir + 'ScrollbarMaxScroll'] + (that[dir + 'ScrollbarIndicatorSize'] - size);
				} else {
					pos = that[dir + 'ScrollbarMaxScroll'];
				}
			}

			that[dir + 'ScrollbarWrapper'].style[transitionDelay] = '0';
			that[dir + 'ScrollbarWrapper'].style.opacity = hidden && that.options.hideScrollbar ? '0' : '1';
			that[dir + 'ScrollbarIndicator'].style[transform] = 'translate(' + (dir == 'h' ? pos + 'px,0)' : '0,' + pos + 'px)') + translateZ;
		},

		_start: function(e) {
			var that = this,
				point = hasTouch ? e.touches[0] : e,
				matrix, x, y, c1, c2;

			if (!that.enabled) return;

			if (that.options.onBeforeScrollStart) that.options.onBeforeScrollStart.call(that, e);

			if (that.options.useTransition || that.options.zoom) that._transitionTime(0);

			that.moved = false;
			that.animating = false;
			that.zoomed = false;
			that.distX = 0;
			that.distY = 0;
			that.absDistX = 0;
			that.absDistY = 0;
			that.dirX = 0;
			that.dirY = 0;

			// Gesture start
			if (that.options.zoom && hasTouch && e.touches.length > 1) {
				c1 = m.abs(e.touches[0].pageX - e.touches[1].pageX);
				c2 = m.abs(e.touches[0].pageY - e.touches[1].pageY);
				that.touchesDistStart = m.sqrt(c1 * c1 + c2 * c2);

				that.originX = m.abs(e.touches[0].pageX + e.touches[1].pageX - that.wrapperOffsetLeft * 2) / 2 - that.x;
				that.originY = m.abs(e.touches[0].pageY + e.touches[1].pageY - that.wrapperOffsetTop * 2) / 2 - that.y;

				if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
			}

			if (that.options.momentum) {
				if (that.options.useTransform) {
					// Very lame general purpose alternative to CSSMatrix
					matrix = getComputedStyle(that.scroller, null)[transform].replace(/[^0-9\-.,]/g, '').split(',');
					x = +(matrix[12] || matrix[4]);
					y = +(matrix[13] || matrix[5]);
				} else {
					x = +getComputedStyle(that.scroller, null).left.replace(/[^0-9-]/g, '');
					y = +getComputedStyle(that.scroller, null).top.replace(/[^0-9-]/g, '');
				}

				if (x != that.x || y != that.y) {
					if (that.options.useTransition) that._unbind(TRNEND_EV);
					else cancelFrame(that.aniTime);
					that.steps = [];
					that._pos(x, y);
					if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);
				}
			}

			that.absStartX = that.x; // Needed by snap threshold
			that.absStartY = that.y;

			that.startX = that.x;
			that.startY = that.y;
			that.pointX = point.pageX;
			that.pointY = point.pageY;

			that.startTime = e.timeStamp || Date.now();

			if (that.options.onScrollStart) that.options.onScrollStart.call(that, e);

			that._bind(MOVE_EV, window);
			that._bind(END_EV, window);
			that._bind(CANCEL_EV, window);
		},

		_move: function(e) {
			var that = this,
				point = hasTouch ? e.touches[0] : e,
				deltaX = point.pageX - that.pointX,
				deltaY = point.pageY - that.pointY,
				newX = that.x + deltaX,
				newY = that.y + deltaY,
				c1, c2, scale, timestamp = e.timeStamp || Date.now();

			if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, e);

			// Zoom
			if (that.options.zoom && hasTouch && e.touches.length > 1) {
				c1 = m.abs(e.touches[0].pageX - e.touches[1].pageX);
				c2 = m.abs(e.touches[0].pageY - e.touches[1].pageY);
				that.touchesDist = m.sqrt(c1 * c1 + c2 * c2);

				that.zoomed = true;

				scale = 1 / that.touchesDistStart * that.touchesDist * this.scale;

				if (scale < that.options.zoomMin) scale = 0.5 * that.options.zoomMin * Math.pow(2.0, scale / that.options.zoomMin);
				else if (scale > that.options.zoomMax) scale = 2.0 * that.options.zoomMax * Math.pow(0.5, that.options.zoomMax / scale);

				that.lastScale = scale / this.scale;

				newX = this.originX - this.originX * that.lastScale + this.x, newY = this.originY - this.originY * that.lastScale + this.y;

				this.scroller.style[transform] = 'translate(' + newX + 'px,' + newY + 'px) scale(' + scale + ')' + translateZ;

				if (that.options.onZoom) that.options.onZoom.call(that, e);
				return;
			}

			that.pointX = point.pageX;
			that.pointY = point.pageY;

			// Slow down if outside of the boundaries
			if (newX > 0 || newX < that.maxScrollX) {
				newX = that.options.bounce ? that.x + (deltaX / 2) : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
			}
			if (newY > that.minScrollY || newY < that.maxScrollY) {
				newY = that.options.bounce ? that.y + (deltaY / 2) : newY >= that.minScrollY || that.maxScrollY >= 0 ? that.minScrollY : that.maxScrollY;
			}

			that.distX += deltaX;
			that.distY += deltaY;
			that.absDistX = m.abs(that.distX);
			that.absDistY = m.abs(that.distY);

			if (that.absDistX < 6 && that.absDistY < 6) {
				return;
			}

			// Lock direction
			if (that.options.lockDirection) {
				if (that.absDistX > that.absDistY + 5) {
					newY = that.y;
					deltaY = 0;
				} else if (that.absDistY > that.absDistX + 5) {
					newX = that.x;
					deltaX = 0;
				}
			}

			that.moved = true;
			that._pos(newX, newY);
			that.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
			that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

			if (timestamp - that.startTime > 300) {
				that.startTime = timestamp;
				that.startX = that.x;
				that.startY = that.y;
			}

			if (that.options.onScrollMove) that.options.onScrollMove.call(that, e);
		},

		_end: function(e) {
			if (hasTouch && e.touches.length !== 0) return;

			var that = this,
				point = hasTouch ? e.changedTouches[0] : e,
				target, ev, momentumX = {
					dist: 0,
					time: 0
				},
				momentumY = {
					dist: 0,
					time: 0
				},
				duration = (e.timeStamp || Date.now()) - that.startTime,
				newPosX = that.x,
				newPosY = that.y,
				distX, distY, newDuration, snap, scale;

			that._unbind(MOVE_EV, window);
			that._unbind(END_EV, window);
			that._unbind(CANCEL_EV, window);

			if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, e);

			if (that.zoomed) {
				scale = that.scale * that.lastScale;
				scale = Math.max(that.options.zoomMin, scale);
				scale = Math.min(that.options.zoomMax, scale);
				that.lastScale = scale / that.scale;
				that.scale = scale;

				that.x = that.originX - that.originX * that.lastScale + that.x;
				that.y = that.originY - that.originY * that.lastScale + that.y;

				that.scroller.style[transitionDuration] = '200ms';
				that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px) scale(' + that.scale + ')' + translateZ;

				that.zoomed = false;
				that.refresh();

				if (that.options.onZoomEnd) that.options.onZoomEnd.call(that, e);
				return;
			}

			if (!that.moved) {
				if (hasTouch) {
					if (that.doubleTapTimer && that.options.zoom) {
						// Double tapped
						clearTimeout(that.doubleTapTimer);
						that.doubleTapTimer = null;
						if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
						that.zoom(that.pointX, that.pointY, that.scale == 1 ? that.options.doubleTapZoom : 1);
						if (that.options.onZoomEnd) {
							setTimeout(function() {
								that.options.onZoomEnd.call(that, e);
							}, 200); // 200 is default zoom duration
						}
					} else if (this.options.handleClick) {
						that.doubleTapTimer = setTimeout(function() {
							that.doubleTapTimer = null;

							// Find the last touched element
							target = point.target;
							while (target.nodeType != 1) target = target.parentNode;

							if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
								ev = doc.createEvent('MouseEvents');
								ev.initMouseEvent('click', true, true, e.view, 1, point.screenX, point.screenY, point.clientX, point.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null);
								ev._fake = true;
								target.dispatchEvent(ev);
							}
						}, that.options.zoom ? 250 : 0);
					}
				}

				that._resetPos(400);

				if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
				return;
			}

			if (duration < 300 && that.options.momentum) {
				momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
				momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, (that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y - that.minScrollY : 0), that.options.bounce ? that.wrapperH : 0) : momentumY;

				newPosX = that.x + momentumX.dist;
				newPosY = that.y + momentumY.dist;

				if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = {
					dist: 0,
					time: 0
				};
				if ((that.y > that.minScrollY && newPosY > that.minScrollY) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = {
					dist: 0,
					time: 0
				};
			}

			if (momentumX.dist || momentumY.dist) {
				newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);

				// Do we need to snap?
				if (that.options.snap) {
					distX = newPosX - that.absStartX;
					distY = newPosY - that.absStartY;
					if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) {
						that.scrollTo(that.absStartX, that.absStartY, 200);
					} else {
						snap = that._snap(newPosX, newPosY);
						newPosX = snap.x;
						newPosY = snap.y;
						newDuration = m.max(snap.time, newDuration);
					}
				}

				that.scrollTo(m.round(newPosX), m.round(newPosY), newDuration);

				if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
				return;
			}

			// Do we need to snap?
			if (that.options.snap) {
				distX = newPosX - that.absStartX;
				distY = newPosY - that.absStartY;
				if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) that.scrollTo(that.absStartX, that.absStartY, 200);
				else {
					snap = that._snap(that.x, that.y);
					if (snap.x != that.x || snap.y != that.y) that.scrollTo(snap.x, snap.y, snap.time);
				}

				if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
				return;
			}

			that._resetPos(200);
			if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
		},

		_resetPos: function(time) {
			var that = this,
				resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
				resetY = that.y >= that.minScrollY || that.maxScrollY > 0 ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

			if (resetX == that.x && resetY == that.y) {
				if (that.moved) {
					that.moved = false;
					if (that.options.onScrollEnd) that.options.onScrollEnd.call(that); // Execute custom code on scroll end
				}

				if (that.hScrollbar && that.options.hideScrollbar) {
					if (vendor == 'webkit') that.hScrollbarWrapper.style[transitionDelay] = '300ms';
					that.hScrollbarWrapper.style.opacity = '0';
				}
				if (that.vScrollbar && that.options.hideScrollbar) {
					if (vendor == 'webkit') that.vScrollbarWrapper.style[transitionDelay] = '300ms';
					that.vScrollbarWrapper.style.opacity = '0';
				}

				return;
			}

			that.scrollTo(resetX, resetY, time || 0);
		},

		_wheel: function(e) {
			var that = this,
				wheelDeltaX, wheelDeltaY, deltaX, deltaY, deltaScale;

			if ('wheelDeltaX' in e) {
				wheelDeltaX = e.wheelDeltaX / 12;
				wheelDeltaY = e.wheelDeltaY / 12;
			} else if ('wheelDelta' in e) {
				wheelDeltaX = wheelDeltaY = e.wheelDelta / 12;
			} else if ('detail' in e) {
				wheelDeltaX = wheelDeltaY = -e.detail * 3;
			} else {
				return;
			}

			if (that.options.wheelAction == 'zoom') {
				deltaScale = that.scale * Math.pow(2, 1 / 3 * (wheelDeltaY ? wheelDeltaY / Math.abs(wheelDeltaY) : 0));
				if (deltaScale < that.options.zoomMin) deltaScale = that.options.zoomMin;
				if (deltaScale > that.options.zoomMax) deltaScale = that.options.zoomMax;

				if (deltaScale != that.scale) {
					if (!that.wheelZoomCount && that.options.onZoomStart) that.options.onZoomStart.call(that, e);
					that.wheelZoomCount++;

					that.zoom(e.pageX, e.pageY, deltaScale, 400);

					setTimeout(function() {
						that.wheelZoomCount--;
						if (!that.wheelZoomCount && that.options.onZoomEnd) that.options.onZoomEnd.call(that, e);
					}, 400);
				}

				return;
			}

			deltaX = that.x + wheelDeltaX;
			deltaY = that.y + wheelDeltaY;

			if (deltaX > 0) deltaX = 0;
			else if (deltaX < that.maxScrollX) deltaX = that.maxScrollX;

			if (deltaY > that.minScrollY) deltaY = that.minScrollY;
			else if (deltaY < that.maxScrollY) deltaY = that.maxScrollY;

			if (that.maxScrollY < 0) {
				that.scrollTo(deltaX, deltaY, 0);
			}
		},

		_transitionEnd: function(e) {
			var that = this;

			if (e.target != that.scroller) return;

			that._unbind(TRNEND_EV);

			that._startAni();
		},


		/**
		 *
		 * Utilities
		 *
		 */
		_startAni: function() {
			var that = this,
				startX = that.x,
				startY = that.y,
				startTime = Date.now(),
				step, easeOut, animate;

			if (that.animating) return;

			if (!that.steps.length) {
				that._resetPos(400);
				return;
			}

			step = that.steps.shift();

			if (step.x == startX && step.y == startY) step.time = 0;

			that.animating = true;
			that.moved = true;

			if (that.options.useTransition) {
				that._transitionTime(step.time);
				that._pos(step.x, step.y);
				that.animating = false;
				if (step.time) that._bind(TRNEND_EV);
				else that._resetPos(0);
				return;
			}

			animate = function() {
				var now = Date.now(),
					newX, newY;

				if (now >= startTime + step.time) {
					that._pos(step.x, step.y);
					that.animating = false;
					if (that.options.onAnimationEnd) that.options.onAnimationEnd.call(that); // Execute custom code on animation end
					that._startAni();
					return;
				}

				now = (now - startTime) / step.time - 1;
				easeOut = m.sqrt(1 - now * now);
				newX = (step.x - startX) * easeOut + startX;
				newY = (step.y - startY) * easeOut + startY;
				that._pos(newX, newY);
				if (that.animating) that.aniTime = nextFrame(animate);
			};

			animate();
		},

		_transitionTime: function(time) {
			time += 'ms';
			this.scroller.style[transitionDuration] = time;
			if (this.hScrollbar) this.hScrollbarIndicator.style[transitionDuration] = time;
			if (this.vScrollbar) this.vScrollbarIndicator.style[transitionDuration] = time;
		},

		_momentum: function(dist, time, maxDistUpper, maxDistLower, size) {
			var deceleration = 0.0006,
				speed = m.abs(dist) / time,
				newDist = (speed * speed) / (2 * deceleration),
				newTime = 0,
				outsideDist = 0;

			// Proportinally reduce speed if we are outside of the boundaries
			if (dist > 0 && newDist > maxDistUpper) {
				outsideDist = size / (6 / (newDist / speed * deceleration));
				maxDistUpper = maxDistUpper + outsideDist;
				speed = speed * maxDistUpper / newDist;
				newDist = maxDistUpper;
			} else if (dist < 0 && newDist > maxDistLower) {
				outsideDist = size / (6 / (newDist / speed * deceleration));
				maxDistLower = maxDistLower + outsideDist;
				speed = speed * maxDistLower / newDist;
				newDist = maxDistLower;
			}

			newDist = newDist * (dist < 0 ? -1 : 1);
			newTime = speed / deceleration;

			return {
				dist: newDist,
				time: m.round(newTime)
			};
		},

		_offset: function(el) {
			var left = -el.offsetLeft,
				top = -el.offsetTop;

			while (el = el.offsetParent) {
				left -= el.offsetLeft;
				top -= el.offsetTop;
			}

			if (el != this.wrapper) {
				left *= this.scale;
				top *= this.scale;
			}

			return {
				left: left,
				top: top
			};
		},

		_snap: function(x, y) {
			var that = this,
				i, l, page, time, sizeX, sizeY;

			// Check page X
			page = that.pagesX.length - 1;
			for (i = 0, l = that.pagesX.length; i < l; i++) {
				if (x >= that.pagesX[i]) {
					page = i;
					break;
				}
			}
			if (page == that.currPageX && page > 0 && that.dirX < 0) page--;
			x = that.pagesX[page];
			sizeX = m.abs(x - that.pagesX[that.currPageX]);
			sizeX = sizeX ? m.abs(that.x - x) / sizeX * 500 : 0;
			that.currPageX = page;

			// Check page Y
			page = that.pagesY.length - 1;
			for (i = 0; i < page; i++) {
				if (y >= that.pagesY[i]) {
					page = i;
					break;
				}
			}
			if (page == that.currPageY && page > 0 && that.dirY < 0) page--;
			y = that.pagesY[page];
			sizeY = m.abs(y - that.pagesY[that.currPageY]);
			sizeY = sizeY ? m.abs(that.y - y) / sizeY * 500 : 0;
			that.currPageY = page;

			// Snap with constant speed (proportional duration)
			time = m.round(m.max(sizeX, sizeY)) || 200;

			return {
				x: x,
				y: y,
				time: time
			};
		},

		_bind: function(type, el, bubble) {
			(el || this.scroller).addEventListener(type, this, !! bubble);
		},

		_unbind: function(type, el, bubble) {
			(el || this.scroller).removeEventListener(type, this, !! bubble);
		},


		/**
		 *
		 * Public methods
		 *
		 */
		destroy: function() {
			var that = this;

			that.scroller.style[transform] = '';

			// Remove the scrollbars
			that.hScrollbar = false;
			that.vScrollbar = false;
			that._scrollbar('h');
			that._scrollbar('v');

			// Remove the event listeners
			that._unbind(RESIZE_EV, window);
			that._unbind(START_EV);
			that._unbind(MOVE_EV, window);
			that._unbind(END_EV, window);
			that._unbind(CANCEL_EV, window);

			if (!that.options.hasTouch) {
				that._unbind('DOMMouseScroll');
				that._unbind('mousewheel');
			}

			if (that.options.useTransition) that._unbind(TRNEND_EV);

			if (that.options.checkDOMChanges) clearInterval(that.checkDOMTime);

			if (that.options.onDestroy) that.options.onDestroy.call(that);
		},

		refresh: function() {
			var that = this,
				offset, i, l, els, pos = 0,
				page = 0;

			if (that.scale < that.options.zoomMin) that.scale = that.options.zoomMin;
			that.wrapperW = that.wrapper.clientWidth || 1;
			that.wrapperH = that.wrapper.clientHeight || 1;

			that.minScrollY = -that.options.topOffset || 0;
			that.scrollerW = m.round(that.scroller.offsetWidth * that.scale);
			that.scrollerH = m.round((that.scroller.offsetHeight + that.minScrollY) * that.scale);
			that.maxScrollX = that.wrapperW - that.scrollerW;
			that.maxScrollY = that.wrapperH - that.scrollerH + that.minScrollY;
			that.dirX = 0;
			that.dirY = 0;

			if (that.options.onRefresh) that.options.onRefresh.call(that);

			that.hScroll = that.options.hScroll && that.maxScrollX < 0;
			that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH);

			that.hScrollbar = that.hScroll && that.options.hScrollbar;
			that.vScrollbar = that.vScroll && that.options.vScrollbar && that.scrollerH > that.wrapperH;

			offset = that._offset(that.wrapper);
			that.wrapperOffsetLeft = -offset.left;
			that.wrapperOffsetTop = -offset.top;

			// Prepare snap
			if (typeof that.options.snap == 'string') {
				that.pagesX = [];
				that.pagesY = [];
				els = that.scroller.querySelectorAll(that.options.snap);
				for (i = 0, l = els.length; i < l; i++) {
					pos = that._offset(els[i]);
					pos.left += that.wrapperOffsetLeft;
					pos.top += that.wrapperOffsetTop;
					that.pagesX[i] = pos.left < that.maxScrollX ? that.maxScrollX : pos.left * that.scale;
					that.pagesY[i] = pos.top < that.maxScrollY ? that.maxScrollY : pos.top * that.scale;
				}
			} else if (that.options.snap) {
				that.pagesX = [];
				while (pos >= that.maxScrollX) {
					that.pagesX[page] = pos;
					pos = pos - that.wrapperW;
					page++;
				}
				if (that.maxScrollX % that.wrapperW) that.pagesX[that.pagesX.length] = that.maxScrollX - that.pagesX[that.pagesX.length - 1] + that.pagesX[that.pagesX.length - 1];

				pos = 0;
				page = 0;
				that.pagesY = [];
				while (pos >= that.maxScrollY) {
					that.pagesY[page] = pos;
					pos = pos - that.wrapperH;
					page++;
				}
				if (that.maxScrollY % that.wrapperH) that.pagesY[that.pagesY.length] = that.maxScrollY - that.pagesY[that.pagesY.length - 1] + that.pagesY[that.pagesY.length - 1];
			}

			// Prepare the scrollbars
			that._scrollbar('h');
			that._scrollbar('v');

			if (!that.zoomed) {
				that.scroller.style[transitionDuration] = '0';
				that._resetPos(400);
			}
		},

		scrollTo: function(x, y, time, relative) {
			var that = this,
				step = x,
				i, l;

			that.stop();

			if (!step.length) step = [{
				x: x,
				y: y,
				time: time,
				relative: relative
			}];

			for (i = 0, l = step.length; i < l; i++) {
				if (step[i].relative) {
					step[i].x = that.x - step[i].x;
					step[i].y = that.y - step[i].y;
				}
				that.steps.push({
					x: step[i].x,
					y: step[i].y,
					time: step[i].time || 0
				});
			}

			that._startAni();
		},

		scrollToElement: function(el, time) {
			var that = this,
				pos;
			el = el.nodeType ? el : that.scroller.querySelector(el);
			if (!el) return;

			pos = that._offset(el);
			pos.left += that.wrapperOffsetLeft;
			pos.top += that.wrapperOffsetTop;

			pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
			pos.top = pos.top > that.minScrollY ? that.minScrollY : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
			time = time === undefined ? m.max(m.abs(pos.left) * 2, m.abs(pos.top) * 2) : time;

			that.scrollTo(pos.left, pos.top, time);
		},

		scrollToPage: function(pageX, pageY, time) {
			var that = this,
				x, y;

			time = time === undefined ? 400 : time;

			if (that.options.onScrollStart) that.options.onScrollStart.call(that);

			if (that.options.snap) {
				pageX = pageX == 'next' ? that.currPageX + 1 : pageX == 'prev' ? that.currPageX - 1 : pageX;
				pageY = pageY == 'next' ? that.currPageY + 1 : pageY == 'prev' ? that.currPageY - 1 : pageY;

				pageX = pageX < 0 ? 0 : pageX > that.pagesX.length - 1 ? that.pagesX.length - 1 : pageX;
				pageY = pageY < 0 ? 0 : pageY > that.pagesY.length - 1 ? that.pagesY.length - 1 : pageY;

				that.currPageX = pageX;
				that.currPageY = pageY;
				x = that.pagesX[pageX];
				y = that.pagesY[pageY];
			} else {
				x = -that.wrapperW * pageX;
				y = -that.wrapperH * pageY;
				if (x < that.maxScrollX) x = that.maxScrollX;
				if (y < that.maxScrollY) y = that.maxScrollY;
			}

			that.scrollTo(x, y, time);
		},

		disable: function() {
			this.stop();
			this._resetPos(0);
			this.enabled = false;

			// If disabled after touchstart we make sure that there are no left over events
			this._unbind(MOVE_EV, window);
			this._unbind(END_EV, window);
			this._unbind(CANCEL_EV, window);
		},

		enable: function() {
			this.enabled = true;
		},

		stop: function() {
			if (this.options.useTransition) this._unbind(TRNEND_EV);
			else cancelFrame(this.aniTime);
			this.steps = [];
			this.moved = false;
			this.animating = false;
		},

		zoom: function(x, y, scale, time) {
			var that = this,
				relScale = scale / that.scale;

			if (!that.options.useTransform) return;

			that.zoomed = true;
			time = time === undefined ? 200 : time;
			x = x - that.wrapperOffsetLeft - that.x;
			y = y - that.wrapperOffsetTop - that.y;
			that.x = x - x * relScale + that.x;
			that.y = y - y * relScale + that.y;

			that.scale = scale;
			that.refresh();

			that.x = that.x > 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x;
			that.y = that.y > that.minScrollY ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

			that.scroller.style[transitionDuration] = time + 'ms';
			that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px) scale(' + scale + ')' + translateZ;
			that.zoomed = false;
		},

		isReady: function() {
			return !this.moved && !this.zoomed && !this.animating;
		}
	};

	function prefixStyle(style) {
		if (vendor === '') return style;

		style = style.charAt(0).toUpperCase() + style.substr(1);
		return vendor + style;
	}

	dummyStyle = null; // for the sake of it

	if (typeof exports !== 'undefined') exports.iScroll = iScroll;
	else window.iScroll = iScroll;

})(window, document);
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/scroller/lib/scroller.js', namespace: 'compo.scroller', url: '/.reference/libjs/compos/scroller/lib/scroller.js'});
;include.js('iscroll-full.js').done(function() {
	mask.registerHandler('scroller', Class({
		Base: Compo,
		DOMInsert: function() {
			if (this.scroller == null) {
				this.scroller = new window.iScroll(this.$[0], {
					vScrollbar: true,
					hScrollbar: true
				});
				
			}
		},
		render: function(model, container, cntx) {
			
			this.tagName = 'div';
			this.attr['class'] = (this.attr['class'] ? this.attr['class'] + ' ' : '') + 'scroller';
			this.nodes = {
				tagName: 'div',
				attr: {
					'class': 'scroller-container'
				},
				nodes: this.nodes
			};
			Compo.render(this, model, container, cntx);
			Compo.shots.on(this, 'DOMInsert', this.DOMInsert);
			return this;
		},
		dispose: function() {
			if (this.scroller) {
				this.scroller.destroy();
			}
		}
	}));
});
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/prism/lib/prism.lib.js', namespace: '', url: '/.reference/libjs/compos/prism/lib/prism.lib.js'});
;(function(){var i=/\blang(?:uage)?-(?!\*)(\w+)\b/i,g=self.Prism={languages:{insertBefore:function(a,b,d,c){var c=c||g.languages,f=c[a],e={},h;for(h in f)if(f.hasOwnProperty(h)){if(h==b)for(var i in d)d.hasOwnProperty(i)&&(e[i]=d[i]);e[h]=f[h]}return c[a]=e},DFS:function(a,b){for(var d in a)b.call(a,d,a[d]),"[object Object]"===Object.prototype.toString.call(a)&&g.languages.DFS(a[d],b)}},highlightAll:function(a,b){for(var d=document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'),
c=0,f;f=d[c++];)g.highlightElement(f,!0===a,b)},highlightElement:function(a,b,d){for(var c,f,e=a;e&&!i.test(e.className);)e=e.parentNode;e&&(c=(e.className.match(i)||[,""])[1],f=g.languages[c]);if(f&&(a.className=a.className.replace(i,"").replace(/\s+/g," ")+" language-"+c,e=a.parentNode,/pre/i.test(e.nodeName)&&(e.className=e.className.replace(i,"").replace(/\s+/g," ")+" language-"+c),e=a.textContent.trim())){var e=e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\u00a0/g,
" "),h={element:a,language:c,grammar:f,code:e};g.hooks.run("before-highlight",h);b&&self.Worker?(a=new Worker(g.filename),a.onmessage=function(a){h.highlightedCode=k.stringify(JSON.parse(a.data));h.element.innerHTML=h.highlightedCode;d&&d.call(h.element);g.hooks.run("after-highlight",h)},a.postMessage(JSON.stringify({language:h.language,code:h.code}))):(h.highlightedCode=g.highlight(h.code,h.grammar),h.element.innerHTML=h.highlightedCode,d&&d.call(a),g.hooks.run("after-highlight",h))}},highlight:function(a,
b){return k.stringify(g.tokenize(a,b))},tokenize:function(a,b){var d=g.Token,c=[a],f=b.rest;if(f){for(var e in f)b[e]=f[e];delete b.rest}a:for(e in b)if(b.hasOwnProperty(e)&&b[e])for(var f=b[e],h=f.inside,i=!!f.lookbehind||0,f=f.pattern||f,k=0;k<c.length;k++){var j=c[k];if(c.length>a.length)break a;if(!(j instanceof d)){f.lastIndex=0;var l=f.exec(j);if(l){i&&(i=l[1].length);var n=l.index-1+i,l=l[0].slice(i),m=n+l.length,n=j.slice(0,n+1),j=j.slice(m+1),m=[k,1];n&&m.push(n);l=new d(e,h?g.tokenize(l,
h):l);m.push(l);j&&m.push(j);Array.prototype.splice.apply(c,m)}}}return c},hooks:{all:{},add:function(a,b){var d=g.hooks.all;d[a]=d[a]||[];d[a].push(b)},run:function(a,b){var d=g.hooks.all[a];if(d&&d.length)for(var c=0,f;f=d[c++];)f(b)}}},k=g.Token=function(a,b){this.type=a;this.content=b};k.stringify=function(a){if("string"==typeof a)return a;if("[object Array]"==Object.prototype.toString.call(a)){for(var b=0;b<a.length;b++)a[b]=k.stringify(a[b]);return a.join("")}a={type:a.type,content:k.stringify(a.content),
tag:"span",classes:["token",a.type],attributes:{}};"comment"==a.type&&(a.attributes.spellcheck="true");g.hooks.run("wrap",a);var d="";for(b in a.attributes)d+=b+'="'+(a.attributes[b]||"")+'"';return"<"+a.tag+' class="'+a.classes.join(" ")+'" '+d+">"+a.content+"</"+a.tag+">"};if(self.document){var j=document.getElementsByTagName("script");if(j=j[j.length-1])g.filename=j.src,document.addEventListener&&!j.hasAttribute("data-manual")&&document.addEventListener("DOMContentLoaded",g.highlightAll)}else self.addEventListener("message",
function(a){a=JSON.parse(a.data);self.postMessage(JSON.stringify(g.tokenize(a.code,g.languages[a.language])));self.close()},!1)})();
Prism.languages.markup={comment:/&lt;!--[\w\W]*?--(&gt;|&gt;)/g,prolog:/&lt;\?.+?\?&gt;/,doctype:/&lt;!DOCTYPE.+?&gt;/,cdata:/&lt;!\[CDATA\[[\w\W]+?]]&gt;/i,tag:{pattern:/&lt;\/?[\w:-]+\s*[\w\W]*?&gt;/gi,inside:{tag:{pattern:/^&lt;\/?[\w:-]+/i,inside:{punctuation:/^&lt;\/?/,namespace:/^[\w-]+?:/}},"attr-value":{pattern:/=(('|")[\w\W]*?(\2)|[^\s>]+)/gi,inside:{punctuation:/=/g}},punctuation:/\/?&gt;/g,"attr-name":{pattern:/[\w:-]+/g,inside:{namespace:/^[\w-]+?:/}}}},entity:/&amp;#?[\da-z]{1,8};/gi};
Prism.hooks.add("wrap",function(i){"entity"===i.type&&(i.attributes.title=i.content.replace(/&amp;/,"&"))});Prism.languages.css={comment:/\/\*[\w\W]*?\*\//g,atrule:/@[\w-]+?(\s+[^;{]+)?(?=\s*{|\s*;)/gi,url:/url\((["']?).*?\1\)/gi,selector:/[^\{\}\s][^\{\}]*(?=\s*\{)/g,property:/(\b|\B)[a-z-]+(?=\s*:)/ig,string:/("|')(\\?.)*?\1/g,important:/\B!important\b/gi,ignore:/&(lt|gt|amp);/gi,punctuation:/[\{\};:]/g};
Prism.languages.markup&&Prism.languages.insertBefore("markup","tag",{style:{pattern:/(&lt;|<)style[\w\W]*?(>|&gt;)[\w\W]*?(&lt;|<)\/style(>|&gt;)/ig,inside:{tag:{pattern:/(&lt;|<)style[\w\W]*?(>|&gt;)|(&lt;|<)\/style(>|&gt;)/ig,inside:Prism.languages.markup.tag.inside},rest:Prism.languages.css}}});
Prism.languages.javascript={comment:{pattern:/(^|[^\\])(\/\*[\w\W]*?\*\/|\/\/.*?(\r?\n|$))/g,lookbehind:!0},string:/("|')(\\?.)*?\1/g,regex:{pattern:/(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/g,lookbehind:!0},keyword:/\b(var|let|if|else|while|do|for|return|in|instanceof|function|new|with|typeof|try|catch|finally|null|break|continue)\b/g,"boolean":/\b(true|false)\b/g,number:/\b-?(0x)?\d*\.?\d+\b/g,operator:/[-+]{1,2}|!|=?&lt;|=?&gt;|={1,2}|(&amp;){1,2}|\|?\||\?|\*|\//g,
ignore:/&(lt|gt|amp);/gi,punctuation:/[{}[\];(),.:]/g};Prism.languages.markup&&Prism.languages.insertBefore("markup","tag",{script:{pattern:/(&lt;|<)script[\w\W]*?(>|&gt;)[\w\W]*?(&lt;|<)\/script(>|&gt;)/ig,inside:{tag:{pattern:/(&lt;|<)script[\w\W]*?(>|&gt;)|(&lt;|<)\/script(>|&gt;)/ig,inside:Prism.languages.markup.tag.inside},rest:Prism.languages.javascript}}});
Prism.languages.java={comment:{pattern:/(^|[^\\])(\/\*[\w\W]*?\*\/|\/\/.*?(\r?\n|$))/g,lookbehind:!0},string:/("|')(\\?.)*?\1/g,keyword:/\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\b/g,"boolean":/\b(true|false)\b/g,
number:/\b0b[01]+\b|\b0x[\da-f]*\.?[\da-fp\-]+\b|\b\d*\.?\d+[e]?[\d]*[df]\b|\W\d*\.?\d+\b/gi,operator:{pattern:/([^\.]|^)([-+]{1,2}|!|=?&lt;|=?&gt;|={1,2}|(&amp;){1,2}|\|?\||\?|\*|\/|%|\^|(&lt;){2}|($gt;){2,3}|:|~)/g,lookbehind:!0},ignore:/&(lt|gt|amp);/gi,punctuation:/[{}[\];(),.:]/g};
(function(){if(window.Prism){var i=/\b([a-z]{3,7}:\/\/|tel:)[\w-+%~/.]+/,g=/\b\S+@[\w.]+[a-z]{2}/,k=/\[([^\]]+)]\(([^)]+)\)/,j=["comment","url","attr-value","string"],a;for(a in Prism.languages){var b=Prism.languages[a];Prism.languages.DFS(b,function(a,c){-1<j.indexOf(a)&&(c.pattern||(c=this[a]={pattern:c}),c.inside=c.inside||{},"comment"==a&&(c.inside["md-link"]=k),c.inside["url-link"]=i,c.inside["email-link"]=g)});b["url-link"]=i;b["email-link"]=g}Prism.hooks.add("wrap",function(a){if(/-link$/.test(a.type)){a.tag=
"a";var c=a.content;if("email-link"==a.type)c="mailto:"+c;else if("md-link"==a.type){var b=a.content.match(k),c=b[2];a.content=b[1]}b="href";0==c.indexOf("name=")&&(b="name",c=c.substring(5));a.attributes[b]=c}})}})();
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/prism/lib/prism.js', namespace: 'compo.prism', url: '/.reference/libjs/compos/prism/lib/prism.js'});
;include.js('prism.lib.js').css('prism.lib.css').done(function() {
    
    function IDeferred(){}    
    IDeferred.prototype = {
        resolve: function(){
            this.done = function(fn){
                fn();
            };
            if (this.callbacks){
                for(var i = 0, length = this.callbacks.length; i<length; i++){
                    this.callbacks[i]();
                }
            }
            delete this.callbacks;
        },
        done: function(fn){
            (this.callbacks || (this.callbacks = [])).push(fn);
        }
    };
    
    
    function highlight(compo){
        window.Prism.highlightElement(compo.$.find('code').get(0));
        
        compo.resolve();
    }
    
    mask.registerHandler('prism', Class({
        Base: Compo,
        Extends: IDeferred,
        Construct: function() {
            this.attr = { language: 'javascript' };            
        },
        render: function(values, container, cntx) {
            this.tagName = 'pre';
            
            var _class = 'language-' + this.attr.language;            
            this.attr.class = _class + ' ' + (this.attr.class || '');            
            this.nodes = {
                tagName: 'code',
                attr: {
                    class: _class
                },
                nodes: this.nodes
            };
            
            Compo.prototype.render.call(this, values, container, cntx);

            if (this.attr.src != null) {
                var _this = this;
                window.include.ajax(this.attr.src + '::Data').done(function(r) {
                    _this.$.find('code').text(r.ajax.Data);                    
                    
                    highlight(_this);                    
                });
            }else {
                highlight(this);
            }
        }
    }));
});
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/datePicker/lib/js/glDatePicker.min.js', namespace: '', url: '/.reference/libjs/compos/datePicker/lib/js/glDatePicker.min.js'});
;/*
	glDatePicker v1.3 - http://code.gautamlad.com/glDatePicker/
	Compiled using Google Closure Compiler - http://closure-compiler.appspot.com/home
*/
(function(c){var r={calId:0,cssName:"default",startDate:-1,endDate:-1,selectedDate:-1,showPrevNext:!0,allowOld:!0,showAlways:!1,position:"absolute"},j={init:function(a){return this.each(function(){var b=c(this),e=c.extend({},r);e.calId=b[0].id+"-gldp";a&&(e=c.extend(e,a));b.data("settings",e);b.click(j.show).focus(j.show);e.showAlways&&setTimeout(function(){b.trigger("focus")},50);c(document).bind("click",function(){j.hide.apply(b)})})},show:function(a){a.stopPropagation();j.hide.apply(c("._gldp").not(c(this)));
j.update.apply(c(this))},hide:function(){if(c(this).length){var a=c(this).data("settings");a.showAlways||(c("#"+a.calId).slideUp(200),c(this).removeClass("_gldp"))}},setStartDate:function(a){c(this).data("settings").startDate=a},setEndDate:function(a){c(this).data("settings").endDate=a},setSelectedDate:function(a){c(this).data("settings").selectedDate=a},update:function(){var a=c(this),b=a.data("settings"),e=b.calId,d=b.startDate;-1==b.startDate&&(d=new Date,d.setDate(1));d.setHours(0,0,0,0);var k=
d.getTime(),f=new Date(0);-1!=b.endDate&&(f=new Date(b.endDate),/^\d+$/.test(b.endDate)&&(f=new Date(d),f.setDate(f.getDate()+b.endDate)));f.setHours(0,0,0,0);var f=f.getTime(),h=new Date(0);-1!=b.selectedDate&&(h=new Date(b.selectedDate),/^\d+$/.test(b.selectedDate)&&(h=new Date(d),h.setDate(h.getDate()+b.selectedDate)));h.setHours(0,0,0,0);var h=h.getTime(),i=a.data("theDate"),i=-1==i||"undefined"==typeof i?d:i,m=new Date(i);m.setDate(1);var r=m.getTime(),d=new Date(m);d.setMonth(d.getMonth()+1);
d.setDate(0);var w=d.getTime(),t=d.getDate(),n=new Date(m);n.setDate(0);n=n.getDate();a.data("theDate",i);for(var d="",u=0,v=0;6>u;u++){for(var s="",q=0;7>q;q++,v++){var o=n-m.getDay()+v+1,p=o-n,g=0==q?"sun":6==q?"sat":"day";if(1<=p&&p<=t){o=new Date;o.setHours(0,0,0,0);var l=new Date(i);l.setHours(0,0,0,0);l.setDate(p);l=l.getTime();g=o.getTime()==l?"today":g;b.allowOld||(g=l<k?"noday":g);-1!=b.endDate&&(g=l>f?"noday":g);-1!=b.selectedDate&&(g=l==h?"selected":g)}else g="noday",p=0>=p?o:o-t-n;s+=
"<td class='gldp-days "+g+" **-"+g+"'><div class='"+g+"'>"+p+"</div></td>"}d+="<tr class='days'>"+s+"</tr>"}h=k<r||b.allowOld;k=w<f||f<k;b.showPrevNext||(h=k=!1);f="January,February,March,April,May,June,July,August,September,October,November,December".split(",")[i.getMonth()]+" "+i.getFullYear();k=("<div class='**'><table><tr>"+("<td class='**-prevnext prev'>"+(h?"\u25c4":"")+"</td>")+"<td class='**-monyear' colspan='5'>{MY}</td>"+("<td class='**-prevnext next'>"+(k?"\u25ba":"")+"</td>")+"</tr><tr class='**-dow'><td>Sun</td><td>Mon</td><td>Tue</td><td>Wed</td><td>Thu</td><td>Fri</td><td>Sat</td></tr>"+
d+"</table></div>").replace(/\*{2}/gi,"gldp-"+b.cssName).replace(/\{MY\}/gi,f);0==c("#"+e).length&&a.after(c("<div id='"+e+"'></div>").css({position:b.position,"z-index":b.zIndex,left:a.offset().left,top:a.offset().top+a.outerHeight(!0)}));e=c("#"+e);e.html(k).slideDown(200);a.addClass("_gldp");c("[class*=-prevnext]",e).click(function(b){b.stopPropagation();if(""!=c(this).html()){var b=c(this).hasClass("prev")?-1:1,d=new Date(m);d.setMonth(i.getMonth()+b);a.data("theDate",d);j.update.apply(a)}});
c("tr.days td:not(.noday, .selected)",e).mouseenter(function(){var a="gldp-"+b.cssName+"-"+c(this).children("div").attr("class");c(this).removeClass(a).addClass(a+"-hover")}).mouseleave(function(){if(!c(this).hasClass("selected")){var a="gldp-"+b.cssName+"-"+c(this).children("div").attr("class");c(this).removeClass(a+"-hover").addClass(a)}}).click(function(b){b.stopPropagation();var b=c(this).children("div").html(),d=a.data("settings"),e=new Date(i);e.setDate(b);a.data("theDate",e);a.val(e.getMonth()+
1+"/"+e.getDate()+"/"+e.getFullYear());if(null!=d.onChange&&"undefined"!=typeof d.onChange)d.onChange(a,e);d.selectedDate=e;j.hide.apply(a)})}};c.fn.glDatePicker=function(a){if(j[a])return j[a].apply(this,Array.prototype.slice.call(arguments,1));if("object"===typeof a||!a)return j.init.apply(this,arguments);c.error("Method "+a+" does not exist on jQuery.glDatePicker")}})(jQuery);
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/datePicker/lib/datePicker.js', namespace: 'compo.datePicker', url: '/.reference/libjs/compos/datePicker/lib/datePicker.js'});
;include.js('js/glDatePicker.min.js').css('css/android.css').done(function() {

	mask.registerHandler('datePicker', Class({
		Base: Compo,
		render: function(values, container, cntx) {
			this.tagName = 'div';
			Compo.render(this, values, container, cntx);
			
			
			this.$.glDatePicker({
				cssName: 'android',
				allowOld: false,
				showAlways: true,
				position: 'static',
				selectedDate: this.date,
				onChange: function(sender, date){
					this.setDate(date);
					this.$.trigger('change', date);
				}.bind(this)
			});
		},
		setDate: function(date){
			this.date = date;
			if (this.$ != null){
				this.$.glDatePicker('setSelectedDate',date);
				this.$.glDatePicker('update');
			}
        },
		getDate: function(date){
			return this.date;
		}
	}));
});
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/timePicker/lib/js/mobiscroll.js', namespace: '', url: '/.reference/libjs/compos/timePicker/lib/js/mobiscroll.js'});
;(function(b){function x(a,c){function l(a){return b.isArray(f.readonly)?(a=b(".dwwl",r).index(a),f.readonly[a]):f.readonly}function o(a){var b="",c=f.height,o;for(o in E[a])b+='<li class="dw-v" data-val="'+o+'" style="height:'+c+"px;line-height:"+c+'px;">'+E[a][o]+"</li>";return b}function A(){var a=document.body,b=document.documentElement;return Math.max(a.scrollHeight,a.offsetHeight,b.clientHeight,b.scrollHeight,b.offsetHeight)}function G(a){h=b("li.dw-v",a).eq(0).index();d=b("li.dw-v",a).eq(-1).index();
t=b("ul",r).index(a);e=f.height;m=g}function v(a){var b=f.headerText;return b?"function"==typeof b?b.call(C,a):b.replace(/{value}/i,a):""}function P(){g.temp=K&&null!==g.val&&g.val!=a.val()||null===g.values?f.parseValue(a.val()?a.val():"",g):g.values.slice(0);g.setValue(!0)}function B(a,c,o,d,A){f.validate.call(C,r,o,a);b(".dww ul",r).each(function(f){var d=b(this),e=b('li[data-val="'+g.temp[f]+'"]',d),d=e.index();if(!e.hasClass("dw-v")){for(var j=e,h=0,k=0;j.prev().length&&!j.hasClass("dw-v");)j=
j.prev(),h++;for(;e.next().length&&!e.hasClass("dw-v");)e=e.next(),k++;(k<h&&k&&1==!A||!h||!j.hasClass("dw-v")||1==A)&&e.hasClass("dw-v")?d+=k:(e=j,d-=h);g.temp[f]=e.attr("data-val")}e=f==o||void 0===o;g.scroll(b(this),d,e?a:0.2,c,f)});g.change(d)}function x(){function c(){b(".dwc",r).each(function(){k=b(this).outerWidth(!0);d+=k;o=k>o?k:o});k=d>e?o:d;k=b(".dwwr",r).width(k+1).outerWidth();m=h.outerHeight()}if("inline"!=f.display){var d=0,o=0,e=b(window).width(),g=window.innerHeight,j=b(window).scrollTop(),
h=b(".dw",r),k,i,l,m,n,s={},u,w=void 0===f.anchor?a:f.anchor,g=g?g:b(window).height();if("modal"==f.display)c(),l=(e-k)/2,i=j+(g-m)/2;else if("bubble"==f.display){c();var p=w.offset(),q=b(".dw-arr",r),v=b(".dw-arrw-i",r),G=h.outerWidth();n=w.outerWidth();l=p.left-(h.outerWidth(!0)-n)/2;l=l>e-G?e-(G+20):l;l=0<=l?l:20;i=p.top-(h.outerHeight()+3);i<j||p.top>j+g?(h.removeClass("dw-bubble-top").addClass("dw-bubble-bottom"),i=p.top+w.outerHeight()+3,u=i+h.outerHeight(!0)>j+g||p.top>j+g):h.removeClass("dw-bubble-bottom").addClass("dw-bubble-top");
i=i>=j?i:j;j=p.left+n/2-(l+(G-v.outerWidth())/2);j>v.outerWidth()&&(j=v.outerWidth());q.css({left:j})}else s.width="100%","top"==f.display?i=j:"bottom"==f.display&&(i=j+g-h.outerHeight(),i=0<=i?i:0);s.top=i;s.left=l;h.css(s);b(".dwo, .dw-persp").height(0).height(A());u&&b(window).scrollTop(i+h.outerHeight(!0)-g)}}function T(a){var b=+a.data("pos")+1;n(a,b>d?h:b,1)}function U(a){var b=+a.data("pos")-1;n(a,b<h?d:b,2)}var g=this,C=a,a=b(C),O,Q,f=b.extend({},F),R,r,E=[],N={},K=a.is("input"),L=!1;g.enable=
function(){f.disabled=!1;K&&a.prop("disabled",!1)};g.disable=function(){f.disabled=!0;K&&a.prop("disabled",!0)};g.scroll=function(a,b,c,d,o){var e=(R-b)*f.height;a.attr("style",(c?J+"-transition:all "+c.toFixed(1)+"s ease-out;":"")+(M?J+"-transform:translate3d(0,"+e+"px,0);":"top:"+e+"px;"));clearInterval(N[o]);if(c&&void 0!==d){var g=0;N[o]=setInterval(function(){g+=0.1;a.data("pos",Math.round((b-d)*Math.sin(g/c*(Math.PI/2))+d));g>=c&&(clearInterval(N[o]),a.data("pos",b).closest(".dwwl").removeClass("dwa"))},
100)}else a.data("pos",b)};g.setValue=function(b,c,d,o){o||(g.values=g.temp.slice(0));L&&b&&B(d);c&&(b=f.formatResult(g.temp),g.val=b,K&&a.val(b).trigger("change"))};g.validate=function(a,b,c,d){B(a,b,c,!0,d)};g.change=function(a){var c=f.formatResult(g.temp);"inline"==f.display?g.setValue(!1,a):b(".dwv",r).html(v(c));a&&f.onChange.call(C,c,g)};g.hide=function(c){if(!1===f.onClose.call(C,g.val,g))return!1;b(".dwtd").prop("disabled",!1).removeClass("dwtd");a.blur();r&&("inline"!=f.display&&f.animate&&
!c?(b(".dw",r).addClass(f.animate+" out"),setTimeout(function(){r.remove()},350)):r.remove(),L=!1,b(window).unbind(".dw"))};g.changeWheel=function(a){if(r){var c=0,d;for(d in f.wheels)for(var e in f.wheels[d]){if(a==c){E[a]=f.wheels[d][e];b("ul",r).eq(a).html(o(a));x();B();return}c++}}};g.show=function(c){if(f.disabled||L)return!1;"top"==f.display&&(f.animate="slidedown");"bottom"==f.display&&(f.animate="slideup");P();f.onBeforeShow.call(C,r,g);var d=0,e=f.height,A="",h="",k="";f.animate&&!c&&(h=
'<div class="dw-persp">',k="</div>",A=f.animate+" in");c='<div class="'+f.theme+" dw-"+f.display+'">'+("inline"==f.display?'<div class="dw dwbg dwi"><div class="dwwr">':h+'<div class="dwo"></div><div class="dw dwbg '+A+'"><div class="dw-arrw"><div class="dw-arrw-i"><div class="dw-arr"></div></div></div><div class="dwwr">'+(f.headerText?'<div class="dwv"></div>':""));for(A=0;A<f.wheels.length;A++){var c=c+('<div class="dwc'+("scroller"!=f.mode?" dwpm":" dwsc")+(f.showLabel?"":" dwhl")+'"><div class="dwwc dwrc"><table cellpadding="0" cellspacing="0"><tr>'),
m;for(m in f.wheels[A])E[d]=f.wheels[A][m],c+='<td><div class="dwwl dwrc dwwl'+d+'">'+("scroller"!=f.mode?'<div class="dwwb dwwbp" style="height:'+e+"px;line-height:"+e+'px;"><span>+</span></div><div class="dwwb dwwbm" style="height:'+e+"px;line-height:"+e+'px;"><span>&ndash;</span></div>':"")+'<div class="dwl">'+m+'</div><div class="dww dwrc" style="height:'+f.rows*e+"px;min-width:"+f.width+'px;"><ul>',c+=o(d),c+='</ul><div class="dwwo"></div></div><div class="dwwol"></div></div></td>',d++;c+="</tr></table></div></div>"}c+=
("inline"!=f.display?'<div class="dwbc'+(f.button3?" dwbc-p":"")+'"><span class="dwbw dwb-s"><span class="dwb">'+f.setText+"</span></span>"+(f.button3?'<span class="dwbw dwb-n"><span class="dwb">'+f.button3Text+"</span></span>":"")+'<span class="dwbw dwb-c"><span class="dwb">'+f.cancelText+"</span></span></div>"+k:'<div class="dwcc"></div>')+"</div></div></div>";r=b(c);B();"inline"!=f.display?r.appendTo("body"):a.is("div")?a.html(r):r.insertAfter(a);L=!0;"inline"!=f.display&&(b(".dwb-s span",r).click(function(){g.setValue(false,
true);g.hide();f.onSelect.call(C,g.val,g);return false}),b(".dwb-c span",r).click(function(){g.hide();f.onCancel.call(C,g.val,g);return false}),f.button3&&b(".dwb-n span",r).click(f.button3),f.scrollLock&&r.bind("touchmove",function(a){a.preventDefault()}),b("input,select").each(function(){b(this).prop("disabled")||b(this).addClass("dwtd")}),b("input,select").prop("disabled",!0),x(),b(window).bind("resize.dw",x));r.delegate(".dwwl","DOMMouseScroll mousewheel",function(a){if(!l(this)){a.preventDefault();
var a=a.originalEvent,a=a.wheelDelta?a.wheelDelta/120:a.detail?-a.detail/3:0,c=b("ul",this),d=+c.data("pos"),d=Math.round(d-a);G(c);n(c,d,a<0?1:2)}}).delegate(".dwb, .dwwb",H,function(){b(this).addClass("dwb-a")}).delegate(".dwwb",H,function(a){var c=b(this).closest(".dwwl");if(!l(c)&&!c.hasClass("dwa")){a.preventDefault();a.stopPropagation();var d=c.find("ul"),o=b(this).hasClass("dwwbp")?T:U;u=true;G(d);clearInterval(i);i=setInterval(function(){o(d)},f.delay);o(d)}}).delegate(".dwwl",H,function(a){a.preventDefault();
if(!l(this)&&!u&&f.mode!="clickpick"){j=true;w=b("ul",this);w.closest(".dwwl").addClass("dwa");s=+w.data("pos");G(w);clearInterval(N[t]);I=p(a);z=new Date;y=I;g.scroll(w,s)}});f.onShow.call(C,r,g);O.init(r,g)};g.init=function(d){O=b.extend({defaults:{},init:q},b.scroller.themes[d.theme?d.theme:f.theme]);Q=b.scroller.i18n[d.lang?d.lang:f.lang];b.extend(f,O.defaults,Q,c,d);g.settings=f;R=Math.floor(f.rows/2);var o=b.scroller.presets[f.preset];a.unbind(".dw");o&&(o=o.call(C,g),b.extend(f,o,c,d),b.extend(D,
o.methods));void 0!==a.data("dwro")&&(C.readOnly=k(a.data("dwro")));L&&g.hide();"inline"==f.display?g.show():(P(),K&&f.showOnFocus&&(a.data("dwro",C.readOnly),C.readOnly=!0,a.bind("focus.dw",function(){g.show()})))};g.values=null;g.val=null;g.temp=null;g.init(c)}function E(a){for(var c in a)if(void 0!==B[a[c]])return!0;return!1}function p(a){return a.changedTouches||a.originalEvent&&a.originalEvent.changedTouches?a.originalEvent?a.originalEvent.changedTouches[0].pageY:a.changedTouches[0].pageY:a.pageY}
function k(a){return!0===a||"true"==a}function n(a,c,e,o,A){c=c>d?d:c;c=c<h?h:c;a=b("li",a).eq(c);m.temp[t]=a.attr("data-val");m.validate(o?c==A?0.1:Math.abs(0.1*(c-A)):0,A,t,e)}var l={},i,q=function(){},e,h,d,m,v=(new Date).getTime(),j,u,w,t,I,y,z,s,B=document.createElement("modernizr").style,M=E(["perspectiveProperty","WebkitPerspective","MozPerspective","OPerspective","msPerspective"])&&"webkitPerspective"in document.documentElement.style,J=function(){var a=["Webkit","Moz","O","ms"],c;for(c in a)if(E([a[c]+
"Transform"]))return"-"+a[c].toLowerCase();return""}(),H="touchstart mousedown",F={width:70,height:40,rows:3,delay:300,disabled:!1,readonly:!1,showOnFocus:!0,showLabel:!0,wheels:[],theme:"",headerText:"{value}",display:"modal",mode:"scroller",preset:"",lang:"en-US",setText:"Set",cancelText:"Cancel",scrollLock:!0,onBeforeShow:q,onShow:q,onClose:q,onSelect:q,onCancel:q,onChange:q,formatResult:function(a){for(var c="",b=0;b<a.length;b++)c+=(0<b?" ":"")+a[b];return c},parseValue:function(a,c){for(var b=
c.settings.wheels,a=a.split(" "),d=[],e=0,j=0;j<b.length;j++)for(var h in b[j]){if(void 0!==b[j][h][a[e]])d.push(a[e]);else for(var k in b[j][h]){d.push(k);break}e++}return d},validate:q},D={init:function(a){void 0===a&&(a={});return this.each(function(){this.id||(v+=1,this.id="scoller"+v);l[this.id]=new x(this,a)})},enable:function(){return this.each(function(){var a=l[this.id];a&&a.enable()})},disable:function(){return this.each(function(){var a=l[this.id];a&&a.disable()})},isDisabled:function(){var a=
l[this[0].id];if(a)return a.settings.disabled},option:function(a,b){return this.each(function(){var d=l[this.id];if(d){var o={};"object"===typeof a?o=a:o[a]=b;d.init(o)}})},setValue:function(a,b,d,o){return this.each(function(){var e=l[this.id];e&&(e.temp=a,e.setValue(!0,b,d,o))})},getInst:function(){return l[this[0].id]},getValue:function(){var a=l[this[0].id];if(a)return a.values},show:function(){var a=l[this[0].id];if(a)return a.show()},hide:function(){return this.each(function(){var a=l[this.id];
a&&a.hide()})},destroy:function(){return this.each(function(){var a=l[this.id];a&&(a.hide(),b(this).unbind(".dw"),delete l[this.id],b(this).is("input")&&(this.readOnly=k(b(this).data("dwro"))))})}};b(document).bind("touchmove mousemove",function(a){j&&(a.preventDefault(),y=p(a),a=s+(I-y)/e,a=a>d+1?d+1:a,a=a<h-1?h-1:a,m.scroll(w,a))});b(document).bind("touchend mouseup",function(a){if(j){a.preventDefault();var c=new Date-z,a=s+(I-y)/e,a=a>d+1?d+1:a,a=a<h-1?h-1:a;300>c?(c=(y-I)/c,c=c*c/0.0012,0>y-I&&
(c=-c)):c=y-I;n(w,Math.round(s-c/e),0,!0,Math.round(a));j=!1;w=null}u&&(clearInterval(i),u=!1);b(".dwb-a").removeClass("dwb-a")});b.fn.scroller=function(a){if(D[a])return D[a].apply(this,Array.prototype.slice.call(arguments,1));if("object"===typeof a||!a)return D.init.apply(this,arguments);b.error("Unknown method")};b.scroller={setDefaults:function(a){b.extend(F,a)},presets:{},themes:{},i18n:{}}})(jQuery);(function(b){var x=new Date,E={dateFormat:"mm/dd/yy",dateOrder:"mmddy",timeWheels:"hhiiA",timeFormat:"hh:ii A",startYear:x.getFullYear()-100,endYear:x.getFullYear()+1,monthNames:"January,February,March,April,May,June,July,August,September,October,November,December".split(","),monthNamesShort:"Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),dayNames:"Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),dayNamesShort:"Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(","),shortYearCutoff:"+10",
monthText:"Month",dayText:"Day",yearText:"Year",hourText:"Hours",minuteText:"Minutes",secText:"Seconds",ampmText:"&nbsp;",nowText:"Now",showNow:!1,stepHour:1,stepMinute:1,stepSecond:1,separator:" "},x=function(p){function k(a,b,c){return void 0!==j[b]?+a[j[b]]:void 0!==c?c:B[u[b]]?B[u[b]]():u[b](B)}function n(a,b){return Math.floor(a/b)*b}function l(a){var b=k(a,"h",0);return new Date(k(a,"y"),k(a,"m"),k(a,"d",1),k(a,"ap")?b+12:b,k(a,"i",0),k(a,"s",0))}var i=b(this),q={},e;if(i.is("input")){switch(i.attr("type")){case "date":e=
"yy-mm-dd";break;case "datetime":e="yy-mm-ddTHH:ii:ssZ";break;case "datetime-local":e="yy-mm-ddTHH:ii:ss";break;case "month":e="yy-mm";q.dateOrder="mmyy";break;case "time":e="HH:ii:ss"}var h=i.attr("min"),i=i.attr("max");h&&(q.minDate=b.scroller.parseDate(e,h));i&&(q.maxDate=b.scroller.parseDate(e,i))}var d=b.extend({},E,q,p.settings),m=0,q=[],v=[],j={},u={y:"getFullYear",m:"getMonth",d:"getDate",h:function(a){a=a.getHours();a=z&&12<=a?a-12:a;return n(a,M)},i:function(a){return n(a.getMinutes(),J)},
s:function(a){return n(a.getSeconds(),H)},ap:function(a){return y&&11<a.getHours()?1:0}},i=d.preset,w=d.dateOrder,t=d.timeWheels,x=w.match(/D/),y=t.match(/a/i),z=t.match(/h/),s="datetime"==i?d.dateFormat+d.separator+d.timeFormat:"time"==i?d.timeFormat:d.dateFormat,B=new Date,M=d.stepHour,J=d.stepMinute,H=d.stepSecond,F=d.minDate?d.minDate:new Date(d.startYear,0,1),D=d.maxDate?d.maxDate:new Date(d.endYear,11,31,23,59,59);e=e?e:s;if(i.match(/date/i)){b.each(["y","m","d"],function(a,b){a=w.search(RegExp(b,
"i"));-1<a&&v.push({o:a,v:b})});v.sort(function(a,b){return a.o>b.o?1:-1});b.each(v,function(a,b){j[b.v]=a});for(var h={},a=0;3>a;a++)if(a==j.y){m++;h[d.yearText]={};for(var c=F.getFullYear(),S=D.getFullYear();c<=S;c++)h[d.yearText][c]=w.match(/yy/i)?c:(c+"").substr(2,2)}else if(a==j.m){m++;h[d.monthText]={};for(c=0;12>c;c++)h[d.monthText][c]=w.match(/MM/)?d.monthNames[c]:w.match(/M/)?d.monthNamesShort[c]:w.match(/mm/)&&9>c?"0"+(c+1):c+1}else if(a==j.d){m++;h[d.dayText]={};for(c=1;32>c;c++)h[d.dayText][c]=
w.match(/dd/i)&&10>c?"0"+c:c}q.push(h)}if(i.match(/time/i)){v=[];b.each(["h","i","s"],function(a,b){a=t.search(RegExp(b,"i"));-1<a&&v.push({o:a,v:b})});v.sort(function(a,b){return a.o>b.o?1:-1});b.each(v,function(a,b){j[b.v]=m+a});h={};for(a=m;a<m+3;a++)if(a==j.h){m++;h[d.hourText]={};for(c=0;c<(z?12:24);c+=M)h[d.hourText][c]=z&&0==c?12:t.match(/hh/i)&&10>c?"0"+c:c}else if(a==j.i){m++;h[d.minuteText]={};for(c=0;60>c;c+=J)h[d.minuteText][c]=t.match(/ii/)&&10>c?"0"+c:c}else if(a==j.s){m++;h[d.secText]=
{};for(c=0;60>c;c+=H)h[d.secText][c]=t.match(/ss/)&&10>c?"0"+c:c}y&&(j.ap=m++,i=t.match(/A/),h[d.ampmText]={"0":i?"AM":"am",1:i?"PM":"pm"});q.push(h)}p.setDate=function(a,b,c,d){for(var e in j)this.temp[j[e]]=a[u[e]]?a[u[e]]():u[e](a);this.setValue(!0,b,c,d)};p.getDate=function(a){return l(a)};return{button3Text:d.showNow?d.nowText:void 0,button3:d.showNow?function(){p.setDate(new Date,!1,0.3,!0)}:void 0,wheels:q,headerText:function(){return b.scroller.formatDate(s,l(p.temp),d)},formatResult:function(a){return b.scroller.formatDate(e,
l(a),d)},parseValue:function(a){var c=new Date,h=[];try{c=b.scroller.parseDate(e,a,d)}catch(k){}for(var i in j)h[j[i]]=c[u[i]]?c[u[i]]():u[i](c);return h},validate:function(a){var c=p.temp,e={y:F.getFullYear(),m:0,d:1,h:0,i:0,s:0,ap:0},h={y:D.getFullYear(),m:11,d:31,h:n(z?11:23,M),i:n(59,J),s:n(59,H),ap:1},i=!0,l=!0;b.each("y,m,d,ap,h,i,s".split(","),function(m,s){if(j[s]!==void 0){var n=e[s],g=h[s],p=31,q=k(c,s),v=b("ul",a).eq(j[s]),f,t;if(s=="d"){f=k(c,"y");t=k(c,"m");g=p=32-(new Date(f,t,32)).getDate();
x&&b("li",v).each(function(){var a=b(this),c=a.data("val"),e=(new Date(f,t,c)).getDay();a.html(w.replace(/[my]/gi,"").replace(/dd/,c<10?"0"+c:c).replace(/d/,c).replace(/DD/,d.dayNames[e]).replace(/D/,d.dayNamesShort[e]))})}i&&F&&(n=F[u[s]]?F[u[s]]():u[s](F));l&&D&&(g=D[u[s]]?D[u[s]]():u[s](D));if(s!="y"){var r=b('li[data-val="'+n+'"]',v).index(),y=b('li[data-val="'+g+'"]',v).index();b("li",v).removeClass("dw-v").slice(r,y+1).addClass("dw-v");s=="d"&&b("li",v).removeClass("dw-h").slice(p).addClass("dw-h")}q<
n&&(q=n);q>g&&(q=g);i&&(i=q==n);l&&(l=q==g);if(d.invalid&&s=="d"){var B=[];d.invalid.dates&&b.each(d.invalid.dates,function(a,b){b.getFullYear()==f&&b.getMonth()==t&&B.push(b.getDate()-1)});if(d.invalid.daysOfWeek){var z=(new Date(f,t,1)).getDay();b.each(d.invalid.daysOfWeek,function(a,b){for(var c=b-z;c<p;c=c+7)c>=0&&B.push(c)})}d.invalid.daysOfMonth&&b.each(d.invalid.daysOfMonth,function(a,b){b=(b+"").split("/");b[1]?b[0]-1==t&&B.push(b[1]-1):B.push(b[0]-1)});b.each(B,function(a,c){b("li",v).eq(c).removeClass("dw-v")})}c[j[s]]=
q}})},methods:{getDate:function(a){var c=b(this).scroller("getInst");if(c)return c.getDate(a?c.temp:c.values)},setDate:function(a,c,d,e){void 0==c&&(c=!1);return this.each(function(){var j=b(this).scroller("getInst");j&&j.setDate(a,c,d,e)})}}}};b.scroller.presets.date=x;b.scroller.presets.datetime=x;b.scroller.presets.time=x;b.scroller.formatDate=function(p,k,n){if(!k)return null;for(var n=b.extend({},E,n),l=function(b){for(var e=0;d+1<p.length&&p.charAt(d+1)==b;)e++,d++;return e},i=function(b,d,
e){d=""+d;if(l(b))for(;d.length<e;)d="0"+d;return d},q=function(b,d,e,h){return l(b)?h[d]:e[d]},e="",h=!1,d=0;d<p.length;d++)if(h)"'"==p.charAt(d)&&!l("'")?h=!1:e+=p.charAt(d);else switch(p.charAt(d)){case "d":e+=i("d",k.getDate(),2);break;case "D":e+=q("D",k.getDay(),n.dayNamesShort,n.dayNames);break;case "o":e+=i("o",(k.getTime()-(new Date(k.getFullYear(),0,0)).getTime())/864E5,3);break;case "m":e+=i("m",k.getMonth()+1,2);break;case "M":e+=q("M",k.getMonth(),n.monthNamesShort,n.monthNames);break;
case "y":e+=l("y")?k.getFullYear():(10>k.getYear()%100?"0":"")+k.getYear()%100;break;case "h":var m=k.getHours(),e=e+i("h",12<m?m-12:0==m?12:m,2);break;case "H":e+=i("H",k.getHours(),2);break;case "i":e+=i("i",k.getMinutes(),2);break;case "s":e+=i("s",k.getSeconds(),2);break;case "a":e+=11<k.getHours()?"pm":"am";break;case "A":e+=11<k.getHours()?"PM":"AM";break;case "'":l("'")?e+="'":h=!0;break;default:e+=p.charAt(d)}return e};b.scroller.parseDate=function(p,k,n){var l=new Date;if(!p||!k)return l;
for(var k="object"==typeof k?k.toString():k+"",i=b.extend({},E,n),q=i.shortYearCutoff,n=l.getFullYear(),e=l.getMonth()+1,h=l.getDate(),d=-1,m=l.getHours(),l=l.getMinutes(),v=0,j=-1,u=!1,w=function(b){(b=z+1<p.length&&p.charAt(z+1)==b)&&z++;return b},t=function(b){w(b);b=k.substr(y).match(RegExp("^\\d{1,"+("@"==b?14:"!"==b?20:"y"==b?4:"o"==b?3:2)+"}"));if(!b)return 0;y+=b[0].length;return parseInt(b[0],10)},x=function(b,d,e){b=w(b)?e:d;for(d=0;d<b.length;d++)if(k.substr(y,b[d].length).toLowerCase()==
b[d].toLowerCase())return y+=b[d].length,d+1;return 0},y=0,z=0;z<p.length;z++)if(u)"'"==p.charAt(z)&&!w("'")?u=!1:y++;else switch(p.charAt(z)){case "d":h=t("d");break;case "D":x("D",i.dayNamesShort,i.dayNames);break;case "o":d=t("o");break;case "m":e=t("m");break;case "M":e=x("M",i.monthNamesShort,i.monthNames);break;case "y":n=t("y");break;case "H":m=t("H");break;case "h":m=t("h");break;case "i":l=t("i");break;case "s":v=t("s");break;case "a":j=x("a",["am","pm"],["am","pm"])-1;break;case "A":j=x("A",
["am","pm"],["am","pm"])-1;break;case "'":w("'")?y++:u=!0;break;default:y++}100>n&&(n+=(new Date).getFullYear()-(new Date).getFullYear()%100+(n<=("string"!=typeof q?q:(new Date).getFullYear()%100+parseInt(q,10))?0:-100));if(-1<d){e=1;h=d;do{i=32-(new Date(n,e-1,32)).getDate();if(h<=i)break;e++;h-=i}while(1)}m=new Date(n,e-1,h,-1==j?m:j&&12>m?m+12:!j&&12==m?0:m,l,v);if(m.getFullYear()!=n||m.getMonth()+1!=e||m.getDate()!=h)throw"Invalid date";return m}})(jQuery);(function(b){var x={defaults:{dateOrder:"Mddyy",mode:"mixed",rows:5,width:70,height:36,showLabel:!1}};b.scroller.themes["android-ics"]=x;b.scroller.themes["android-ics light"]=x})(jQuery);

;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/timePicker/lib/timePicker.js', namespace: 'compo.timePicker', url: '/.reference/libjs/compos/timePicker/lib/timePicker.js'});
;include
.js('js/mobiscroll.js')//
.css('css/mobiscroll.css').done(function() {

	mask.registerHandler('timePicker', Class({
		Base: Compo,
		render: function(values, container, cntx) {
			this.tagName = 'div';
			Compo.prototype.render.call(this, values, container, cntx);
			

			this.$.scroller({
				preset: this.attr.preset || 'time',
                theme: 'android-ics',
				display: 'inline',
                mode: 'scroller',
                timeFormat:'HH:ii',
                timeWheels: 'HHii'
			});

		}
	}));
});
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/layout/lib/layout.js', namespace: 'compo.layout', url: '/.reference/libjs/compos/layout/lib/layout.js'});
;(function() {

    var masters = {};

    mask.registerHandler('layout:master', Class({
        render: function() {
            masters[this.attr.id] = this;
        }
    }));

    mask.registerHandler('layout:view', Class({
        clone: function(node) {

            if (node.content != null) {
				return {
					content: node.content
				};
			}

            var outnode = {
                tagName: node.tagName || node.compoName,
                attr: node.attr
            };

            if (node.nodes != null) {
                outnode.nodes = [];

                var isarray = node.nodes instanceof Array,
                    length = isarray ? node.nodes.length : 1,
                    x = null;
                for (var i = 0; isarray ? i < length : i < 1; i++) {
					x = isarray ? node.nodes[i] : node.nodes;
                    
                    if (x.tagName == 'placeholder') {
                        var value = this.get(x.attr.id);                        
                        if (value != null) {
                            if (value instanceof Array) {
                                outnode.nodes = outnode.nodes.concat(value);
                                continue;
                            }
                            outnode.nodes.push(value);
                        }
                        continue;
                    }
                    
                    outnode.nodes.push(this.clone(x));
                }
            }
            return outnode;

        },
        get: function(id) {
            for (var i = 0, x, length = this.nodes.length; i < length; i++) {
				x = this.nodes[i];
                if (x.tagName == id) {
					return x.nodes;
				}
            }
            return null;
        },
        render: function(values, container, cntx) {
            var masterLayout = masters[this.attr.master];
            if (masterLayout == null){
                console.error('Master Layout is not defined for', this);
                return;
            }
            this.nodes = this.clone(masterLayout).nodes;
            mask.renderDom(this.nodes, values, container, cntx);
        }
    }));

}());
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/list/lib/list.js', namespace: 'compo.list', url: '/.reference/libjs/compos/list/lib/list.js'});
;(function() {
	mask.registerHandler('list', Class({
		Base: Compo,
		render: function(values, container, cntx) {

			values = Object.getProperty(values, this.attr.value);
			if (values instanceof Array === false) {
				return;
			}

			if (this.attr.template != null) {
				var template = this.attr.template;
				if (template[0] == '#') {
					template = document.querySelector(this.attr.template).innerHTML;
				}
				this.nodes = mask.compile(template);
			}

			if (this.attr.ref != null) {
				console.log(mask.templates, this.attr.ref);
				this.nodes = Compo.findCompo(mask.templates, this.attr.ref).nodes;				
			}

			for (var i = 0, length = values.length; i < length; i++) {
				mask.renderDom(this.nodes, values[i], container, cntx);
			}

			this.$ = $(container);
			
			if (container instanceof Array){
				Compo.shots.on(this, 'DOMInsert',function(){
					this.$ = this.$.parent();
				});
			}
		},
		add: function(values) {
			var dom = mask.renderDom(this.nodes, values, null, this),
				container = this.$ && this.$.get(0);

			
			if (!container) {
				return;
			}


			if ('id' in values) {
				var item = container.querySelector('[data-id="' + values.id + '"]');
				if (item) {
					item.parentNode.replaceChild(dom, item);
					return;
				}
			}
			container.appendChild(dom);
		}
	}));
}());
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/.reference/libjs/compos/utils/lib/utils.js', namespace: 'compo.utils', url: '/.reference/libjs/compos/utils/lib/utils.js'});
;(function(){

	
	var Templates = [];
	
	mask.templates = Templates;
	mask.registerHandler('template',Class({
		Base: Compo,
		Construct: function(){
			mask.templates.push(this);
		},
		render: function(){}
	}));

	mask.registerHandler('html', Class({
		render: function(values, container) {
			var source = null;
			if (this.attr.source != null) {
				source = document.getElementById(this.attr.source).innerHTML;
			}
			if (this.nodes && this.nodes.content != null) {
				source = this.nodes.content;
			}

			var $div = document.createElement('div');
			$div.innerHTML = source;
			for (var key in this.attr) {
				$div.setAttribute(key, this.attr[key]);
			}
			container.appendChild($div);
		}
	}));

}());
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/script/component/viewsManager.js', namespace: 'controller.viewsManager', url: '/script/component/viewsManager.js'});
;include.js({
	'lib': 'ranimate'
}).done(function() {

	var Helper = {
		doSwitch: function($current, $next) {
			$current.removeClass('active');
			$next.addClass('active');

			var prfx = ruqq.info.cssprefix;
			ruqq.animate($next, {				
				property: prfx + 'transform',
				valueFrom: 'translate3d(0px, -110%, 0px)',
				valueTo: 'translate3d(0px, 0px, 0px)',
				duration: 300,
				timing: 'cubic-bezier(.58,1.54,.59,.75)'
			});
		}
	},
	currentCompo;


	var ViewsManager = Class({
		Base: Compo,
		Construct: function() {
			window.viewsManager = this;
		},
		render: function(values, container, cntx) {
			this.nodes = mask.compile('list value="views" > view;');
			this.tagName = 'div';
			Compo.prototype.render.call(this, values, container, cntx);
		},
		load: function(info) {

			var activity = Compo.findCompo(window.app, 'pageActivity').show(),
				name = info.view.replace('View', '');

			
			//include.cfg({eval: true});
			//(new window.includeLib.Resource)
			include.js(String.format('/pages/libs/%1/%1.js', name)).done(function() {
				console.log('view loaded');
				this.append(name + 'View;', {});

				activity.hide();


				var compo = Compo.findCompo(this, info.view);
				if (compo == null) {
					console.error('Cannt be loaded', info.view);
					return;
				}

				this.performShow(compo, info);

			}.bind(this));
		},
		show: function(info) {
			if (info.view) {
				info.view += 'View';
			}

			var compo = Compo.findCompo(this, info.view);

			if (compo == null) {
				this.$.children('.active').removeClass('active');
				this.load(info);
				return;
			}

			this.performShow(compo, info);
		},
		performShow: function(compo, info) {

			compo.section(info);

			if (compo == currentCompo) {
				return;
			}

			currentCompo = compo;

			if (this.$) {
				Helper.doSwitch(this.$.children('.active'), compo.$);
			}
			compo.activate && compo.activate();
		}
	});

	mask.registerHandler('viewsManager', ViewsManager);

});
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/script/component/view.js', namespace: 'controller.view', url: '/script/component/view.js'});
;include.css('view.css').done(function() {

   function when(idfrs, callback) {
      var wait = idfrs.length,
          ondone = function() {
            if (--wait === 0) {
				callback();
			}
          };
          
      for (var i = 0, length = idfrs.length; i < length; i++) {         
         idfrs[i].done(ondone);
      }
   }


   mask.registerHandler('view', Class({
      Base: Compo,
      Extends: CompoUtils,
      Construct: function() {
         (this.attr || (this.attr = {})).class = 'view';
      },
      render: function(values, container, cntx) {
         this.tagName = 'div';

         Compo.prototype.render.apply(this, arguments);
      },
      events: {
         'changed: .radioButtons': function(e, target) {
            var name = this.attr.id.replace('View', '');
            window.routes.navigate(name + '/' + target.name);
         }
      },

      tab: function(name) {
         this.$.find('.tabPanel > .active').removeClass('active');
         this.$.find('.tabPanel > .' + name).addClass('active');
         
         var scroller = Compo.find(this, 'scroller');
         if (scroller && (scroller = scroller.scroller)){
            scroller.scrollTo(0,0);
            scroller.refresh();
         }
         
      },

      section: function(info) {
         if (!info.category) {
			info.category = this.defaultCategory || 'info';
		 }

         var buttons = Compo.findCompo(this, '.radioButtons');

         if (buttons) {
            buttons.setActive(info.category);
            this.tab(info.category);
         }
         
         
         var prisms = this.all('prism','compo');
         if (prisms && prisms.length){
            when(this.all('prism', 'compo'), this.update.bind(this, info));
            return;
         }
         
         this.update(info);
      
      },
      update: function(info){
         var scroller = Compo.find(this, 'scroller');
         scroller && scroller.scroller && scroller.scroller.refresh();
         
         if (info.anchor){
            var element = this.$.find('a[name="' + info.anchor + '"]').get(0);
			
			if (scroller && scroller.scroller){
				scroller.scroller.scrollToElement(element, 100);
			}
         }
      },
      activate: function() {
         var scroller = Compo.find(this, 'scroller');
         scroller && scroller.scroller && scroller.scroller.refresh();
      }

   }));

});
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/script/control/radioButtons.js', namespace: 'uicontrol.radioButtons', url: '/script/control/radioButtons.js'});
;mask.registerHandler('radioButtons', Class({
    Base: Compo,
    events: {
        'click: button:not(.active)': function(e) {
            var $this = $(e.target);
            $this.parent().children('.active').removeClass('active');
            $this.addClass('active');
            this.$.trigger('changed', e.target);
        }
    },
    render: function() {
        this.tagName = 'div';
        this.attr['class'] = 'radioButtons ' + (this.attr['class'] || '');
        Compo.prototype.render.apply(this, arguments);
    },
    
    setActive: function(name){
        var button = this.$.find('[name='+name+']');
        
        button.parent().children('.active').removeClass('active');
        button.addClass('active');
    }
}));

;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/script/control/pageActivity.js', namespace: 'uicontrol.pageActivity', url: '/script/control/pageActivity.js'});
;(function() {


    var I = ruqq.info,
        vendor = null,
        initVendorStrings = function() {
            vendor = {
                TransitionProperty: I.prefix + 'TransitionProperty',
                Transform: I.prefix + 'Transform',
                Transition: I.prefix + 'Transition',
                cssTransform: I.cssprefix + 'transform'
            };
        };

    var Spinner = Class({
        Base: Compo,
        render: function(values, container, cntx) {
            this.currentPos = 0;
            this.tagName = 'div';

            var defaults = {
                width: 32,
                height: 32,
                image: '',
                top: '50%',
                left: '50%',
                marginLeft: -16,
                marginTop: -16
            };

            Object.defaults(this.attr, defaults);

            this.attr.marginTop = this.attr.height / -2;
            this.attr.marginLeft = this.attr.width / -2;
            if (I.supportTransitions) {
                this.attr.image = this.attr.image.replace('.png', '-single.png');
            }


            var _ = ['width:#{width}px;', //
            'height:#{height}px;', //
            'background:url(#{image}) 0 0 no-repeat;', //
            'position:fixed;', //
            'top:#{top};', //
            'left:#{left};', //
            'margin-left:#{marginLeft}px;', //
            'margin-top:#{marginTop}px;', //
            'z-index:9999999;', //
            'display:none;', //
            ];

            this.attr.style = String.format(_.join(''), this.attr);

            Object.clear(this.attr, defaults);
            Compo.prototype.render.call(this, values, container, cntx);


        },
        start: function() {
            if (this.interval) {
				return;
			}


            var style = this.$.get(0).style;
            if (I.supportTransitions) {
                if (vendor == null) {
					initVendorStrings();
				}

                
                style[vendor.TransitionProperty] = 'none';
                style[vendor.Transform] = 'rotate(0deg)';

                setTimeout(function() {
                    style[vendor.Transition] = vendor.cssTransform + ' 5s linear';
                    style[vendor.Transform] = 'rotate(720deg)';
                }, 1);

                this.interval = setInterval(function() {
                    style[vendor.TransitionProperty] = 'none';
                    style[vendor.Transform] = 'rotate(0deg)';

                    setTimeout(function() {
                        style[vendor.Transition] = vendor.cssTransform + ' 5s linear';
                        style[vendor.Transform] = 'rotate(720deg)';
                    }, 0);
                }, 5000);

            } else {
                //this.interval = setInterval(function() {
                //    this.currentPos += this.data.height;
                //    if (this.currentPos > this.data.height * this.data.frames - 1) {
                //        this.currentPos = 0;
                //    }
                //    this.$.css('background-position', '0px -' + this.currentPos + 'px');
                //}.bind(this), 100);
            }
        },
        stop: function() {
            if (I.supportTransitions) {
                var style = this.$.get(0).style;
                style[vendor.TransitionProperty] = 'none';
                style[vendor.Transform] = 'rotate(0deg)';
            }

            if (this.interval == null) {
                console.warn('Stop spinner but interval is null !!!');
                return;
            }
            clearInterval(this.interval);
            this.interval = null;
        },
        show: function() {
            this.start();
            this.$.show();            
            return this;
        },
        hide: function() {
            this.stop();
            this.$.hide();
            return this;
        },
        isActive: function() {
            return this.interval != null;
        }
    });


    mask.registerHandler('spinner', Spinner);


    mask.registerHandler('pageActivity', Class({
        Base: Compo,
        Construct: function() {
            this.compos = {
                'spinner': 'compo: spinner'
            };
        },
        render: function() {
            this.tagName = 'div';
            this.attr.style = 'position:fixed; top:0px; left:0px; right: 0px; bottom:0px;background:rgba(0,0,0,.5);display:none;';
            this.nodes = {
                tagName: 'spinner',
                attr: {
                    image: 'images/128x128_spinner.png',
                    width: 128,
                    height: 128,
                    frames: 12
                }
            };

            Compo.prototype.render.apply(this, arguments);            
        },
        show: function() {            
            this.$.show();
            this.compos.spinner.show();
            return this;
        },
        hide: function(){
            this.$.hide();
            this.compos.spinner.hide();
            return this;
        }
    }));

})();
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/script/utils/maskUtils.js', namespace: '', url: '/script/utils/maskUtils.js'});
;(function() {
    var replaces = null;
    mask.registerHandler('formatter:pre', Class({
        Construct: function() {
            if (replaces == null) {
                replaces = {
                    regexps: [/\\n/g, /\\t/g],
                    values: ['\n', '    ']
                };
            }
        },
        makePre: function(nodes) {
            var isarray = nodes instanceof Array,
                length = isarray ? nodes.length : 1,
                x = null;
            for (var i = 0; isarray ? i < length : i < 1; i++) {
				x = isarray ? nodes[i] : nodes;
                if (x.content != null) {
                    x.content = x.content.replace(replaces.regexps[0], '\n').replace(replaces.regexps[1], '    ');
                }
                if (x.nodes != null) {
                    this.makePre(x.nodes);
                }
            }
        },
        render: function(values, container, cntx) {
            this.makePre(this.nodes);
            mask.renderDom(this.nodes, values, container, cntx);
        }
    }));
	
	
	
	if (ruqq.info.engine.name !== 'webkit'){
		mask.registerHandler('scroller',Class({
			render: function(model, container,cntx){
				this.tagName = 'div';
				this.attr['class'] = (this.attr['class'] ? this.attr['class'] + ' ' : '') + 'scroller';
				this.nodes = {
					tagName: 'div',
					attr: {
						'class': 'scroller-container'
					},
					nodes: this.nodes
				};
				Compo.render(this, model, container, cntx);
				
				
				this.attr = null;
				this.tagName = null;
				
				this.scroller = {
					refresh: function(){},
					scrollToElement: function(element){
						var scrollTo = $(element),
							container = this.$;
						container.scrollTop(
							scrollTo.offset().top - container.offset().top + container.scrollTop()
						);
					}.bind(this),
					scrollTo: function(x, y){
						this.$.scrollTop(y);
						this.$.scrollLeft(x);
					}.bind(this)
				}
				
				return this;
			}
		}))
	}
	
}());
;includeLib.ScriptStack.afterScriptRun(include)
;include.setCurrent({ id: '/script/main.js', namespace: '', url: '/script/main.js'});
;
window.onerror = function(){
	console.log(arguments);
};

include.routes({
	controller: '/script/component/{0}.js',
	uicontrol: '/script/control/{0}.js'
}).js({
	framework: ['dom/jquery', 'ruqq.base', 'utils', 'routes', 'browser.detect'],
	lib: ['compo','ranimate'],

	compo: ['scroller', 'prism', 'datePicker', 'timePicker', 'layout', 'list', 'utils'],
	controller: ['viewsManager', 'view'],
	uicontrol: ['radioButtons', 'pageActivity'],
	'': ['/script/utils/maskUtils.js']
}).ready(function() {

	var w = window,
		model = {

			menuModel: [{
				title: 'About',
				items: [{
					view: 'about',
					title: 'About'
				}/*, {
					view: 'blog',
					title: 'Blog'
				}*/]
			}, {
				title: 'Library',
				items: [{
					view: 'class',
					title: 'ClassJS'
				}, {
					view: 'mask',
					title: 'MaskJS'
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
					items: [{
						view: 'ruqq/routing',
						title: 'Routing'
					}, {
						view: 'ruqq/arr',
						title: 'Array Helper'
					}, {
						view: 'ruqq/obj',
						title: 'Object Helper'
					}, ]
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
				}, {
					view: 'compos/dualbind',
					title: 'dualbind;'
				}, {
					view: 'compos/validate',
					title: 'validate;'
				}]
			}]
		};



	Compo.config.setDOMLibrary($);

	w.app = new new Class({
		Base: Compo,
		attr: {
			template: '#layout'
		},
		compos: {
			menuHelp: '$: .menu-help',
			menu: ['$: menu',
			{
				'click: .viewTitle': function(e) {
					console.log('mouseup');
					var view = $(e.target).data('view');
					w.routes.navigate(view);
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


	w.app.render(model).insert(document.body);

	w.routes.add('/:view/?:category/?:anchor', function(current) {
		console.log('current', current);
		w.viewsManager.show(current);
	});

	w.viewsManager.show(w.routes.current() || {
		view: 'about'
	});



});
;includeLib.ScriptStack.afterScriptRun(include)