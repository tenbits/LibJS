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
;include.cfg({"lib":"/.reference/libjs/{name}/lib/{name}.js","framework":"/.reference/libjs/framework/lib/{name}.js","compo":"/.reference/libjs/compos/{name}/lib/{name}.js","lockedToFolder":true,"controller":"/script/component/{name}.js","uicontrol":"/script/control/{name}.js"}); include.register({"css":[{"id":"/style/main.css","url":"style/main.css","namespace":""},{"id":"controller.view/view.css","url":"view.css"},{"id":"compo.prism/prism.lib.css","url":"prism.lib.css"}],"lazy":[{"id":"framework.animation","url":"/.reference/libjs/framework/lib/animation.js","namespace":"framework.animation"}],"js":[{"id":"/.reference/libjs/class/lib/class.js","url":".reference/libjs/class/lib/class.js","namespace":""},{"id":"/.reference/libjs/include/lib/include.js","url":".reference/libjs/include/lib/include.js","namespace":""},{"id":"/include.routes.js","url":"include.routes.js","namespace":""},{"id":"framework.es5shim","url":"/.reference/libjs/framework/lib/es5shim.js","namespace":"framework.es5shim"},{"id":"framework.dom/jquery","url":"/.reference/libjs/framework/lib/dom/jquery.js","namespace":"framework.dom/jquery"},{"id":"framework.ruqq.base","url":"/.reference/libjs/framework/lib/ruqq.base.js","namespace":"framework.ruqq.base"},{"id":"framework.utils","url":"/.reference/libjs/framework/lib/utils.js","namespace":"framework.utils"},{"id":"framework.animation","url":"/.reference/libjs/framework/lib/animation.js","namespace":"framework.animation"},{"id":"lib.mask","url":"/.reference/libjs/mask/lib/mask.js","namespace":"lib.mask"},{"id":"lib.compo","url":"/.reference/libjs/compo/lib/compo.js","namespace":"lib.compo"},{"id":"compo.scroller/iscroll-full.js","url":"iscroll-full.js"},{"id":"compo.scroller","url":"/.reference/libjs/compos/scroller/lib/scroller.js","namespace":"compo.scroller"},{"id":"compo.prism/prism.lib.js","url":"prism.lib.js"},{"id":"compo.prism","url":"/.reference/libjs/compos/prism/lib/prism.js","namespace":"compo.prism"},{"id":"controller.viewsManager","url":"/script/component/viewsManager.js","namespace":"controller.viewsManager"},{"id":"controller.view","url":"/script/component/view.js","namespace":"controller.view"},{"id":"uicontrol.radioButtons","url":"/script/control/radioButtons.js","namespace":"uicontrol.radioButtons"},{"id":"uicontrol.pageActivity","url":"/script/control/pageActivity.js","namespace":"uicontrol.pageActivity"},{"id":"/script/handler/routes.js","url":"/script/handler/routes.js","namespace":""},{"id":"/script/main.js","url":"script/main.js","namespace":""}]})
;include.setCurrent({ id: '/include.routes.js', namespace: '', url: '{url}'});
;include.cfg({
     "lib": "/.reference/libjs/{name}/lib/{name}.js",
     "framework": "/.reference/libjs/framework/lib/{name}.js",
     "compo": "/.reference/libjs/compos/{name}/lib/{name}.js"
});
;include.setCurrent({ id: 'framework.es5shim', namespace: 'framework.es5shim', url: '{url}'});
;if (typeof Function.prototype.bind === 'undefined') {
    Function.prototype.bind = function() {
        if (arguments.length < 2 && typeof arguments[0] == "undefined") return this;
        var __method = this,
            args = Array.prototype.slice.call(arguments),
            object = args.shift();
        return function() {
            return __method.apply(object, args.concat(Array.prototype.slice.call(arguments)));
        }
    }
}


if (typeof Date.now === 'undefined') {
    Date.now = function() {
        return new Date().getTime();
    }
}

