;
(function(w) {

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
			if (x == null) return;
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
			
			if (typeof original !== 'object') return;

			this.extendPrototype = original.__proto__ == null ? this.protoLess : this.proto;
			this.extendPrototype(_class, _base, _extends, original);
		},
		proto: function(_class, _base, _extends, original) {
			var prototype = original,
				proto = original;
			
			if (_extends != null) {
				proto.__proto__ = {};
				helper.each(_extends, function(x) {
					helper.extendProto(proto.__proto__, x);
				});
				proto = proto.__proto__;
			}
			
			if (_base != null) {
				proto.__proto__ = _base.prototype;
			}

			_class.prototype = prototype;
		},
		/** browser that doesnt support __proto__ */
		protoLess: function(_class, _base, _extends, original) {
			
			if (_base != null) {
				var proto = {},
					tmp = new Function;
					
				tmp.prototype = _base.prototype;
				_class.prototype = new tmp();
				_class.constructor = _base;
			}
			
			helper.extendProto(_class.prototype, original);
			if (_extends != null) {				
				helper.each(_extends, function(x){
					helper.extendProto(_class.prototype, x);
				});				
			}
		}
	}

	w.Class = function(data) {
		var _base = data.Base,
			_extends = data.Extends,
			_static = data.Static,
			_construct = data.Construct,
			_class = null;
			
		if (_base != null) delete data.Base;
		if (_extends != null) delete data.Extends;
		if (_static != null) delete data.Static;
		if (_construct != null) delete data.Construct;
		
		
		if (_base == null && _extends == null) {
			if (_construct == null)   _class = function() {};
			else _class = _construct;				
			
			if (_static != null) {
				for (var key in _static) _class[key] = _static[key];				
			}

			_class.prototype = data;
			return _class;

		}
		
		_class = function() {
			
			if (_extends != null){				
				var isarray = _extends instanceof Array,
					length = isarray ? _extends.length : 1,
					x = null;
				for (var i = 0; x = isarray ? _extends[i] : _extends, isarray ? i < length : i < 1; i++) {
					if (typeof x === 'function') x.apply(this, arguments);
				}				
			}
			
			if (_base != null) {								
				_base.apply(this, arguments);			
			}
			
			if (_construct != null) {
				var r = _construct.apply(this, arguments);
				if (r != null) return r;
			}
			return this;
		}
		
		if (_static != null)  for (var key in _static) _class[key] = _static[key]; 			
		
		
		helper.extendClass(_class, _base, _extends, data);
		
		
		data = null;
		_static = null;
		
		return _class;
	}



})(window);

;;
void

function(w, d) {

	var cfg = {},
		bin = {},
		isWeb = !! (w.location && w.location.protocol && /^https?:/.test(w.location.protocol)),
		handler = {},
		regexp = {
			name: new RegExp('\\{name\\}', 'g')
		},
		helper = { /** TODO: improve url handling*/
			uri: {
				getDir: function(url) {
					var index = url.lastIndexOf('/');
					return index == -1 ? '' : url.substring(index + 1, -index);
				},
				/** @obsolete */
				resolveCurrent: function() {
					var scripts = d.querySelectorAll('script');
					return scripts[scripts.length - 1].getAttribute('src');
				},
				resolveUrl: function(url, parent) {
					if (cfg.path && url[0] == '/') {
						url = cfg.path + url.substring(1);
					}
					if (url[0] == '/') {
						if (isWeb == false || cfg.lockedToFolder == true) return url.substring(1);
						return url;
					}
					switch (url.substring(0, 4)) {
					case 'file':
					case 'http':
						return url;
					}

					if (parent != null && parent.location != null) return parent.location + url;
					return url;
				}
			},
			extend: function(target, source) {
				for (var key in source) target[key] = source[key];
				return target;
			},
			/**
			 *	@arg x :
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
			eachIncludeItem: function(type, x, fn, namespace, xpath) {
				if (x == null) {
					console.error('Include Item has no Data', type, namespace);
					return;
				}

				if (type == 'lazy' && xpath == null) {
					for (var key in x) this.eachIncludeItem(type, x[key], fn, null, key);
					return;
				}
				if (x instanceof Array) {
					for (var i = 0; i < x.length; i++) this.eachIncludeItem(type, x[i], fn, namespace, xpath);
					return;
				}
				if (typeof x === 'object') {
					for (var key in x) this.eachIncludeItem(type, x[key], fn, key, xpath);
					return;
				}

				if (typeof x === 'string') {
					var route = namespace && cfg[namespace];
					if (route) {
						namespace += '.' + x;
						x = route.replace(regexp.name, x);
					}
					fn(namespace, x, xpath);
					return;
				}

				console.error('Include Package is invalid', arguments);
			},
			invokeEach: function(arr, args) {
				if (arr == null) return;
				if (arr instanceof Array) {
					for (var i = 0, x, length = arr.length; x = arr[i], i < length; i++) {
						if (typeof x === 'function')(args != null ? x.apply(this, args) : x());
					}
				}
			},
			doNothing: function(fn) {
				typeof fn == 'function' && fn()
			},
			reportError: function(e) {
				console.error('IncludeJS Error:', e, e.message, e.url);
				typeof handler.onerror == 'function' && handler.onerror(e);
			},
			ensureArray: function(obj, xpath) {
				if (!xpath) return obj;
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
				}
				xhr.open('GET', url, true);
				xhr.send();
			}
		},

		events = (function(w, d) {
			if (d == null) {
				return {
					ready: helper.doNothing,
					load: helper.doNothing
				};
			}
			var readycollection = [],
				loadcollection = null,
				readyqueue = null,
				timer = Date.now();

			d.onreadystatechange = function() {
				if (/complete|interactive/g.test(d.readyState) == false) return;

				if (timer) console.log('DOMContentLoader', d.readyState, Date.now() - timer, 'ms');
				events.ready = (events.readyQueue = helper.doNothing);
				
				
				helper.invokeEach(readyqueue);
				
				helper.invokeEach(readycollection);				
				readycollection = null;
				readyqueue = null;
				
				
				if (d.readyState == 'complete') {
					events.load = helper.doNothing;
					helper.invokeEach(loadcollection);
					loadcollection = null;
				}
			};

			return {
				ready: function(callback) {
					readycollection.unshift(callback);
				},
				readyQueue: function(callback){
					(readyqueue || (readyqueue = [])).push(callback);
				},
				load: function(callback) {
					(loadcollection || (loadcollection = [])).unshift(callback);
				}
			}
		})(w, d);


	var IncludeDeferred = Class({
		ready: function(callback) {
			return this.on(4, function() {
				events.ready(callback);
			});
		},
		/** assest loaded and window is loaded */
		loaded: function(callback) {
			return this.on(4, function() {
				events.load(callback);
			});
		},
		/** assest loaded */
		done: function(callback) {
			return this.on(4, this.resolve.bind(this, callback));
		},
		resolve: function(callback) {
			var r = callback(this.response);
			if (r != null) this.obj = r;
		}
	});


	var StateObservable = Class({
		Construct: function() {
			this.callbacks = [];
		},
		on: function(state, callback) {
			state <= this.state ? callback(this) : this.callbacks.unshift({
				state: state,
				callback: callback
			});
			return this;
		},
		readystatechanged: function(state) {
			this.state = state;
			for (var i = 0, x, length = this.callbacks.length; x = this.callbacks[i], i < length; i++) {
				if (x.state > this.state || x.callback == null) continue;
				x.callback(this);
				x.callback = null;
			}
		}
	});


	var currentParent;
	var Include = Class({
		setCurrent: function(data) {
			currentParent = data;
		},
		incl: function(type, pckg) {
			if (this instanceof Resource) return this.include(type, pckg);

			var r = new Resource;

			if (currentParent) {
				r.id = currentParent.id;
				//-r.url = currentParent.url;
				r.namespace = currentParent.namespace;
				//-currentParent = null;
			}
			return r.include(type, pckg);
			//-return (this instanceof Resource ? this : new Resource).include(type, pckg);
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
				for (var key in arg) cfg[key] = arg[key];
				break;
			case 'string':
				if (arguments.length == 1) return cfg[arg];
				if (arguments.length == 2) cfg[arg] = arguments[1];
				break;
			case 'undefined':
				return cfg;
			}
			return this;
		},
		promise: function(namespace) {
			var arr = namespace.split('.'),
				obj = w;
			while (arr.length) {
				var key = arr.shift();
				obj = obj[key] || (obj[key] = {});
			}
			return obj;
		},
		register: function(_bin) {
			var onready = [];
			for (var key in _bin) {
				for (var i = 0; i < _bin[key].length; i++) {
					var id = _bin[key][i].id,
						url = _bin[key][i].url,
						namespace = _bin[key][i].namespace,
						resource = new Resource;

					resource.state = 4;
					resource.namespace = namespace;
					resource.type = key;

					if (url) {
						if (url[0] == '/') url = url.substring(1);
						resource.location = helper.uri.getDir(url);
					}

					switch (key) {
					case 'load':
					case 'lazy':
						resource.state = 0;
						events.readyQueue(function(_r, _id) {
							var container = d.querySelector('script[data-id="' + _id + '"]');
							if (container == null) {
								console.error('"%s" Data was not embedded into html', _id);
								return;
							}
							_r.obj = container.innerHTML;
							_r.readystatechanged(4);
						}.bind(this, resource, id));
						break;
					};
					(bin[key] || (bin[key] = {}))[id] = resource;
				}
			}			
		}
	});


	var hasRewrites = typeof IncludeRewrites != 'undefined',
		rewrites = hasRewrites ? IncludeRewrites : null;


	var Resource = Class({
		Base: Include,
		Extends: [IncludeDeferred, StateObservable],
		Construct: function(type, url, namespace, xpath, parent, id) {

			if (type == null) {
				return this;
			}



			this.namespace = namespace;
			this.type = type;
			this.xpath = xpath;
			this.url = url;

			if (url != null) {
				this.url = helper.uri.resolveUrl(url, parent);
			}


			if (id) void(0);
			else if (namespace) id = namespace;
			else if (url[0] == '/') id = url;
			else if (parent && parent.namespace) id = parent.namespace + '/' + url;
			else if (parent && parent.location) id = '/' + parent.location.replace(/^[\/]+/, '') + url;
			else id = '/' + url;

			if (bin[type] && bin[type][id]) {
				return bin[type][id];
			}


			if (hasRewrites == true && rewrites[id] != null) {
				url = rewrites[id];
			} else {
				url = this.url;
			}

			this.location = helper.uri.getDir(url);

			//-console.log('includejs. Load Resource:', id, url);


			;
			(bin[type] || (bin[type] = {}))[id] = this;


			var tag;
			switch (type) {
			case 'js':
				helper.xhr(url, this.onload.bind(this));
				if (d != null) {
					tag = d.createElement('script');
					tag.type = "application/x-included-placeholder";
					tag.src = url;
				}
				break;
			case 'ajax':
			case 'load':
			case 'lazy':
				helper.xhr(url, this.onload.bind(this));
				break;
			case 'css':
				this.state = 4;

				tag = d.createElement('link');
				tag.href = url;
				tag.rel = "stylesheet";
				tag.type = "text/css";
				break;
			case 'embed':
				tag = d.createElement('script');
				tag.type = 'application/javascript';
				tag.src = url;
				tag.onload = function() {
					this.readystatechanged(4);
				}.bind(this);
				tag.onerror = tag.onload;
				break;
			}
			if (tag != null) {
				d.querySelector('head').appendChild(tag);
				tag = null;
			}
			return this;
		},
		include: function(type, pckg) {
			this.state = 0;
			if (this.includes == null) this.includes = [];

			helper.eachIncludeItem(type, pckg, function(namespace, url, xpath) {

				var resource = new Resource(type, url, namespace, xpath, this);


				this.includes.push(resource);

				resource.index = this.calcIndex(type, namespace);
				resource.on(4, this.resourceLoaded.bind(this));
			}.bind(this));

			return this;
		},
		calcIndex: function(type, namespace) {
			if (this.response == null) this.response = {};
			switch (type) {
			case 'js':
			case 'load':
			case 'ajax':
				if (this.response[type + 'Index'] == null) this.response[type + 'Index'] = -1;
				return ++this.response[type + 'Index'];
			}
			return -1;
		},
		wait: function() {
			if (this.waits == null) this.waits = [];
			if (this._include == null) this._include = this.include;

			var data;

			this.waits.push((data = []));
			this.include = function(type, pckg) {
				data.push({
					type: type,
					pckg: pckg
				});
				return this;
			}
			return this;
		},
		resourceLoaded: function(resource) {
			if (this.parsing) return;


			if (resource != null && resource.obj != null && resource.obj instanceof Include === false) {
				switch (resource.type) {
				case 'js':
				case 'load':
				case 'ajax':
					var obj = (this.response[resource.type] || (this.response[resource.type] = []));

					if (resource.namespace != null) {
						obj = helper.ensureArray(obj, resource.namespace);
					}
					obj[resource.index] = resource.obj;
					break;
				}
			}

			if (this.includes != null && this.includes.length) {
				for (var i = 0; i < this.includes.length; i++) if (this.includes[i].state != 4) return;
			}


			if (this.waits && this.waits.length) {

				var data = this.waits.shift();
				this.include = this._include;
				for (var i = 0; i < data.length; i++) this.include(data[i].type, data[i].pckg);
				return;
			}

			this.readystatechanged((this.state = 4));

		},

		onload: function(url, response) {
			if (!response) {
				console.warn('Resource cannt be loaded', this.url);
				this.readystatechanged(4);
				return;
			}

			switch (this.type) {
			case 'load':
			case 'ajax':
				this.obj = response;
				break;
			case 'lazy':
				LazyModule.create(this.xpath, response);
				break;
			case 'js':
				this.parsing = true;
				try {
					__includeEval(response, this);
				} catch (error) {
					error.url = this.url;
					helper.reportError(error);
				}
				break;
			};

			this.parsing = false;

			this.resourceLoaded(null);

		}

	});


	var LazyModule = {
		create: function(xpath, code) {
			var arr = xpath.split('.'),
				obj = window,
				module = arr[arr.length - 1];
			while (arr.length > 1) {
				var prop = arr.shift();
				obj = obj[prop] || (obj[prop] = {});
			}
			arr = null;
			obj.__defineGetter__(module, function() {

				delete obj[module];
				try {
					var r = __includeEval(code, window.include);
					if (r != null && r instanceof Resource == false) obj[module] = r;
				} catch (error) {
					error.xpath = xpath;
					helper.reportError(e);
				} finally {
					code = null;
					xpath = null;

					return obj[module];
				}
			});
		}
	}


	w.include = new Include();
	w.include.helper = helper;
	w.IncludeResource = Resource;


}(window, window.document);