window.requestAnimationFrame = (function() {
	var w = window;
	return w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.mozRequestAnimationFrame || w.oRequestAnimationFrame || w.msRequestAnimationFrame ||
	function(callback) {
		return setTimeout(callback, 17);
	}
})();
;include.setCurrent({ id: 'framework.dom/jquery', namespace: 'framework.dom/jquery', url: '{url}'});
;/*! jQuery v1.8.2 jquery.com | jquery.org/license */
(function(a,b){function G(a){var b=F[a]={};return p.each(a.split(s),function(a,c){b[c]=!0}),b}function J(a,c,d){if(d===b&&a.nodeType===1){var e="data-"+c.replace(I,"-$1").toLowerCase();d=a.getAttribute(e);if(typeof d=="string"){try{d=d==="true"?!0:d==="false"?!1:d==="null"?null:+d+""===d?+d:H.test(d)?p.parseJSON(d):d}catch(f){}p.data(a,c,d)}else d=b}return d}function K(a){var b;for(b in a){if(b==="data"&&p.isEmptyObject(a[b]))continue;if(b!=="toJSON")return!1}return!0}function ba(){return!1}function bb(){return!0}function bh(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function bi(a,b){do a=a[b];while(a&&a.nodeType!==1);return a}function bj(a,b,c){b=b||0;if(p.isFunction(b))return p.grep(a,function(a,d){var e=!!b.call(a,d,a);return e===c});if(b.nodeType)return p.grep(a,function(a,d){return a===b===c});if(typeof b=="string"){var d=p.grep(a,function(a){return a.nodeType===1});if(be.test(b))return p.filter(b,d,!c);b=p.filter(b,d)}return p.grep(a,function(a,d){return p.inArray(a,b)>=0===c})}function bk(a){var b=bl.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}function bC(a,b){return a.getElementsByTagName(b)[0]||a.appendChild(a.ownerDocument.createElement(b))}function bD(a,b){if(b.nodeType!==1||!p.hasData(a))return;var c,d,e,f=p._data(a),g=p._data(b,f),h=f.events;if(h){delete g.handle,g.events={};for(c in h)for(d=0,e=h[c].length;d<e;d++)p.event.add(b,c,h[c][d])}g.data&&(g.data=p.extend({},g.data))}function bE(a,b){var c;if(b.nodeType!==1)return;b.clearAttributes&&b.clearAttributes(),b.mergeAttributes&&b.mergeAttributes(a),c=b.nodeName.toLowerCase(),c==="object"?(b.parentNode&&(b.outerHTML=a.outerHTML),p.support.html5Clone&&a.innerHTML&&!p.trim(b.innerHTML)&&(b.innerHTML=a.innerHTML)):c==="input"&&bv.test(a.type)?(b.defaultChecked=b.checked=a.checked,b.value!==a.value&&(b.value=a.value)):c==="option"?b.selected=a.defaultSelected:c==="input"||c==="textarea"?b.defaultValue=a.defaultValue:c==="script"&&b.text!==a.text&&(b.text=a.text),b.removeAttribute(p.expando)}function bF(a){return typeof a.getElementsByTagName!="undefined"?a.getElementsByTagName("*"):typeof a.querySelectorAll!="undefined"?a.querySelectorAll("*"):[]}function bG(a){bv.test(a.type)&&(a.defaultChecked=a.checked)}function bY(a,b){if(b in a)return b;var c=b.charAt(0).toUpperCase()+b.slice(1),d=b,e=bW.length;while(e--){b=bW[e]+c;if(b in a)return b}return d}function bZ(a,b){return a=b||a,p.css(a,"display")==="none"||!p.contains(a.ownerDocument,a)}function b$(a,b){var c,d,e=[],f=0,g=a.length;for(;f<g;f++){c=a[f];if(!c.style)continue;e[f]=p._data(c,"olddisplay"),b?(!e[f]&&c.style.display==="none"&&(c.style.display=""),c.style.display===""&&bZ(c)&&(e[f]=p._data(c,"olddisplay",cc(c.nodeName)))):(d=bH(c,"display"),!e[f]&&d!=="none"&&p._data(c,"olddisplay",d))}for(f=0;f<g;f++){c=a[f];if(!c.style)continue;if(!b||c.style.display==="none"||c.style.display==="")c.style.display=b?e[f]||"":"none"}return a}function b_(a,b,c){var d=bP.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function ca(a,b,c,d){var e=c===(d?"border":"content")?4:b==="width"?1:0,f=0;for(;e<4;e+=2)c==="margin"&&(f+=p.css(a,c+bV[e],!0)),d?(c==="content"&&(f-=parseFloat(bH(a,"padding"+bV[e]))||0),c!=="margin"&&(f-=parseFloat(bH(a,"border"+bV[e]+"Width"))||0)):(f+=parseFloat(bH(a,"padding"+bV[e]))||0,c!=="padding"&&(f+=parseFloat(bH(a,"border"+bV[e]+"Width"))||0));return f}function cb(a,b,c){var d=b==="width"?a.offsetWidth:a.offsetHeight,e=!0,f=p.support.boxSizing&&p.css(a,"boxSizing")==="border-box";if(d<=0||d==null){d=bH(a,b);if(d<0||d==null)d=a.style[b];if(bQ.test(d))return d;e=f&&(p.support.boxSizingReliable||d===a.style[b]),d=parseFloat(d)||0}return d+ca(a,b,c||(f?"border":"content"),e)+"px"}function cc(a){if(bS[a])return bS[a];var b=p("<"+a+">").appendTo(e.body),c=b.css("display");b.remove();if(c==="none"||c===""){bI=e.body.appendChild(bI||p.extend(e.createElement("iframe"),{frameBorder:0,width:0,height:0}));if(!bJ||!bI.createElement)bJ=(bI.contentWindow||bI.contentDocument).document,bJ.write("<!doctype html><html><body>"),bJ.close();b=bJ.body.appendChild(bJ.createElement(a)),c=bH(b,"display"),e.body.removeChild(bI)}return bS[a]=c,c}function ci(a,b,c,d){var e;if(p.isArray(b))p.each(b,function(b,e){c||ce.test(a)?d(a,e):ci(a+"["+(typeof e=="object"?b:"")+"]",e,c,d)});else if(!c&&p.type(b)==="object")for(e in b)ci(a+"["+e+"]",b[e],c,d);else d(a,b)}function cz(a){return function(b,c){typeof b!="string"&&(c=b,b="*");var d,e,f,g=b.toLowerCase().split(s),h=0,i=g.length;if(p.isFunction(c))for(;h<i;h++)d=g[h],f=/^\+/.test(d),f&&(d=d.substr(1)||"*"),e=a[d]=a[d]||[],e[f?"unshift":"push"](c)}}function cA(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h,i=a[f],j=0,k=i?i.length:0,l=a===cv;for(;j<k&&(l||!h);j++)h=i[j](c,d,e),typeof h=="string"&&(!l||g[h]?h=b:(c.dataTypes.unshift(h),h=cA(a,c,d,e,h,g)));return(l||!h)&&!g["*"]&&(h=cA(a,c,d,e,"*",g)),h}function cB(a,c){var d,e,f=p.ajaxSettings.flatOptions||{};for(d in c)c[d]!==b&&((f[d]?a:e||(e={}))[d]=c[d]);e&&p.extend(!0,a,e)}function cC(a,c,d){var e,f,g,h,i=a.contents,j=a.dataTypes,k=a.responseFields;for(f in k)f in d&&(c[k[f]]=d[f]);while(j[0]==="*")j.shift(),e===b&&(e=a.mimeType||c.getResponseHeader("content-type"));if(e)for(f in i)if(i[f]&&i[f].test(e)){j.unshift(f);break}if(j[0]in d)g=j[0];else{for(f in d){if(!j[0]||a.converters[f+" "+j[0]]){g=f;break}h||(h=f)}g=g||h}if(g)return g!==j[0]&&j.unshift(g),d[g]}function cD(a,b){var c,d,e,f,g=a.dataTypes.slice(),h=g[0],i={},j=0;a.dataFilter&&(b=a.dataFilter(b,a.dataType));if(g[1])for(c in a.converters)i[c.toLowerCase()]=a.converters[c];for(;e=g[++j];)if(e!=="*"){if(h!=="*"&&h!==e){c=i[h+" "+e]||i["* "+e];if(!c)for(d in i){f=d.split(" ");if(f[1]===e){c=i[h+" "+f[0]]||i["* "+f[0]];if(c){c===!0?c=i[d]:i[d]!==!0&&(e=f[0],g.splice(j--,0,e));break}}}if(c!==!0)if(c&&a["throws"])b=c(b);else try{b=c(b)}catch(k){return{state:"parsererror",error:c?k:"No conversion from "+h+" to "+e}}}h=e}return{state:"success",data:b}}function cL(){try{return new a.XMLHttpRequest}catch(b){}}function cM(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function cU(){return setTimeout(function(){cN=b},0),cN=p.now()}function cV(a,b){p.each(b,function(b,c){var d=(cT[b]||[]).concat(cT["*"]),e=0,f=d.length;for(;e<f;e++)if(d[e].call(a,b,c))return})}function cW(a,b,c){var d,e=0,f=0,g=cS.length,h=p.Deferred().always(function(){delete i.elem}),i=function(){var b=cN||cU(),c=Math.max(0,j.startTime+j.duration-b),d=1-(c/j.duration||0),e=0,f=j.tweens.length;for(;e<f;e++)j.tweens[e].run(d);return h.notifyWith(a,[j,d,c]),d<1&&f?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:p.extend({},b),opts:p.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:cN||cU(),duration:c.duration,tweens:[],createTween:function(b,c,d){var e=p.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(e),e},stop:function(b){var c=0,d=b?j.tweens.length:0;for(;c<d;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;cX(k,j.opts.specialEasing);for(;e<g;e++){d=cS[e].call(j,a,k,j.opts);if(d)return d}return cV(j,k),p.isFunction(j.opts.start)&&j.opts.start.call(a,j),p.fx.timer(p.extend(i,{anim:j,queue:j.opts.queue,elem:a})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}function cX(a,b){var c,d,e,f,g;for(c in a){d=p.camelCase(c),e=b[d],f=a[c],p.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=p.cssHooks[d];if(g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}}function cY(a,b,c){var d,e,f,g,h,i,j,k,l=this,m=a.style,n={},o=[],q=a.nodeType&&bZ(a);c.queue||(j=p._queueHooks(a,"fx"),j.unqueued==null&&(j.unqueued=0,k=j.empty.fire,j.empty.fire=function(){j.unqueued||k()}),j.unqueued++,l.always(function(){l.always(function(){j.unqueued--,p.queue(a,"fx").length||j.empty.fire()})})),a.nodeType===1&&("height"in b||"width"in b)&&(c.overflow=[m.overflow,m.overflowX,m.overflowY],p.css(a,"display")==="inline"&&p.css(a,"float")==="none"&&(!p.support.inlineBlockNeedsLayout||cc(a.nodeName)==="inline"?m.display="inline-block":m.zoom=1)),c.overflow&&(m.overflow="hidden",p.support.shrinkWrapBlocks||l.done(function(){m.overflow=c.overflow[0],m.overflowX=c.overflow[1],m.overflowY=c.overflow[2]}));for(d in b){f=b[d];if(cP.exec(f)){delete b[d];if(f===(q?"hide":"show"))continue;o.push(d)}}g=o.length;if(g){h=p._data(a,"fxshow")||p._data(a,"fxshow",{}),q?p(a).show():l.done(function(){p(a).hide()}),l.done(function(){var b;p.removeData(a,"fxshow",!0);for(b in n)p.style(a,b,n[b])});for(d=0;d<g;d++)e=o[d],i=l.createTween(e,q?h[e]:0),n[e]=h[e]||p.style(a,e),e in h||(h[e]=i.start,q&&(i.end=i.start,i.start=e==="width"||e==="height"?1:0))}}function cZ(a,b,c,d,e){return new cZ.prototype.init(a,b,c,d,e)}function c$(a,b){var c,d={height:a},e=0;b=b?1:0;for(;e<4;e+=2-b)c=bV[e],d["margin"+c]=d["padding"+c]=a;return b&&(d.opacity=d.width=a),d}function da(a){return p.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1}var c,d,e=a.document,f=a.location,g=a.navigator,h=a.jQuery,i=a.$,j=Array.prototype.push,k=Array.prototype.slice,l=Array.prototype.indexOf,m=Object.prototype.toString,n=Object.prototype.hasOwnProperty,o=String.prototype.trim,p=function(a,b){return new p.fn.init(a,b,c)},q=/[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source,r=/\S/,s=/\s+/,t=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,u=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,v=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,w=/^[\],:{}\s]*$/,x=/(?:^|:|,)(?:\s*\[)+/g,y=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,z=/"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,A=/^-ms-/,B=/-([\da-z])/gi,C=function(a,b){return(b+"").toUpperCase()},D=function(){e.addEventListener?(e.removeEventListener("DOMContentLoaded",D,!1),p.ready()):e.readyState==="complete"&&(e.detachEvent("onreadystatechange",D),p.ready())},E={};p.fn=p.prototype={constructor:p,init:function(a,c,d){var f,g,h,i;if(!a)return this;if(a.nodeType)return this.context=this[0]=a,this.length=1,this;if(typeof a=="string"){a.charAt(0)==="<"&&a.charAt(a.length-1)===">"&&a.length>=3?f=[null,a,null]:f=u.exec(a);if(f&&(f[1]||!c)){if(f[1])return c=c instanceof p?c[0]:c,i=c&&c.nodeType?c.ownerDocument||c:e,a=p.parseHTML(f[1],i,!0),v.test(f[1])&&p.isPlainObject(c)&&this.attr.call(a,c,!0),p.merge(this,a);g=e.getElementById(f[2]);if(g&&g.parentNode){if(g.id!==f[2])return d.find(a);this.length=1,this[0]=g}return this.context=e,this.selector=a,this}return!c||c.jquery?(c||d).find(a):this.constructor(c).find(a)}return p.isFunction(a)?d.ready(a):(a.selector!==b&&(this.selector=a.selector,this.context=a.context),p.makeArray(a,this))},selector:"",jquery:"1.8.2",length:0,size:function(){return this.length},toArray:function(){return k.call(this)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a,b,c){var d=p.merge(this.constructor(),a);return d.prevObject=this,d.context=this.context,b==="find"?d.selector=this.selector+(this.selector?" ":"")+c:b&&(d.selector=this.selector+"."+b+"("+c+")"),d},each:function(a,b){return p.each(this,a,b)},ready:function(a){return p.ready.promise().done(a),this},eq:function(a){return a=+a,a===-1?this.slice(a):this.slice(a,a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(k.apply(this,arguments),"slice",k.call(arguments).join(","))},map:function(a){return this.pushStack(p.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){return this.prevObject||this.constructor(null)},push:j,sort:[].sort,splice:[].splice},p.fn.init.prototype=p.fn,p.extend=p.fn.extend=function(){var a,c,d,e,f,g,h=arguments[0]||{},i=1,j=arguments.length,k=!1;typeof h=="boolean"&&(k=h,h=arguments[1]||{},i=2),typeof h!="object"&&!p.isFunction(h)&&(h={}),j===i&&(h=this,--i);for(;i<j;i++)if((a=arguments[i])!=null)for(c in a){d=h[c],e=a[c];if(h===e)continue;k&&e&&(p.isPlainObject(e)||(f=p.isArray(e)))?(f?(f=!1,g=d&&p.isArray(d)?d:[]):g=d&&p.isPlainObject(d)?d:{},h[c]=p.extend(k,g,e)):e!==b&&(h[c]=e)}return h},p.extend({noConflict:function(b){return a.$===p&&(a.$=i),b&&a.jQuery===p&&(a.jQuery=h),p},isReady:!1,readyWait:1,holdReady:function(a){a?p.readyWait++:p.ready(!0)},ready:function(a){if(a===!0?--p.readyWait:p.isReady)return;if(!e.body)return setTimeout(p.ready,1);p.isReady=!0;if(a!==!0&&--p.readyWait>0)return;d.resolveWith(e,[p]),p.fn.trigger&&p(e).trigger("ready").off("ready")},isFunction:function(a){return p.type(a)==="function"},isArray:Array.isArray||function(a){return p.type(a)==="array"},isWindow:function(a){return a!=null&&a==a.window},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return a==null?String(a):E[m.call(a)]||"object"},isPlainObject:function(a){if(!a||p.type(a)!=="object"||a.nodeType||p.isWindow(a))return!1;try{if(a.constructor&&!n.call(a,"constructor")&&!n.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}var d;for(d in a);return d===b||n.call(a,d)},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},error:function(a){throw new Error(a)},parseHTML:function(a,b,c){var d;return!a||typeof a!="string"?null:(typeof b=="boolean"&&(c=b,b=0),b=b||e,(d=v.exec(a))?[b.createElement(d[1])]:(d=p.buildFragment([a],b,c?null:[]),p.merge([],(d.cacheable?p.clone(d.fragment):d.fragment).childNodes)))},parseJSON:function(b){if(!b||typeof b!="string")return null;b=p.trim(b);if(a.JSON&&a.JSON.parse)return a.JSON.parse(b);if(w.test(b.replace(y,"@").replace(z,"]").replace(x,"")))return(new Function("return "+b))();p.error("Invalid JSON: "+b)},parseXML:function(c){var d,e;if(!c||typeof c!="string")return null;try{a.DOMParser?(e=new DOMParser,d=e.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c))}catch(f){d=b}return(!d||!d.documentElement||d.getElementsByTagName("parsererror").length)&&p.error("Invalid XML: "+c),d},noop:function(){},globalEval:function(b){b&&r.test(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(A,"ms-").replace(B,C)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,c,d){var e,f=0,g=a.length,h=g===b||p.isFunction(a);if(d){if(h){for(e in a)if(c.apply(a[e],d)===!1)break}else for(;f<g;)if(c.apply(a[f++],d)===!1)break}else if(h){for(e in a)if(c.call(a[e],e,a[e])===!1)break}else for(;f<g;)if(c.call(a[f],f,a[f++])===!1)break;return a},trim:o&&!o.call("﻿ ")?function(a){return a==null?"":o.call(a)}:function(a){return a==null?"":(a+"").replace(t,"")},makeArray:function(a,b){var c,d=b||[];return a!=null&&(c=p.type(a),a.length==null||c==="string"||c==="function"||c==="regexp"||p.isWindow(a)?j.call(d,a):p.merge(d,a)),d},inArray:function(a,b,c){var d;if(b){if(l)return l.call(b,a,c);d=b.length,c=c?c<0?Math.max(0,d+c):c:0;for(;c<d;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,c){var d=c.length,e=a.length,f=0;if(typeof d=="number")for(;f<d;f++)a[e++]=c[f];else while(c[f]!==b)a[e++]=c[f++];return a.length=e,a},grep:function(a,b,c){var d,e=[],f=0,g=a.length;c=!!c;for(;f<g;f++)d=!!b(a[f],f),c!==d&&e.push(a[f]);return e},map:function(a,c,d){var e,f,g=[],h=0,i=a.length,j=a instanceof p||i!==b&&typeof i=="number"&&(i>0&&a[0]&&a[i-1]||i===0||p.isArray(a));if(j)for(;h<i;h++)e=c(a[h],h,d),e!=null&&(g[g.length]=e);else for(f in a)e=c(a[f],f,d),e!=null&&(g[g.length]=e);return g.concat.apply([],g)},guid:1,proxy:function(a,c){var d,e,f;return typeof c=="string"&&(d=a[c],c=a,a=d),p.isFunction(a)?(e=k.call(arguments,2),f=function(){return a.apply(c,e.concat(k.call(arguments)))},f.guid=a.guid=a.guid||p.guid++,f):b},access:function(a,c,d,e,f,g,h){var i,j=d==null,k=0,l=a.length;if(d&&typeof d=="object"){for(k in d)p.access(a,c,k,d[k],1,g,e);f=1}else if(e!==b){i=h===b&&p.isFunction(e),j&&(i?(i=c,c=function(a,b,c){return i.call(p(a),c)}):(c.call(a,e),c=null));if(c)for(;k<l;k++)c(a[k],d,i?e.call(a[k],k,c(a[k],d)):e,h);f=1}return f?a:j?c.call(a):l?c(a[0],d):g},now:function(){return(new Date).getTime()}}),p.ready.promise=function(b){if(!d){d=p.Deferred();if(e.readyState==="complete")setTimeout(p.ready,1);else if(e.addEventListener)e.addEventListener("DOMContentLoaded",D,!1),a.addEventListener("load",p.ready,!1);else{e.attachEvent("onreadystatechange",D),a.attachEvent("onload",p.ready);var c=!1;try{c=a.frameElement==null&&e.documentElement}catch(f){}c&&c.doScroll&&function g(){if(!p.isReady){try{c.doScroll("left")}catch(a){return setTimeout(g,50)}p.ready()}}()}}return d.promise(b)},p.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){E["[object "+b+"]"]=b.toLowerCase()}),c=p(e);var F={};p.Callbacks=function(a){a=typeof a=="string"?F[a]||G(a):p.extend({},a);var c,d,e,f,g,h,i=[],j=!a.once&&[],k=function(b){c=a.memory&&b,d=!0,h=f||0,f=0,g=i.length,e=!0;for(;i&&h<g;h++)if(i[h].apply(b[0],b[1])===!1&&a.stopOnFalse){c=!1;break}e=!1,i&&(j?j.length&&k(j.shift()):c?i=[]:l.disable())},l={add:function(){if(i){var b=i.length;(function d(b){p.each(b,function(b,c){var e=p.type(c);e==="function"&&(!a.unique||!l.has(c))?i.push(c):c&&c.length&&e!=="string"&&d(c)})})(arguments),e?g=i.length:c&&(f=b,k(c))}return this},remove:function(){return i&&p.each(arguments,function(a,b){var c;while((c=p.inArray(b,i,c))>-1)i.splice(c,1),e&&(c<=g&&g--,c<=h&&h--)}),this},has:function(a){return p.inArray(a,i)>-1},empty:function(){return i=[],this},disable:function(){return i=j=c=b,this},disabled:function(){return!i},lock:function(){return j=b,c||l.disable(),this},locked:function(){return!j},fireWith:function(a,b){return b=b||[],b=[a,b.slice?b.slice():b],i&&(!d||j)&&(e?j.push(b):k(b)),this},fire:function(){return l.fireWith(this,arguments),this},fired:function(){return!!d}};return l},p.extend({Deferred:function(a){var b=[["resolve","done",p.Callbacks("once memory"),"resolved"],["reject","fail",p.Callbacks("once memory"),"rejected"],["notify","progress",p.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return p.Deferred(function(c){p.each(b,function(b,d){var f=d[0],g=a[b];e[d[1]](p.isFunction(g)?function(){var a=g.apply(this,arguments);a&&p.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f+"With"](this===e?c:this,[a])}:c[f])}),a=null}).promise()},promise:function(a){return a!=null?p.extend(a,d):d}},e={};return d.pipe=d.then,p.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[a^1][2].disable,b[2][2].lock),e[f[0]]=g.fire,e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=k.call(arguments),d=c.length,e=d!==1||a&&p.isFunction(a.promise)?d:0,f=e===1?a:p.Deferred(),g=function(a,b,c){return function(d){b[a]=this,c[a]=arguments.length>1?k.call(arguments):d,c===h?f.notifyWith(b,c):--e||f.resolveWith(b,c)}},h,i,j;if(d>1){h=new Array(d),i=new Array(d),j=new Array(d);for(;b<d;b++)c[b]&&p.isFunction(c[b].promise)?c[b].promise().done(g(b,j,c)).fail(f.reject).progress(g(b,i,h)):--e}return e||f.resolveWith(j,c),f.promise()}}),p.support=function(){var b,c,d,f,g,h,i,j,k,l,m,n=e.createElement("div");n.setAttribute("className","t"),n.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",c=n.getElementsByTagName("*"),d=n.getElementsByTagName("a")[0],d.style.cssText="top:1px;float:left;opacity:.5";if(!c||!c.length)return{};f=e.createElement("select"),g=f.appendChild(e.createElement("option")),h=n.getElementsByTagName("input")[0],b={leadingWhitespace:n.firstChild.nodeType===3,tbody:!n.getElementsByTagName("tbody").length,htmlSerialize:!!n.getElementsByTagName("link").length,style:/top/.test(d.getAttribute("style")),hrefNormalized:d.getAttribute("href")==="/a",opacity:/^0.5/.test(d.style.opacity),cssFloat:!!d.style.cssFloat,checkOn:h.value==="on",optSelected:g.selected,getSetAttribute:n.className!=="t",enctype:!!e.createElement("form").enctype,html5Clone:e.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",boxModel:e.compatMode==="CSS1Compat",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,boxSizingReliable:!0,pixelPosition:!1},h.checked=!0,b.noCloneChecked=h.cloneNode(!0).checked,f.disabled=!0,b.optDisabled=!g.disabled;try{delete n.test}catch(o){b.deleteExpando=!1}!n.addEventListener&&n.attachEvent&&n.fireEvent&&(n.attachEvent("onclick",m=function(){b.noCloneEvent=!1}),n.cloneNode(!0).fireEvent("onclick"),n.detachEvent("onclick",m)),h=e.createElement("input"),h.value="t",h.setAttribute("type","radio"),b.radioValue=h.value==="t",h.setAttribute("checked","checked"),h.setAttribute("name","t"),n.appendChild(h),i=e.createDocumentFragment(),i.appendChild(n.lastChild),b.checkClone=i.cloneNode(!0).cloneNode(!0).lastChild.checked,b.appendChecked=h.checked,i.removeChild(h),i.appendChild(n);if(n.attachEvent)for(k in{submit:!0,change:!0,focusin:!0})j="on"+k,l=j in n,l||(n.setAttribute(j,"return;"),l=typeof n[j]=="function"),b[k+"Bubbles"]=l;return p(function(){var c,d,f,g,h="padding:0;margin:0;border:0;display:block;overflow:hidden;",i=e.getElementsByTagName("body")[0];if(!i)return;c=e.createElement("div"),c.style.cssText="visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px",i.insertBefore(c,i.firstChild),d=e.createElement("div"),c.appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",f=d.getElementsByTagName("td"),f[0].style.cssText="padding:0;margin:0;border:0;display:none",l=f[0].offsetHeight===0,f[0].style.display="",f[1].style.display="none",b.reliableHiddenOffsets=l&&f[0].offsetHeight===0,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",b.boxSizing=d.offsetWidth===4,b.doesNotIncludeMarginInBodyOffset=i.offsetTop!==1,a.getComputedStyle&&(b.pixelPosition=(a.getComputedStyle(d,null)||{}).top!=="1%",b.boxSizingReliable=(a.getComputedStyle(d,null)||{width:"4px"}).width==="4px",g=e.createElement("div"),g.style.cssText=d.style.cssText=h,g.style.marginRight=g.style.width="0",d.style.width="1px",d.appendChild(g),b.reliableMarginRight=!parseFloat((a.getComputedStyle(g,null)||{}).marginRight)),typeof d.style.zoom!="undefined"&&(d.innerHTML="",d.style.cssText=h+"width:1px;padding:1px;display:inline;zoom:1",b.inlineBlockNeedsLayout=d.offsetWidth===3,d.style.display="block",d.style.overflow="visible",d.innerHTML="<div></div>",d.firstChild.style.width="5px",b.shrinkWrapBlocks=d.offsetWidth!==3,c.style.zoom=1),i.removeChild(c),c=d=f=g=null}),i.removeChild(n),c=d=f=g=h=i=n=null,b}();var H=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,I=/([A-Z])/g;p.extend({cache:{},deletedIds:[],uuid:0,expando:"jQuery"+(p.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){return a=a.nodeType?p.cache[a[p.expando]]:a[p.expando],!!a&&!K(a)},data:function(a,c,d,e){if(!p.acceptData(a))return;var f,g,h=p.expando,i=typeof c=="string",j=a.nodeType,k=j?p.cache:a,l=j?a[h]:a[h]&&h;if((!l||!k[l]||!e&&!k[l].data)&&i&&d===b)return;l||(j?a[h]=l=p.deletedIds.pop()||p.guid++:l=h),k[l]||(k[l]={},j||(k[l].toJSON=p.noop));if(typeof c=="object"||typeof c=="function")e?k[l]=p.extend(k[l],c):k[l].data=p.extend(k[l].data,c);return f=k[l],e||(f.data||(f.data={}),f=f.data),d!==b&&(f[p.camelCase(c)]=d),i?(g=f[c],g==null&&(g=f[p.camelCase(c)])):g=f,g},removeData:function(a,b,c){if(!p.acceptData(a))return;var d,e,f,g=a.nodeType,h=g?p.cache:a,i=g?a[p.expando]:p.expando;if(!h[i])return;if(b){d=c?h[i]:h[i].data;if(d){p.isArray(b)||(b in d?b=[b]:(b=p.camelCase(b),b in d?b=[b]:b=b.split(" ")));for(e=0,f=b.length;e<f;e++)delete d[b[e]];if(!(c?K:p.isEmptyObject)(d))return}}if(!c){delete h[i].data;if(!K(h[i]))return}g?p.cleanData([a],!0):p.support.deleteExpando||h!=h.window?delete h[i]:h[i]=null},_data:function(a,b,c){return p.data(a,b,c,!0)},acceptData:function(a){var b=a.nodeName&&p.noData[a.nodeName.toLowerCase()];return!b||b!==!0&&a.getAttribute("classid")===b}}),p.fn.extend({data:function(a,c){var d,e,f,g,h,i=this[0],j=0,k=null;if(a===b){if(this.length){k=p.data(i);if(i.nodeType===1&&!p._data(i,"parsedAttrs")){f=i.attributes;for(h=f.length;j<h;j++)g=f[j].name,g.indexOf("data-")||(g=p.camelCase(g.substring(5)),J(i,g,k[g]));p._data(i,"parsedAttrs",!0)}}return k}return typeof a=="object"?this.each(function(){p.data(this,a)}):(d=a.split(".",2),d[1]=d[1]?"."+d[1]:"",e=d[1]+"!",p.access(this,function(c){if(c===b)return k=this.triggerHandler("getData"+e,[d[0]]),k===b&&i&&(k=p.data(i,a),k=J(i,a,k)),k===b&&d[1]?this.data(d[0]):k;d[1]=c,this.each(function(){var b=p(this);b.triggerHandler("setData"+e,d),p.data(this,a,c),b.triggerHandler("changeData"+e,d)})},null,c,arguments.length>1,null,!1))},removeData:function(a){return this.each(function(){p.removeData(this,a)})}}),p.extend({queue:function(a,b,c){var d;if(a)return b=(b||"fx")+"queue",d=p._data(a,b),c&&(!d||p.isArray(c)?d=p._data(a,b,p.makeArray(c)):d.push(c)),d||[]},dequeue:function(a,b){b=b||"fx";var c=p.queue(a,b),d=c.length,e=c.shift(),f=p._queueHooks(a,b),g=function(){p.dequeue(a,b)};e==="inprogress"&&(e=c.shift(),d--),e&&(b==="fx"&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return p._data(a,c)||p._data(a,c,{empty:p.Callbacks("once memory").add(function(){p.removeData(a,b+"queue",!0),p.removeData(a,c,!0)})})}}),p.fn.extend({queue:function(a,c){var d=2;return typeof a!="string"&&(c=a,a="fx",d--),arguments.length<d?p.queue(this[0],a):c===b?this:this.each(function(){var b=p.queue(this,a,c);p._queueHooks(this,a),a==="fx"&&b[0]!=="inprogress"&&p.dequeue(this,a)})},dequeue:function(a){return this.each(function(){p.dequeue(this,a)})},delay:function(a,b){return a=p.fx?p.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,c){var d,e=1,f=p.Deferred(),g=this,h=this.length,i=function(){--e||f.resolveWith(g,[g])};typeof a!="string"&&(c=a,a=b),a=a||"fx";while(h--)d=p._data(g[h],a+"queueHooks"),d&&d.empty&&(e++,d.empty.add(i));return i(),f.promise(c)}});var L,M,N,O=/[\t\r\n]/g,P=/\r/g,Q=/^(?:button|input)$/i,R=/^(?:button|input|object|select|textarea)$/i,S=/^a(?:rea|)$/i,T=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,U=p.support.getSetAttribute;p.fn.extend({attr:function(a,b){return p.access(this,p.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){p.removeAttr(this,a)})},prop:function(a,b){return p.access(this,p.prop,a,b,arguments.length>1)},removeProp:function(a){return a=p.propFix[a]||a,this.each(function(){try{this[a]=b,delete this[a]}catch(c){}})},addClass:function(a){var b,c,d,e,f,g,h;if(p.isFunction(a))return this.each(function(b){p(this).addClass(a.call(this,b,this.className))});if(a&&typeof a=="string"){b=a.split(s);for(c=0,d=this.length;c<d;c++){e=this[c];if(e.nodeType===1)if(!e.className&&b.length===1)e.className=a;else{f=" "+e.className+" ";for(g=0,h=b.length;g<h;g++)f.indexOf(" "+b[g]+" ")<0&&(f+=b[g]+" ");e.className=p.trim(f)}}}return this},removeClass:function(a){var c,d,e,f,g,h,i;if(p.isFunction(a))return this.each(function(b){p(this).removeClass(a.call(this,b,this.className))});if(a&&typeof a=="string"||a===b){c=(a||"").split(s);for(h=0,i=this.length;h<i;h++){e=this[h];if(e.nodeType===1&&e.className){d=(" "+e.className+" ").replace(O," ");for(f=0,g=c.length;f<g;f++)while(d.indexOf(" "+c[f]+" ")>=0)d=d.replace(" "+c[f]+" "," ");e.className=a?p.trim(d):""}}}return this},toggleClass:function(a,b){var c=typeof a,d=typeof b=="boolean";return p.isFunction(a)?this.each(function(c){p(this).toggleClass(a.call(this,c,this.className,b),b)}):this.each(function(){if(c==="string"){var e,f=0,g=p(this),h=b,i=a.split(s);while(e=i[f++])h=d?h:!g.hasClass(e),g[h?"addClass":"removeClass"](e)}else if(c==="undefined"||c==="boolean")this.className&&p._data(this,"__className__",this.className),this.className=this.className||a===!1?"":p._data(this,"__className__")||""})},hasClass:function(a){var b=" "+a+" ",c=0,d=this.length;for(;c<d;c++)if(this[c].nodeType===1&&(" "+this[c].className+" ").replace(O," ").indexOf(b)>=0)return!0;return!1},val:function(a){var c,d,e,f=this[0];if(!arguments.length){if(f)return c=p.valHooks[f.type]||p.valHooks[f.nodeName.toLowerCase()],c&&"get"in c&&(d=c.get(f,"value"))!==b?d:(d=f.value,typeof d=="string"?d.replace(P,""):d==null?"":d);return}return e=p.isFunction(a),this.each(function(d){var f,g=p(this);if(this.nodeType!==1)return;e?f=a.call(this,d,g.val()):f=a,f==null?f="":typeof f=="number"?f+="":p.isArray(f)&&(f=p.map(f,function(a){return a==null?"":a+""})),c=p.valHooks[this.type]||p.valHooks[this.nodeName.toLowerCase()];if(!c||!("set"in c)||c.set(this,f,"value")===b)this.value=f})}}),p.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){var b,c,d,e,f=a.selectedIndex,g=[],h=a.options,i=a.type==="select-one";if(f<0)return null;c=i?f:0,d=i?f+1:h.length;for(;c<d;c++){e=h[c];if(e.selected&&(p.support.optDisabled?!e.disabled:e.getAttribute("disabled")===null)&&(!e.parentNode.disabled||!p.nodeName(e.parentNode,"optgroup"))){b=p(e).val();if(i)return b;g.push(b)}}return i&&!g.length&&h.length?p(h[f]).val():g},set:function(a,b){var c=p.makeArray(b);return p(a).find("option").each(function(){this.selected=p.inArray(p(this).val(),c)>=0}),c.length||(a.selectedIndex=-1),c}}},attrFn:{},attr:function(a,c,d,e){var f,g,h,i=a.nodeType;if(!a||i===3||i===8||i===2)return;if(e&&p.isFunction(p.fn[c]))return p(a)[c](d);if(typeof a.getAttribute=="undefined")return p.prop(a,c,d);h=i!==1||!p.isXMLDoc(a),h&&(c=c.toLowerCase(),g=p.attrHooks[c]||(T.test(c)?M:L));if(d!==b){if(d===null){p.removeAttr(a,c);return}return g&&"set"in g&&h&&(f=g.set(a,d,c))!==b?f:(a.setAttribute(c,d+""),d)}return g&&"get"in g&&h&&(f=g.get(a,c))!==null?f:(f=a.getAttribute(c),f===null?b:f)},removeAttr:function(a,b){var c,d,e,f,g=0;if(b&&a.nodeType===1){d=b.split(s);for(;g<d.length;g++)e=d[g],e&&(c=p.propFix[e]||e,f=T.test(e),f||p.attr(a,e,""),a.removeAttribute(U?e:c),f&&c in a&&(a[c]=!1))}},attrHooks:{type:{set:function(a,b){if(Q.test(a.nodeName)&&a.parentNode)p.error("type property can't be changed");else if(!p.support.radioValue&&b==="radio"&&p.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}},value:{get:function(a,b){return L&&p.nodeName(a,"button")?L.get(a,b):b in a?a.value:null},set:function(a,b,c){if(L&&p.nodeName(a,"button"))return L.set(a,b,c);a.value=b}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,f,g,h=a.nodeType;if(!a||h===3||h===8||h===2)return;return g=h!==1||!p.isXMLDoc(a),g&&(c=p.propFix[c]||c,f=p.propHooks[c]),d!==b?f&&"set"in f&&(e=f.set(a,d,c))!==b?e:a[c]=d:f&&"get"in f&&(e=f.get(a,c))!==null?e:a[c]},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):R.test(a.nodeName)||S.test(a.nodeName)&&a.href?0:b}}}}),M={get:function(a,c){var d,e=p.prop(a,c);return e===!0||typeof e!="boolean"&&(d=a.getAttributeNode(c))&&d.nodeValue!==!1?c.toLowerCase():b},set:function(a,b,c){var d;return b===!1?p.removeAttr(a,c):(d=p.propFix[c]||c,d in a&&(a[d]=!0),a.setAttribute(c,c.toLowerCase())),c}},U||(N={name:!0,id:!0,coords:!0},L=p.valHooks.button={get:function(a,c){var d;return d=a.getAttributeNode(c),d&&(N[c]?d.value!=="":d.specified)?d.value:b},set:function(a,b,c){var d=a.getAttributeNode(c);return d||(d=e.createAttribute(c),a.setAttributeNode(d)),d.value=b+""}},p.each(["width","height"],function(a,b){p.attrHooks[b]=p.extend(p.attrHooks[b],{set:function(a,c){if(c==="")return a.setAttribute(b,"auto"),c}})}),p.attrHooks.contenteditable={get:L.get,set:function(a,b,c){b===""&&(b="false"),L.set(a,b,c)}}),p.support.hrefNormalized||p.each(["href","src","width","height"],function(a,c){p.attrHooks[c]=p.extend(p.attrHooks[c],{get:function(a){var d=a.getAttribute(c,2);return d===null?b:d}})}),p.support.style||(p.attrHooks.style={get:function(a){return a.style.cssText.toLowerCase()||b},set:function(a,b){return a.style.cssText=b+""}}),p.support.optSelected||(p.propHooks.selected=p.extend(p.propHooks.selected,{get:function(a){var b=a.parentNode;return b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex),null}})),p.support.enctype||(p.propFix.enctype="encoding"),p.support.checkOn||p.each(["radio","checkbox"],function(){p.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value}}}),p.each(["radio","checkbox"],function(){p.valHooks[this]=p.extend(p.valHooks[this],{set:function(a,b){if(p.isArray(b))return a.checked=p.inArray(p(a).val(),b)>=0}})});var V=/^(?:textarea|input|select)$/i,W=/^([^\.]*|)(?:\.(.+)|)$/,X=/(?:^|\s)hover(\.\S+|)\b/,Y=/^key/,Z=/^(?:mouse|contextmenu)|click/,$=/^(?:focusinfocus|focusoutblur)$/,_=function(a){return p.event.special.hover?a:a.replace(X,"mouseenter$1 mouseleave$1")};p.event={add:function(a,c,d,e,f){var g,h,i,j,k,l,m,n,o,q,r;if(a.nodeType===3||a.nodeType===8||!c||!d||!(g=p._data(a)))return;d.handler&&(o=d,d=o.handler,f=o.selector),d.guid||(d.guid=p.guid++),i=g.events,i||(g.events=i={}),h=g.handle,h||(g.handle=h=function(a){return typeof p!="undefined"&&(!a||p.event.triggered!==a.type)?p.event.dispatch.apply(h.elem,arguments):b},h.elem=a),c=p.trim(_(c)).split(" ");for(j=0;j<c.length;j++){k=W.exec(c[j])||[],l=k[1],m=(k[2]||"").split(".").sort(),r=p.event.special[l]||{},l=(f?r.delegateType:r.bindType)||l,r=p.event.special[l]||{},n=p.extend({type:l,origType:k[1],data:e,handler:d,guid:d.guid,selector:f,needsContext:f&&p.expr.match.needsContext.test(f),namespace:m.join(".")},o),q=i[l];if(!q){q=i[l]=[],q.delegateCount=0;if(!r.setup||r.setup.call(a,e,m,h)===!1)a.addEventListener?a.addEventListener(l,h,!1):a.attachEvent&&a.attachEvent("on"+l,h)}r.add&&(r.add.call(a,n),n.handler.guid||(n.handler.guid=d.guid)),f?q.splice(q.delegateCount++,0,n):q.push(n),p.event.global[l]=!0}a=null},global:{},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,q,r=p.hasData(a)&&p._data(a);if(!r||!(m=r.events))return;b=p.trim(_(b||"")).split(" ");for(f=0;f<b.length;f++){g=W.exec(b[f])||[],h=i=g[1],j=g[2];if(!h){for(h in m)p.event.remove(a,h+b[f],c,d,!0);continue}n=p.event.special[h]||{},h=(d?n.delegateType:n.bindType)||h,o=m[h]||[],k=o.length,j=j?new RegExp("(^|\\.)"+j.split(".").sort().join("\\.(?:.*\\.|)")+"(\\.|$)"):null;for(l=0;l<o.length;l++)q=o[l],(e||i===q.origType)&&(!c||c.guid===q.guid)&&(!j||j.test(q.namespace))&&(!d||d===q.selector||d==="**"&&q.selector)&&(o.splice(l--,1),q.selector&&o.delegateCount--,n.remove&&n.remove.call(a,q));o.length===0&&k!==o.length&&((!n.teardown||n.teardown.call(a,j,r.handle)===!1)&&p.removeEvent(a,h,r.handle),delete m[h])}p.isEmptyObject(m)&&(delete r.handle,p.removeData(a,"events",!0))},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(c,d,f,g){if(!f||f.nodeType!==3&&f.nodeType!==8){var h,i,j,k,l,m,n,o,q,r,s=c.type||c,t=[];if($.test(s+p.event.triggered))return;s.indexOf("!")>=0&&(s=s.slice(0,-1),i=!0),s.indexOf(".")>=0&&(t=s.split("."),s=t.shift(),t.sort());if((!f||p.event.customEvent[s])&&!p.event.global[s])return;c=typeof c=="object"?c[p.expando]?c:new p.Event(s,c):new p.Event(s),c.type=s,c.isTrigger=!0,c.exclusive=i,c.namespace=t.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+t.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,m=s.indexOf(":")<0?"on"+s:"";if(!f){h=p.cache;for(j in h)h[j].events&&h[j].events[s]&&p.event.trigger(c,d,h[j].handle.elem,!0);return}c.result=b,c.target||(c.target=f),d=d!=null?p.makeArray(d):[],d.unshift(c),n=p.event.special[s]||{};if(n.trigger&&n.trigger.apply(f,d)===!1)return;q=[[f,n.bindType||s]];if(!g&&!n.noBubble&&!p.isWindow(f)){r=n.delegateType||s,k=$.test(r+s)?f:f.parentNode;for(l=f;k;k=k.parentNode)q.push([k,r]),l=k;l===(f.ownerDocument||e)&&q.push([l.defaultView||l.parentWindow||a,r])}for(j=0;j<q.length&&!c.isPropagationStopped();j++)k=q[j][0],c.type=q[j][1],o=(p._data(k,"events")||{})[c.type]&&p._data(k,"handle"),o&&o.apply(k,d),o=m&&k[m],o&&p.acceptData(k)&&o.apply&&o.apply(k,d)===!1&&c.preventDefault();return c.type=s,!g&&!c.isDefaultPrevented()&&(!n._default||n._default.apply(f.ownerDocument,d)===!1)&&(s!=="click"||!p.nodeName(f,"a"))&&p.acceptData(f)&&m&&f[s]&&(s!=="focus"&&s!=="blur"||c.target.offsetWidth!==0)&&!p.isWindow(f)&&(l=f[m],l&&(f[m]=null),p.event.triggered=s,f[s](),p.event.triggered=b,l&&(f[m]=l)),c.result}return},dispatch:function(c){c=p.event.fix(c||a.event);var d,e,f,g,h,i,j,l,m,n,o=(p._data(this,"events")||{})[c.type]||[],q=o.delegateCount,r=k.call(arguments),s=!c.exclusive&&!c.namespace,t=p.event.special[c.type]||{},u=[];r[0]=c,c.delegateTarget=this;if(t.preDispatch&&t.preDispatch.call(this,c)===!1)return;if(q&&(!c.button||c.type!=="click"))for(f=c.target;f!=this;f=f.parentNode||this)if(f.disabled!==!0||c.type!=="click"){h={},j=[];for(d=0;d<q;d++)l=o[d],m=l.selector,h[m]===b&&(h[m]=l.needsContext?p(m,this).index(f)>=0:p.find(m,this,null,[f]).length),h[m]&&j.push(l);j.length&&u.push({elem:f,matches:j})}o.length>q&&u.push({elem:this,matches:o.slice(q)});for(d=0;d<u.length&&!c.isPropagationStopped();d++){i=u[d],c.currentTarget=i.elem;for(e=0;e<i.matches.length&&!c.isImmediatePropagationStopped();e++){l=i.matches[e];if(s||!c.namespace&&!l.namespace||c.namespace_re&&c.namespace_re.test(l.namespace))c.data=l.data,c.handleObj=l,g=((p.event.special[l.origType]||{}).handle||l.handler).apply(i.elem,r),g!==b&&(c.result=g,g===!1&&(c.preventDefault(),c.stopPropagation()))}}return t.postDispatch&&t.postDispatch.call(this,c),c.result},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return a.which==null&&(a.which=b.charCode!=null?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,c){var d,f,g,h=c.button,i=c.fromElement;return a.pageX==null&&c.clientX!=null&&(d=a.target.ownerDocument||e,f=d.documentElement,g=d.body,a.pageX=c.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),a.pageY=c.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?c.toElement:i),!a.which&&h!==b&&(a.which=h&1?1:h&2?3:h&4?2:0),a}},fix:function(a){if(a[p.expando])return a;var b,c,d=a,f=p.event.fixHooks[a.type]||{},g=f.props?this.props.concat(f.props):this.props;a=p.Event(d);for(b=g.length;b;)c=g[--b],a[c]=d[c];return a.target||(a.target=d.srcElement||e),a.target.nodeType===3&&(a.target=a.target.parentNode),a.metaKey=!!a.metaKey,f.filter?f.filter(a,d):a},special:{load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(a,b,c){p.isWindow(this)&&(this.onbeforeunload=c)},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null)}}},simulate:function(a,b,c,d){var e=p.extend(new p.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?p.event.trigger(e,null,b):p.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},p.event.handle=p.event.dispatch,p.removeEvent=e.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){var d="on"+b;a.detachEvent&&(typeof a[d]=="undefined"&&(a[d]=null),a.detachEvent(d,c))},p.Event=function(a,b){if(this instanceof p.Event)a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?bb:ba):this.type=a,b&&p.extend(this,b),this.timeStamp=a&&a.timeStamp||p.now(),this[p.expando]=!0;else return new p.Event(a,b)},p.Event.prototype={preventDefault:function(){this.isDefaultPrevented=bb;var a=this.originalEvent;if(!a)return;a.preventDefault?a.preventDefault():a.returnValue=!1},stopPropagation:function(){this.isPropagationStopped=bb;var a=this.originalEvent;if(!a)return;a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=bb,this.stopPropagation()},isDefaultPrevented:ba,isPropagationStopped:ba,isImmediatePropagationStopped:ba},p.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){p.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj,g=f.selector;if(!e||e!==d&&!p.contains(d,e))a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b;return c}}}),p.support.submitBubbles||(p.event.special.submit={setup:function(){if(p.nodeName(this,"form"))return!1;p.event.add(this,"click._submit keypress._submit",function(a){var c=a.target,d=p.nodeName(c,"input")||p.nodeName(c,"button")?c.form:b;d&&!p._data(d,"_submit_attached")&&(p.event.add(d,"submit._submit",function(a){a._submit_bubble=!0}),p._data(d,"_submit_attached",!0))})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&p.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){if(p.nodeName(this,"form"))return!1;p.event.remove(this,"._submit")}}),p.support.changeBubbles||(p.event.special.change={setup:function(){if(V.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")p.event.add(this,"propertychange._change",function(a){a.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),p.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1),p.event.simulate("change",this,a,!0)});return!1}p.event.add(this,"beforeactivate._change",function(a){var b=a.target;V.test(b.nodeName)&&!p._data(b,"_change_attached")&&(p.event.add(b,"change._change",function(a){this.parentNode&&!a.isSimulated&&!a.isTrigger&&p.event.simulate("change",this.parentNode,a,!0)}),p._data(b,"_change_attached",!0))})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox")return a.handleObj.handler.apply(this,arguments)},teardown:function(){return p.event.remove(this,"._change"),!V.test(this.nodeName)}}),p.support.focusinBubbles||p.each({focus:"focusin",blur:"focusout"},function(a,b){var c=0,d=function(a){p.event.simulate(b,a.target,p.event.fix(a),!0)};p.event.special[b]={setup:function(){c++===0&&e.addEventListener(a,d,!0)},teardown:function(){--c===0&&e.removeEventListener(a,d,!0)}}}),p.fn.extend({on:function(a,c,d,e,f){var g,h;if(typeof a=="object"){typeof c!="string"&&(d=d||c,c=b);for(h in a)this.on(h,c,d,a[h],f);return this}d==null&&e==null?(e=c,d=c=b):e==null&&(typeof c=="string"?(e=d,d=b):(e=d,d=c,c=b));if(e===!1)e=ba;else if(!e)return this;return f===1&&(g=e,e=function(a){return p().off(a),g.apply(this,arguments)},e.guid=g.guid||(g.guid=p.guid++)),this.each(function(){p.event.add(this,a,e,d,c)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,c,d){var e,f;if(a&&a.preventDefault&&a.handleObj)return e=a.handleObj,p(a.delegateTarget).off(e.namespace?e.origType+"."+e.namespace:e.origType,e.selector,e.handler),this;if(typeof a=="object"){for(f in a)this.off(f,c,a[f]);return this}if(c===!1||typeof c=="function")d=c,c=b;return d===!1&&(d=ba),this.each(function(){p.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},live:function(a,b,c){return p(this.context).on(a,this.selector,b,c),this},die:function(a,b){return p(this.context).off(a,this.selector||"**",b),this},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return arguments.length===1?this.off(a,"**"):this.off(b,a||"**",c)},trigger:function(a,b){return this.each(function(){p.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0])return p.event.trigger(a,b,this[0],!0)},toggle:function(a){var b=arguments,c=a.guid||p.guid++,d=0,e=function(c){var e=(p._data(this,"lastToggle"+a.guid)||0)%d;return p._data(this,"lastToggle"+a.guid,e+1),c.preventDefault(),b[e].apply(this,arguments)||!1};e.guid=c;while(d<b.length)b[d++].guid=c;return this.click(e)},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),p.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){p.fn[b]=function(a,c){return c==null&&(c=a,a=null),arguments.length>0?this.on(b,null,a,c):this.trigger(b)},Y.test(b)&&(p.event.fixHooks[b]=p.event.keyHooks),Z.test(b)&&(p.event.fixHooks[b]=p.event.mouseHooks)}),function(a,b){function bc(a,b,c,d){c=c||[],b=b||r;var e,f,i,j,k=b.nodeType;if(!a||typeof a!="string")return c;if(k!==1&&k!==9)return[];i=g(b);if(!i&&!d)if(e=P.exec(a))if(j=e[1]){if(k===9){f=b.getElementById(j);if(!f||!f.parentNode)return c;if(f.id===j)return c.push(f),c}else if(b.ownerDocument&&(f=b.ownerDocument.getElementById(j))&&h(b,f)&&f.id===j)return c.push(f),c}else{if(e[2])return w.apply(c,x.call(b.getElementsByTagName(a),0)),c;if((j=e[3])&&_&&b.getElementsByClassName)return w.apply(c,x.call(b.getElementsByClassName(j),0)),c}return bp(a.replace(L,"$1"),b,c,d,i)}function bd(a){return function(b){var c=b.nodeName.toLowerCase();return c==="input"&&b.type===a}}function be(a){return function(b){var c=b.nodeName.toLowerCase();return(c==="input"||c==="button")&&b.type===a}}function bf(a){return z(function(b){return b=+b,z(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function bg(a,b,c){if(a===b)return c;var d=a.nextSibling;while(d){if(d===b)return-1;d=d.nextSibling}return 1}function bh(a,b){var c,d,f,g,h,i,j,k=C[o][a];if(k)return b?0:k.slice(0);h=a,i=[],j=e.preFilter;while(h){if(!c||(d=M.exec(h)))d&&(h=h.slice(d[0].length)),i.push(f=[]);c=!1;if(d=N.exec(h))f.push(c=new q(d.shift())),h=h.slice(c.length),c.type=d[0].replace(L," ");for(g in e.filter)(d=W[g].exec(h))&&(!j[g]||(d=j[g](d,r,!0)))&&(f.push(c=new q(d.shift())),h=h.slice(c.length),c.type=g,c.matches=d);if(!c)break}return b?h.length:h?bc.error(a):C(a,i).slice(0)}function bi(a,b,d){var e=b.dir,f=d&&b.dir==="parentNode",g=u++;return b.first?function(b,c,d){while(b=b[e])if(f||b.nodeType===1)return a(b,c,d)}:function(b,d,h){if(!h){var i,j=t+" "+g+" ",k=j+c;while(b=b[e])if(f||b.nodeType===1){if((i=b[o])===k)return b.sizset;if(typeof i=="string"&&i.indexOf(j)===0){if(b.sizset)return b}else{b[o]=k;if(a(b,d,h))return b.sizset=!0,b;b.sizset=!1}}}else while(b=b[e])if(f||b.nodeType===1)if(a(b,d,h))return b}}function bj(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function bk(a,b,c,d,e){var f,g=[],h=0,i=a.length,j=b!=null;for(;h<i;h++)if(f=a[h])if(!c||c(f,d,e))g.push(f),j&&b.push(h);return g}function bl(a,b,c,d,e,f){return d&&!d[o]&&(d=bl(d)),e&&!e[o]&&(e=bl(e,f)),z(function(f,g,h,i){if(f&&e)return;var j,k,l,m=[],n=[],o=g.length,p=f||bo(b||"*",h.nodeType?[h]:h,[],f),q=a&&(f||!b)?bk(p,m,a,h,i):p,r=c?e||(f?a:o||d)?[]:g:q;c&&c(q,r,h,i);if(d){l=bk(r,n),d(l,[],h,i),j=l.length;while(j--)if(k=l[j])r[n[j]]=!(q[n[j]]=k)}if(f){j=a&&r.length;while(j--)if(k=r[j])f[m[j]]=!(g[m[j]]=k)}else r=bk(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):w.apply(g,r)})}function bm(a){var b,c,d,f=a.length,g=e.relative[a[0].type],h=g||e.relative[" "],i=g?1:0,j=bi(function(a){return a===b},h,!0),k=bi(function(a){return y.call(b,a)>-1},h,!0),m=[function(a,c,d){return!g&&(d||c!==l)||((b=c).nodeType?j(a,c,d):k(a,c,d))}];for(;i<f;i++)if(c=e.relative[a[i].type])m=[bi(bj(m),c)];else{c=e.filter[a[i].type].apply(null,a[i].matches);if(c[o]){d=++i;for(;d<f;d++)if(e.relative[a[d].type])break;return bl(i>1&&bj(m),i>1&&a.slice(0,i-1).join("").replace(L,"$1"),c,i<d&&bm(a.slice(i,d)),d<f&&bm(a=a.slice(d)),d<f&&a.join(""))}m.push(c)}return bj(m)}function bn(a,b){var d=b.length>0,f=a.length>0,g=function(h,i,j,k,m){var n,o,p,q=[],s=0,u="0",x=h&&[],y=m!=null,z=l,A=h||f&&e.find.TAG("*",m&&i.parentNode||i),B=t+=z==null?1:Math.E;y&&(l=i!==r&&i,c=g.el);for(;(n=A[u])!=null;u++){if(f&&n){for(o=0;p=a[o];o++)if(p(n,i,j)){k.push(n);break}y&&(t=B,c=++g.el)}d&&((n=!p&&n)&&s--,h&&x.push(n))}s+=u;if(d&&u!==s){for(o=0;p=b[o];o++)p(x,q,i,j);if(h){if(s>0)while(u--)!x[u]&&!q[u]&&(q[u]=v.call(k));q=bk(q)}w.apply(k,q),y&&!h&&q.length>0&&s+b.length>1&&bc.uniqueSort(k)}return y&&(t=B,l=z),x};return g.el=0,d?z(g):g}function bo(a,b,c,d){var e=0,f=b.length;for(;e<f;e++)bc(a,b[e],c,d);return c}function bp(a,b,c,d,f){var g,h,j,k,l,m=bh(a),n=m.length;if(!d&&m.length===1){h=m[0]=m[0].slice(0);if(h.length>2&&(j=h[0]).type==="ID"&&b.nodeType===9&&!f&&e.relative[h[1].type]){b=e.find.ID(j.matches[0].replace(V,""),b,f)[0];if(!b)return c;a=a.slice(h.shift().length)}for(g=W.POS.test(a)?-1:h.length-1;g>=0;g--){j=h[g];if(e.relative[k=j.type])break;if(l=e.find[k])if(d=l(j.matches[0].replace(V,""),R.test(h[0].type)&&b.parentNode||b,f)){h.splice(g,1),a=d.length&&h.join("");if(!a)return w.apply(c,x.call(d,0)),c;break}}}return i(a,m)(d,b,f,c,R.test(a)),c}function bq(){}var c,d,e,f,g,h,i,j,k,l,m=!0,n="undefined",o=("sizcache"+Math.random()).replace(".",""),q=String,r=a.document,s=r.documentElement,t=0,u=0,v=[].pop,w=[].push,x=[].slice,y=[].indexOf||function(a){var b=0,c=this.length;for(;b<c;b++)if(this[b]===a)return b;return-1},z=function(a,b){return a[o]=b==null||b,a},A=function(){var a={},b=[];return z(function(c,d){return b.push(c)>e.cacheLength&&delete a[b.shift()],a[c]=d},a)},B=A(),C=A(),D=A(),E="[\\x20\\t\\r\\n\\f]",F="(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",G=F.replace("w","w#"),H="([*^$|!~]?=)",I="\\["+E+"*("+F+")"+E+"*(?:"+H+E+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+G+")|)|)"+E+"*\\]",J=":("+F+")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:"+I+")|[^:]|\\\\.)*|.*))\\)|)",K=":(even|odd|eq|gt|lt|nth|first|last)(?:\\("+E+"*((?:-\\d)?\\d*)"+E+"*\\)|)(?=[^-]|$)",L=new RegExp("^"+E+"+|((?:^|[^\\\\])(?:\\\\.)*)"+E+"+$","g"),M=new RegExp("^"+E+"*,"+E+"*"),N=new RegExp("^"+E+"*([\\x20\\t\\r\\n\\f>+~])"+E+"*"),O=new RegExp(J),P=/^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,Q=/^:not/,R=/[\x20\t\r\n\f]*[+~]/,S=/:not\($/,T=/h\d/i,U=/input|select|textarea|button/i,V=/\\(?!\\)/g,W={ID:new RegExp("^#("+F+")"),CLASS:new RegExp("^\\.("+F+")"),NAME:new RegExp("^\\[name=['\"]?("+F+")['\"]?\\]"),TAG:new RegExp("^("+F.replace("w","w*")+")"),ATTR:new RegExp("^"+I),PSEUDO:new RegExp("^"+J),POS:new RegExp(K,"i"),CHILD:new RegExp("^:(only|nth|first|last)-child(?:\\("+E+"*(even|odd|(([+-]|)(\\d*)n|)"+E+"*(?:([+-]|)"+E+"*(\\d+)|))"+E+"*\\)|)","i"),needsContext:new RegExp("^"+E+"*[>+~]|"+K,"i")},X=function(a){var b=r.createElement("div");try{return a(b)}catch(c){return!1}finally{b=null}},Y=X(function(a){return a.appendChild(r.createComment("")),!a.getElementsByTagName("*").length}),Z=X(function(a){return a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!==n&&a.firstChild.getAttribute("href")==="#"}),$=X(function(a){a.innerHTML="<select></select>";var b=typeof a.lastChild.getAttribute("multiple");return b!=="boolean"&&b!=="string"}),_=X(function(a){return a.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",!a.getElementsByClassName||!a.getElementsByClassName("e").length?!1:(a.lastChild.className="e",a.getElementsByClassName("e").length===2)}),ba=X(function(a){a.id=o+0,a.innerHTML="<a name='"+o+"'></a><div name='"+o+"'></div>",s.insertBefore(a,s.firstChild);var b=r.getElementsByName&&r.getElementsByName(o).length===2+r.getElementsByName(o+0).length;return d=!r.getElementById(o),s.removeChild(a),b});try{x.call(s.childNodes,0)[0].nodeType}catch(bb){x=function(a){var b,c=[];for(;b=this[a];a++)c.push(b);return c}}bc.matches=function(a,b){return bc(a,null,null,b)},bc.matchesSelector=function(a,b){return bc(b,null,null,[a]).length>0},f=bc.getText=function(a){var b,c="",d=0,e=a.nodeType;if(e){if(e===1||e===9||e===11){if(typeof a.textContent=="string")return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=f(a)}else if(e===3||e===4)return a.nodeValue}else for(;b=a[d];d++)c+=f(b);return c},g=bc.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?b.nodeName!=="HTML":!1},h=bc.contains=s.contains?function(a,b){var c=a.nodeType===9?a.documentElement:a,d=b&&b.parentNode;return a===d||!!(d&&d.nodeType===1&&c.contains&&c.contains(d))}:s.compareDocumentPosition?function(a,b){return b&&!!(a.compareDocumentPosition(b)&16)}:function(a,b){while(b=b.parentNode)if(b===a)return!0;return!1},bc.attr=function(a,b){var c,d=g(a);return d||(b=b.toLowerCase()),(c=e.attrHandle[b])?c(a):d||$?a.getAttribute(b):(c=a.getAttributeNode(b),c?typeof a[b]=="boolean"?a[b]?b:null:c.specified?c.value:null:null)},e=bc.selectors={cacheLength:50,createPseudo:z,match:W,attrHandle:Z?{}:{href:function(a){return a.getAttribute("href",2)},type:function(a){return a.getAttribute("type")}},find:{ID:d?function(a,b,c){if(typeof b.getElementById!==n&&!c){var d=b.getElementById(a);return d&&d.parentNode?[d]:[]}}:function(a,c,d){if(typeof c.getElementById!==n&&!d){var e=c.getElementById(a);return e?e.id===a||typeof e.getAttributeNode!==n&&e.getAttributeNode("id").value===a?[e]:b:[]}},TAG:Y?function(a,b){if(typeof b.getElementsByTagName!==n)return b.getElementsByTagName(a)}:function(a,b){var c=b.getElementsByTagName(a);if(a==="*"){var d,e=[],f=0;for(;d=c[f];f++)d.nodeType===1&&e.push(d);return e}return c},NAME:ba&&function(a,b){if(typeof b.getElementsByName!==n)return b.getElementsByName(name)},CLASS:_&&function(a,b,c){if(typeof b.getElementsByClassName!==n&&!c)return b.getElementsByClassName(a)}},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(V,""),a[3]=(a[4]||a[5]||"").replace(V,""),a[2]==="~="&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),a[1]==="nth"?(a[2]||bc.error(a[0]),a[3]=+(a[3]?a[4]+(a[5]||1):2*(a[2]==="even"||a[2]==="odd")),a[4]=+(a[6]+a[7]||a[2]==="odd")):a[2]&&bc.error(a[0]),a},PSEUDO:function(a){var b,c;if(W.CHILD.test(a[0]))return null;if(a[3])a[2]=a[3];else if(b=a[4])O.test(b)&&(c=bh(b,!0))&&(c=b.indexOf(")",b.length-c)-b.length)&&(b=b.slice(0,c),a[0]=a[0].slice(0,c)),a[2]=b;return a.slice(0,3)}},filter:{ID:d?function(a){return a=a.replace(V,""),function(b){return b.getAttribute("id")===a}}:function(a){return a=a.replace(V,""),function(b){var c=typeof b.getAttributeNode!==n&&b.getAttributeNode("id");return c&&c.value===a}},TAG:function(a){return a==="*"?function(){return!0}:(a=a.replace(V,"").toLowerCase(),function(b){return b.nodeName&&b.nodeName.toLowerCase()===a})},CLASS:function(a){var b=B[o][a];return b||(b=B(a,new RegExp("(^|"+E+")"+a+"("+E+"|$)"))),function(a){return b.test(a.className||typeof a.getAttribute!==n&&a.getAttribute("class")||"")}},ATTR:function(a,b,c){return function(d,e){var f=bc.attr(d,a);return f==null?b==="!=":b?(f+="",b==="="?f===c:b==="!="?f!==c:b==="^="?c&&f.indexOf(c)===0:b==="*="?c&&f.indexOf(c)>-1:b==="$="?c&&f.substr(f.length-c.length)===c:b==="~="?(" "+f+" ").indexOf(c)>-1:b==="|="?f===c||f.substr(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d){return a==="nth"?function(a){var b,e,f=a.parentNode;if(c===1&&d===0)return!0;if(f){e=0;for(b=f.firstChild;b;b=b.nextSibling)if(b.nodeType===1){e++;if(a===b)break}}return e-=d,e===c||e%c===0&&e/c>=0}:function(b){var c=b;switch(a){case"only":case"first":while(c=c.previousSibling)if(c.nodeType===1)return!1;if(a==="first")return!0;c=b;case"last":while(c=c.nextSibling)if(c.nodeType===1)return!1;return!0}}},PSEUDO:function(a,b){var c,d=e.pseudos[a]||e.setFilters[a.toLowerCase()]||bc.error("unsupported pseudo: "+a);return d[o]?d(b):d.length>1?(c=[a,a,"",b],e.setFilters.hasOwnProperty(a.toLowerCase())?z(function(a,c){var e,f=d(a,b),g=f.length;while(g--)e=y.call(a,f[g]),a[e]=!(c[e]=f[g])}):function(a){return d(a,0,c)}):d}},pseudos:{not:z(function(a){var b=[],c=[],d=i(a.replace(L,"$1"));return d[o]?z(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)if(f=g[h])a[h]=!(b[h]=f)}):function(a,e,f){return b[0]=a,d(b,null,f,c),!c.pop()}}),has:z(function(a){return function(b){return bc(a,b).length>0}}),contains:z(function(a){return function(b){return(b.textContent||b.innerText||f(b)).indexOf(a)>-1}}),enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&!!a.checked||b==="option"&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},parent:function(a){return!e.pseudos.empty(a)},empty:function(a){var b;a=a.firstChild;while(a){if(a.nodeName>"@"||(b=a.nodeType)===3||b===4)return!1;a=a.nextSibling}return!0},header:function(a){return T.test(a.nodeName)},text:function(a){var b,c;return a.nodeName.toLowerCase()==="input"&&(b=a.type)==="text"&&((c=a.getAttribute("type"))==null||c.toLowerCase()===b)},radio:bd("radio"),checkbox:bd("checkbox"),file:bd("file"),password:bd("password"),image:bd("image"),submit:be("submit"),reset:be("reset"),button:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&a.type==="button"||b==="button"},input:function(a){return U.test(a.nodeName)},focus:function(a){var b=a.ownerDocument;return a===b.activeElement&&(!b.hasFocus||b.hasFocus())&&(!!a.type||!!a.href)},active:function(a){return a===a.ownerDocument.activeElement},first:bf(function(a,b,c){return[0]}),last:bf(function(a,b,c){return[b-1]}),eq:bf(function(a,b,c){return[c<0?c+b:c]}),even:bf(function(a,b,c){for(var d=0;d<b;d+=2)a.push(d);return a}),odd:bf(function(a,b,c){for(var d=1;d<b;d+=2)a.push(d);return a}),lt:bf(function(a,b,c){for(var d=c<0?c+b:c;--d>=0;)a.push(d);return a}),gt:bf(function(a,b,c){for(var d=c<0?c+b:c;++d<b;)a.push(d);return a})}},j=s.compareDocumentPosition?function(a,b){return a===b?(k=!0,0):(!a.compareDocumentPosition||!b.compareDocumentPosition?a.compareDocumentPosition:a.compareDocumentPosition(b)&4)?-1:1}:function(a,b){if(a===b)return k=!0,0;if(a.sourceIndex&&b.sourceIndex)return a.sourceIndex-b.sourceIndex;var c,d,e=[],f=[],g=a.parentNode,h=b.parentNode,i=g;if(g===h)return bg(a,b);if(!g)return-1;if(!h)return 1;while(i)e.unshift(i),i=i.parentNode;i=h;while(i)f.unshift(i),i=i.parentNode;c=e.length,d=f.length;for(var j=0;j<c&&j<d;j++)if(e[j]!==f[j])return bg(e[j],f[j]);return j===c?bg(a,f[j],-1):bg(e[j],b,1)},[0,0].sort(j),m=!k,bc.uniqueSort=function(a){var b,c=1;k=m,a.sort(j);if(k)for(;b=a[c];c++)b===a[c-1]&&a.splice(c--,1);return a},bc.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},i=bc.compile=function(a,b){var c,d=[],e=[],f=D[o][a];if(!f){b||(b=bh(a)),c=b.length;while(c--)f=bm(b[c]),f[o]?d.push(f):e.push(f);f=D(a,bn(e,d))}return f},r.querySelectorAll&&function(){var a,b=bp,c=/'|\\/g,d=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,e=[":focus"],f=[":active",":focus"],h=s.matchesSelector||s.mozMatchesSelector||s.webkitMatchesSelector||s.oMatchesSelector||s.msMatchesSelector;X(function(a){a.innerHTML="<select><option selected=''></option></select>",a.querySelectorAll("[selected]").length||e.push("\\["+E+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),a.querySelectorAll(":checked").length||e.push(":checked")}),X(function(a){a.innerHTML="<p test=''></p>",a.querySelectorAll("[test^='']").length&&e.push("[*^$]="+E+"*(?:\"\"|'')"),a.innerHTML="<input type='hidden'/>",a.querySelectorAll(":enabled").length||e.push(":enabled",":disabled")}),e=new RegExp(e.join("|")),bp=function(a,d,f,g,h){if(!g&&!h&&(!e||!e.test(a))){var i,j,k=!0,l=o,m=d,n=d.nodeType===9&&a;if(d.nodeType===1&&d.nodeName.toLowerCase()!=="object"){i=bh(a),(k=d.getAttribute("id"))?l=k.replace(c,"\\$&"):d.setAttribute("id",l),l="[id='"+l+"'] ",j=i.length;while(j--)i[j]=l+i[j].join("");m=R.test(a)&&d.parentNode||d,n=i.join(",")}if(n)try{return w.apply(f,x.call(m.querySelectorAll(n),0)),f}catch(p){}finally{k||d.removeAttribute("id")}}return b(a,d,f,g,h)},h&&(X(function(b){a=h.call(b,"div");try{h.call(b,"[test!='']:sizzle"),f.push("!=",J)}catch(c){}}),f=new RegExp(f.join("|")),bc.matchesSelector=function(b,c){c=c.replace(d,"='$1']");if(!g(b)&&!f.test(c)&&(!e||!e.test(c)))try{var i=h.call(b,c);if(i||a||b.document&&b.document.nodeType!==11)return i}catch(j){}return bc(c,null,null,[b]).length>0})}(),e.pseudos.nth=e.pseudos.eq,e.filters=bq.prototype=e.pseudos,e.setFilters=new bq,bc.attr=p.attr,p.find=bc,p.expr=bc.selectors,p.expr[":"]=p.expr.pseudos,p.unique=bc.uniqueSort,p.text=bc.getText,p.isXMLDoc=bc.isXML,p.contains=bc.contains}(a);var bc=/Until$/,bd=/^(?:parents|prev(?:Until|All))/,be=/^.[^:#\[\.,]*$/,bf=p.expr.match.needsContext,bg={children:!0,contents:!0,next:!0,prev:!0};p.fn.extend({find:function(a){var b,c,d,e,f,g,h=this;if(typeof a!="string")return p(a).filter(function(){for(b=0,c=h.length;b<c;b++)if(p.contains(h[b],this))return!0});g=this.pushStack("","find",a);for(b=0,c=this.length;b<c;b++){d=g.length,p.find(a,this[b],g);if(b>0)for(e=d;e<g.length;e++)for(f=0;f<d;f++)if(g[f]===g[e]){g.splice(e--,1);break}}return g},has:function(a){var b,c=p(a,this),d=c.length;return this.filter(function(){for(b=0;b<d;b++)if(p.contains(this,c[b]))return!0})},not:function(a){return this.pushStack(bj(this,a,!1),"not",a)},filter:function(a){return this.pushStack(bj(this,a,!0),"filter",a)},is:function(a){return!!a&&(typeof a=="string"?bf.test(a)?p(a,this.context).index(this[0])>=0:p.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){var c,d=0,e=this.length,f=[],g=bf.test(a)||typeof a!="string"?p(a,b||this.context):0;for(;d<e;d++){c=this[d];while(c&&c.ownerDocument&&c!==b&&c.nodeType!==11){if(g?g.index(c)>-1:p.find.matchesSelector(c,a)){f.push(c);break}c=c.parentNode}}return f=f.length>1?p.unique(f):f,this.pushStack(f,"closest",a)},index:function(a){return a?typeof a=="string"?p.inArray(this[0],p(a)):p.inArray(a.jquery?a[0]:a,this):this[0]&&this[0].parentNode?this.prevAll().length:-1},add:function(a,b){var c=typeof a=="string"?p(a,b):p.makeArray(a&&a.nodeType?[a]:a),d=p.merge(this.get(),c);return this.pushStack(bh(c[0])||bh(d[0])?d:p.unique(d))},addBack:function(a){return this.add(a==null?this.prevObject:this.prevObject.filter(a))}}),p.fn.andSelf=p.fn.addBack,p.each({parent:function(a){var b=a.parentNode;return b&&b.nodeType!==11?b:null},parents:function(a){return p.dir(a,"parentNode")},parentsUntil:function(a,b,c){return p.dir(a,"parentNode",c)},next:function(a){return bi(a,"nextSibling")},prev:function(a){return bi(a,"previousSibling")},nextAll:function(a){return p.dir(a,"nextSibling")},prevAll:function(a){return p.dir(a,"previousSibling")},nextUntil:function(a,b,c){return p.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return p.dir(a,"previousSibling",c)},siblings:function(a){return p.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return p.sibling(a.firstChild)},contents:function(a){return p.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:p.merge([],a.childNodes)}},function(a,b){p.fn[a]=function(c,d){var e=p.map(this,b,c);return bc.test(a)||(d=c),d&&typeof d=="string"&&(e=p.filter(d,e)),e=this.length>1&&!bg[a]?p.unique(e):e,this.length>1&&bd.test(a)&&(e=e.reverse()),this.pushStack(e,a,k.call(arguments).join(","))}}),p.extend({filter:function(a,b,c){return c&&(a=":not("+a+")"),b.length===1?p.find.matchesSelector(b[0],a)?[b[0]]:[]:p.find.matches(a,b)},dir:function(a,c,d){var e=[],f=a[c];while(f&&f.nodeType!==9&&(d===b||f.nodeType!==1||!p(f).is(d)))f.nodeType===1&&e.push(f),f=f[c];return e},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var bl="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",bm=/ jQuery\d+="(?:null|\d+)"/g,bn=/^\s+/,bo=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bp=/<([\w:]+)/,bq=/<tbody/i,br=/<|&#?\w+;/,bs=/<(?:script|style|link)/i,bt=/<(?:script|object|embed|option|style)/i,bu=new RegExp("<(?:"+bl+")[\\s/>]","i"),bv=/^(?:checkbox|radio)$/,bw=/checked\s*(?:[^=]|=\s*.checked.)/i,bx=/\/(java|ecma)script/i,by=/^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g,bz={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},bA=bk(e),bB=bA.appendChild(e.createElement("div"));bz.optgroup=bz.option,bz.tbody=bz.tfoot=bz.colgroup=bz.caption=bz.thead,bz.th=bz.td,p.support.htmlSerialize||(bz._default=[1,"X<div>","</div>"]),p.fn.extend({text:function(a){return p.access(this,function(a){return a===b?p.text(this):this.empty().append((this[0]&&this[0].ownerDocument||e).createTextNode(a))},null,a,arguments.length)},wrapAll:function(a){if(p.isFunction(a))return this.each(function(b){p(this).wrapAll(a.call(this,b))});if(this[0]){var b=p(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&a.firstChild.nodeType===1)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){return p.isFunction(a)?this.each(function(b){p(this).wrapInner(a.call(this,b))}):this.each(function(){var b=p(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=p.isFunction(a);return this.each(function(c){p(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){p.nodeName(this,"body")||p(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(a){(this.nodeType===1||this.nodeType===11)&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,!0,function(a){(this.nodeType===1||this.nodeType===11)&&this.insertBefore(a,this.firstChild)})},before:function(){if(!bh(this[0]))return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this)});if(arguments.length){var a=p.clean(arguments);return this.pushStack(p.merge(a,this),"before",this.selector)}},after:function(){if(!bh(this[0]))return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling)});if(arguments.length){var a=p.clean(arguments);return this.pushStack(p.merge(this,a),"after",this.selector)}},remove:function(a,b){var c,d=0;for(;(c=this[d])!=null;d++)if(!a||p.filter(a,[c]).length)!b&&c.nodeType===1&&(p.cleanData(c.getElementsByTagName("*")),p.cleanData([c])),c.parentNode&&c.parentNode.removeChild(c);return this},empty:function(){var a,b=0;for(;(a=this[b])!=null;b++){a.nodeType===1&&p.cleanData(a.getElementsByTagName("*"));while(a.firstChild)a.removeChild(a.firstChild)}return this},clone:function(a,b){return a=a==null?!1:a,b=b==null?a:b,this.map(function(){return p.clone(this,a,b)})},html:function(a){return p.access(this,function(a){var c=this[0]||{},d=0,e=this.length;if(a===b)return c.nodeType===1?c.innerHTML.replace(bm,""):b;if(typeof a=="string"&&!bs.test(a)&&(p.support.htmlSerialize||!bu.test(a))&&(p.support.leadingWhitespace||!bn.test(a))&&!bz[(bp.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(bo,"<$1></$2>");try{for(;d<e;d++)c=this[d]||{},c.nodeType===1&&(p.cleanData(c.getElementsByTagName("*")),c.innerHTML=a);c=0}catch(f){}}c&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(a){return bh(this[0])?this.length?this.pushStack(p(p.isFunction(a)?a():a),"replaceWith",a):this:p.isFunction(a)?this.each(function(b){var c=p(this),d=c.html();c.replaceWith(a.call(this,b,d))}):(typeof a!="string"&&(a=p(a).detach()),this.each(function(){var b=this.nextSibling,c=this.parentNode;p(this).remove(),b?p(b).before(a):p(c).append(a)}))},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,d){a=[].concat.apply([],a);var e,f,g,h,i=0,j=a[0],k=[],l=this.length;if(!p.support.checkClone&&l>1&&typeof j=="string"&&bw.test(j))return this.each(function(){p(this).domManip(a,c,d)});if(p.isFunction(j))return this.each(function(e){var f=p(this);a[0]=j.call(this,e,c?f.html():b),f.domManip(a,c,d)});if(this[0]){e=p.buildFragment(a,this,k),g=e.fragment,f=g.firstChild,g.childNodes.length===1&&(g=f);if(f){c=c&&p.nodeName(f,"tr");for(h=e.cacheable||l-1;i<l;i++)d.call(c&&p.nodeName(this[i],"table")?bC(this[i],"tbody"):this[i],i===h?g:p.clone(g,!0,!0))}g=f=null,k.length&&p.each(k,function(a,b){b.src?p.ajax?p.ajax({url:b.src,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0}):p.error("no ajax"):p.globalEval((b.text||b.textContent||b.innerHTML||"").replace(by,"")),b.parentNode&&b.parentNode.removeChild(b)})}return this}}),p.buildFragment=function(a,c,d){var f,g,h,i=a[0];return c=c||e,c=!c.nodeType&&c[0]||c,c=c.ownerDocument||c,a.length===1&&typeof i=="string"&&i.length<512&&c===e&&i.charAt(0)==="<"&&!bt.test(i)&&(p.support.checkClone||!bw.test(i))&&(p.support.html5Clone||!bu.test(i))&&(g=!0,f=p.fragments[i],h=f!==b),f||(f=c.createDocumentFragment(),p.clean(a,c,f,d),g&&(p.fragments[i]=h&&f)),{fragment:f,cacheable:g}},p.fragments={},p.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){p.fn[a]=function(c){var d,e=0,f=[],g=p(c),h=g.length,i=this.length===1&&this[0].parentNode;if((i==null||i&&i.nodeType===11&&i.childNodes.length===1)&&h===1)return g[b](this[0]),this;for(;e<h;e++)d=(e>0?this.clone(!0):this).get(),p(g[e])[b](d),f=f.concat(d);return this.pushStack(f,a,g.selector)}}),p.extend({clone:function(a,b,c){var d,e,f,g;p.support.html5Clone||p.isXMLDoc(a)||!bu.test("<"+a.nodeName+">")?g=a.cloneNode(!0):(bB.innerHTML=a.outerHTML,bB.removeChild(g=bB.firstChild));if((!p.support.noCloneEvent||!p.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!p.isXMLDoc(a)){bE(a,g),d=bF(a),e=bF(g);for(f=0;d[f];++f)e[f]&&bE(d[f],e[f])}if(b){bD(a,g);if(c){d=bF(a),e=bF(g);for(f=0;d[f];++f)bD(d[f],e[f])}}return d=e=null,g},clean:function(a,b,c,d){var f,g,h,i,j,k,l,m,n,o,q,r,s=b===e&&bA,t=[];if(!b||typeof b.createDocumentFragment=="undefined")b=e;for(f=0;(h=a[f])!=null;f++){typeof h=="number"&&(h+="");if(!h)continue;if(typeof h=="string")if(!br.test(h))h=b.createTextNode(h);else{s=s||bk(b),l=b.createElement("div"),s.appendChild(l),h=h.replace(bo,"<$1></$2>"),i=(bp.exec(h)||["",""])[1].toLowerCase(),j=bz[i]||bz._default,k=j[0],l.innerHTML=j[1]+h+j[2];while(k--)l=l.lastChild;if(!p.support.tbody){m=bq.test(h),n=i==="table"&&!m?l.firstChild&&l.firstChild.childNodes:j[1]==="<table>"&&!m?l.childNodes:[];for(g=n.length-1;g>=0;--g)p.nodeName(n[g],"tbody")&&!n[g].childNodes.length&&n[g].parentNode.removeChild(n[g])}!p.support.leadingWhitespace&&bn.test(h)&&l.insertBefore(b.createTextNode(bn.exec(h)[0]),l.firstChild),h=l.childNodes,l.parentNode.removeChild(l)}h.nodeType?t.push(h):p.merge(t,h)}l&&(h=l=s=null);if(!p.support.appendChecked)for(f=0;(h=t[f])!=null;f++)p.nodeName(h,"input")?bG(h):typeof h.getElementsByTagName!="undefined"&&p.grep(h.getElementsByTagName("input"),bG);if(c){q=function(a){if(!a.type||bx.test(a.type))return d?d.push(a.parentNode?a.parentNode.removeChild(a):a):c.appendChild(a)};for(f=0;(h=t[f])!=null;f++)if(!p.nodeName(h,"script")||!q(h))c.appendChild(h),typeof h.getElementsByTagName!="undefined"&&(r=p.grep(p.merge([],h.getElementsByTagName("script")),q),t.splice.apply(t,[f+1,0].concat(r)),f+=r.length)}return t},cleanData:function(a,b){var c,d,e,f,g=0,h=p.expando,i=p.cache,j=p.support.deleteExpando,k=p.event.special;for(;(e=a[g])!=null;g++)if(b||p.acceptData(e)){d=e[h],c=d&&i[d];if(c){if(c.events)for(f in c.events)k[f]?p.event.remove(e,f):p.removeEvent(e,f,c.handle);i[d]&&(delete i[d],j?delete e[h]:e.removeAttribute?e.removeAttribute(h):e[h]=null,p.deletedIds.push(d))}}}}),function(){var a,b;p.uaMatch=function(a){a=a.toLowerCase();var b=/(chrome)[ \/]([\w.]+)/.exec(a)||/(webkit)[ \/]([\w.]+)/.exec(a)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(a)||/(msie) ([\w.]+)/.exec(a)||a.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(a)||[];return{browser:b[1]||"",version:b[2]||"0"}},a=p.uaMatch(g.userAgent),b={},a.browser&&(b[a.browser]=!0,b.version=a.version),b.chrome?b.webkit=!0:b.webkit&&(b.safari=!0),p.browser=b,p.sub=function(){function a(b,c){return new a.fn.init(b,c)}p.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.sub=this.sub,a.fn.init=function c(c,d){return d&&d instanceof p&&!(d instanceof a)&&(d=a(d)),p.fn.init.call(this,c,d,b)},a.fn.init.prototype=a.fn;var b=a(e);return a}}();var bH,bI,bJ,bK=/alpha\([^)]*\)/i,bL=/opacity=([^)]*)/,bM=/^(top|right|bottom|left)$/,bN=/^(none|table(?!-c[ea]).+)/,bO=/^margin/,bP=new RegExp("^("+q+")(.*)$","i"),bQ=new RegExp("^("+q+")(?!px)[a-z%]+$","i"),bR=new RegExp("^([-+])=("+q+")","i"),bS={},bT={position:"absolute",visibility:"hidden",display:"block"},bU={letterSpacing:0,fontWeight:400},bV=["Top","Right","Bottom","Left"],bW=["Webkit","O","Moz","ms"],bX=p.fn.toggle;p.fn.extend({css:function(a,c){return p.access(this,function(a,c,d){return d!==b?p.style(a,c,d):p.css(a,c)},a,c,arguments.length>1)},show:function(){return b$(this,!0)},hide:function(){return b$(this)},toggle:function(a,b){var c=typeof a=="boolean";return p.isFunction(a)&&p.isFunction(b)?bX.apply(this,arguments):this.each(function(){(c?a:bZ(this))?p(this).show():p(this).hide()})}}),p.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=bH(a,"opacity");return c===""?"1":c}}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":p.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(!a||a.nodeType===3||a.nodeType===8||!a.style)return;var f,g,h,i=p.camelCase(c),j=a.style;c=p.cssProps[i]||(p.cssProps[i]=bY(j,i)),h=p.cssHooks[c]||p.cssHooks[i];if(d===b)return h&&"get"in h&&(f=h.get(a,!1,e))!==b?f:j[c];g=typeof d,g==="string"&&(f=bR.exec(d))&&(d=(f[1]+1)*f[2]+parseFloat(p.css(a,c)),g="number");if(d==null||g==="number"&&isNaN(d))return;g==="number"&&!p.cssNumber[i]&&(d+="px");if(!h||!("set"in h)||(d=h.set(a,d,e))!==b)try{j[c]=d}catch(k){}},css:function(a,c,d,e){var f,g,h,i=p.camelCase(c);return c=p.cssProps[i]||(p.cssProps[i]=bY(a.style,i)),h=p.cssHooks[c]||p.cssHooks[i],h&&"get"in h&&(f=h.get(a,!0,e)),f===b&&(f=bH(a,c)),f==="normal"&&c in bU&&(f=bU[c]),d||e!==b?(g=parseFloat(f),d||p.isNumeric(g)?g||0:f):f},swap:function(a,b,c){var d,e,f={};for(e in b)f[e]=a.style[e],a.style[e]=b[e];d=c.call(a);for(e in b)a.style[e]=f[e];return d}}),a.getComputedStyle?bH=function(b,c){var d,e,f,g,h=a.getComputedStyle(b,null),i=b.style;return h&&(d=h[c],d===""&&!p.contains(b.ownerDocument,b)&&(d=p.style(b,c)),bQ.test(d)&&bO.test(c)&&(e=i.width,f=i.minWidth,g=i.maxWidth,i.minWidth=i.maxWidth=i.width=d,d=h.width,i.width=e,i.minWidth=f,i.maxWidth=g)),d}:e.documentElement.currentStyle&&(bH=function(a,b){var c,d,e=a.currentStyle&&a.currentStyle[b],f=a.style;return e==null&&f&&f[b]&&(e=f[b]),bQ.test(e)&&!bM.test(b)&&(c=f.left,d=a.runtimeStyle&&a.runtimeStyle.left,d&&(a.runtimeStyle.left=a.currentStyle.left),f.left=b==="fontSize"?"1em":e,e=f.pixelLeft+"px",f.left=c,d&&(a.runtimeStyle.left=d)),e===""?"auto":e}),p.each(["height","width"],function(a,b){p.cssHooks[b]={get:function(a,c,d){if(c)return a.offsetWidth===0&&bN.test(bH(a,"display"))?p.swap(a,bT,function(){return cb(a,b,d)}):cb(a,b,d)},set:function(a,c,d){return b_(a,c,d?ca(a,b,d,p.support.boxSizing&&p.css(a,"boxSizing")==="border-box"):0)}}}),p.support.opacity||(p.cssHooks.opacity={get:function(a,b){return bL.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=p.isNumeric(b)?"alpha(opacity="+b*100+")":"",f=d&&d.filter||c.filter||"";c.zoom=1;if(b>=1&&p.trim(f.replace(bK,""))===""&&c.removeAttribute){c.removeAttribute("filter");if(d&&!d.filter)return}c.filter=bK.test(f)?f.replace(bK,e):f+" "+e}}),p(function(){p.support.reliableMarginRight||(p.cssHooks.marginRight={get:function(a,b){return p.swap(a,{display:"inline-block"},function(){if(b)return bH(a,"marginRight")})}}),!p.support.pixelPosition&&p.fn.position&&p.each(["top","left"],function(a,b){p.cssHooks[b]={get:function(a,c){if(c){var d=bH(a,b);return bQ.test(d)?p(a).position()[b]+"px":d}}}})}),p.expr&&p.expr.filters&&(p.expr.filters.hidden=function(a){return a.offsetWidth===0&&a.offsetHeight===0||!p.support.reliableHiddenOffsets&&(a.style&&a.style.display||bH(a,"display"))==="none"},p.expr.filters.visible=function(a){return!p.expr.filters.hidden(a)}),p.each({margin:"",padding:"",border:"Width"},function(a,b){p.cssHooks[a+b]={expand:function(c){var d,e=typeof c=="string"?c.split(" "):[c],f={};for(d=0;d<4;d++)f[a+bV[d]+b]=e[d]||e[d-2]||e[0];return f}},bO.test(a)||(p.cssHooks[a+b].set=b_)});var cd=/%20/g,ce=/\[\]$/,cf=/\r?\n/g,cg=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,ch=/^(?:select|textarea)/i;p.fn.extend({serialize:function(){return p.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?p.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||ch.test(this.nodeName)||cg.test(this.type))}).map(function(a,b){var c=p(this).val();return c==null?null:p.isArray(c)?p.map(c,function(a,c){return{name:b.name,value:a.replace(cf,"\r\n")}}):{name:b.name,value:c.replace(cf,"\r\n")}}).get()}}),p.param=function(a,c){var d,e=[],f=function(a,b){b=p.isFunction(b)?b():b==null?"":b,e[e.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};c===b&&(c=p.ajaxSettings&&p.ajaxSettings.traditional);if(p.isArray(a)||a.jquery&&!p.isPlainObject(a))p.each(a,function(){f(this.name,this.value)});else for(d in a)ci(d,a[d],c,f);return e.join("&").replace(cd,"+")};var cj,ck,cl=/#.*$/,cm=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,cn=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,co=/^(?:GET|HEAD)$/,cp=/^\/\//,cq=/\?/,cr=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,cs=/([?&])_=[^&]*/,ct=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,cu=p.fn.load,cv={},cw={},cx=["*/"]+["*"];try{ck=f.href}catch(cy){ck=e.createElement("a"),ck.href="",ck=ck.href}cj=ct.exec(ck.toLowerCase())||[],p.fn.load=function(a,c,d){if(typeof a!="string"&&cu)return cu.apply(this,arguments);if(!this.length)return this;var e,f,g,h=this,i=a.indexOf(" ");return i>=0&&(e=a.slice(i,a.length),a=a.slice(0,i)),p.isFunction(c)?(d=c,c=b):c&&typeof c=="object"&&(f="POST"),p.ajax({url:a,type:f,dataType:"html",data:c,complete:function(a,b){d&&h.each(d,g||[a.responseText,b,a])}}).done(function(a){g=arguments,h.html(e?p("<div>").append(a.replace(cr,"")).find(e):a)}),this},p.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){p.fn[b]=function(a){return this.on(b,a)}}),p.each(["get","post"],function(a,c){p[c]=function(a,d,e,f){return p.isFunction(d)&&(f=f||e,e=d,d=b),p.ajax({type:c,url:a,data:d,success:e,dataType:f})}}),p.extend({getScript:function(a,c){return p.get(a,b,c,"script")},getJSON:function(a,b,c){return p.get(a,b,c,"json")},ajaxSetup:function(a,b){return b?cB(a,p.ajaxSettings):(b=a,a=p.ajaxSettings),cB(a,b),a},ajaxSettings:{url:ck,isLocal:cn.test(cj[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":cx},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":p.parseJSON,"text xml":p.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:cz(cv),ajaxTransport:cz(cw),ajax:function(a,c){function y(a,c,f,i){var k,s,t,u,w,y=c;if(v===2)return;v=2,h&&clearTimeout(h),g=b,e=i||"",x.readyState=a>0?4:0,f&&(u=cC(l,x,f));if(a>=200&&a<300||a===304)l.ifModified&&(w=x.getResponseHeader("Last-Modified"),w&&(p.lastModified[d]=w),w=x.getResponseHeader("Etag"),w&&(p.etag[d]=w)),a===304?(y="notmodified",k=!0):(k=cD(l,u),y=k.state,s=k.data,t=k.error,k=!t);else{t=y;if(!y||a)y="error",a<0&&(a=0)}x.status=a,x.statusText=(c||y)+"",k?o.resolveWith(m,[s,y,x]):o.rejectWith(m,[x,y,t]),x.statusCode(r),r=b,j&&n.trigger("ajax"+(k?"Success":"Error"),[x,l,k?s:t]),q.fireWith(m,[x,y]),j&&(n.trigger("ajaxComplete",[x,l]),--p.active||p.event.trigger("ajaxStop"))}typeof a=="object"&&(c=a,a=b),c=c||{};var d,e,f,g,h,i,j,k,l=p.ajaxSetup({},c),m=l.context||l,n=m!==l&&(m.nodeType||m instanceof p)?p(m):p.event,o=p.Deferred(),q=p.Callbacks("once memory"),r=l.statusCode||{},t={},u={},v=0,w="canceled",x={readyState:0,setRequestHeader:function(a,b){if(!v){var c=a.toLowerCase();a=u[c]=u[c]||a,t[a]=b}return this},getAllResponseHeaders:function(){return v===2?e:null},getResponseHeader:function(a){var c;if(v===2){if(!f){f={};while(c=cm.exec(e))f[c[1].toLowerCase()]=c[2]}c=f[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){return v||(l.mimeType=a),this},abort:function(a){return a=a||w,g&&g.abort(a),y(0,a),this}};o.promise(x),x.success=x.done,x.error=x.fail,x.complete=q.add,x.statusCode=function(a){if(a){var b;if(v<2)for(b in a)r[b]=[r[b],a[b]];else b=a[x.status],x.always(b)}return this},l.url=((a||l.url)+"").replace(cl,"").replace(cp,cj[1]+"//"),l.dataTypes=p.trim(l.dataType||"*").toLowerCase().split(s),l.crossDomain==null&&(i=ct.exec(l.url.toLowerCase())||!1,l.crossDomain=i&&i.join(":")+(i[3]?"":i[1]==="http:"?80:443)!==cj.join(":")+(cj[3]?"":cj[1]==="http:"?80:443)),l.data&&l.processData&&typeof l.data!="string"&&(l.data=p.param(l.data,l.traditional)),cA(cv,l,c,x);if(v===2)return x;j=l.global,l.type=l.type.toUpperCase(),l.hasContent=!co.test(l.type),j&&p.active++===0&&p.event.trigger("ajaxStart");if(!l.hasContent){l.data&&(l.url+=(cq.test(l.url)?"&":"?")+l.data,delete l.data),d=l.url;if(l.cache===!1){var z=p.now(),A=l.url.replace(cs,"$1_="+z);l.url=A+(A===l.url?(cq.test(l.url)?"&":"?")+"_="+z:"")}}(l.data&&l.hasContent&&l.contentType!==!1||c.contentType)&&x.setRequestHeader("Content-Type",l.contentType),l.ifModified&&(d=d||l.url,p.lastModified[d]&&x.setRequestHeader("If-Modified-Since",p.lastModified[d]),p.etag[d]&&x.setRequestHeader("If-None-Match",p.etag[d])),x.setRequestHeader("Accept",l.dataTypes[0]&&l.accepts[l.dataTypes[0]]?l.accepts[l.dataTypes[0]]+(l.dataTypes[0]!=="*"?", "+cx+"; q=0.01":""):l.accepts["*"]);for(k in l.headers)x.setRequestHeader(k,l.headers[k]);if(!l.beforeSend||l.beforeSend.call(m,x,l)!==!1&&v!==2){w="abort";for(k in{success:1,error:1,complete:1})x[k](l[k]);g=cA(cw,l,c,x);if(!g)y(-1,"No Transport");else{x.readyState=1,j&&n.trigger("ajaxSend",[x,l]),l.async&&l.timeout>0&&(h=setTimeout(function(){x.abort("timeout")},l.timeout));try{v=1,g.send(t,y)}catch(B){if(v<2)y(-1,B);else throw B}}return x}return x.abort()},active:0,lastModified:{},etag:{}});var cE=[],cF=/\?/,cG=/(=)\?(?=&|$)|\?\?/,cH=p.now();p.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=cE.pop()||p.expando+"_"+cH++;return this[a]=!0,a}}),p.ajaxPrefilter("json jsonp",function(c,d,e){var f,g,h,i=c.data,j=c.url,k=c.jsonp!==!1,l=k&&cG.test(j),m=k&&!l&&typeof i=="string"&&!(c.contentType||"").indexOf("application/x-www-form-urlencoded")&&cG.test(i);if(c.dataTypes[0]==="jsonp"||l||m)return f=c.jsonpCallback=p.isFunction(c.jsonpCallback)?c.jsonpCallback():c.jsonpCallback,g=a[f],l?c.url=j.replace(cG,"$1"+f):m?c.data=i.replace(cG,"$1"+f):k&&(c.url+=(cF.test(j)?"&":"?")+c.jsonp+"="+f),c.converters["script json"]=function(){return h||p.error(f+" was not called"),h[0]},c.dataTypes[0]="json",a[f]=function(){h=arguments},e.always(function(){a[f]=g,c[f]&&(c.jsonpCallback=d.jsonpCallback,cE.push(f)),h&&p.isFunction(g)&&g(h[0]),h=g=b}),"script"}),p.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){return p.globalEval(a),a}}}),p.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),p.ajaxTransport("script",function(a){if(a.crossDomain){var c,d=e.head||e.getElementsByTagName("head")[0]||e.documentElement;return{send:function(f,g){c=e.createElement("script"),c.async="async",a.scriptCharset&&(c.charset=a.scriptCharset),c.src=a.url,c.onload=c.onreadystatechange=function(a,e){if(e||!c.readyState||/loaded|complete/.test(c.readyState))c.onload=c.onreadystatechange=null,d&&c.parentNode&&d.removeChild(c),c=b,e||g(200,"success")},d.insertBefore(c,d.firstChild)},abort:function(){c&&c.onload(0,1)}}}});var cI,cJ=a.ActiveXObject?function(){for(var a in cI)cI[a](0,1)}:!1,cK=0;p.ajaxSettings.xhr=a.ActiveXObject?function(){return!this.isLocal&&cL()||cM()}:cL,function(a){p.extend(p.support,{ajax:!!a,cors:!!a&&"withCredentials"in a})}(p.ajaxSettings.xhr()),p.support.ajax&&p.ajaxTransport(function(c){if(!c.crossDomain||p.support.cors){var d;return{send:function(e,f){var g,h,i=c.xhr();c.username?i.open(c.type,c.url,c.async,c.username,c.password):i.open(c.type,c.url,c.async);if(c.xhrFields)for(h in c.xhrFields)i[h]=c.xhrFields[h];c.mimeType&&i.overrideMimeType&&i.overrideMimeType(c.mimeType),!c.crossDomain&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");try{for(h in e)i.setRequestHeader(h,e[h])}catch(j){}i.send(c.hasContent&&c.data||null),d=function(a,e){var h,j,k,l,m;try{if(d&&(e||i.readyState===4)){d=b,g&&(i.onreadystatechange=p.noop,cJ&&delete cI[g]);if(e)i.readyState!==4&&i.abort();else{h=i.status,k=i.getAllResponseHeaders(),l={},m=i.responseXML,m&&m.documentElement&&(l.xml=m);try{l.text=i.responseText}catch(a){}try{j=i.statusText}catch(n){j=""}!h&&c.isLocal&&!c.crossDomain?h=l.text?200:404:h===1223&&(h=204)}}}catch(o){e||f(-1,o)}l&&f(h,j,l,k)},c.async?i.readyState===4?setTimeout(d,0):(g=++cK,cJ&&(cI||(cI={},p(a).unload(cJ)),cI[g]=d),i.onreadystatechange=d):d()},abort:function(){d&&d(0,1)}}}});var cN,cO,cP=/^(?:toggle|show|hide)$/,cQ=new RegExp("^(?:([-+])=|)("+q+")([a-z%]*)$","i"),cR=/queueHooks$/,cS=[cY],cT={"*":[function(a,b){var c,d,e=this.createTween(a,b),f=cQ.exec(b),g=e.cur(),h=+g||0,i=1,j=20;if(f){c=+f[2],d=f[3]||(p.cssNumber[a]?"":"px");if(d!=="px"&&h){h=p.css(e.elem,a,!0)||c||1;do i=i||".5",h=h/i,p.style(e.elem,a,h+d);while(i!==(i=e.cur()/g)&&i!==1&&--j)}e.unit=d,e.start=h,e.end=f[1]?h+(f[1]+1)*c:c}return e}]};p.Animation=p.extend(cW,{tweener:function(a,b){p.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");var c,d=0,e=a.length;for(;d<e;d++)c=a[d],cT[c]=cT[c]||[],cT[c].unshift(b)},prefilter:function(a,b){b?cS.unshift(a):cS.push(a)}}),p.Tween=cZ,cZ.prototype={constructor:cZ,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(p.cssNumber[c]?"":"px")},cur:function(){var a=cZ.propHooks[this.prop];return a&&a.get?a.get(this):cZ.propHooks._default.get(this)},run:function(a){var b,c=cZ.propHooks[this.prop];return this.options.duration?this.pos=b=p.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):cZ.propHooks._default.set(this),this}},cZ.prototype.init.prototype=cZ.prototype,cZ.propHooks={_default:{get:function(a){var b;return a.elem[a.prop]==null||!!a.elem.style&&a.elem.style[a.prop]!=null?(b=p.css(a.elem,a.prop,!1,""),!b||b==="auto"?0:b):a.elem[a.prop]},set:function(a){p.fx.step[a.prop]?p.fx.step[a.prop](a):a.elem.style&&(a.elem.style[p.cssProps[a.prop]]!=null||p.cssHooks[a.prop])?p.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},cZ.propHooks.scrollTop=cZ.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},p.each(["toggle","show","hide"],function(a,b){var c=p.fn[b];p.fn[b]=function(d,e,f){return d==null||typeof d=="boolean"||!a&&p.isFunction(d)&&p.isFunction(e)?c.apply(this,arguments):this.animate(c$(b,!0),d,e,f)}}),p.fn.extend({fadeTo:function(a,b,c,d){return this.filter(bZ).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=p.isEmptyObject(a),f=p.speed(b,c,d),g=function(){var b=cW(this,p.extend({},a),f);e&&b.stop(!0)};return e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,c,d){var e=function(a){var b=a.stop;delete a.stop,b(d)};return typeof a!="string"&&(d=c,c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,c=a!=null&&a+"queueHooks",f=p.timers,g=p._data(this);if(c)g[c]&&g[c].stop&&e(g[c]);else for(c in g)g[c]&&g[c].stop&&cR.test(c)&&e(g[c]);for(c=f.length;c--;)f[c].elem===this&&(a==null||f[c].queue===a)&&(f[c].anim.stop(d),b=!1,f.splice(c,1));(b||!d)&&p.dequeue(this,a)})}}),p.each({slideDown:c$("show"),slideUp:c$("hide"),slideToggle:c$("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){p.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),p.speed=function(a,b,c){var d=a&&typeof a=="object"?p.extend({},a):{complete:c||!c&&b||p.isFunction(a)&&a,duration:a,easing:c&&b||b&&!p.isFunction(b)&&b};d.duration=p.fx.off?0:typeof d.duration=="number"?d.duration:d.duration in p.fx.speeds?p.fx.speeds[d.duration]:p.fx.speeds._default;if(d.queue==null||d.queue===!0)d.queue="fx";return d.old=d.complete,d.complete=function(){p.isFunction(d.old)&&d.old.call(this),d.queue&&p.dequeue(this,d.queue)},d},p.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},p.timers=[],p.fx=cZ.prototype.init,p.fx.tick=function(){var a,b=p.timers,c=0;for(;c<b.length;c++)a=b[c],!a()&&b[c]===a&&b.splice(c--,1);b.length||p.fx.stop()},p.fx.timer=function(a){a()&&p.timers.push(a)&&!cO&&(cO=setInterval(p.fx.tick,p.fx.interval))},p.fx.interval=13,p.fx.stop=function(){clearInterval(cO),cO=null},p.fx.speeds={slow:600,fast:200,_default:400},p.fx.step={},p.expr&&p.expr.filters&&(p.expr.filters.animated=function(a){return p.grep(p.timers,function(b){return a===b.elem}).length});var c_=/^(?:body|html)$/i;p.fn.offset=function(a){if(arguments.length)return a===b?this:this.each(function(b){p.offset.setOffset(this,a,b)});var c,d,e,f,g,h,i,j={top:0,left:0},k=this[0],l=k&&k.ownerDocument;if(!l)return;return(d=l.body)===k?p.offset.bodyOffset(k):(c=l.documentElement,p.contains(c,k)?(typeof k.getBoundingClientRect!="undefined"&&(j=k.getBoundingClientRect()),e=da(l),f=c.clientTop||d.clientTop||0,g=c.clientLeft||d.clientLeft||0,h=e.pageYOffset||c.scrollTop,i=e.pageXOffset||c.scrollLeft,{top:j.top+h-f,left:j.left+i-g}):j)},p.offset={bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;return p.support.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(p.css(a,"marginTop"))||0,c+=parseFloat(p.css(a,"marginLeft"))||0),{top:b,left:c}},setOffset:function(a,b,c){var d=p.css(a,"position");d==="static"&&(a.style.position="relative");var e=p(a),f=e.offset(),g=p.css(a,"top"),h=p.css(a,"left"),i=(d==="absolute"||d==="fixed")&&p.inArray("auto",[g,h])>-1,j={},k={},l,m;i?(k=e.position(),l=k.top,m=k.left):(l=parseFloat(g)||0,m=parseFloat(h)||0),p.isFunction(b)&&(b=b.call(a,c,f)),b.top!=null&&(j.top=b.top-f.top+l),b.left!=null&&(j.left=b.left-f.left+m),"using"in b?b.using.call(a,j):e.css(j)}},p.fn.extend({position:function(){if(!this[0])return;var a=this[0],b=this.offsetParent(),c=this.offset(),d=c_.test(b[0].nodeName)?{top:0,left:0}:b.offset();return c.top-=parseFloat(p.css(a,"marginTop"))||0,c.left-=parseFloat(p.css(a,"marginLeft"))||0,d.top+=parseFloat(p.css(b[0],"borderTopWidth"))||0,d.left+=parseFloat(p.css(b[0],"borderLeftWidth"))||0,{top:c.top-d.top,left:c.left-d.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||e.body;while(a&&!c_.test(a.nodeName)&&p.css(a,"position")==="static")a=a.offsetParent;return a||e.body})}}),p.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,c){var d=/Y/.test(c);p.fn[a]=function(e){return p.access(this,function(a,e,f){var g=da(a);if(f===b)return g?c in g?g[c]:g.document.documentElement[e]:a[e];g?g.scrollTo(d?p(g).scrollLeft():f,d?f:p(g).scrollTop()):a[e]=f},a,e,arguments.length,null)}}),p.each({Height:"height",Width:"width"},function(a,c){p.each({padding:"inner"+a,content:c,"":"outer"+a},function(d,e){p.fn[e]=function(e,f){var g=arguments.length&&(d||typeof e!="boolean"),h=d||(e===!0||f===!0?"margin":"border");return p.access(this,function(c,d,e){var f;return p.isWindow(c)?c.document.documentElement["client"+a]:c.nodeType===9?(f=c.documentElement,Math.max(c.body["scroll"+a],f["scroll"+a],c.body["offset"+a],f["offset"+a],f["client"+a])):e===b?p.css(c,d,e,h):p.style(c,d,e,h)},c,g?e:b,g,null)}})}),a.jQuery=a.$=p,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return p})})(window);
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
;include.js({
    framework: 'ruqq.base'
}).done(function() {
    var w = window,
        r = ruqq,
        prfx = r.info.cssprefix,
        getTransitionEndEvent = function() {
            var el = document.createElement('fakeelement'),
                transitions = {
                    'transition': 'transitionEnd',
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
            }
            el = null;
            transitions = null;
            return getTransitionEndEvent();

        };

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
        timing: prfx + 'transition-timing-function',
        delay: prfx + 'transition-delay'
    };

    r.animate.ModelData = (function() {
        function parse(model) {
            var arr = model.split(/ *\| */g),
                data = {},
                length = arr.length;

            data.prop = arr[0];

            var vals = arr[1].split(/ *> */);
            data.from = vals.length == 2 ? vals[0] : null;
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


        var ModelData3 = Class({
            Construct: function(data, parent) {
                this.parent = parent;
                var model = data.model || data;
                
                if (model instanceof Array) {
                    this.model = [];
                    for (var i = 0, x, length = model.length; x = model[i], i < length; i++) {                        
                        this.model.push(new ModelData3(x, this));
                    }                    
                } else if (model instanceof Object) {
                    this.model = [new ModelData3(model, this)];
                } else if (typeof model === 'string') {
                    this.model = parse(model);
                }
                
                if (data.next != null) {
                    this.next = new ModelData3(data.next, this);                    
                }
                this.reset();
            },
            reset: function() {
                
                this.state = 0;
                this.modelCount = this.model instanceof Array ? this.model.length : 1;
                this.nextCount = 0;
                if (this.next != null) this.nextCount = this.next instanceof Array ? this.next.length : 1;
            },
            getNext: function() {                
                if (this.state == 0){
                    this.state = 1;
                    return this; 
                }
                
                
                
                if (this.state == 1 && this.modelCount > 0){
                    --this.modelCount;                    
                }
                if (this.state == 1 && this.modelCount == 0){
                    this.state = 2;                    
                    if (this.next)  return this.next;
                }                
                if (this.state == 2 && this.nextCount > 0){
                    --this.nextCount;
                }
                
                //-console.log('getNext', this.state, this.modelCount, this.nextCount, this.parent);
                if (this.state == 2 && this.nextCount == 0 && this.parent){
                    return this.parent.getNext && this.parent.getNext();
                }
                return null;
            }
        });

        return ModelData3;
    })();



    var Stack = Class({
        Construct: function() {
            this.arr = [];
        },       
        put: function(modelData3) {
            if (modelData3 == null) return false;
            
            var next = modelData3.getNext();
            
            if (next == null) {
                return false;
            }            
            if (next instanceof Array) {
                var r = false;
                for (var i = 0, x, length = next.length; x = next[i], i < length; i++) {
                    if (this.put(x) == true) r = true;
                }                
                return r;                
            }
            
            if (next.model instanceof Array){
                var r = false;
                for(var i = 0, x, length = next.model.length; x = next.model[i], i<length; i++){
                    if (this.put(x) == true) r = true;                    
                }                
                return r;
            }
            if (next.state == 0) next.state = 1;
            this.arr.push(next); 
            return true;
        },
        resolve: function(prop) {
            for (var i = 0, x, length = this.arr.length; x = this.arr[i], i < length; i++) {
                if (x.model.prop == prop) {
                    this.arr.splice(i, 1);                    
                    return this.put(x);                    
                }
            }
            return false;
        },
        getCss: function(startCss, css) {
            
            for (var i = 0, x, length = this.arr.length; x = this.arr[i], i < length; i++) {                
                if ('from' in x.model) {
                    startCss[x.model.prop] = x.model.from;
                }
                css[x.model.prop] = x.model.to;

                for (var key in I) {
                    (css[I[key]] || (css[I[key]] = [])).push(x.model[key]);
                }
            }
            for (var key in I) {
                css[I[key]] = css[I[key]].join(',')
            }
        }
    });

    r.animate.Model3 = Class({
        Construct: function(models) {
            this.stack = new Stack();
            this.model = new r.animate.ModelData(models);
            this.transitionEnd = this.transitionEnd.bind(this);
        },
        getNext: function(){
            //-console.log('getNext');
        },
        start: function(element, onComplete) {
            this.onComplete = onComplete;
            var startCss = {},
                css = {};
            
            this.model.reset();
            this.stack.put(this.model);
            this.stack.getCss(startCss, css);

            
            element.addEventListener(getTransitionEndEvent(), this.transitionEnd, false);
            this.element = element;
            this.apply(startCss, css);
        },
        transitionEnd: function(event) {            
            if (this.stack.resolve(event.propertyName) == true) {
                var startCss = {},
                    css = {};
                this.stack.getCss(startCss, css);
                this.apply(startCss, css);
            } else{
                this.element.removeEventListener(getTransitionEndEvent(), this.transitionEnd, false);
                this.stack.arr.length < 2 && this.onComplete && this.onComplete();                
            }
        },

        apply: function(startCss, css) {
            if (startCss) {
                for (var key in startCss) this.element.style[key] = startCss[key];
            }
            
            setTimeout(function() {
                for (var key in css) this.element.style[key] = css[key];
            }.bind(this), 0);
        }
    });













    r.animate.Model = Class({
        Construct: function(model, ondone) {
            this.count = 0;
            this.addModel(model);
        },
        addModel: function(model) {
            if (model instanceof Array) {
                for (var i = 0, x, length = model.length; x = model[i], i < length; i++) {
                    this.addModel(x);
                }
                return this;
            }
            switch (typeof model) {
            case 'string':
                this._addModel(this._parse(model));
                break;
            case 'object':
                if (model != null) this._addModel(model);
                break;
            }
            return this;
        },
        start: function(element, onComplete) {

            if (this.startCss) {
                for (var key in this.startCss) element.style[key] = this.startCss[key];
            }
            setTimeout(function() {
                for (var key in this.css) {
                    element.style[key] = this.css[key];
                }


                var count = this.count,
                    fn = function(e) {
                        console.log('onCompl', count, e);
                        if (--count == 0) {
                            onComplete && onComplete();
                            element.removeEventListener(getTransitionEndEvent(), fn);
                        }



                    };
                element.addEventListener(getTransitionEndEvent(), fn, false);

            }.bind(this), 0)
        },
        /**
         *  '{prop} | {?from} > {to} | {duration}ms | {?timing}'
         */
        _parse: function(model) {
            var arr = model.split(/ *\| */g),
                data = {},
                length = arr.length;

            data.prop = arr[0];

            var vals = arr[1].split(/ *> */);
            data.from = vals.length == 2 ? vals[0] : null;
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
        },
        /**
         * Apply Raw Object */
        _addModel: function(data) {
            this.count++;

            if (data.from != null) {
                if (this.startCss == null) this.startCss = {};
                this.startCss[data.prop] = data.from;
            }
            if (this.css == null) this.css = {};

            for (var key in I) this.css[I[key]] = (this.css[I[key]] ? this.css[I[key]] + ',' : '') + data[key];

            this.css[data.prop] = data.to;
        }
    });



    r.animate.sprite = (function() {
        var keyframes = {},
            prfx = r.info.cssprefix,
            vendor = null,
            initVendorStrings = function() {
                var prfx = r.info.prefix;
                vendor = {
                    keyframes: "@" + prfx + "keyframes",
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
			/** remove unimportant whitespaces */
			template = template.replace(/[\t\n\r]|[ ]{2,}/g, ' ');
			
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

				if (direction == 'up') nextKey = 'parent';
				else nextKey = type == 'node' ? 'nodes' : 'components';

				return {
					key: key,
					prop: prop,
					selector: selector,
					nextKey: nextKey
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
			on: function(component, events, $element) {
				if ($element == null) $element = component.$;
				
				var isarray = events instanceof Array,
					length = isarray ? events.length : 1,
					x = null;
				for (var i = 0; x = isarray ? events[i] : events, isarray ? i < length : i < 1; i++) {

					if (x instanceof Array) {
						$element.on.apply($element, x);
						continue;
					}


					for (var key in x) {
						var fn = typeof x[key] === 'string' ? component[x[key]] : x[key],
							parts = key.split(':');
							
						$element.on(parts[0] || 'click', parts.splice(1).join(':').trim() || null , fn.bind(component));
						
						
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
						
					if (data instanceof Array){
						selector = data[0];
						events = data.splice(1);
					}
					if (typeof data == 'string'){
						selector = data;
					}
					if (data == null){
						console.error('Unknown component child', name, compos[name]);
						return;
					}
					
					var index = selector.indexOf(':'),
						engine = selector.substring(0, index);

					engine = Compo.config.selectors[engine];

					if (engine == null) {
						component.compos[name] = component.$[0].querySelector(selector);						
					}else{
						selector = selector.substring(++index).replace(regexp.trailingSpaces, '');
						component.compos[name] = engine(component, selector);
					}
					
					if (events != null){
						Events_.on(component, events, component.compos[name]);
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
				Children_.select(this, this.compos);
				//////for (var key in this.compos) {
				//////	if (typeof this.compos[key] !== 'string') continue;
				//////	var selector = this.compos[key],
				//////		index = selector.indexOf(':'),
				//////		engine = selector.substring(0, index);
				//////
				//////	engine = Compo.config.selectors[engine];
				//////
				//////	if (engine == null) {
				//////		this.compos[key] = this.$.get(0).querySelector(selector);
				//////		continue;
				//////	}
				//////
				//////	selector = selector.substring(++index).replace(regexp.trailingSpaces, '');
				//////	this.compos[key] = engine(this, selector);
				//////
				//////}
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
			match: function(compo, selector, type) {
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

				return Compo.find(compo[selector.nextKey], selector);
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
         'changed: .radioButtons': function(e, target) {
            var name = this.attr.id.replace('View', '');
            window.routes.set(name + '/' + target.name);
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
         var scroller = Compo.find(this, 'scroller');
         scroller && scroller.scroller && scroller.scroller.refresh();
         
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
;include.setCurrent({ id: '/script/main.js', namespace: '', url: '{url}'});
;window.onerror = function(e, a, b) {
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