window.__includeEval = function(source, include) {
	return eval(source);
}
;include.cfg({"lib":"file:///c:/Development/libjs/{name}/lib/{name}.js","framework":"file:///c:/Development/libjs/framework/lib/{name}.js","compo":"file:///c:/Development/libjs/compos/{name}/lib/{name}.js","lockedToFolder":true,"controller":"/script/component/{name}.js","uicontrol":"/script/control/{name}.js"}); include.register({"css":[{"id":"/style/main.css","url":"style/main.css","namespace":""},{"id":"controller.view/view.css","url":"view.css"},{"id":"compo.prism/prism.lib.css","url":"prism.lib.css"}],"lazy":[{"id":"framework.animation","url":"file:///c:/Development/libjs/framework/lib/animation.js","namespace":"framework.animation"}],"js":[{"id":"/file:///c:/Development/libjs/class/lib/class.js","url":"file:///c:/Development/libjs/class/lib/class.js"},{"id":"/file:///c:/Development/libjs/include/lib/include.js","url":"file:///c:/Development/libjs/include/lib/include.js"},{"id":"framework.dom/zepto","url":"file:///c:/Development/libjs/framework/lib/dom/zepto.js","namespace":"framework.dom/zepto"},{"id":"framework.ruqq.base","url":"file:///c:/Development/libjs/framework/lib/ruqq.base.js","namespace":"framework.ruqq.base"},{"id":"framework.utils","url":"file:///c:/Development/libjs/framework/lib/utils.js","namespace":"framework.utils"},{"id":"framework.animation","url":"file:///c:/Development/libjs/framework/lib/animation.js","namespace":"framework.animation"},{"id":"lib.mask","url":"file:///c:/Development/libjs/mask/lib/mask.js","namespace":"lib.mask"},{"id":"lib.compo","url":"file:///c:/Development/libjs/compo/lib/compo.js","namespace":"lib.compo"},{"id":"compo.scroller/iscroll-full.js","url":"iscroll-full.js"},{"id":"compo.scroller","url":"file:///c:/Development/libjs/compos/scroller/lib/scroller.js","namespace":"compo.scroller"},{"id":"compo.prism/prism.lib.js","url":"prism.lib.js"},{"id":"compo.prism","url":"file:///c:/Development/libjs/compos/prism/lib/prism.js","namespace":"compo.prism"},{"id":"controller.viewsManager","url":"/script/component/viewsManager.js","namespace":"controller.viewsManager"},{"id":"controller.view","url":"/script/component/view.js","namespace":"controller.view"},{"id":"uicontrol.radioButtons","url":"/script/control/radioButtons.js","namespace":"uicontrol.radioButtons"},{"id":"uicontrol.pageActivity","url":"/script/control/pageActivity.js","namespace":"uicontrol.pageActivity"},{"id":"/script/handler/routes.js","url":"/script/handler/routes.js","namespace":""},{"id":"/script/main.js","url":"script/main.js"}]})
;include.setCurrent({ id: 'framework.dom/zepto', namespace: 'framework.dom/zepto', url: '{url}'});
;/* Zepto v1.0rc1 - polyfill zepto event detect fx ajax form touch - zeptojs.com/license */
;(function(undefined){
  if (String.prototype.trim === undefined) // fix for iOS 3.2
    String.prototype.trim = function(){ return this.replace(/^\s+/, '').replace(/\s+$/, '') }

  // For iOS 3.x
  // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
  if (Array.prototype.reduce === undefined)
    Array.prototype.reduce = function(fun){
      if(this === void 0 || this === null) throw new TypeError()
      var t = Object(this), len = t.length >>> 0, k = 0, accumulator
      if(typeof fun != 'function') throw new TypeError()
      if(len == 0 && arguments.length == 1) throw new TypeError()

      if(arguments.length >= 2)
       accumulator = arguments[1]
      else
        do{
          if(k in t){
            accumulator = t[k++]
            break
          }
          if(++k >= len) throw new TypeError()
        } while (true)

      while (k < len){
        if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
        k++
      }
      return accumulator
    }

})()
var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {}, classCache = {},
    getComputedStyle = document.defaultView.getComputedStyle,
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,

    // Used by `$.zepto.init` to wrap elements, text/comment nodes, document,
    // and document fragment node types.
    elementTypes = [1, 3, 8, 9, 11],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    classSelectorRE = /^\.([\w-]+)$/,
    idSelectorRE = /^#([\w-]+)$/,
    tagSelectorRE = /^[\w-]+$/,
    toString = ({}).toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div')

  zepto.matches = function(element, selector) {
    if (!element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function isFunction(value) { return toString.call(value) == "[object Function]" }
  function isObject(value) { return value instanceof Object }
  function isPlainObject(value) {
    var key, ctor
    if (toString.call(value) !== "[object Object]") return false
    ctor = (isFunction(value.constructor) && value.constructor.prototype)
    if (!ctor || !hasOwnProperty.call(ctor, 'isPrototypeOf')) return false
    for (key in value);
    return key === undefined || hasOwnProperty.call(value, key)
  }
  function isArray(value) { return value instanceof Array }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return array.filter(function(item){ return item !== undefined && item !== null }) }
  function flatten(array) { return array.length > 0 ? [].concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return array.filter(function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name) {
    if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
    if (!(name in containers)) name = '*'
    var container = containers[name]
    container.innerHTML = '' + html
    return $.each(slice.call(container.childNodes), function(){
      container.removeChild(this)
    })
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function(dom, selector) {
    dom = dom || []
    dom.__proto__ = arguments.callee.prototype
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, juts return it
    else if (zepto.isZ(selector)) return selector
    else {
      var dom
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // if a JavaScript object is given, return a copy of it
      // this is a somewhat peculiar option, but supported by
      // jQuery so we'll do it, too
      else if (isPlainObject(selector))
        dom = [$.extend({}, selector)], selector = null
      // wrap stuff like `document` or `window`
      else if (elementTypes.indexOf(selector.nodeType) >= 0 || selector === window)
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
      // create a new Zepto collection from the nodes found
      return zepto.Z(dom, selector)
    }
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, whichs makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    slice.call(arguments, 1).forEach(function(source) {
      for (key in source)
        if (source[key] !== undefined)
          target[key] = source[key]
    })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function(element, selector){
    var found
    return (element === document && idSelectorRE.test(selector)) ?
      ( (found = element.getElementById(RegExp.$1)) ? [found] : emptyArray ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? emptyArray :
      slice.call(
        classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
        tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
        element.querySelectorAll(selector)
      )
  }

  function filtered(nodes, selector) {
    return selector === undefined ? $(nodes) : $(nodes).filter(selector)
  }

  function funcArg(context, arg, idx, payload) {
   return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  $.isFunction = isFunction
  $.isObject = isObject
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.trim = function(str) { return str.trim() }

  // plugin compatibility
  $.uuid = 0

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $.map(this, function(el, i){ return fn.call(el, i, el) })
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      if (readyRE.test(document.readyState)) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      this.forEach(function(el, idx){ callback.call(el, idx, el) })
      return this
    },
    filter: function(selector){
      return $([].filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result
      if (this.length == 1) result = zepto.qsa(this[0], selector)
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return $(result)
    },
    closest: function(selector, context){
      var node = this[0]
      while (node && !zepto.matches(node, selector))
        node = node !== context && node !== document && node.parentNode
      return $(node)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && node !== document && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return slice.call(this.children) }), selector)
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return slice.call(el.parentNode.children).filter(function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return this.map(function(){ return this[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = null)
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(newContent){
      return this.each(function(){
        $(this).wrapAll($(newContent)[0].cloneNode(false))
      })
    },
    wrapAll: function(newContent){
      if (this[0]) {
        $(this[0]).before(newContent = $(newContent))
        newContent.append(this)
      }
      return this
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return $(this.map(function(){ return this.cloneNode(true) }))
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return (setting === undefined ? this.css("display") == "none" : setting) ? this.show() : this.hide()
    },
    prev: function(){ return $(this.pluck('previousElementSibling')) },
    next: function(){ return $(this.pluck('nextElementSibling')) },
    html: function(html){
      return html === undefined ?
        (this.length > 0 ? this[0].innerHTML : null) :
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        })
    },
    text: function(text){
      return text === undefined ?
        (this.length > 0 ? this[0].textContent : null) :
        this.each(function(){ this.textContent = text })
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && value === undefined) ?
        (this.length == 0 || this[0].nodeType !== 1 ? undefined :
          (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) this.setAttribute(key, name[key])
          else this.setAttribute(name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ if (this.nodeType === 1) this.removeAttribute(name) })
    },
    prop: function(name, value){
      return (value === undefined) ?
        (this[0] ? this[0][name] : undefined) :
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        })
    },
    data: function(name, value){
      var data = this.attr('data-' + dasherize(name), value)
      return data !== null ? data : undefined
    },
    val: function(value){
      return (value === undefined) ?
        (this.length > 0 ? this[0].value : undefined) :
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
    },
    offset: function(){
      if (this.length==0) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: obj.width,
        height: obj.height
      }
    },
    css: function(property, value){
      if (value === undefined && typeof property == 'string')
        return (
          this.length == 0
            ? undefined
            : this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property))

      var css = ''
      for (key in property)
        if(typeof property[key] == 'string' && property[key] == '')
          this.each(function(){ this.style.removeProperty(dasherize(key)) })
        else
          css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'

      if (typeof property == 'string')
        if (value == '')
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (this.length < 1) return false
      else return classRE(name).test(this[0].className)
    },
    addClass: function(name){
      return this.each(function(idx){
        classList = []
        var cls = this.className, newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && (this.className += (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (name === undefined)
          return this.className = ''
        classList = this.className
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        this.className = classList.trim()
      })
    },
    toggleClass: function(name, when){
      return this.each(function(idx){
        var newName = funcArg(this, name, idx, this.className)
        ;(when === undefined ? !$(this).hasClass(newName) : when) ?
          $(this).addClass(newName) : $(this).removeClass(newName)
      })
    }
  }

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    $.fn[dimension] = function(value){
      var offset, Dimension = dimension.replace(/./, function(m){ return m[0].toUpperCase() })
      if (value === undefined) return this[0] == window ? window['inner' + Dimension] :
        this[0] == document ? document.documentElement['offset' + Dimension] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        var el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function insert(operator, target, node) {
    var parent = (operator % 2) ? target : target.parentNode
    parent ? parent.insertBefore(node,
      !operator ? target.nextSibling :      // after
      operator == 1 ? parent.firstChild :   // prepend
      operator == 2 ? target :              // before
      null) :                               // append
      $(node).remove()
  }

  function traverseNode(node, fun) {
    fun(node)
    for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(key, operator) {
    $.fn[key] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var nodes = $.map(arguments, function(n){ return isObject(n) ? n : zepto.fragment(n) })
      if (nodes.length < 1) return this
      var size = this.length, copyByClone = size > 1, inReverse = operator < 2

      return this.each(function(index, target){
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[inReverse ? nodes.length-i-1 : i]
          traverseNode(node, function(node){
            if (node.nodeName != null && node.nodeName.toUpperCase() === 'SCRIPT' && (!node.type || node.type === 'text/javascript'))
              window['eval'].call(window, node.innerHTML)
          })
          if (copyByClone && index < size - 1) node = node.cloneNode(true)
          insert(operator, target, node)
        }
      })
    }

    $.fn[(operator % 2) ? key+'To' : 'insert'+(operator ? 'Before' : 'After')] = function(html){
      $(html)[key](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.camelize = camelize
  zepto.uniq = uniq
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
'$' in window || (window.$ = Zepto)
;(function($){
  var $$ = $.zepto.qsa, handlers = {}, _zid = 1, specialEvents={}

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eachEvent(events, fn, iterator){
    if ($.isObject(events)) $.each(events, iterator)
    else events.split(/\s/).forEach(function(type){ iterator(type, fn) })
  }

  function add(element, events, fn, selector, getDelegate, capture){
    capture = !!capture
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    eachEvent(events, fn, function(event, fn){
      var delegate = getDelegate && getDelegate(fn, event),
        callback = delegate || fn
      var proxyfn = function (event) {
        var result = callback.apply(element, [event].concat(event.data))
        if (result === false) event.preventDefault()
        return result
      }
      var handler = $.extend(parse(event), {fn: fn, proxy: proxyfn, sel: selector, del: delegate, i: set.length})
      set.push(handler)
      element.addEventListener(handler.e, proxyfn, capture)
    })
  }
  function remove(element, events, fn, selector){
    var id = zid(element)
    eachEvent(events || '', fn, function(event, fn){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
        element.removeEventListener(handler.e, handler.proxy, false)
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    if ($.isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (typeof context == 'string') {
      return $.proxy(fn[context], fn)
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, callback){
    return this.each(function(){
      add(this, event, callback)
    })
  }
  $.fn.unbind = function(event, callback){
    return this.each(function(){
      remove(this, event, callback)
    })
  }
  $.fn.one = function(event, callback){
    return this.each(function(i, element){
      add(this, event, callback, null, function(fn, type){
        return function(){
          var result = fn.apply(element, arguments)
          remove(element, type, fn)
          return result
        }
      })
    })
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }
  function createProxy(event) {
    var proxy = $.extend({originalEvent: event}, event)
    $.each(eventMethods, function(name, predicate) {
      proxy[name] = function(){
        this[predicate] = returnTrue
        return event[name].apply(event, arguments)
      }
      proxy[predicate] = returnFalse
    })
    return proxy
  }

  // emulates the 'defaultPrevented' property for browsers that have none
  function fix(event) {
    if (!('defaultPrevented' in event)) {
      event.defaultPrevented = false
      var prevent = event.preventDefault
      event.preventDefault = function() {
        this.defaultPrevented = true
        prevent.call(this)
      }
    }
  }

  $.fn.delegate = function(selector, event, callback){
    var capture = false
    if(event == 'blur' || event == 'focus'){
      if($.iswebkit)
        event = event == 'blur' ? 'focusout' : event == 'focus' ? 'focusin' : event
      else
        capture = true
    }

    return this.each(function(i, element){
      add(element, event, callback, selector, function(fn){
        return function(e){
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match) {
            evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
            return fn.apply(match, [evt].concat([].slice.call(arguments, 1)))
          }
        }
      }, capture)
    })
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, callback){
    return selector == undefined || $.isFunction(selector) ?
      this.bind(event, selector) : this.delegate(selector, event, callback)
  }
  $.fn.off = function(event, selector, callback){
    return selector == undefined || $.isFunction(selector) ?
      this.unbind(event, selector) : this.undelegate(selector, event, callback)
  }

  $.fn.trigger = function(event, data){
    if (typeof event == 'string') event = $.Event(event)
    fix(event)
    event.data = data
    return this.each(function(){
      // items in the collection might not be DOM elements
      // (todo: possibly support events on plain old objects)
      if('dispatchEvent' in this) this.dispatchEvent(event)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, data){
    var e, result
    this.each(function(i, element){
      e = createProxy(typeof event == 'string' ? $.Event(event) : event)
      e.data = data
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback){ return this.bind(event, callback) }
  })

  ;['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback)
      else if (this.length) try { this.get(0)[name]() } catch(e){}
      return this
    }
  })

  $.Event = function(type, props) {
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null)
    return event
  }

})(Zepto)
;(function($){
  function detect(ua){
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/WebKit\/([\d.]+)/),
      android = ua.match(/(Android)\s+([\d.]+)/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/)

    // todo clean this up with a better OS/browser
    // separation. we need to discern between multiple
    // browsers on android, and decide if kindle fire in
    // silk mode is android or not

    if (browser.webkit = !!webkit) browser.version = webkit[1]

    if (android) os.android = true, os.version = android[2]
    if (iphone) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
    if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
    if (webos) os.webos = true, os.version = webos[2]
    if (touchpad) os.touchpad = true
    if (blackberry) os.blackberry = true, os.version = blackberry[2]
    if (kindle) os.kindle = true, os.version = kindle[1]
    if (silk) browser.silk = true, browser.version = silk[1]
    if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
  }

  detect.call($, navigator.userAgent)
  // make available to unit tests
  $.__detect = detect

})(Zepto)
;(function($, undefined){
  var prefix = '', eventPrefix, endEventName, endAnimationName,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
    document = window.document, testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    clearProperties = {}

  function downcase(str) { return str.toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) }

  $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + downcase(vendor) + '-'
      eventPrefix = event
      return false
    }
  })

  clearProperties[prefix + 'transition-property'] =
  clearProperties[prefix + 'transition-duration'] =
  clearProperties[prefix + 'transition-timing-function'] =
  clearProperties[prefix + 'animation-name'] =
  clearProperties[prefix + 'animation-duration'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function(properties, duration, ease, callback){
    if ($.isObject(duration))
      ease = duration.easing, callback = duration.complete, duration = duration.duration
    if (duration) duration = duration / 1000
    return this.anim(properties, duration, ease, callback)
  }

  $.fn.anim = function(properties, duration, ease, callback){
    var transforms, cssProperties = {}, key, that = this, wrappedCallback, endEvent = $.fx.transitionEnd
    if (duration === undefined) duration = 0.4
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssProperties[prefix + 'animation-name'] = properties
      cssProperties[prefix + 'animation-duration'] = duration + 's'
      endEvent = $.fx.animationEnd
    } else {
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) {
          transforms || (transforms = [])
          transforms.push(key + '(' + properties[key] + ')')
        }
        else cssProperties[key] = properties[key]

      if (transforms) cssProperties[prefix + 'transform'] = transforms.join(' ')
      if (!$.fx.off && typeof properties === 'object') {
        cssProperties[prefix + 'transition-property'] = Object.keys(properties).join(', ')
        cssProperties[prefix + 'transition-duration'] = duration + 's'
        cssProperties[prefix + 'transition-timing-function'] = (ease || 'linear')
      }
    }

    wrappedCallback = function(event){
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, arguments.callee)
      }
      $(this).css(clearProperties)
      callback && callback.call(this)
    }
    if (duration > 0) this.bind(endEvent, wrappedCallback)

    setTimeout(function() {
      that.css(cssProperties)
      if (duration <= 0) setTimeout(function() {
        that.each(function(){ wrappedCallback.call(this) })
      }, 0)
    }, 0)

    return this
  }

  testEl = null
})(Zepto)
;(function($){
  var jsonpID = 0,
      isObject = $.isObject,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.defaultPrevented
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options){
    var callbackName = 'jsonp' + (++jsonpID),
      script = document.createElement('script'),
      abort = function(){
        $(script).remove()
        if (callbackName in window) window[callbackName] = empty
        ajaxComplete('abort', xhr, options)
      },
      xhr = { abort: abort }, abortTimeout

    if (options.error) script.onerror = function() {
      xhr.abort()
      options.error()
    }

    window[callbackName] = function(data){
      clearTimeout(abortTimeout)
      $(script).remove()
      delete window[callbackName]
      ajaxSuccess(data, xhr, options)
    }

    serializeData(options)
    script.src = options.url.replace(/=\?/, '=' + callbackName)
    $('head').append(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.abort()
        ajaxComplete('timeout', xhr, options)
      }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    accepts: {
      script: 'text/javascript, application/javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0
  }

  function mimeToDataType(mime) {
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (isObject(options.data)) options.data = $.param(options.data)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data)
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {})
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host

    var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url)
    if (dataType == 'jsonp' || hasPlaceholder) {
      if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
      return $.ajaxJSONP(settings)
    }

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)

    var mime = settings.accepts[dataType],
        baseHeaders = { },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = $.ajaxSettings.xhr(), abortTimeout

    if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
    if (mime) {
      baseHeaders['Accept'] = mime
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.data && settings.type.toUpperCase() != 'GET'))
      baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
    settings.headers = $.extend(baseHeaders, settings.headers || {})

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : JSON.parse(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings)
          else ajaxSuccess(result, xhr, settings)
        } else {
          ajaxError(null, 'error', xhr, settings)
        }
      }
    }

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async)

    for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      return false
    }

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  $.get = function(url, success){ return $.ajax({ url: url, success: success }) }

  $.post = function(url, data, success, dataType){
    if ($.isFunction(data)) dataType = dataType || success, success = data, data = null
    return $.ajax({ type: 'POST', url: url, data: data, success: success, dataType: dataType })
  }

  $.getJSON = function(url, success){
    return $.ajax({ url: url, success: success, dataType: 'json' })
  }

  $.fn.load = function(url, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector
    if (parts.length > 1) url = parts[0], selector = parts[1]
    $.get(url, function(response){
      self.html(selector ?
        $(document.createElement('div')).html(response.replace(rscript, "")).find(selector).html()
        : response)
      success && success.call(self)
    })
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var array = $.isArray(obj)
    $.each(obj, function(key, value) {
      if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (traditional ? $.isArray(value) : isObject(value))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
    serialize(params, obj, traditional)
    return params.join('&').replace('%20', '+')
  }
})(Zepto)
;(function ($) {
  $.fn.serializeArray = function () {
    var result = [], el
    $( Array.prototype.slice.call(this.get(0).elements) ).each(function () {
      el = $(this)
      var type = el.attr('type')
      if (this.nodeName.toLowerCase() != 'fieldset' &&
        !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        ((type != 'radio' && type != 'checkbox') || this.checked))
        result.push({
          name: el.attr('name'),
          value: el.val()
        })
    })
    return result
  }

  $.fn.serialize = function () {
    var result = []
    this.serializeArray().forEach(function (elm) {
      result.push( encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value) )
    })
    return result.join('&')
  }

  $.fn.submit = function (callback) {
    if (callback) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.defaultPrevented) this.get(0).submit()
    }
    return this
  }

})(Zepto)
;(function($){
  var touch = {}, touchTimeout

  function parentIfText(node){
    return 'tagName' in node ? node : node.parentNode
  }

  function swipeDirection(x1, x2, y1, y2){
    var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2)
    return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
  }

  var longTapDelay = 750, longTapTimeout

  function longTap(){
    longTapTimeout = null
    if (touch.last) {
      touch.el.trigger('longTap')
      touch = {}
    }
  }

  function cancelLongTap(){
    if (longTapTimeout) clearTimeout(longTapTimeout)
    longTapTimeout = null
  }

  $(document).ready(function(){
    var now, delta

    $(document.body).bind('touchstart', function(e){
      now = Date.now()
      delta = now - (touch.last || now)
      touch.el = $(parentIfText(e.touches[0].target))
      touchTimeout && clearTimeout(touchTimeout)
      touch.x1 = e.touches[0].pageX
      touch.y1 = e.touches[0].pageY
      if (delta > 0 && delta <= 250) touch.isDoubleTap = true
      touch.last = now
      longTapTimeout = setTimeout(longTap, longTapDelay)
    }).bind('touchmove', function(e){
      cancelLongTap()
      touch.x2 = e.touches[0].pageX
      touch.y2 = e.touches[0].pageY
    }).bind('touchend', function(e){
       cancelLongTap()

      // double tap (tapped twice within 250ms)
      if (touch.isDoubleTap) {
        touch.el.trigger('doubleTap')
        touch = {}

      // swipe
      } else if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
                 (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)) {
        touch.el.trigger('swipe') &&
          touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
        touch = {}

      // normal tap
      } else if ('last' in touch) {
        touch.el.trigger('tap')

        touchTimeout = setTimeout(function(){
          touchTimeout = null
          touch.el.trigger('singleTap')
          touch = {}
        }, 250)
      }
    }).bind('touchcancel', function(){
      if (touchTimeout) clearTimeout(touchTimeout)
      if (longTapTimeout) clearTimeout(longTapTimeout)
      longTapTimeout = touchTimeout = null
      touch = {}
    })
  })

  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m){
    $.fn[m] = function(callback){ return this.bind(m, callback) }
  })
})(Zepto)

;include.setCurrent({ id: 'framework.ruqq.base', namespace: 'framework.ruqq.base', url: '{url}'});
;void

function() {
   "use strict";

   var w = window,
       r = typeof w.ruqq === 'undefined' ? (w.ruqq = {}) : ruqq;

   r.doNothing = function() {
      return false;
   };


   
   void
   function(r) {
      var div = document.createElement('div'),
          I = {};
      r.info = I;

      I.hasTouchSupport = (function() {
         if ('createTouch' in document) return true;
         try {
            return !!document.createEvent("TouchEvent").initTouchEvent;
         } catch (error) {
            return false;
         }
      })();
      I.prefix = (function() {
         if ('webkitTransition' in div.style) return 'webkit';
         if ('MozTransition' in div.style) return 'Moz';
         if ('OTransition' in div.style) return 'O';
         if ('msTransition' in div.style) return 'ms';
         return '';
      })();
      I.cssprefix = I.prefix ? '-' + I.prefix.toLowerCase() + '-' : '';
      I.supportTransitions = I.prefix + 'TransitionProperty' in div.style;

   }(r);


   return r;

}();
;include.setCurrent({ id: 'framework.utils', namespace: 'framework.utils', url: '{url}'});
;void

function() {
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
            if (index == -1) break;
            output += str.substring(lastIndex, index);
            var end = str.indexOf('}', index);

            output += obj[str.substring(index + 2, end)];
            lastIndex = ++end;
        }
        output += str.substring(lastIndex);
        return output;
    }


    Object.defaults = function(obj, def) {
        for (var key in def) if (obj[key] == null) obj[key] = def[key];
        return obj;
    }
    Object.clear = function(obj, arg) {
        if (arg instanceof Array) {
            for (var i = 0, x, length = arg.length; x = arg[i], i < length; i++) if (x in obj) delete obj[x];
        } else if (typeof arg === 'object') {
            for (var key in arg) if (key in obj) delete obj[key];
        }
        return obj;
    }

    Object.extend = function(target, source) {
        if (target == null) target = {};
        if (source == null) return target;
        for (var key in source) if (source[key] != null) target[key] = source[key];
        return target;
    }

    Object.getProperty = function(o, chain) {
        if (typeof o !== 'object' || chain == null) return o;
        if (typeof chain === 'string') chain = chain.split('.');
        if (chain.length === 1) return o[chain[0]];
        return Object.getProperty(o[chain.shift()], chain);
    }

    Object.observe = function(obj, property, callback) {
        if (obj.__observers == null) obj.__observers = {};
        if (obj.__observers[property]) {
            obj.__observers[property].push(callback);
            return;
        };
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
                for (var i = 0, fn, length = obj.__observers[property].length; fn = obj.__observers[property][i], i < length; i++) {
                    fn(x);
                }
            }
        })
    }

    Date.format = function(date, format) {
        if (!format) format = "MM/dd/yyyy";

        function pad(value) {
            return value > 9 ? value : '0' + value;
        }
        format = format.replace("MM", pad(date.getMonth() + 1));
        var _year = date.getFullYear();
        if (format.indexOf("yyyy") > -1) format = format.replace("yyyy", _year);
        else if (format.indexOf("yy") > -1) format = format.replace("yy", _year.toString().substr(2, 2));

        format = format.replace("dd", pad(date.getDate()));

        if (format.indexOf("HH") > -1) format = format.replace("HH", pad(date.getHours()));
        if (format.indexOf("mm") > -1) format = format.replace("mm", pad(date.getMinutes()));
        if (format.indexOf("ss") > -1) format = format.replace("ss", pad(date.getSeconds()));
        return format;
    }


}();
;include.setCurrent({ id: 'framework.animation', namespace: 'framework.animation', url: '{url}'});
;
include.js({
    framework: 'ruqq.base'
}).done(function() {
    var w = window,
        r = ruqq,
        prfx = r.info.cssprefix;

    r.animate = (function() {
        function Animate(element, property, valueTo, duration, callback, valueFrom, timing) {
            
            
            var data = typeof property === 'string' ? {
                property: property,
                valueFrom: valueFrom,
                valueTo: valueTo,
                duration: duration,
                timing: timing,
                callback: callback
            } : property,
                $this = $(element);

            if (data.timing == null) data.timing = 'linear';
            if (data.duration == null) data.duration = 300;

            
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
                    var timeout = setTimeout(data.callback.bind($this), data.duration);
                    $this.data('cssAnimationCallback', timeout);
                }

                element = null;
                data = null;
            }, 0);

            return this;
        }

        function AnimateModel(model, ondone) {
            var isarray = model instanceof Array,
                length = isarray ? model.length : 1,
                x = null;

            var beforeCss = null;
            for (var i = 0; x = isarray ? model[i] : model, isarray ? i < length : i < 1; i++) {
                if (x.from == null) continue;                
                (beforeCss || (beforeCss = {}))[x.prop] = x.from;
            }
            
            
            for (var i = 0; x = isarray ? model[i] : model, isarray ? i < length : i < 1; i++) {
                var callback = x.onComplete ? scopeModel(x.onComplete) : ondone;
                Animate(x.element, x.prop, x.to, x.duration, callback, x.from, x.timing);
            }
        }

        function scopeModel(model, callback) {
            return function() {
                AnimateModel(model, callback);
            }
        }

        return function(argument, property, valueTo, duration, callback, valueFrom, timing) {
            if (argument instanceof HTMLElement) {
                Animate(argument, property, valueTo, duration, callback, valueFrom, timing);
                return this;
            }
            AnimateModel(argument, property);
            return this;
        }
    })();

    
    
    var I = {
        prop: prfx + 'transition-property',
        duration: prfx + 'transition-duration',
        timing: prfx + 'transition-timing-function'
    };
    
    r.animate.Model = Class({        
        Construct: function(model, ondone){
            this.count = 0;
            this.addModel(model);            
        },
        addModel: function(model){            
            if (model instanceof Array){
                for(var i = 0, x, length = model.length; x = model[i], i<length; i++){
                    this.addModel(x);
                }
                return;
            }            
            switch(typeof model){
                case 'string':
                    this._addModel(this._parse(model));
                    break;
                case 'object':
                    if (model != null) this._addModel(model);
                    break;                    
            }            
        },
        start: function(element){
            if (this.startCss){
                for(var key in this.startCss) element.style[key] = this.startCss[key];
            }
            setTimeout(function(){
                for(var key in this.css){
                    element.style[key] = this.css[key];
                }                
            }.bind(this),0)
        },
        /**
         *  '{prop} | {?from} > {to} | {duration}ms | {?timing}'
         */
        _parse: function(model){
            var arr = model.split(/ *\| */g),
                data = {},
                length = arr.length;
            
            data.prop = arr[0];
            
            var vals = arr[1].split(/ *> */);
            data.from = vals.length == 2 ? vals[0] : null;
            data.to = vals[vals.length - 1];
            
            
            data.duration = length >  2 ? arr[2] : '200ms';
            data.timing = length > 3 ? arr[3] : 'linear';
           
            return data;
        },
        /**
         * Apply Raw Object */
        _addModel: function(data){
            this.count++;
            
            if (data.from != null){
                if (this.startCss == null) this.startCss = {};
                this.startCss[data.prop] = data.from;
            }            
            if (this.css == null)  this.css = {};
            
            for(var key in I) this.css[I[key]] = (this.css[I[key]] ? this.css[I[key]] + ',' : '') + data[key];            
            
            ////this.css[I.prop] = (this.css[I.prop] ? this.css[I.prop] + ',' : '') + data.prop;            
            ////this.css[I.duration] = (this.css[I.duration] ? this.css[I.duration] + ',' : '') + data.duration;
            ////this.css[I.timing] = (this.css[I.timing] ? this.css[I.timing] + ',' : '') + data.timing;
            
            this.css[data.prop] = data.to;
        }
    });



    r.animate.sprite = (function() {
        var keyframes = {},
            prfx = r.info.cssprefix,
            vendor = null,
            initVendorStrings = function(){
                var prfx = r.info.prefix;
                vendor = {
                    keyframes: "@" + prfx+ "keyframes",
                    AnimationIterationCount: prfx + 'AnimationIterationCount',
                    AnimationDuration: prfx + 'AnimationDuration',
                    AnimationTimingFunction: prfx + 'AnimationTimingFunction',
                    AnimationFillMode: prfx + 'AnimationFillMode',
                    AnimationName: prfx + 'AnimationFillMode'
                }
            }
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
                        spriteAnimation.stop($element);
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
                        spriteAnimation.stop($element, css);
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
                if (css != null) $element.css(css);
            }
        }
    })();

});
;include.setCurrent({ id: 'lib.mask', namespace: 'lib.mask', url: '{url}'});
;//include('script/ruqq/class.js', function() {


window.mask = (function(w, d) {


	var regexp = {
		noWhitespace: /[^\s]/g,
		whitespace: /\s/g,
		attributes: /(([\w_-]+)='([^']+))|(\.([\w-_]+)[# \.;{])|(#([\w-_]+)[ \.])/g,
		linearCondition: /([!]?[\w\.-]+)([!<>=]{1,2})?([^\|\&]+)?([\|\&]{2})?/g,
		escapedChar: {
			"'": /\\'/g,
			'"': /\\"/g,
			'{': /\\\{/g,
			'>': /\\>/g,
			';': /\\>/g
		},
		attrEnd: /[\.#>\{ ;]/g
	},
		singleTags = {
			img: 1,
			input: 1,
			br: 1,
			hr: 1,
			link: 1
		};

	var Helper = {
		extend: function(target, source) {
			if (source == null) return target;
			if (target == null) target = {};
			for (var key in source) target[key] = source[key];
			return target;
		},
		getProperty: function(o, chain) {
			if (typeof o !== 'object' || chain == null) return o;
			if (typeof chain === 'string') chain = chain.split('.');
			if (chain.length === 1) return o[chain[0]];
			return this.getProperty(o[chain.shift()], chain);
		},
		templateFunction: function(arr, o) {

			var output = '';
			for (var i = 0; i < arr.length; i++) {
				if (i % 2 === 0) {
					output += arr[i];
				} else {
					var key = arr[i],
						value = null,
						index = key.indexOf(':');

					if (index > -1) {
						var utility = index > 0 ? key.substring(0, index).replace(regexp.whitespace, '') : '';
						if (utility === '') utility = 'condition';

						key = key.substring(index + 1);
						value = typeof ValueUtilities[utility] === 'function' ? ValueUtilities[utility](key, o) : null;

					} else {
						value = Helper.getProperty(o, arr[i]);
					}
					output += value == null ? '' : value;
				}
			}
			return output;
		}
	}

	var Template = function(template) {
		this.template = template;
		this.index = 0;
		this.length = template.length;
	}
	Template.prototype = {
		next: function() {
			this.index++;
			return this;
		},
		skipWhitespace: function() {
			//regexp.noWhitespace.lastIndex = this.index;
			//var result = regexp.noWhitespace.exec(this.template);
			//if (result){                
			//    this.index = result.index;                
			//}
			//return this;

			for (; this.index < this.length; this.index++) {
				if (this.template.charCodeAt(this.index) !== 32 /*' '*/ ) return this;
			}

			return this;
		},
		skipToChar: function(c) {
			var index = this.template.indexOf(c, this.index);
			if (index > -1) {
				this.index = index;
				if (this.template.charCodeAt(index - 1) !== 92 /*'\\'*/ ) {
					return this;
				}
				this.next().skipToChar(c);
			}
			return this;

		},
		skipToAny: function(chars) {
			var r = regexp[chars];
			if (r == null) {
				console.error('Unknown regexp %s: Create', chars);
				r = (regexp[chars] = new RegExp('[' + chars + ']', 'g'));
			}

			r.lastIndex = this.index;
			var result = r.exec(this.template);
			if (result != null) {
				this.index = result.index;
			}
			return this;
		},
		skipToAttributeBreak: function() {

			//regexp.attrEnd.lastIndex = ++this.index;
			//var result;
			//do{
			//    result = regexp.attrEnd.exec(this.template);
			//    if (result != null){
			//        if (result[0] == '#' && this.template.charCodeAt(this.index + 1) === 123) {
			//            regexp.attrEnd.lastIndex += 2;
			//            continue;
			//        }
			//        this.index = result.index;                    
			//        break;
			//    }
			//}while(result != null)
			//return this;
			var c;
			do {
				c = this.template.charCodeAt(++this.index);
				// if c == # && next() == { - continue */
				if (c === 35 && this.template.charCodeAt(this.index + 1) === 123) {
					this.index++;
					c = null;
				}
			}
			while (c !== 46 && c !== 35 && c !== 62 && c !== 123 && c !== 32 && c !== 59 && this.index < this.length);
			//while(!== ".#>{ ;");
			return this;
		},
		sliceToChar: function(c) {
			var start = this.index,
				isEscaped, index;

			while ((index = this.template.indexOf(c, this.index)) > -1) {
				this.index = index;
				if (this.template.charCodeAt(index - 1) !== 92 /*'\\'*/ ) {
					break;
				}
				isEscaped = true;
				this.index++;
			}

			var value = this.template.substring(start, this.index);
			return isEscaped ? value.replace(regexp.escapedChar[c], c) : value;

			//-return this.skipToChar(c).template.substring(start, this.index);
		},
		sliceToAny: function(chars) {
			var start = this.index;
			return this.skipToAny(chars).template.substring(start, this.index);
		}
	}

	var ICustomTag = function() {
		if (this.attr == null) this.attr = {};
	};
	ICustomTag.prototype.render = function(values, stream) {
		return stream instanceof Array ? Builder.buildHtml(this.noes, values, stream) : Builder.buildDom(this.nodes, values, stream);
	}

	var CustomTags = (function(ICustomTag) {
		var List = function() {
			this.attr = {}
		}
		List.prototype.render = function(values, container, cntx) {

			values = Helper.getProperty(values, this.attr.value);
			if (values instanceof Array === false) return container;


			if (this.attr.template != null) {
				var template = document.querySelector(this.attr.template).innerHTML;
				this.nodes = mask.compile(template);
			}


			if (this.nodes == null) return container;

			//-var fn = container instanceof Array ? 'buildHtml' : 'buildDom';
			var fn = container.buffer != null ? 'buildHtml' : 'buildDom';

			for (var i = 0, length = values.length; i < length; i++) {
				Builder[fn](this.nodes, values[i], container, cntx);
			}
			return container;
		}
		var Visible = function() {
			this.attr = {}
		}
		Visible.prototype.render = function(values, container, cntx) {
			if (ValueUtilities.out.isCondition(this.attr.check, values) === false) return container;
			return ICustomTag.prototype.render.call(this, values, container, cntx);
		}
		var Binding = function() {
			this.attr = {}
		}
		Binding.prototype.render = function(values, container) {
			var value = values[this.attr.value];
			Object.defineProperty(values, this.attr.value, {
				get: function() {
					return value;
				},
				set: function(x) {
					container.innerHTML = (value = x);
				}
			})
			container.innerHTML = value;
			return container;
		}


		return {
			all: {
				list: List,
				visible: Visible,
				bind: Binding
			}
		}
	})(ICustomTag);


	var ValueUtilities = (function(H, regexp) {
		//condition1 == condition2 ? case1 : case2            
		var parseLinearCondition = function(line) {
			var c = {
				assertions: []
			},
				buffer = {
					data: line.replace(regexp.whitespace, '')
				};

			buffer.index = buffer.data.indexOf('?');
			if (buffer.index == -1) console.error('Invalid Linear Condition: ? - no found');



			var match, expr = buffer.data.substring(0, buffer.index);
			while ((match = regexp.linearCondition.exec(expr)) != null) {
				c.assertions.push({
					join: match[4],
					left: match[1],
					sign: match[2],
					right: match[3]
				});
			}

			buffer.index++;
			parseCase(buffer, c, 'case1');

			buffer.index++;
			parseCase(buffer, c, 'case2');

			return c;
		},
			parseCase = function(buffer, obj, key) {
				var c = buffer.data[buffer.index],
					end = null;

				if (c == null) return;
				if (c === '"' || c === "'") {
					end = buffer.data.indexOf(c, ++buffer.index);
					obj[key] = buffer.data.substring(buffer.index, end);
				} else {
					end = buffer.data.indexOf(':', buffer.index);
					if (end == -1) end = buffer.data.length;
					obj[key] = {
						value: buffer.data.substring(buffer.index, end)
					};
				}
				if (end != null) buffer.index = ++end;
			},
			isCondition = function(con, values) {
				if (typeof con === 'string') con = parseLinearCondition(con);
				var current = false;
				for (var i = 0; i < con.assertions.length; i++) {
					var a = con.assertions[i],
						value1, value2;
					if (a.right == null) {

						current = a.left.charCodeAt(0) === 33 ? !H.getProperty(values, a.left.substring(1)) : !! H.getProperty(values, a.left);

						if (current == true) {
							if (a.join == '&&') continue;
							break;
						}
						if (a.join == '||') continue;
						break;
					}
					var c = a.right.charCodeAt(0);
					if (c === 34 || c === 39) {
						value2 = a.right.substring(1, a.right.length - 1);
					} else if (c > 47 && c < 58) {
						value2 = a.right;
					} else {
						value2 = H.getProperty(values, a.right);
					}

					value1 = H.getProperty(values, a.left);
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
						current = value1 != value2;
						break;
					case '==':
						current = value1 == value2;
						break;
					}

					if (current == true) {
						if (a.join == '&&') continue;
						break;
					}
					if (a.join == '||') continue;
					break;
				}
				return current;
			};

		return {
			condition: function(line, values) {
				con = parseLinearCondition(line);
				var result = isCondition(con, values) ? con.case1 : con.case2;;

				if (result == null) return '';
				if (typeof result === 'string') return result;
				return H.getProperty(values, result.value);
			},
			out: {
				isCondition: isCondition,
				parse: parseLinearCondition
			}
		}
	})(Helper, regexp);



	var Parser = {
		toFunction: function(template) {

			var arr = template.split('#{'),
				length = arr.length;

			for (var i = 1; i < length; i++) {
				var key = arr[i],
					index = key.indexOf('}');
				arr.splice(i, 0, key.substring(0, index));
				i++;
				length++;
				arr[i] = key.substring(index + 1);
			}

			template = null;
			return function(o) {
				return Helper.templateFunction(arr, o);
			}
		},
		parseAttributes: function(T, node) {

			var key, value, _classNames, quote;
			if (node.attr == null) node.attr = {};

			for (; T.index < T.length; T.index++) {
				key = null;
				value = null;
				var c = T.template.charCodeAt(T.index);
				switch (c) {
				case 32:
					//case 9: was replaced while compiling
					//case 10: 
					continue;

					//case '{;>':
				case 123:
				case 59:
				case 62:
					if (_classNames != null) {
						node.attr['class'] = _classNames.indexOf('#{') > -1 ? (T.serialize !== true ? this.toFunction(_classNames) : {
							template: _classNames
						}) : _classNames;

					}
					return;

				case 46:
					/* '.' */

					var start = T.index + 1;
					T.skipToAttributeBreak();

					value = T.template.substring(start, T.index);

					_classNames = _classNames != null ? _classNames + ' ' + value : value;
					T.index--;
					break;
				case 35:
					/* '#' */
					key = 'id';

					var start = T.index + 1;
					T.skipToAttributeBreak();
					value = T.template.substring(start, T.index);

					T.index--;
					break;
				default:
					key = T.sliceToChar('=');

					do(quote = T.template.charAt(++T.index))
					while (quote == ' ');

					T.index++;
					value = T.sliceToChar(quote);

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

		},
		/** @out : nodes */
		parse: function(T, nodes) {
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

					var content = T.sliceToChar(c == 39 ? "'" : '"');
					if (content.indexOf('#{') > -1) content = T.serialize !== true ? this.toFunction(content) : {
						template: content
					};

					var t = {
						content: content
					}
					if (current.nodes == null) current.nodes = t;
					else if (current.nodes.push == null) current.nodes = [current.nodes, t];
					else current.nodes.push(t);
					//-current.nodes.push(t);

					if (current.__single) {
						if (current == null) continue;
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
				case 125:
					/* '}' */
					if (current == null) continue;

					do(current = current.parent)
					while (current != null && current.__single != null);

					continue;
				}



				var start = T.index;
				do(c = T.template.charCodeAt(++T.index))
				while (c !== 32 && c !== 35 && c !== 46 && c !== 59 && c !== 123 && c !== 62); /** while !: ' ', # , . , ; , { <*/


				var tagName = T.template.substring(start, T.index);

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

				if (current.nodes == null) current.nodes = tag;
				else if (current.nodes.push == null) current.nodes = [current.nodes, tag];
				else current.nodes.push(tag);
				//-if (current.nodes == null) current.nodes = [];
				//-current.nodes.push(tag);

				current = tag;

				this.parseAttributes(T, current);

				T.index--;
			}
			return T.nodes;
		},
		cleanObject: function(obj) {
			if (obj instanceof Array) {
				for (var i = 0; i < obj.length; i++) this.cleanObject(obj[i]);
				return obj;
			}
			delete obj.parent;
			delete obj.__single;

			if (obj.nodes != null) this.cleanObject(obj.nodes);

			return obj;
		}
	};

	var Builder = {
		buildDom: function(nodes, values, container, cntx) {
			if (nodes == null) return container;

			if (container == null) {
				container = d.createDocumentFragment();
			}
			if (cntx == null) {
				cntx = {
					//events: {}
				};
			}

			var isarray = nodes instanceof Array,
				length = isarray ? nodes.length : 1,
				node = null;

			for (var i = 0; node = isarray ? nodes[i] : nodes, isarray ? i < length : i < 1; i++) {

				if (CustomTags.all[node.tagName] != null) {

					var custom = new CustomTags.all[node.tagName](values);
					custom.compoName = node.tagName;
					custom.nodes = node.nodes;

					custom.attr = custom.attr == null ? node.attr : Helper.extend(custom.attr, node.attr);

					(cntx.components || (cntx.components = [])).push(custom);
					//cntx = custom;
					custom.parent = cntx;
					custom.render(values, container, custom);


					continue;
				}
				if (node.content != null) {
					container.appendChild(d.createTextNode(typeof node.content == 'function' ? node.content(values) : node.content));
					continue;
				}

				var tag = d.createElement(node.tagName);
				for (var key in node.attr) {
					var value = typeof node.attr[key] == 'function' ? node.attr[key](values) : node.attr[key];
					if (value) tag.setAttribute(key, value);
				}

				if (node.nodes != null) {
					this.buildDom(node.nodes, values, tag, cntx);
				}
				container.appendChild(tag);

			}
			return container;
		},
		//////////buildHtml: function(node, values, stream) {
		//////////
		//////////	if (stream == null) stream = [];
		//////////	if (node instanceof Array) {
		//////////		for (var i = 0, length = node.length; i < length; i++) this.buildHtml(node[i], values, stream);
		//////////		return stream;
		//////////	}
		//////////
		//////////	if (CustomTags.all[node.tagName] != null) {
		//////////		var custom = new CustomTags.all[node.tagName]();
		//////////		for (var key in node) custom[key] = node[key];
		//////////		custom.render(values, stream);
		//////////		return stream;
		//////////	}
		//////////	if (node.content != null) {
		//////////		stream.push(typeof node.content === 'function' ? node.content(values) : node.content);
		//////////		return stream;
		//////////	}
		//////////
		//////////	stream.push('<' + node.tagName);
		//////////	for (var key in node.attr) {
		//////////		var value = typeof node.attr[key] == 'function' ? node.attr[key](values) : node.attr[key];
		//////////		if (value) {
		//////////			stream.push(' ' + key + "='");
		//////////			stream.push(value);
		//////////			stream.push("'");
		//////////		}
		//////////	}
		//////////	if (singleTags[node.tagName] != null) {
		//////////		stream.push('/>');
		//////////		if (node.nodes != null) console.error('Html could be invalid: Single Tag Contains children:', node);
		//////////	} else {
		//////////		stream.push('>');
		//////////		if (node.nodes != null) {
		//////////			this.buildHtml(node.nodes, values, stream);
		//////////		}
		//////////		stream.push('</' + node.tagName + '>');
		//////////	}
		//////////	return stream;
		//////////},
		buildHtml: function(nodes, values, writer) {
			if (writer == null) {
				writer = {
					buffer: ''
				}
			}

			var isarray = nodes instanceof Array,
				length = isarray ? nodes.length : 1,
				node = null;

			for (var i = 0; node = isarray ? nodes[i] : nodes, isarray ? i < length : i < 1; i++) {

				if (CustomTags.all[node.tagName] != null) {
					var custom = new CustomTags.all[node.tagName]();
					for (var key in node) custom[key] = node[key];
					custom.render(values, writer);
					return writer;
				}
				if (node.content != null) {
					writer.buffer += typeof node.content === 'function' ? node.content(values) : node.content;
					return writer;
				}

				writer.buffer += '<' + node.tagName;
				for (var key in node.attr) {
					var value = typeof node.attr[key] == 'function' ? node.attr[key](values) : node.attr[key];
					if (value) {
						writer.buffer += ' ' + key + "='" + value + "'";
					}
				}
				if (singleTags[node.tagName] != null) {
					writer.buffer += '/>';
					if (node.nodes != null) console.error('Html could be invalid: Single Tag Contains children:', node);
				} else {
					writer.buffer += '>';
					if (node.nodes != null) {
						this.buildHtml(node.nodes, values, writer);
					}

					writer.buffer += '</' + node.tagName + '>';
				}
			}
			return writer;
		}
	}


	return {
		/**
		 * @see renderDom
		 * @description - normally you should use renderDom, as this function is slower
		 * @return html {string} 
		 */
		renderHtml: function(template, values) {
			if (typeof template === 'string') {
				template = this.compile(template);
			}
			return Builder.buildHtml(template, values).buffer //-join('');
		},

		/**
		 * @arg template - {template{string} | maskDOM{array}}
		 * @arg values - template values
		 * @arg container - optional, - place to renderDOM, @default - DocumentFragment
		 * @return container {@default DocumentFragment}
		 */
		renderDom: function(template, values, container, cntx) {
			//////try {
				if (typeof template === 'string') {
					template = this.compile(template);					
				}
				return Builder.buildDom(template, values, container, cntx);
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
		compile: function(template, serializeOnly) {
			/** remove line-comments and unimportant whitespaces */
			template = template//
				.replace(/^\s*\/\/[^\r\n]*/gm,' ')
				.replace(/[\t\n\r]|[ ]{2,}/g, ' ');
			var T = new Template(template);
			if (serializeOnly == true) T.serialize = true;

			return Parser.parse(T, []);
		},
		registerHandler: function(tagName, TagHandler) {
			CustomTags.all[tagName] = TagHandler;
		},
		getHandler: function(tagName) {
			return CustomTags.all[tagName]
		},
		registerUtility: function(utilityName, fn) {
			ValueUtilities[utilityName] = fn;
		},
		serialize: function(template) {
			return Parser.cleanObject(this.compile(template, true));
		},
		deserialize: function(serialized) {
			if (serialized instanceof Array) {
				for (var i = 0; i < serialized.length; i++) {
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
				for (var key in serialized.attr) {
					if (serialized.attr[key].template == null) continue;
					serialized.attr[key] = Parser.toFunction(serialized.attr[key].template);
				}
			}
			if (serialized.nodes != null) {
				this.deserialize(serialized.nodes);
			}
			return serialized;
		},
		ICustomTag: ICustomTag,
		ValueUtils: ValueUtilities
	}
})(window, document);




//});
;include.setCurrent({ id: 'lib.compo', namespace: 'lib.compo', url: '{url}'});
;include.js({
	lib: 'mask'
}).done(function() {

	var w = window,
		regexp = {
			trailingSpaces: /^\s+/
		},
		Helper = {
			resolveDom: function(compo, values) {
				if (compo.nodes != null) {
					if (compo.tagName != null) return compo;

					return mask.renderDom(compo.nodes, values);
				}
				if (compo.attr.template != null) {
					var e;
					if (compo.attr.template[0] === '#') {
						e = document.getElementById(compo.attr.template.substring(1));
						if (e == null) {
							console.error('Template Element not Found:', arg);
							return null;
						}
					}
					return mask.renderDom(e != null ? e.innerHTML : compo.attr.template, values);
				}
				return null;
			},
			ensureTemplate: function(compo) {
				if (compo.nodes != null) return;

				var template;
				if (compo.attr.template != null) {
					if (compo.attr.template[0] === '#') template = this.templateById(compo.attr.template.substring(1));
					else template = compo.attr.template;

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
				if (e == null) console.error('Template Element not Found:', id);
				else
				return e.innerHTML;
				return '';
			},
			containerArray: function() {
				var arr = [];
				arr.appendChild = function(child) {
					this.push(child);
				}
				return arr;
			},
			parseSelector: function(selector, type, direction){
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
				
				if (direction == 'up') nextKey = 'parent';
				else nextKey = type == 'node' ? 'nodes' : 'components';
				
				return {
					key: key,
					prop: prop,
					selector: selector,
					nextKey : nextKey
				}
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
				if (component.listeners == null) component.listeners = {};
				component.listeners[event] = fn;
			}
		},
		Events_ = {
			on: function(component, events) {
				var isarray = events instanceof Array,
					length = isarray ? events.length : 1,
					x = null;
				for (var i = 0; x = isarray ? events[i] : events, isarray ? i < length : i < 1; i++) {

					if (x instanceof Array) {
						component.$.on.apply(component.$, x);
						continue;
					}


					for (var key in x) {
						var fn = typeof x[key] === 'string' ? component[x[key]] : x[key],
							parts = key.split(':');

						component.$.on(parts[0] || 'click', parts.splice(1).join(':'), fn.bind(component));
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
				if (template[0] == '#') template = Helper.templateById(template.substring(1));
				this.nodes = mask.compile(template);
			}

		},
		render: function(values, container, cntx) {
			this.create(values, cntx);

			if (container != null) {
				for (var i = 0; i < this.$.length; i++) container.appendChild(this.$[i]);
			}
			return this;
		},
		insert: function(parent) {
			for (var i = 0; i < this.$.length; i++) parent.appendChild(this.$[i]);

			Shots.emit(this, 'DOMInsert');
			return this;
		},
		append: function(template, values, selector) {
			if (this.$ == null) {
				var dom = typeof template == 'string' ? mask.compile(template) : template,
					parent = selector ? Compo.findNode(this, selector) : this;

				if (parent.nodes == null) this.nodes = dom;
				else if (parent.nodes instanceof Array) parent.nodes.push(dom);
				else parent.nodes = [this.nodes, dom];

				return this;
			}
			var array = mask.renderDom(template, values, Helper.containerArray(), this),
				parent = selector ? this.$.find(selector) : this.$;

			for (var i = 0; i < array.length; i++) parent.append(array[i]);

			Shots.emit(this, 'DOMInsert');
			return this;
		},
		create: function(values, cntx) {
			if (cntx == null) cntx = this;

			Helper.ensureTemplate(this);

			var elements = mask.renderDom(this.tagName == null ? this.nodes : this, values, Helper.containerArray(), cntx);
			this.$ = $(elements);

			if (this.events != null) {
				Events_.on(this, this.events);
			}
			if (this.compos != null) {
				for (var key in this.compos) {
					if (typeof this.compos[key] !== 'string') continue;
					var selector = this.compos[key],
						index = selector.indexOf(':'),
						engine = selector.substring(0, index);

					engine = Compo.config.selectors[engine];

					if (engine == null) {
						this.compos[key] = this.$.get(0).querySelector(selector);
						continue;
					}

					selector = selector.substring(++index).replace(regexp.trailingSpaces, '');
					this.compos[key] = engine(this, selector);

				}
			}

			return this;
		},
		on: function() {
			var x = Array.prototype.slice.call(arguments)
			switch (arguments.length) {
			case 1:
			case 2:
				x.unshift('click');
				break;

			}

			if (this.events == null) this.events = [x];
			else if (this.events instanceof Array) this.events.push(x)
			else this.events = [x, this.events];
			return this;
		},
		remove: function() {
			this.$ && this.$.remove();
			Compo.dispose(this);

			if (this.parent != null) {
				var i = this.parent.components.indexOf(compo);
				this.parent.components.splice(i, 1);
			}

			return this;
		},
		Static: {
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
					$ = lib;
				}
			},			
			match: function(compo, selector, type){
				if (typeof selector === 'string') {
					if (type == null) type = compo.compoName ? 'compo' : 'node';
					selector = Helper.parseSelector(selector, type, direction);					
				}
				
				var obj = selector.prop ? compo[selector.prop] : compo;
				if (obj == null) return false;
				
				if (selector.selector.test != null) {
					if (selector.selector.test(obj[selector.key])) return true;
				} else {
					if (obj[selector.key] == selector.selector) return true;
				}
				return false;
			},
			find: function(compo, selector, direction, type) {
				if (compo == null) return null;

				if (typeof selector === 'string') {
					if (type == null) type = compo.compoName ? 'compo' : 'node';
					selector = Helper.parseSelector(selector, type, direction);
					
				}

				if (compo instanceof Array) {
					for (var i = 0, x, length = compo.length; x = compo[i], i < length; i++) {
						var r = Compo.find(x, selector);
						
						
						if (r != null) return r;
					}
					return null;
				}
				
				if (Compo.match(compo, selector) == true) return compo;
				
				return  Compo.find(compo[selector.nextKey], selector);
			},
			findCompo: function(compo, selector, direction) {
				return Compo.find(compo, selector, direction, 'compo');

			},
			findNode: function(compo, selector, direction) {
				return Compo.find(compo, selector, direction, 'node');
			},
			dispose: function(compo) {
				compo.dispose && compo.dispose();
				if (this.components == null) return;
				for (var i = 0, x, length = compo.components.length; x = compo.components[i], i < length; i++) {
					Compo.dispose(x);
				}
			},
			events: Shots
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
				arr = arguments[3] || []
			
			if (typeof selector === 'string') selector = Helper.parseSelector(selector, type);
			
			
			if (Compo.match(current, selector)){
				arr.push(current);
			}
			
			var childs = current[selector.nextKey];
			
			if (childs != null){
				for (var i=0; i < childs.length; i++) {
					this.all(selector, null, childs[i], arr);
				}
			}
			
			return arr;
		}
	}

	var Manipulate = {
		addClass: function(_class) {
			this.attr.class = this.attr.class ? this.attr.class + ' ' + _class : _class;
		}
	}

	w.CompoUtils = Class({
		Extends: [Traversing, Manipulate]
	});

});
;include.setCurrent({ id: 'compo.scroller/iscroll-full.js', namespace: 'undefined', url: '{url}'});
;/*!
 * iScroll v4.2.2 ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
(function(window, doc){
var m = Math,
	dummyStyle = doc.createElement('div').style,
	vendor = (function () {
		var vendors = 't,webkitT,MozT,msT,OT'.split(','),
			t,
			i = 0,
			l = vendors.length;

		for ( ; i < l; i++ ) {
			t = vendors[i] + 'ransform';
			if ( t in dummyStyle ) {
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
    hasTransform = !!vendor,
    hasTransitionEnd = prefixStyle('transition') in dummyStyle,

	RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
	START_EV = hasTouch ? 'touchstart' : 'mousedown',
	MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
	END_EV = hasTouch ? 'touchend' : 'mouseup',
	CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
	WHEEL_EV = vendor == 'Moz' ? 'DOMMouseScroll' : 'mousewheel',
	TRNEND_EV = (function () {
		if ( vendor === false ) return false;

		var transitionEnd = {
				''			: 'transitionend',
				'webkit'	: 'webkitTransitionEnd',
				'Moz'		: 'transitionend',
				'O'			: 'otransitionend',
				'ms'		: 'MSTransitionEnd'
			};

		return transitionEnd[vendor];
	})(),

	nextFrame = (function() {
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(callback) { return setTimeout(callback, 1); };
	})(),
	cancelFrame = (function () {
		return window.cancelRequestAnimationFrame ||
			window.webkitCancelAnimationFrame ||
			window.webkitCancelRequestAnimationFrame ||
			window.mozCancelRequestAnimationFrame ||
			window.oCancelRequestAnimationFrame ||
			window.msCancelRequestAnimationFrame ||
			clearTimeout;
	})(),

	// Helpers
	translateZ = has3d ? ' translateZ(0)' : '',

	// Constructor
	iScroll = function (el, options) {
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
			checkDOMChanges: false,		// Experimental
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
			onBeforeScrollStart: function (e) { e.preventDefault(); },
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
		if ( that.options.zoom && isAndroid ){
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
			if (that.options.wheelAction != 'none')
				that._bind(WHEEL_EV);
		}

		if (that.options.checkDOMChanges) that.checkDOMTime = setInterval(function () {
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
	currPageX: 0, currPageY: 0,
	pagesX: [], pagesY: [],
	aniTime: null,
	wheelZoomCount: 0,
	
	handleEvent: function (e) {
		var that = this;
		switch(e.type) {
			case START_EV:
				if (!hasTouch && e.button !== 0) return;
				that._start(e);
				break;
			case MOVE_EV: that._move(e); break;
			case END_EV:
			case CANCEL_EV: that._end(e); break;
			case RESIZE_EV: that._resize(); break;
			case WHEEL_EV: that._wheel(e); break;
			case TRNEND_EV: that._transitionEnd(e); break;
		}
	},
	
	_checkDOMChanges: function () {
		if (this.moved || this.zoomed || this.animating ||
			(this.scrollerW == this.scroller.offsetWidth * this.scale && this.scrollerH == this.scroller.offsetHeight * this.scale)) return;

		this.refresh();
	},
	
	_scrollbar: function (dir) {
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
				bar.style.cssText = 'position:absolute;z-index:100;background:rgba(100,100,100,0.4);border:1px solid rgba(200,200,200,0.5);' + cssVendor + 'background-clip:padding-box;' + cssVendor + 'box-sizing:border-box;' + (dir == 'h' ? 'height:100%' : 'width:100%') + ';' + cssVendor + 'border-radius:3px;border-radius:3px';
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
	
	_resize: function () {
		var that = this;
		setTimeout(function () { that.refresh(); }, isAndroid ? 200 : 0);
	},
	
	_pos: function (x, y) {
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

	_scrollbarPos: function (dir, hidden) {
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
	
	_start: function (e) {
		var that = this,
			point = hasTouch ? e.touches[0] : e,
			matrix, x, y,
			c1, c2;

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
			c1 = m.abs(e.touches[0].pageX-e.touches[1].pageX);
			c2 = m.abs(e.touches[0].pageY-e.touches[1].pageY);
			that.touchesDistStart = m.sqrt(c1 * c1 + c2 * c2);

			that.originX = m.abs(e.touches[0].pageX + e.touches[1].pageX - that.wrapperOffsetLeft * 2) / 2 - that.x;
			that.originY = m.abs(e.touches[0].pageY + e.touches[1].pageY - that.wrapperOffsetTop * 2) / 2 - that.y;

			if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
		}

		if (that.options.momentum) {
			if (that.options.useTransform) {
				// Very lame general purpose alternative to CSSMatrix
				matrix = getComputedStyle(that.scroller, null)[transform].replace(/[^0-9\-.,]/g, '').split(',');
				x = +matrix[4];
				y = +matrix[5];
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

		that.absStartX = that.x;	// Needed by snap threshold
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
	
	_move: function (e) {
		var that = this,
			point = hasTouch ? e.touches[0] : e,
			deltaX = point.pageX - that.pointX,
			deltaY = point.pageY - that.pointY,
			newX = that.x + deltaX,
			newY = that.y + deltaY,
			c1, c2, scale,
			timestamp = e.timeStamp || Date.now();

		if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, e);

		// Zoom
		if (that.options.zoom && hasTouch && e.touches.length > 1) {
			c1 = m.abs(e.touches[0].pageX - e.touches[1].pageX);
			c2 = m.abs(e.touches[0].pageY - e.touches[1].pageY);
			that.touchesDist = m.sqrt(c1*c1+c2*c2);

			that.zoomed = true;

			scale = 1 / that.touchesDistStart * that.touchesDist * this.scale;

			if (scale < that.options.zoomMin) scale = 0.5 * that.options.zoomMin * Math.pow(2.0, scale / that.options.zoomMin);
			else if (scale > that.options.zoomMax) scale = 2.0 * that.options.zoomMax * Math.pow(0.5, that.options.zoomMax / scale);

			that.lastScale = scale / this.scale;

			newX = this.originX - this.originX * that.lastScale + this.x,
			newY = this.originY - this.originY * that.lastScale + this.y;

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
	
	_end: function (e) {
		if (hasTouch && e.touches.length !== 0) return;

		var that = this,
			point = hasTouch ? e.changedTouches[0] : e,
			target, ev,
			momentumX = { dist:0, time:0 },
			momentumY = { dist:0, time:0 },
			duration = (e.timeStamp || Date.now()) - that.startTime,
			newPosX = that.x,
			newPosY = that.y,
			distX, distY,
			newDuration,
			snap,
			scale;

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
					that.doubleTapTimer = setTimeout(function () {
						that.doubleTapTimer = null;

						// Find the last touched element
						target = point.target;
						while (target.nodeType != 1) target = target.parentNode;

						if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
							ev = doc.createEvent('MouseEvents');
							ev.initMouseEvent('click', true, true, e.view, 1,
								point.screenX, point.screenY, point.clientX, point.clientY,
								e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
								0, null);
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

			if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = { dist:0, time:0 };
			if ((that.y > that.minScrollY && newPosY > that.minScrollY) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = { dist:0, time:0 };
		}

		if (momentumX.dist || momentumY.dist) {
			newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);

			// Do we need to snap?
			if (that.options.snap) {
				distX = newPosX - that.absStartX;
				distY = newPosY - that.absStartY;
				if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) { that.scrollTo(that.absStartX, that.absStartY, 200); }
				else {
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
	
	_resetPos: function (time) {
		var that = this,
			resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
			resetY = that.y >= that.minScrollY || that.maxScrollY > 0 ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

		if (resetX == that.x && resetY == that.y) {
			if (that.moved) {
				that.moved = false;
				if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);		// Execute custom code on scroll end
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

	_wheel: function (e) {
		var that = this,
			wheelDeltaX, wheelDeltaY,
			deltaX, deltaY,
			deltaScale;

		if ('wheelDeltaX' in e) {
			wheelDeltaX = e.wheelDeltaX / 3;
			wheelDeltaY = e.wheelDeltaY / 3;
		} else if('wheelDelta' in e) {
			wheelDeltaX = wheelDeltaY = e.wheelDelta / 3;
		} else if ('detail' in e) {
			wheelDeltaX = wheelDeltaY = -e.detail * 3;
		} else {
			return;
		}
		
		if (that.options.wheelAction == 'zoom') {
			deltaScale = that.scale * Math.pow(2, 1/3 * (wheelDeltaY ? wheelDeltaY / Math.abs(wheelDeltaY) : 0));
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
	
	_transitionEnd: function (e) {
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
	_startAni: function () {
		var that = this,
			startX = that.x, startY = that.y,
			startTime = Date.now(),
			step, easeOut,
			animate;

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

		animate = function () {
			var now = Date.now(),
				newX, newY;

			if (now >= startTime + step.time) {
				that._pos(step.x, step.y);
				that.animating = false;
				if (that.options.onAnimationEnd) that.options.onAnimationEnd.call(that);			// Execute custom code on animation end
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

	_transitionTime: function (time) {
		time += 'ms';
		this.scroller.style[transitionDuration] = time;
		if (this.hScrollbar) this.hScrollbarIndicator.style[transitionDuration] = time;
		if (this.vScrollbar) this.vScrollbarIndicator.style[transitionDuration] = time;
	},

	_momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
		var deceleration = 0.0006,
			speed = m.abs(dist) / time,
			newDist = (speed * speed) / (2 * deceleration),
			newTime = 0, outsideDist = 0;

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

		return { dist: newDist, time: m.round(newTime) };
	},

	_offset: function (el) {
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

		return { left: left, top: top };
	},

	_snap: function (x, y) {
		var that = this,
			i, l,
			page, time,
			sizeX, sizeY;

		// Check page X
		page = that.pagesX.length - 1;
		for (i=0, l=that.pagesX.length; i<l; i++) {
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
		page = that.pagesY.length-1;
		for (i=0; i<page; i++) {
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

		return { x: x, y: y, time: time };
	},

	_bind: function (type, el, bubble) {
		(el || this.scroller).addEventListener(type, this, !!bubble);
	},

	_unbind: function (type, el, bubble) {
		(el || this.scroller).removeEventListener(type, this, !!bubble);
	},


	/**
	*
	* Public methods
	*
	*/
	destroy: function () {
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
			that._unbind(WHEEL_EV);
		}
		
		if (that.options.useTransition) that._unbind(TRNEND_EV);
		
		if (that.options.checkDOMChanges) clearInterval(that.checkDOMTime);
		
		if (that.options.onDestroy) that.options.onDestroy.call(that);
	},

	refresh: function () {
		var that = this,
			offset,
			i, l,
			els,
			pos = 0,
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
			for (i=0, l=els.length; i<l; i++) {
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
			if (that.maxScrollX%that.wrapperW) that.pagesX[that.pagesX.length] = that.maxScrollX - that.pagesX[that.pagesX.length-1] + that.pagesX[that.pagesX.length-1];

			pos = 0;
			page = 0;
			that.pagesY = [];
			while (pos >= that.maxScrollY) {
				that.pagesY[page] = pos;
				pos = pos - that.wrapperH;
				page++;
			}
			if (that.maxScrollY%that.wrapperH) that.pagesY[that.pagesY.length] = that.maxScrollY - that.pagesY[that.pagesY.length-1] + that.pagesY[that.pagesY.length-1];
		}

		// Prepare the scrollbars
		that._scrollbar('h');
		that._scrollbar('v');

		if (!that.zoomed) {
			that.scroller.style[transitionDuration] = '0';
			that._resetPos(400);
		}
	},

	scrollTo: function (x, y, time, relative) {
		var that = this,
			step = x,
			i, l;

		that.stop();

		if (!step.length) step = [{ x: x, y: y, time: time, relative: relative }];
		
		for (i=0, l=step.length; i<l; i++) {
			if (step[i].relative) { step[i].x = that.x - step[i].x; step[i].y = that.y - step[i].y; }
			that.steps.push({ x: step[i].x, y: step[i].y, time: step[i].time || 0 });
		}

		that._startAni();
	},

	scrollToElement: function (el, time) {
		var that = this, pos;
		el = el.nodeType ? el : that.scroller.querySelector(el);
		if (!el) return;

		pos = that._offset(el);
		pos.left += that.wrapperOffsetLeft;
		pos.top += that.wrapperOffsetTop;

		pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
		pos.top = pos.top > that.minScrollY ? that.minScrollY : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
		time = time === undefined ? m.max(m.abs(pos.left)*2, m.abs(pos.top)*2) : time;

		that.scrollTo(pos.left, pos.top, time);
	},

	scrollToPage: function (pageX, pageY, time) {
		var that = this, x, y;
		
		time = time === undefined ? 400 : time;

		if (that.options.onScrollStart) that.options.onScrollStart.call(that);

		if (that.options.snap) {
			pageX = pageX == 'next' ? that.currPageX+1 : pageX == 'prev' ? that.currPageX-1 : pageX;
			pageY = pageY == 'next' ? that.currPageY+1 : pageY == 'prev' ? that.currPageY-1 : pageY;

			pageX = pageX < 0 ? 0 : pageX > that.pagesX.length-1 ? that.pagesX.length-1 : pageX;
			pageY = pageY < 0 ? 0 : pageY > that.pagesY.length-1 ? that.pagesY.length-1 : pageY;

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

	disable: function () {
		this.stop();
		this._resetPos(0);
		this.enabled = false;

		// If disabled after touchstart we make sure that there are no left over events
		this._unbind(MOVE_EV, window);
		this._unbind(END_EV, window);
		this._unbind(CANCEL_EV, window);
	},
	
	enable: function () {
		this.enabled = true;
	},
	
	stop: function () {
		if (this.options.useTransition) this._unbind(TRNEND_EV);
		else cancelFrame(this.aniTime);
		this.steps = [];
		this.moved = false;
		this.animating = false;
	},
	
	zoom: function (x, y, scale, time) {
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
	
	isReady: function () {
		return !this.moved && !this.zoomed && !this.animating;
	}
};

function prefixStyle (style) {
	if ( vendor === '' ) return style;

	style = style.charAt(0).toUpperCase() + style.substr(1);
	return vendor + style;
}

dummyStyle = null;	// for the sake of it

if (typeof exports !== 'undefined') exports.iScroll = iScroll;
else window.iScroll = iScroll;

})(window, document);
;include.setCurrent({ id: 'compo.scroller', namespace: 'compo.scroller', url: '{url}'});
;include.js('iscroll-full.js').done(function() {
   mask.registerHandler('scroller', Class({
      Base: Compo,
      DOMInsert: function() {
         if (this.scroller == null) this.scroller = new iScroll(this.$[0],{vScrollbar: true, hScrollbar: true});         
      },
      render: function(values, container, cntx) {

         this.tagName = 'div';
         this.attr.class = (this.attr.class ? this.attr.class + ' ': '') + 'scroller';
         
         this.nodes = {
            tagName: 'div',
            attr: {
               class: 'scroller-container'
            },
            nodes: this.nodes
         };
         
         
         Compo.prototype.render.call(this, values, container, cntx);
         Compo.events.on(this, 'DOMInsert', this.DOMInsert);
         
         return this;
      },
      dispose: function() {
         if (this.scroller) this.scroller.destroy();
      }
   }));
});
;include.setCurrent({ id: 'compo.prism/prism.lib.js', namespace: 'undefined', url: '{url}'});
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
;include.setCurrent({ id: 'compo.prism', namespace: 'compo.prism', url: '{url}'});
;include.js('prism.lib.js').css('prism.lib.css').done(function() {
    
    function IDeferred(){}    
    IDeferred.prototype = {
        resolve: function(){
            this.done = function(fn){
                fn();
            }
            if (this.callbacks){
                for(var i = 0, x, length = this.callbacks.length; x = this.callbacks[i], i<length; i++){
                    x()
                }
            }
            delete this.callbacks;
        },
        done: function(fn){
            (this.callbacks || (this.callbacks = [])).push(fn);
        }
    }
    
    
    function highlight(compo){
        Prism.highlightElement(compo.$.find('code').get(0));
        
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
                window.include.ajax(this.attr.src).done(function(r) {
                    _this.$.find('code').html(r.ajax[0]);                    
                    
                    highlight(_this);                    
                });
            }else {
                highlight(this);
            }
        }
    }));
});
;include.setCurrent({ id: 'controller.viewsManager', namespace: 'controller.viewsManager', url: '{url}'});
;include.lazy({
    'ruqq.animation': {
        framework: 'animation'
    }
}).done(function() {

    var Helper = {
        doSwitch: function($current, $next) {
            $current.removeClass('active');
            $next.addClass('active');
            
            var prfx = ruqq.info.cssprefix;
            ruqq.animate({
                element: $next,
                prop: prfx + 'transform',
                from: 'translate3d(0px, -110%, 0px)',
                to: 'translate3d(0px, 0px, 0px)',
                duration: 300,
                timing: 'cubic-bezier(.58,1.54,.59,.75)'
            });            
        }
    }

	
	var currentCompo;
    window.ViewsManager = Class({
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
            
			var activity = Compo.findCompo(app, 'pageActivity').show(),
				name = info.view.replace('View', '');
            
			
            window.include.js({
                controller: name + '/' + name
            }).done(function() {
                
                this.append(name + 'View;',{});
				
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
			var compo = Compo.findCompo(this, info.view);
            if (compo == null) {
                this.load(info);
                return;
            }
			
			this.performShow(compo, info);
        },
		performShow: function(compo, info){
			
			compo.section(info);
			
			if (compo == currentCompo) return;
			
			currentCompo = compo;
            
			if (this.$) Helper.doSwitch(this.$.children('.active'), compo.$);
            compo.activate && compo.activate();
		}
    });

    mask.registerHandler('viewsManager', ViewsManager);

});
;include.setCurrent({ id: 'controller.view', namespace: 'controller.view', url: '{url}'});
;include.css('view.css').done(function() {


   function when(idfrs, callback) {
      var wait = idfrs.length,
          ondone = function() {
            if (--wait == 0) callback();
          };
          
      for (var i = 0, x, length = idfrs.length; x = idfrs[i], i < length; i++) {         
         x.done(ondone);
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
         'changed: .radioButtons': function(e) {
            var name = this.attr.id.replace('View', '');
            window.routes.set(name + '/' + e.data.name);
         }
      },

      tab: function(name) {
         this.$.find('.tabPanel > .active').removeClass('active');
         this.$.find('.tabPanel > .' + name).addClass('active');
         
         var scroller = Compo.find(this, 'scroller').scroller;
         scroller.scrollTo(0,0);
         scroller.refresh();
         
      },

      section: function(info) {
         if (!info.category) info.category = this.defaultCategory || 'info';

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
         var scroller = Compo.find(this, 'scroller').scroller;         
         
         scroller.refresh();
         
         if (info.anchor){
            var element = this.$.find('a[name="' + info.anchor + '"]').get(0);
            scroller.scrollToElement(element, 100);
         }
      },
      activate: function() {
         var scroller = Compo.find(this, 'scroller');
         scroller && scroller.scroller && scroller.scroller.refresh();
      }

   }));
});
;include.setCurrent({ id: 'uicontrol.radioButtons', namespace: 'uicontrol.radioButtons', url: '{url}'});
;mask.registerHandler('radioButtons', Class({
    Base: Compo,
    Construct: function() {            
        this.on('button:not(.active)', function(e) {
            var $this = $(e.target);
            $this.parent().children('.active').removeClass('active');
            $this.addClass('active');
            this.$.trigger('changed', e.target);
        }.bind(this));              
    },
    render: function() {
        this.tagName = 'div';
        this.attr.class = 'radioButtons ' + (this.attr.class || '');
        Compo.prototype.render.apply(this, arguments);
    },
    
    setActive: function(name){
        var button = this.$.find('[name='+name+']');
        
        button.parent().children('.active').removeClass('active');
        button.addClass('active');
    }
}));

;include.setCurrent({ id: 'uicontrol.pageActivity', namespace: 'uicontrol.pageActivity', url: '{url}'});
;void

function() {


    var I = ruqq.info,
        vendor = null,
        initVendorStrings = function() {
            vendor = {
                TransitionProperty: I.prefix + 'TransitionProperty',
                Transform: I.prefix + 'Transform',
                Transition: I.prefix + 'Transition',
                cssTransform: I.cssprefix + 'transform'
            }
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
            if (this.interval) return;


            var style = this.$.get(0).style;
            if (I.supportTransitions) {
                if (vendor == null) initVendorStrings();

                
                style[vendor.TransitionProperty] = 'none';
                style[vendor.Transform] = 'rotate(0deg)';

                setTimeout(function() {
                    style[vendor.Transition] = vendor.cssTransform + ' 5s linear'
                    style[vendor.Transform] = 'rotate(720deg)';
                }, 1);

                this.interval = setInterval(function() {
                    style[vendor.TransitionProperty] = 'none';
                    style[vendor.Transform] = 'rotate(0deg)';

                    setTimeout(function() {
                        style[vendor.Transition] = vendor.cssTransform + ' 5s linear'
                        style[vendor.Transform] = 'rotate(720deg)';
                    }, 0)
                }, 5000);

            } else {
                this.interval = setInterval(function() {
                    this.currentPos += this.data.height;
                    if (this.currentPos > this.data.height * this.data.frames - 1) {
                        this.currentPos = 0;
                    }
                    this.$.css('background-position', '0px -' + this.currentPos + 'px');
                }.bind(this), this.data.fps ? 1000 / this.data.fps : 100);
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
            }
        },
        render: function() {
            this.tagName = 'div';
            this.attr.style = 'position:fixed; top:0px; left:0px; right: 0px; bottom:0px;background:rgba(0,0,0,.5);display:none;'
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

}();
;include.setCurrent({ id: '/script/handler/routes.js', namespace: '', url: '{url}'});
;void

function(w) {

    /** convert line parameters to object. : 'e=10' to {e:10} */
    var deserialize = function(line) {
        var o = {};
        if (!line) return o;
        for (var item, i, parts = line.split('&');
        (item = parts[(i = -~i) - 1]) && (item = item.split('=')) && (item.length == 2);) {
            o[item[0]] = item[1];
        }
        return o;
    }

    /**
     *      route = {Object}
     *      {
     *              match: {regexp},
     *              param: {querystring} /** 'key=$1&key2=$2'
     *      }
     */

    w.Routes = Class({
        Construct: function(routes) {
            if (routes) {
                var isarray = routes instanceof Array,
                    length = isarray ? routes.length : 1,
                    x = null;
                for (var i = 0; x = isarray ? routes[i] : routes, isarray ? i < length : i < 1; i++) {
                    this.add(x);
                }
            }
            window.onhashchange = this.hashchanged.bind(this);
        },
        hashchanged: function() {
            var hash = (w.location.hash || '').replace(/^#\/?/, '');

            if (this.routes == null) return;

            for (var i = 0, x, length = this.routes.length; x = this.routes[i], i < length; i++) {
                var result = x.match.exec(hash);
                if (!result || !result.length) continue;

                x.callback(deserialize(hash.replace(x.match, x.param)));
            }
        },
        add: function(route) {

            (this.routes || (this.routes = [])).push(route);
        },
        set: function(hash) {
            w.location.hash = '/' + hash;
        },
        current: function() {
            var hash = (w.location.hash || '').replace(/^#\/?/, '');

            if (this.routes) {

                for (var i = 0, x, length = this.routes.length; x = this.routes[i], i < length; i++) {
                    var result = x.match.exec(hash);
                    if (!result || !result.length) continue;

                    return deserialize(hash.replace(x.match, x.param));
                }
            }
            return null;
        }
    });




}(window);
;include.setCurrent({ id: '/script/main.js', namespace: 'undefined', url: '{url}'});
;window.onerror = function(e, a, b) {
    console.error(arguments, typeof a.stack);
}

include.cfg({
	lockedToFolder: true,
    controller: '/script/component/{name}.js',
    uicontrol: '/script/control/{name}.js'
}).js({
    framework: ['dom/zepto', 'ruqq.base', 'utils', 'animation'],
	lib: 'compo'    
}).wait().js({
    compo: ['scroller', 'prism'],
    controller: ['viewsManager', 'view'],
    uicontrol: ['radioButtons', 'pageActivity'],
	'': '/script/handler/routes.js'
}).ready(function() {
    
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
            scrollerView: {
                name: 'Scroller'
            },
            prismView: {
                name: 'Prism'
            },
            formsView: {
                name: 'Forms'
            },
			
			
            aboutView: {
                name: 'About'
            },
            classView: {
                name: 'ClassJS'
            },
            maskView: {
                name: 'MaskJS'
            },
            includeView: {
                name: 'IncludeJS'
            },
            includeBuilderView: {
                name: 'IncludeJS.Builder'
            },
            compoView: {
                name: 'CompoJS'
            },
			ruqqView: {
                name: 'RuqqJS'
            }
			
        },
        aggr = function(keys, fn) {
            var arr = [];
            if (keys == null) keys = Object.keys(views);
            for (var i = 0; i < keys.length; i++) arr.push(fn(keys[i], views[keys[i]]));
            return arr;
        };

    var model = {
        libraries: aggr(['classView', 'maskView', 'includeView','includeBuilderView', 'compoView', 'ruqqView'], function(key, x) {
            return {
                id: key,
                name: x.name
            }
        }),
        components: aggr(['scrollerView', 'prismView'], function(key, x) {
            return {
                id: key,
                name: x.name
            }
        })
    };




    Compo.config.setDOMLibrary($);

    w.app = new(Class({
        Base: Compo,
        attr: {
            template: '#layout'
        },
        events: {
            'click: menu li': function(e) {
                var view = $(e.target).data('view');
				
                routes.set(view.replace('View',''));
            }
        }
    }));
	

    w.app.render(model).insert(document.body);
	
	
	w.routes = new Routes({
		match: /([\w]+)(\/([\w]+))?(\/([\w]+))?/,
		param: 'view=$1View&category=$3&anchor=$5',
		callback: viewsManager.show.bind(viewsManager)
	});
	
	
	

	
	viewsManager.show(w.routes.current() || { view : 'aboutView' });



});