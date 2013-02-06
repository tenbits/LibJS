(function(global) {
    var helper = {
        each: function(arr, fn) {
            if (arr instanceof Array) {
                for (var i = 0; i < arr.length; i++) fn(arr[i]);
                return;
            }
            fn(arr);
        },
        extendProto: function(proto, x) {
            var prototype;
            if (null == x) return;
            switch (typeof x) {
              case "function":
                prototype = x.prototype;
                break;

              case "object":
                prototype = x;
                break;

              default:
                return;
            }
            for (var key in prototype) proto[key] = prototype[key];
        },
        extendClass: function(_class, _base, _extends, original) {
            if ("object" !== typeof original) return;
            this.extendPrototype = null == original["__proto__"] ? this.protoLess : this.proto;
            this.extendPrototype(_class, _base, _extends, original);
        },
        proto: function(_class, _base, _extends, original) {
            var prototype = original, proto = original;
            prototype.constructor = _class.prototype.constructor;
            if (null != _extends) {
                proto["__proto__"] = {};
                helper.each(_extends, function(x) {
                    helper.extendProto(proto["__proto__"], x);
                });
                proto = proto["__proto__"];
            }
            if (null != _base) proto["__proto__"] = _base.prototype;
            _class.prototype = prototype;
        },
        protoLess: function(_class, _base, _extends, original) {
            if (null != _base) {
                var proto = {}, tmp = function() {};
                tmp.prototype = _base.prototype;
                _class.prototype = new tmp();
                _class.prototype.constructor = _class;
            }
            helper.extendProto(_class.prototype, original);
            if (null != _extends) helper.each(_extends, function(x) {
                var a = {};
                helper.extendProto(a, x);
                delete a.constructor;
                for (var key in a) _class.prototype[key] = a[key];
            });
        }
    };
    var Class = function(data) {
        var _base = data.Base, _extends = data.Extends, _static = data.Static, _construct = data.Construct, _class = null, key;
        if (null != _base) delete data.Base;
        if (null != _extends) delete data.Extends;
        if (null != _static) delete data.Static;
        if (null != _construct) delete data.Construct;
        if (null == _base && null == _extends) {
            if (null == _construct) _class = function() {}; else _class = _construct;
            data.constructor = _class.prototype.constructor;
            if (null != _static) for (key in _static) _class[key] = _static[key];
            _class.prototype = data;
            return _class;
        }
        _class = function() {
            if (null != _extends) {
                var isarray = _extends instanceof Array, length = isarray ? _extends.length : 1, x = null;
                for (var i = 0; isarray ? i < length : i < 1; i++) {
                    x = isarray ? _extends[i] : _extends;
                    if ("function" === typeof x) x.apply(this, arguments);
                }
            }
            if (null != _base) _base.apply(this, arguments);
            if (null != _construct) {
                var r = _construct.apply(this, arguments);
                if (null != r) return r;
            }
            return this;
        };
        if (null != _static) for (key in _static) _class[key] = _static[key];
        helper.extendClass(_class, _base, _extends, data);
        data = null;
        _static = null;
        return _class;
    };
    Class.bind = function(cntx) {
        var arr = arguments, i = 1, length = arguments.length, key;
        for (;i < length; i++) {
            key = arr[i];
            cntx[key] = cntx[key].bind(cntx);
        }
        return cntx;
    };
    global.Class = Class;
})("undefined" === typeof window ? global : window);

var __eval = function(source, include) {
    "use strict";
    var iparams = include && include.route.params;
    return eval.call(window, source);
};

(function(global, document) {
    "use strict";
    var bin = {}, isWeb = !!(global.location && global.location.protocol && /^https?:/.test(global.location.protocol)), cfg = {
        eval: null == document
    }, handler = {}, hasOwnProp = {}.hasOwnProperty, XMLHttpRequest = global.XMLHttpRequest;
    var Helper = {
        uri: {
            getDir: function(url) {
                var index = url.lastIndexOf("/");
                return index == -1 ? "" : url.substring(index + 1, -index);
            },
            resolveCurrent: function() {
                var scripts = document.getElementsByTagName("script");
                return scripts[scripts.length - 1].getAttribute("src");
            },
            resolveUrl: function(url, parent) {
                if (cfg.path && "/" == url[0]) url = cfg.path + url.substring(1);
                switch (url.substring(0, 5)) {
                  case "file:":
                  case "http:":
                    return url;
                }
                if ("./" === url.substring(0, 2)) url = url.substring(2);
                if ("/" === url[0]) {
                    if (false === isWeb || true === cfg.lockedToFolder) url = url.substring(1);
                } else if (null != parent && null != parent.location) url = parent.location + url;
                while (url.indexOf("../") > -1) url = url.replace(/[^\/]+\/\.\.\//, "");
                return url;
            }
        },
        extend: function(target) {
            for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                if ("function" === typeof source) source = source.prototype;
                for (var key in source) target[key] = source[key];
            }
            return target;
        },
        invokeEach: function(arr, args) {
            if (null == arr) return;
            if (arr instanceof Array) for (var i = 0, x, length = arr.length; i < length; i++) {
                x = arr[i];
                if ("function" === typeof x) null != args ? x.apply(this, args) : x();
            }
        },
        doNothing: function(fn) {
            "function" == typeof fn && fn();
        },
        reportError: function(e) {
            console.error("IncludeJS Error:", e, e.message, e.url);
            "function" == typeof handler.onerror && handler.onerror(e);
        },
        ensureArray: function(obj, xpath) {
            if (!xpath) return obj;
            var arr = xpath.split(".");
            while (arr.length - 1) {
                var key = arr.shift();
                obj = obj[key] || (obj[key] = {});
            }
            return obj[arr.shift()] = [];
        }
    }, XHR = function(resource, callback) {
        var xhr = new XMLHttpRequest(), s = Date.now();
        xhr.onreadystatechange = function() {
            4 == xhr.readyState && callback && callback(resource, xhr.responseText);
        };
        xhr.open("GET", "object" === typeof resource ? resource.url : resource, true);
        xhr.send();
    };
    var RoutesLib = function() {
        var routes = {}, regexpAlias = /([^\\\/]+)\.\w+$/;
        return {
            register: function(namespace, route) {
                routes[namespace] = route instanceof Array ? route : route.split(/[\{\}]/g);
            },
            resolve: function(namespace, template) {
                var questionMark = template.indexOf("?"), aliasIndex = template.indexOf("::"), alias, path, params, route, i, x, length;
                if (~aliasIndex) {
                    alias = template.substring(aliasIndex + 2);
                    template = template.substring(0, aliasIndex);
                }
                if (~questionMark) {
                    var arr = template.substring(questionMark + 1).split("&");
                    params = {};
                    for (i = 0, length = arr.length; i < length; i++) {
                        x = arr[i].split("=");
                        params[x[0]] = x[1];
                    }
                    template = template.substring(0, questionMark);
                }
                template = template.split("/");
                route = routes[namespace];
                if (null == route) return {
                    path: template.join("/"),
                    params: params,
                    alias: alias
                };
                path = route[0];
                for (i = 1; i < route.length; i++) if (0 === i % 2) path += route[i]; else {
                    var index = route[i] << 0;
                    if (index > template.length - 1) index = template.length - 1;
                    path += template[index];
                    if (i == route.length - 2) for (index++; index < template.length; index++) path += "/" + template[index];
                }
                return {
                    path: path,
                    params: params,
                    alias: alias
                };
            },
            each: function(type, includeData, fn, namespace, xpath) {
                var key;
                if (null == includeData) {
                    console.error("Include Item has no Data", type, namespace);
                    return;
                }
                if ("lazy" == type && null == xpath) {
                    for (key in includeData) this.each(type, includeData[key], fn, null, key);
                    return;
                }
                if (includeData instanceof Array) {
                    for (var i = 0; i < includeData.length; i++) this.each(type, includeData[i], fn, namespace, xpath);
                    return;
                }
                if ("object" === typeof includeData) {
                    for (key in includeData) if (hasOwnProp.call(includeData, key)) this.each(type, includeData[key], fn, key, xpath);
                    return;
                }
                if ("string" === typeof includeData) {
                    var x = this.resolve(namespace, includeData);
                    if (namespace) namespace += "." + includeData;
                    fn(namespace, x, xpath);
                    return;
                }
                console.error("Include Package is invalid", arguments);
            },
            getRoutes: function() {
                return routes;
            },
            parseAlias: function(route) {
                var path = route.path, result = regexpAlias.exec(path);
                return result && result[1];
            }
        };
    };
    var Routes = RoutesLib();
    var Events = function(document) {
        if (null == document) return {
            ready: Helper.doNothing,
            load: Helper.doNothing
        };
        var readycollection = [], loadcollection = null, timer = Date.now();
        document.onreadystatechange = function() {
            if (false === /complete|interactive/g.test(document.readyState)) return;
            if (timer) console.log("DOMContentLoader", document.readyState, Date.now() - timer, "ms");
            Events.ready = Helper.doNothing;
            Helper.invokeEach(readycollection);
            readycollection = null;
            if ("complete" == document.readyState) {
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
    }(document);
    var IncludeDeferred = function() {
        this.callbacks = [];
        this.state = 0;
    };
    IncludeDeferred.prototype = {
        on: function(state, callback) {
            state <= this.state ? callback(this) : this.callbacks[this.state < 3 ? "unshift" : "push"]({
                state: state,
                callback: callback
            });
            return this;
        },
        readystatechanged: function(state) {
            var i, length, x, currentInclude;
            if (state > this.state) this.state = state;
            if (3 === this.state) {
                var includes = this.includes;
                if (null != includes && includes.length) for (i = 0; i < includes.length; i++) if (4 != includes[i].resource.state) return;
                this.state = 4;
            }
            i = 0;
            length = this.callbacks.length;
            if (0 === length) return;
            if ("js" === this.type && 4 === this.state) {
                currentInclude = global.include;
                global.include = this;
            }
            for (;i < length; i++) {
                x = this.callbacks[i];
                if (null == x || x.state > this.state) continue;
                this.callbacks.splice(i, 1);
                length--;
                i--;
                x.callback(this);
                if (this.state < 4) break;
            }
            if (null != currentInclude) global.include = currentInclude;
        },
        ready: function(callback) {
            var that = this;
            return this.on(4, function() {
                Events.ready(function() {
                    that.resolve(callback);
                });
            });
        },
        loaded: function(callback) {
            return this.on(4, function() {
                Events.load(callback);
            });
        },
        done: function(callback) {
            var that = this;
            return this.on(4, function() {
                that.resolve(callback);
            });
        },
        resolve: function(callback) {
            var includes = this.includes, length = null == includes ? 0 : includes.length;
            if (length > 0 && null == this.response) {
                this.response = {};
                var resource, route;
                for (var i = 0, x; i < length; i++) {
                    x = includes[i];
                    resource = x.resource;
                    route = x.route;
                    if (!resource.exports) continue;
                    var type = resource.type;
                    switch (type) {
                      case "js":
                      case "load":
                      case "ajax":
                        var alias = route.alias || Routes.parseAlias(route), obj = "js" == type ? this.response : this.response[type] || (this.response[type] = {});
                        if (alias) {
                            obj[alias] = resource.exports;
                            break;
                        } else console.warn("Resource Alias is Not defined", resource);
                    }
                }
            }
            callback(this.response);
        }
    };
    var Include = function() {
        function embedPlugin(source) {
            eval(source);
        }
        function enableModules() {
            if ("undefined" === typeof Object.defineProperty) {
                console.warn("Browser do not support Object.defineProperty");
                return;
            }
            Object.defineProperty(global, "module", {
                get: function() {
                    return global.include;
                }
            });
            Object.defineProperty(global, "exports", {
                get: function() {
                    var current = global.include;
                    return current.exports || (current.exports = {});
                },
                set: function(exports) {
                    global.include.exports = exports;
                }
            });
        }
        var Include = function() {};
        Include.prototype = {
            setCurrent: function(data) {
                var resource = new Resource("js", {
                    path: data.id
                }, data.namespace, null, null, data.id);
                if (4 != resource.state) console.error("Current Resource should be loaded");
                resource.state = 3;
                global.include = resource;
            },
            incl: function(type, pckg) {
                if (this instanceof Resource) return this.include(type, pckg);
                var r = new Resource();
                r.type = "js";
                return r.include(type, pckg);
            },
            js: function(pckg) {
                return this.incl("js", pckg);
            },
            css: function(pckg) {
                return this.incl("css", pckg);
            },
            load: function(pckg) {
                return this.incl("load", pckg);
            },
            ajax: function(pckg) {
                return this.incl("ajax", pckg);
            },
            embed: function(pckg) {
                return this.incl("embed", pckg);
            },
            lazy: function(pckg) {
                return this.incl("lazy", pckg);
            },
            cfg: function(arg) {
                switch (typeof arg) {
                  case "object":
                    for (var key in arg) {
                        cfg[key] = arg[key];
                        if ("modules" == key && true === arg[key]) enableModules();
                    }
                    break;

                  case "string":
                    if (1 == arguments.length) return cfg[arg];
                    if (2 == arguments.length) cfg[arg] = arguments[1];
                    break;

                  case "undefined":
                    return cfg;
                }
                return this;
            },
            routes: function(arg) {
                if (null == arg) return Routes.getRoutes();
                for (var key in arg) Routes.register(key, arg[key]);
                return this;
            },
            promise: function(namespace) {
                var arr = namespace.split("."), obj = global;
                while (arr.length) {
                    var key = arr.shift();
                    obj = obj[key] || (obj[key] = {});
                }
                return obj;
            },
            register: function(_bin) {
                for (var key in _bin) for (var i = 0; i < _bin[key].length; i++) {
                    var id = _bin[key][i].id, url = _bin[key][i].url, namespace = _bin[key][i].namespace, resource = new Resource();
                    resource.state = 4;
                    resource.namespace = namespace;
                    resource.type = key;
                    if (url) {
                        if ("/" == url[0]) url = url.substring(1);
                        resource.location = Helper.uri.getDir(url);
                    }
                    switch (key) {
                      case "load":
                      case "lazy":
                        var container = document.querySelector("#includejs-" + id.replace(/\W/g, ""));
                        if (null == container) {
                            console.error('"%s" Data was not embedded into html', id);
                            return;
                        }
                        resource.exports = container.innerHTML;
                    }
                    (bin[key] || (bin[key] = {}))[id] = resource;
                }
            },
            instance: function() {
                return new Resource();
            },
            getResource: function(url, type) {
                var id = ("/" == url[0] ? "" : "/") + url;
                if (null != type) return bin[type][id];
                for (var key in bin) if (bin[key].hasOwnProperty(id)) return bin[key][id];
                return null;
            },
            plugin: function(pckg, callback) {
                var urls = [], length = 0, j = 0, i = 0, onload = function(url, response) {
                    j++;
                    embedPlugin(response);
                    if (j == length - 1 && callback) {
                        callback();
                        callback = null;
                    }
                };
                Routes.each("", pckg, function(namespace, route) {
                    urls.push("/" == route.path[0] ? route.path.substring(1) : route.path);
                });
                length = urls.length;
                for (;i < length; i++) XHR(urls[i], onload);
                return this;
            }
        };
        return Include;
    }();
    var ScriptStack = function() {
        var head, currentResource, stack = [], loadScript = function(url, callback) {
            var tag = document.createElement("script");
            tag.type = "text/javascript";
            tag.src = url;
            if ("onreadystatechange" in tag) tag.onreadystatechange = function() {
                ("complete" == this.readyState || "loaded" == this.readyState) && callback();
            }; else tag.onload = tag.onerror = callback;
            (head || (head = document.getElementsByTagName("head")[0])).appendChild(tag);
        }, loadByEmbedding = function() {
            if (0 === stack.length) return;
            if (null != currentResource) return;
            var resource = currentResource = stack[0];
            if (1 === resource.state) return;
            resource.state = 1;
            global.include = resource;
            global.iparams = resource.route.params;
            function resourceLoaded(e) {
                if (e && "error" == e.type) console.log("Script Loaded Error", resource.url);
                var i = 0, length = stack.length;
                for (;i < length; i++) if (stack[i] === resource) {
                    stack.splice(i, 1);
                    break;
                }
                if (i == length) {
                    console.error("Loaded Resource not found in stack", resource);
                    return;
                }
                resource.readystatechanged(3);
                currentResource = null;
                loadByEmbedding();
            }
            if (resource.source) {
                __eval(resource.source, resource);
                resourceLoaded();
                return;
            }
            loadScript(resource.url, resourceLoaded);
        }, processByEval = function() {
            if (0 === stack.length) return;
            if (null != currentResource) return;
            var resource = stack[0];
            if (resource.state < 2) return;
            currentResource = resource;
            resource.state = 1;
            global.include = resource;
            __eval(resource.source, resource);
            for (var i = 0, x, length = stack.length; i < length; i++) {
                x = stack[i];
                if (x == resource) {
                    stack.splice(i, 1);
                    break;
                }
            }
            resource.readystatechanged(3);
            currentResource = null;
            processByEval();
        };
        return {
            load: function(resource, parent, forceEmbed) {
                var added = false;
                if (parent) for (var i = 0, length = stack.length; i < length; i++) if (stack[i] === parent) {
                    stack.splice(i, 0, resource);
                    added = true;
                    break;
                }
                if (!added) stack.push(resource);
                if (!cfg.eval || forceEmbed) {
                    loadByEmbedding();
                    return;
                }
                if (resource.source) {
                    resource.state = 2;
                    processByEval();
                    return;
                }
                XHR(resource, function(resource, response) {
                    if (!response) console.error("Not Loaded:", resource.url);
                    resource.source = response;
                    resource.state = 2;
                    processByEval();
                });
            },
            moveToParent: function(resource, parent) {
                var i, length, x, tasks = 2;
                for (i = 0, x, length = stack.length; i < length && tasks; i++) {
                    x = stack[i];
                    if (x === resource) {
                        stack.splice(i, 1);
                        length--;
                        i--;
                        tasks--;
                    }
                    if (x === parent) {
                        stack.splice(i, 0, resource);
                        length++;
                        i++;
                        tasks--;
                    }
                }
                if (null == parent) stack.unshift(resource);
            }
        };
    }();
    var CustomLoader = function() {
        var _loaders = {};
        function createLoader(url) {
            var extension = url.substring(url.lastIndexOf(".") + 1);
            if (_loaders.hasOwnProperty(extension)) return _loaders[extension];
            var loaderRoute = cfg.loader[extension], path = loaderRoute, namespace = null;
            if ("object" === typeof loaderRoute) for (var key in loaderRoute) {
                namespace = key;
                path = loaderRoute[key];
                break;
            }
            return _loaders[extension] = new Resource("js", Routes.resolve(namespace, path), namespace);
        }
        return {
            load: function(resource, callback) {
                var loader = createLoader(resource.url);
                loader.done(function() {
                    XHR(resource, function(resource, response) {
                        callback(resource, loader.exports.process(response, resource));
                    });
                });
            },
            exists: function(resource) {
                if (!(resource.url && cfg.loader)) return false;
                var url = resource.url, extension = url.substring(url.lastIndexOf(".") + 1);
                return cfg.loader.hasOwnProperty(extension);
            }
        };
    }();
    var LazyModule = {
        create: function(xpath, code) {
            var arr = xpath.split("."), obj = global, module = arr[arr.length - 1];
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
                        if (!(null == r || r instanceof Resource)) obj[module] = r;
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
    var Resource = function(Include, IncludeDeferred, Routes, ScriptStack, CustomLoader) {
        function process(resource, loader) {
            var type = resource.type, parent = resource.parent, url = resource.url;
            if (false === CustomLoader.exists(resource)) switch (type) {
              case "js":
              case "embed":
                ScriptStack.load(resource, parent, "embed" == type);
                break;

              case "ajax":
              case "load":
              case "lazy":
                XHR(resource, onXHRCompleted);
                break;

              case "css":
                resource.state = 4;
                var tag = document.createElement("link");
                tag.href = url;
                tag.rel = "stylesheet";
                tag.type = "text/css";
                document.getElementsByTagName("head")[0].appendChild(tag);
            } else CustomLoader.load(resource, onXHRCompleted);
            return resource;
        }
        function onXHRCompleted(resource, response) {
            if (!response) {
                console.warn("Resource cannt be loaded", resource.url);
                resource.readystatechanged(4);
                return;
            }
            switch (resource.type) {
              case "js":
              case "embed":
                resource.source = response;
                ScriptStack.load(resource, resource.parent, "embed" == resource.type);
                return;

              case "load":
              case "ajax":
                resource.exports = response;
                break;

              case "lazy":
                LazyModule.create(resource.xpath, response);
                break;

              case "css":
                var tag = document.createElement("style");
                tag.type = "text/css";
                tag.innerHTML = response;
                document.getElementsByTagName("head")[0].appendChild(tag);
            }
            resource.readystatechanged(4);
        }
        function childLoaded(resource, child) {
            var includes = resource.includes;
            if (includes && includes.length) {
                if (resource.state < 3) return;
                for (var i = 0; i < includes.length; i++) if (4 != includes[i].resource.state) return;
            }
            resource.readystatechanged(4);
        }
        var Resource = function(type, route, namespace, xpath, parent, id) {
            Include.call(this);
            IncludeDeferred.call(this);
            var url = route && route.path;
            if (null != url) this.url = url = Helper.uri.resolveUrl(url, parent);
            this.route = route;
            this.namespace = namespace;
            this.type = type;
            this.xpath = xpath;
            this.parent = parent;
            if (null == id && url) id = ("/" == url[0] ? "" : "/") + url;
            var resource = bin[type] && bin[type][id];
            if (resource) {
                if (resource.state < 4 && "js" == type) ScriptStack.moveToParent(resource, parent);
                return resource;
            }
            if (null == url) {
                this.state = 3;
                return this;
            }
            this.location = Helper.uri.getDir(url);
            (bin[type] || (bin[type] = {}))[id] = this;
            if (cfg.version) this.url += (!~this.url.indexOf("?") ? "?" : "&") + "v=" + cfg.version;
            return process(this);
        };
        Resource.prototype = Helper.extend({}, IncludeDeferred, Include, {
            include: function(type, pckg) {
                var that = this;
                this.state = this.state >= 3 ? 3 : 2;
                if (null == this.includes) this.includes = [];
                if (null == this.childLoaded) this.childLoaded = function(child) {
                    childLoaded.call(that, that, child);
                };
                this.response = null;
                Routes.each(type, pckg, function(namespace, route, xpath) {
                    var resource = new Resource(type, route, namespace, xpath, that);
                    that.includes.push({
                        resource: resource,
                        route: route
                    });
                    resource.on(4, that.childLoaded);
                });
                return this;
            }
        });
        return Resource;
    }(Include, IncludeDeferred, Routes, ScriptStack, CustomLoader);
    global.include = new Include();
    global.includeLib = {
        Helper: Helper,
        Routes: RoutesLib,
        Resource: Resource,
        ScriptStack: ScriptStack,
        registerLoader: CustomLoader.register
    };
})("undefined" === typeof window ? global : window, "undefined" == typeof document ? null : document);

include.register({
    css: [ {
        id: "/style/main.css",
        url: "/style/main.css",
        namespace: ""
    }, {
        id: "/script/shortend-dialog/shortend-dialog.css",
        url: "/script/shortend-dialog/shortend-dialog.css"
    }, {
        id: "/script/dropdownMenu/dropdownMenu.css",
        url: "/script/dropdownMenu/dropdownMenu.css"
    }, {
        id: "/script/tabs/tabs.css",
        url: "/script/tabs/tabs.css"
    }, {
        id: "/script/preview/preview.css",
        url: "/script/preview/preview.css"
    } ],
    load: [ {
        id: "/script/shortend-dialog/shortend-dialog.mask",
        url: "/script/shortend-dialog/shortend-dialog.mask"
    }, {
        id: "/presets/presets.txt",
        url: "/presets/presets.txt"
    } ],
    js: [ {
        id: "/.reference/libjs/class/lib/class.js",
        url: "/.reference/libjs/class/lib/class.js",
        namespace: ""
    }, {
        id: "/.reference/libjs/include/lib/include.js",
        url: "/.reference/libjs/include/lib/include.js",
        namespace: ""
    }, {
        id: "/include.routes.js",
        url: "/include.routes.js",
        namespace: ""
    }, {
        id: "/script/htmlbeautify.js",
        url: "/script/htmlbeautify.js",
        namespace: ""
    }, {
        id: "/.reference/libjs/ruqq/lib/dom/jquery.js",
        url: "/.reference/libjs/ruqq/lib/dom/jquery.js",
        namespace: "ruqq.dom/jquery"
    }, {
        id: "/.reference/libjs/ruqq/lib/utils.js",
        url: "/.reference/libjs/ruqq/lib/utils.js",
        namespace: "ruqq.utils"
    }, {
        id: "/.reference/libjs/ruqq/lib/arr.js",
        url: "/.reference/libjs/ruqq/lib/arr.js",
        namespace: "ruqq.arr"
    }, {
        id: "/.reference/libjs/ruqq/lib/es5shim.js",
        url: "/.reference/libjs/ruqq/lib/es5shim.js",
        namespace: "ruqq.es5shim"
    }, {
        id: "/.reference/libjs/mask/lib/mask.js",
        url: "/.reference/libjs/mask/lib/mask.js",
        namespace: "lib.mask"
    }, {
        id: "/.reference/libjs/compo/lib/compo.js",
        url: "/.reference/libjs/compo/lib/compo.js",
        namespace: "lib.compo"
    }, {
        id: "/.reference/libjs/ruqq/lib/ruqq.base.js",
        url: "/.reference/libjs/ruqq/lib/ruqq.base.js",
        namespace: "ruqq.ruqq.base"
    }, {
        id: "/.reference/libjs/ranimate/lib/ranimate.js",
        url: "/.reference/libjs/ranimate/lib/ranimate.js",
        namespace: "lib.ranimate"
    }, {
        id: "/script/preview/preview.js",
        url: "/script/preview/preview.js",
        namespace: "component.preview"
    }, {
        id: "/script/tabs/tabs.js",
        url: "/script/tabs/tabs.js",
        namespace: "component.tabs"
    }, {
        id: "/script/dropdownMenu/dropdownMenu.js",
        url: "/script/dropdownMenu/dropdownMenu.js",
        namespace: "component.dropdownMenu"
    }, {
        id: "/script/shortend-dialog/shortend-dialog.js",
        url: "/script/shortend-dialog/shortend-dialog.js",
        namespace: "component.shortend-dialog"
    }, {
        id: "/.reference/libjs/vendor-lib/keymaster/keymaster.js",
        url: "/.reference/libjs/vendor-lib/keymaster/keymaster.js",
        namespace: "vendor.keymaster"
    }, {
        id: "/script/presets.js",
        url: "/script/presets.js",
        namespace: "script.presets"
    }, {
        id: "/script/urlcode.js",
        url: "/script/urlcode.js",
        namespace: "script.urlcode"
    }, {
        id: "/script/main.js",
        url: "/script/main.js",
        namespace: ""
    } ]
});

include.setCurrent({
    id: "/include.routes.js",
    namespace: "",
    url: "/include.routes.js"
});

window.DEBUG = true;

include.routes({
    lib: "/.reference/libjs/{0}/lib/{1}.js",
    ruqq: "/.reference/libjs/ruqq/lib/{0}.js",
    compo: "/.reference/libjs/compos/{0}/lib/{1}.js"
});

if (false) include.plugin({
    lib: "include/include.autoreload"
});

if (window.location.href.indexOf("file") != -1) include.cfg({
    loader: {
        coffee: {
            lib: "include/loader/coffee/loader"
        },
        less: {
            lib: "include/loader/less/loader"
        }
    }
});

include.getResource("/include.routes.js", "js").readystatechanged(3);

function style_html(html_source, options) {
    var multi_parser, indent_size, indent_character, max_char, brace_style, unformatted;
    options = options || {};
    indent_size = options.indent_size || 4;
    indent_character = options.indent_char || " ";
    brace_style = options.brace_style || "collapse";
    max_char = 0 == options.max_char ? 1/0 : options.max_char || 70;
    unformatted = options.unformatted || [ "a", "span", "bdo", "em", "strong", "dfn", "code", "samp", "kbd", "var", "cite", "abbr", "acronym", "q", "sub", "sup", "tt", "i", "b", "big", "small", "u", "s", "strike", "font", "ins", "del", "pre", "address", "dt", "h1", "h2", "h3", "h4", "h5", "h6" ];
    function Parser() {
        this.pos = 0;
        this.token = "";
        this.current_mode = "CONTENT";
        this.tags = {
            parent: "parent1",
            parentcount: 1,
            parent1: ""
        };
        this.tag_type = "";
        this.token_text = this.last_token = this.last_text = this.token_type = "";
        this.Utils = {
            whitespace: "\n\r	 ".split(""),
            single_token: "br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed,?php,?,?=".split(","),
            extra_liners: "head,body,/html".split(","),
            in_array: function(what, arr) {
                for (var i = 0; i < arr.length; i++) if (what === arr[i]) return true;
                return false;
            }
        };
        this.get_content = function() {
            var input_char = "", content = [], space = false;
            while ("<" !== this.input.charAt(this.pos)) {
                if (this.pos >= this.input.length) return content.length ? content.join("") : [ "", "TK_EOF" ];
                input_char = this.input.charAt(this.pos);
                this.pos++;
                this.line_char_count++;
                if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                    if (content.length) space = true;
                    this.line_char_count--;
                    continue;
                } else if (space) {
                    if (this.line_char_count >= this.max_char) {
                        content.push("\n");
                        for (var i = 0; i < this.indent_level; i++) content.push(this.indent_string);
                        this.line_char_count = 0;
                    } else {
                        content.push(" ");
                        this.line_char_count++;
                    }
                    space = false;
                }
                content.push(input_char);
            }
            return content.length ? content.join("") : "";
        };
        this.get_contents_to = function(name) {
            if (this.pos == this.input.length) return [ "", "TK_EOF" ];
            var input_char = "";
            var content = "";
            var reg_match = new RegExp("</" + name + "\\s*>", "igm");
            reg_match.lastIndex = this.pos;
            var reg_array = reg_match.exec(this.input);
            var end_script = reg_array ? reg_array.index : this.input.length;
            if (this.pos < end_script) {
                content = this.input.substring(this.pos, end_script);
                this.pos = end_script;
            }
            return content;
        };
        this.record_tag = function(tag) {
            if (this.tags[tag + "count"]) {
                this.tags[tag + "count"]++;
                this.tags[tag + this.tags[tag + "count"]] = this.indent_level;
            } else {
                this.tags[tag + "count"] = 1;
                this.tags[tag + this.tags[tag + "count"]] = this.indent_level;
            }
            this.tags[tag + this.tags[tag + "count"] + "parent"] = this.tags.parent;
            this.tags.parent = tag + this.tags[tag + "count"];
        };
        this.retrieve_tag = function(tag) {
            if (this.tags[tag + "count"]) {
                var temp_parent = this.tags.parent;
                while (temp_parent) {
                    if (tag + this.tags[tag + "count"] === temp_parent) break;
                    temp_parent = this.tags[temp_parent + "parent"];
                }
                if (temp_parent) {
                    this.indent_level = this.tags[tag + this.tags[tag + "count"]];
                    this.tags.parent = this.tags[temp_parent + "parent"];
                }
                delete this.tags[tag + this.tags[tag + "count"] + "parent"];
                delete this.tags[tag + this.tags[tag + "count"]];
                if (1 == this.tags[tag + "count"]) delete this.tags[tag + "count"]; else this.tags[tag + "count"]--;
            }
        };
        this.get_tag = function(peek) {
            var input_char = "", content = [], space = false, tag_start, tag_end, peek = "undefined" !== typeof peek ? peek : false, orig_pos = this.pos, orig_line_char_count = this.line_char_count;
            do {
                if (this.pos >= this.input.length) {
                    if (peek) {
                        this.pos = orig_pos;
                        this.line_char_count = orig_line_char_count;
                    }
                    return content.length ? content.join("") : [ "", "TK_EOF" ];
                }
                input_char = this.input.charAt(this.pos);
                this.pos++;
                this.line_char_count++;
                if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                    space = true;
                    this.line_char_count--;
                    continue;
                }
                if ("'" === input_char || '"' === input_char) if (!content[1] || "!" !== content[1]) {
                    input_char += this.get_unformatted(input_char);
                    space = true;
                }
                if ("=" === input_char) space = false;
                if (content.length && "=" !== content[content.length - 1] && ">" !== input_char && space) {
                    if (this.line_char_count >= this.max_char) {
                        this.print_newline(false, content);
                        this.line_char_count = 0;
                    } else {
                        content.push(" ");
                        this.line_char_count++;
                    }
                    space = false;
                }
                if ("<" === input_char) tag_start = this.pos - 1;
                content.push(input_char);
            } while (">" !== input_char);
            var tag_complete = content.join("");
            var tag_index;
            if (tag_complete.indexOf(" ") != -1) tag_index = tag_complete.indexOf(" "); else tag_index = tag_complete.indexOf(">");
            var tag_check = tag_complete.substring(1, tag_index).toLowerCase();
            if ("/" === tag_complete.charAt(tag_complete.length - 2) || this.Utils.in_array(tag_check, this.Utils.single_token)) {
                if (!peek) this.tag_type = "SINGLE";
            } else if ("script" === tag_check) {
                if (!peek) {
                    this.record_tag(tag_check);
                    this.tag_type = "SCRIPT";
                }
            } else if ("style" === tag_check) {
                if (!peek) {
                    this.record_tag(tag_check);
                    this.tag_type = "STYLE";
                }
            } else if (this.is_unformatted(tag_check, unformatted)) {
                var comment = this.get_unformatted("</" + tag_check + ">", tag_complete);
                content.push(comment);
                if (tag_start > 0 && this.Utils.in_array(this.input.charAt(tag_start - 1), this.Utils.whitespace)) content.splice(0, 0, this.input.charAt(tag_start - 1));
                tag_end = this.pos - 1;
                if (this.Utils.in_array(this.input.charAt(tag_end + 1), this.Utils.whitespace)) content.push(this.input.charAt(tag_end + 1));
                this.tag_type = "SINGLE";
            } else if ("!" === tag_check.charAt(0)) if (tag_check.indexOf("[if") != -1) {
                if (tag_complete.indexOf("!IE") != -1) {
                    var comment = this.get_unformatted("-->", tag_complete);
                    content.push(comment);
                }
                if (!peek) this.tag_type = "START";
            } else if (tag_check.indexOf("[endif") != -1) {
                this.tag_type = "END";
                this.unindent();
            } else if (tag_check.indexOf("[cdata[") != -1) {
                var comment = this.get_unformatted("]]>", tag_complete);
                content.push(comment);
                if (!peek) this.tag_type = "SINGLE";
            } else {
                var comment = this.get_unformatted("-->", tag_complete);
                content.push(comment);
                this.tag_type = "SINGLE";
            } else if (!peek) {
                if ("/" === tag_check.charAt(0)) {
                    this.retrieve_tag(tag_check.substring(1));
                    this.tag_type = "END";
                } else {
                    this.record_tag(tag_check);
                    this.tag_type = "START";
                }
                if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) this.print_newline(true, this.output);
            }
            if (peek) {
                this.pos = orig_pos;
                this.line_char_count = orig_line_char_count;
            }
            return content.join("");
        };
        this.get_unformatted = function(delimiter, orig_tag) {
            if (orig_tag && orig_tag.toLowerCase().indexOf(delimiter) != -1) return "";
            var input_char = "";
            var content = "";
            var space = true;
            do {
                if (this.pos >= this.input.length) return content;
                input_char = this.input.charAt(this.pos);
                this.pos++;
                if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                    if (!space) {
                        this.line_char_count--;
                        continue;
                    }
                    if ("\n" === input_char || "\r" === input_char) {
                        content += "\n";
                        this.line_char_count = 0;
                        continue;
                    }
                }
                content += input_char;
                this.line_char_count++;
                space = true;
            } while (content.toLowerCase().indexOf(delimiter) == -1);
            return content;
        };
        this.get_token = function() {
            var token;
            if ("TK_TAG_SCRIPT" === this.last_token || "TK_TAG_STYLE" === this.last_token) {
                var type = this.last_token.substr(7);
                token = this.get_contents_to(type);
                if ("string" !== typeof token) return token;
                return [ token, "TK_" + type ];
            }
            if ("CONTENT" === this.current_mode) {
                token = this.get_content();
                if ("string" !== typeof token) return token; else return [ token, "TK_CONTENT" ];
            }
            if ("TAG" === this.current_mode) {
                token = this.get_tag();
                if ("string" !== typeof token) return token; else {
                    var tag_name_type = "TK_TAG_" + this.tag_type;
                    return [ token, tag_name_type ];
                }
            }
        };
        this.get_full_indent = function(level) {
            level = this.indent_level + level || 0;
            if (level < 1) return "";
            return Array(level + 1).join(this.indent_string);
        };
        this.is_unformatted = function(tag_check, unformatted) {
            if (!this.Utils.in_array(tag_check, unformatted)) return false;
            if ("a" !== tag_check.toLowerCase() || !this.Utils.in_array("a", unformatted)) return true;
            var next_tag = this.get_tag(true);
            if (next_tag && this.Utils.in_array(next_tag, unformatted)) return true; else return false;
        };
        this.printer = function(js_source, indent_character, indent_size, max_char, brace_style) {
            this.input = js_source || "";
            this.output = [];
            this.indent_character = indent_character;
            this.indent_string = "";
            this.indent_size = indent_size;
            this.brace_style = brace_style;
            this.indent_level = 0;
            this.max_char = max_char;
            this.line_char_count = 0;
            for (var i = 0; i < this.indent_size; i++) this.indent_string += this.indent_character;
            this.print_newline = function(ignore, arr) {
                this.line_char_count = 0;
                if (!arr || !arr.length) return;
                if (!ignore) while (this.Utils.in_array(arr[arr.length - 1], this.Utils.whitespace)) arr.pop();
                arr.push("\n");
                for (var i = 0; i < this.indent_level; i++) arr.push(this.indent_string);
            };
            this.print_token = function(text) {
                this.output.push(text);
            };
            this.indent = function() {
                this.indent_level++;
            };
            this.unindent = function() {
                if (this.indent_level > 0) this.indent_level--;
            };
        };
        return this;
    }
    multi_parser = new Parser();
    multi_parser.printer(html_source, indent_character, indent_size, max_char, brace_style);
    while (true) {
        var t = multi_parser.get_token();
        multi_parser.token_text = t[0];
        multi_parser.token_type = t[1];
        if ("TK_EOF" === multi_parser.token_type) break;
        switch (multi_parser.token_type) {
          case "TK_TAG_START":
            multi_parser.print_newline(false, multi_parser.output);
            multi_parser.print_token(multi_parser.token_text);
            multi_parser.indent();
            multi_parser.current_mode = "CONTENT";
            break;

          case "TK_TAG_STYLE":
          case "TK_TAG_SCRIPT":
            multi_parser.print_newline(false, multi_parser.output);
            multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = "CONTENT";
            break;

          case "TK_TAG_END":
            if ("TK_CONTENT" === multi_parser.last_token && "" === multi_parser.last_text) {
                var tag_name = multi_parser.token_text.match(/\w+/)[0];
                var tag_extracted_from_last_output = multi_parser.output[multi_parser.output.length - 1].match(/<\s*(\w+)/);
                if (null === tag_extracted_from_last_output || tag_extracted_from_last_output[1] !== tag_name) multi_parser.print_newline(true, multi_parser.output);
            }
            multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = "CONTENT";
            break;

          case "TK_TAG_SINGLE":
            var tag_check = multi_parser.token_text.match(/^\s*<([a-z]+)/i);
            if (!tag_check || !multi_parser.Utils.in_array(tag_check[1], unformatted)) multi_parser.print_newline(false, multi_parser.output);
            multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = "CONTENT";
            break;

          case "TK_CONTENT":
            if ("" !== multi_parser.token_text) multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = "TAG";
            break;

          case "TK_STYLE":
          case "TK_SCRIPT":
            if ("" !== multi_parser.token_text) {
                multi_parser.output.push("\n");
                var text = multi_parser.token_text;
                if ("TK_SCRIPT" == multi_parser.token_type) var _beautifier = "function" == typeof js_beautify && js_beautify; else if ("TK_STYLE" == multi_parser.token_type) var _beautifier = "function" == typeof css_beautify && css_beautify;
                if ("keep" == options.indent_scripts) var script_indent_level = 0; else if ("separate" == options.indent_scripts) var script_indent_level = -multi_parser.indent_level; else var script_indent_level = 1;
                var indentation = multi_parser.get_full_indent(script_indent_level);
                if (_beautifier) text = _beautifier(text.replace(/^\s*/, indentation), options); else {
                    var white = text.match(/^\s*/)[0];
                    var _level = white.match(/[^\n\r]*$/)[0].split(multi_parser.indent_string).length - 1;
                    var reindent = multi_parser.get_full_indent(script_indent_level - _level);
                    text = text.replace(/^\s*/, indentation).replace(/\r\n|\r|\n/g, "\n" + reindent).replace(/\s*$/, "");
                }
                if (text) {
                    multi_parser.print_token(text);
                    multi_parser.print_newline(true, multi_parser.output);
                }
            }
            multi_parser.current_mode = "TAG";
        }
        multi_parser.last_token = multi_parser.token_type;
        multi_parser.last_text = multi_parser.token_text;
    }
    return multi_parser.output.join("");
}

if ("undefined" !== typeof exports) exports.html_beautify = style_html;

(function(a, b) {
    function G(a) {
        var b = F[a] = {};
        return p.each(a.split(s), function(a, c) {
            b[c] = !0;
        }), b;
    }
    function J(a, c, d) {
        if (d === b && 1 === a.nodeType) {
            var e = "data-" + c.replace(I, "-$1").toLowerCase();
            d = a.getAttribute(e);
            if ("string" == typeof d) {
                try {
                    d = "true" === d ? !0 : "false" === d ? !1 : "null" === d ? null : +d + "" === d ? +d : H.test(d) ? p.parseJSON(d) : d;
                } catch (f) {}
                p.data(a, c, d);
            } else d = b;
        }
        return d;
    }
    function K(a) {
        var b;
        for (b in a) {
            if ("data" === b && p.isEmptyObject(a[b])) continue;
            if ("toJSON" !== b) return !1;
        }
        return !0;
    }
    function ba() {
        return !1;
    }
    function bb() {
        return !0;
    }
    function bh(a) {
        return !a || !a.parentNode || 11 === a.parentNode.nodeType;
    }
    function bi(a, b) {
        do a = a[b]; while (a && 1 !== a.nodeType);
        return a;
    }
    function bj(a, b, c) {
        b = b || 0;
        if (p.isFunction(b)) return p.grep(a, function(a, d) {
            var e = !!b.call(a, d, a);
            return e === c;
        });
        if (b.nodeType) return p.grep(a, function(a, d) {
            return a === b === c;
        });
        if ("string" == typeof b) {
            var d = p.grep(a, function(a) {
                return 1 === a.nodeType;
            });
            if (be.test(b)) return p.filter(b, d, !c);
            b = p.filter(b, d);
        }
        return p.grep(a, function(a, d) {
            return p.inArray(a, b) >= 0 === c;
        });
    }
    function bk(a) {
        var b = bl.split("|"), c = a.createDocumentFragment();
        if (c.createElement) while (b.length) c.createElement(b.pop());
        return c;
    }
    function bC(a, b) {
        return a.getElementsByTagName(b)[0] || a.appendChild(a.ownerDocument.createElement(b));
    }
    function bD(a, b) {
        if (1 !== b.nodeType || !p.hasData(a)) return;
        var c, d, e, f = p._data(a), g = p._data(b, f), h = f.events;
        if (h) {
            delete g.handle, g.events = {};
            for (c in h) for (d = 0, e = h[c].length; d < e; d++) p.event.add(b, c, h[c][d]);
        }
        g.data && (g.data = p.extend({}, g.data));
    }
    function bE(a, b) {
        var c;
        if (1 !== b.nodeType) return;
        b.clearAttributes && b.clearAttributes(), b.mergeAttributes && b.mergeAttributes(a), 
        c = b.nodeName.toLowerCase(), "object" === c ? (b.parentNode && (b.outerHTML = a.outerHTML), 
        p.support.html5Clone && a.innerHTML && !p.trim(b.innerHTML) && (b.innerHTML = a.innerHTML)) : "input" === c && bv.test(a.type) ? (b.defaultChecked = b.checked = a.checked, 
        b.value !== a.value && (b.value = a.value)) : "option" === c ? b.selected = a.defaultSelected : "input" === c || "textarea" === c ? b.defaultValue = a.defaultValue : "script" === c && b.text !== a.text && (b.text = a.text), 
        b.removeAttribute(p.expando);
    }
    function bF(a) {
        return "undefined" != typeof a.getElementsByTagName ? a.getElementsByTagName("*") : "undefined" != typeof a.querySelectorAll ? a.querySelectorAll("*") : [];
    }
    function bG(a) {
        bv.test(a.type) && (a.defaultChecked = a.checked);
    }
    function bY(a, b) {
        if (b in a) return b;
        var c = b.charAt(0).toUpperCase() + b.slice(1), d = b, e = bW.length;
        while (e--) {
            b = bW[e] + c;
            if (b in a) return b;
        }
        return d;
    }
    function bZ(a, b) {
        return a = b || a, "none" === p.css(a, "display") || !p.contains(a.ownerDocument, a);
    }
    function b$(a, b) {
        var c, d, e = [], f = 0, g = a.length;
        for (;f < g; f++) {
            c = a[f];
            if (!c.style) continue;
            e[f] = p._data(c, "olddisplay"), b ? (!e[f] && "none" === c.style.display && (c.style.display = ""), 
            "" === c.style.display && bZ(c) && (e[f] = p._data(c, "olddisplay", cc(c.nodeName)))) : (d = bH(c, "display"), 
            !e[f] && "none" !== d && p._data(c, "olddisplay", d));
        }
        for (f = 0; f < g; f++) {
            c = a[f];
            if (!c.style) continue;
            if (!b || "none" === c.style.display || "" === c.style.display) c.style.display = b ? e[f] || "" : "none";
        }
        return a;
    }
    function b_(a, b, c) {
        var d = bP.exec(b);
        return d ? Math.max(0, d[1] - (c || 0)) + (d[2] || "px") : b;
    }
    function ca(a, b, c, d) {
        var e = c === (d ? "border" : "content") ? 4 : "width" === b ? 1 : 0, f = 0;
        for (;e < 4; e += 2) "margin" === c && (f += p.css(a, c + bV[e], !0)), d ? ("content" === c && (f -= parseFloat(bH(a, "padding" + bV[e])) || 0), 
        "margin" !== c && (f -= parseFloat(bH(a, "border" + bV[e] + "Width")) || 0)) : (f += parseFloat(bH(a, "padding" + bV[e])) || 0, 
        "padding" !== c && (f += parseFloat(bH(a, "border" + bV[e] + "Width")) || 0));
        return f;
    }
    function cb(a, b, c) {
        var d = "width" === b ? a.offsetWidth : a.offsetHeight, e = !0, f = p.support.boxSizing && "border-box" === p.css(a, "boxSizing");
        if (d <= 0 || null == d) {
            d = bH(a, b);
            if (d < 0 || null == d) d = a.style[b];
            if (bQ.test(d)) return d;
            e = f && (p.support.boxSizingReliable || d === a.style[b]), d = parseFloat(d) || 0;
        }
        return d + ca(a, b, c || (f ? "border" : "content"), e) + "px";
    }
    function cc(a) {
        if (bS[a]) return bS[a];
        var b = p("<" + a + ">").appendTo(e.body), c = b.css("display");
        b.remove();
        if ("none" === c || "" === c) {
            bI = e.body.appendChild(bI || p.extend(e.createElement("iframe"), {
                frameBorder: 0,
                width: 0,
                height: 0
            }));
            if (!bJ || !bI.createElement) bJ = (bI.contentWindow || bI.contentDocument).document, 
            bJ.write("<!doctype html><html><body>"), bJ.close();
            b = bJ.body.appendChild(bJ.createElement(a)), c = bH(b, "display"), e.body.removeChild(bI);
        }
        return bS[a] = c, c;
    }
    function ci(a, b, c, d) {
        var e;
        if (p.isArray(b)) p.each(b, function(b, e) {
            c || ce.test(a) ? d(a, e) : ci(a + "[" + ("object" == typeof e ? b : "") + "]", e, c, d);
        }); else if (!c && "object" === p.type(b)) for (e in b) ci(a + "[" + e + "]", b[e], c, d); else d(a, b);
    }
    function cz(a) {
        return function(b, c) {
            "string" != typeof b && (c = b, b = "*");
            var d, e, f, g = b.toLowerCase().split(s), h = 0, i = g.length;
            if (p.isFunction(c)) for (;h < i; h++) d = g[h], f = /^\+/.test(d), f && (d = d.substr(1) || "*"), 
            e = a[d] = a[d] || [], e[f ? "unshift" : "push"](c);
        };
    }
    function cA(a, c, d, e, f, g) {
        f = f || c.dataTypes[0], g = g || {}, g[f] = !0;
        var h, i = a[f], j = 0, k = i ? i.length : 0, l = a === cv;
        for (;j < k && (l || !h); j++) h = i[j](c, d, e), "string" == typeof h && (!l || g[h] ? h = b : (c.dataTypes.unshift(h), 
        h = cA(a, c, d, e, h, g)));
        return (l || !h) && !g["*"] && (h = cA(a, c, d, e, "*", g)), h;
    }
    function cB(a, c) {
        var d, e, f = p.ajaxSettings.flatOptions || {};
        for (d in c) c[d] !== b && ((f[d] ? a : e || (e = {}))[d] = c[d]);
        e && p.extend(!0, a, e);
    }
    function cC(a, c, d) {
        var e, f, g, h, i = a.contents, j = a.dataTypes, k = a.responseFields;
        for (f in k) f in d && (c[k[f]] = d[f]);
        while ("*" === j[0]) j.shift(), e === b && (e = a.mimeType || c.getResponseHeader("content-type"));
        if (e) for (f in i) if (i[f] && i[f].test(e)) {
            j.unshift(f);
            break;
        }
        if (j[0] in d) g = j[0]; else {
            for (f in d) {
                if (!j[0] || a.converters[f + " " + j[0]]) {
                    g = f;
                    break;
                }
                h || (h = f);
            }
            g = g || h;
        }
        if (g) return g !== j[0] && j.unshift(g), d[g];
    }
    function cD(a, b) {
        var c, d, e, f, g = a.dataTypes.slice(), h = g[0], i = {}, j = 0;
        a.dataFilter && (b = a.dataFilter(b, a.dataType));
        if (g[1]) for (c in a.converters) i[c.toLowerCase()] = a.converters[c];
        for (;e = g[++j]; ) if ("*" !== e) {
            if ("*" !== h && h !== e) {
                c = i[h + " " + e] || i["* " + e];
                if (!c) for (d in i) {
                    f = d.split(" ");
                    if (f[1] === e) {
                        c = i[h + " " + f[0]] || i["* " + f[0]];
                        if (c) {
                            c === !0 ? c = i[d] : i[d] !== !0 && (e = f[0], g.splice(j--, 0, e));
                            break;
                        }
                    }
                }
                if (c !== !0) if (c && a["throws"]) b = c(b); else try {
                    b = c(b);
                } catch (k) {
                    return {
                        state: "parsererror",
                        error: c ? k : "No conversion from " + h + " to " + e
                    };
                }
            }
            h = e;
        }
        return {
            state: "success",
            data: b
        };
    }
    function cL() {
        try {
            return new a.XMLHttpRequest();
        } catch (b) {}
    }
    function cM() {
        try {
            return new a.ActiveXObject("Microsoft.XMLHTTP");
        } catch (b) {}
    }
    function cU() {
        return setTimeout(function() {
            cN = b;
        }, 0), cN = p.now();
    }
    function cV(a, b) {
        p.each(b, function(b, c) {
            var d = (cT[b] || []).concat(cT["*"]), e = 0, f = d.length;
            for (;e < f; e++) if (d[e].call(a, b, c)) return;
        });
    }
    function cW(a, b, c) {
        var d, e = 0, f = 0, g = cS.length, h = p.Deferred().always(function() {
            delete i.elem;
        }), i = function() {
            var b = cN || cU(), c = Math.max(0, j.startTime + j.duration - b), d = 1 - (c / j.duration || 0), e = 0, f = j.tweens.length;
            for (;e < f; e++) j.tweens[e].run(d);
            return h.notifyWith(a, [ j, d, c ]), d < 1 && f ? c : (h.resolveWith(a, [ j ]), 
            !1);
        }, j = h.promise({
            elem: a,
            props: p.extend({}, b),
            opts: p.extend(!0, {
                specialEasing: {}
            }, c),
            originalProperties: b,
            originalOptions: c,
            startTime: cN || cU(),
            duration: c.duration,
            tweens: [],
            createTween: function(b, c, d) {
                var e = p.Tween(a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing);
                return j.tweens.push(e), e;
            },
            stop: function(b) {
                var c = 0, d = b ? j.tweens.length : 0;
                for (;c < d; c++) j.tweens[c].run(1);
                return b ? h.resolveWith(a, [ j, b ]) : h.rejectWith(a, [ j, b ]), this;
            }
        }), k = j.props;
        cX(k, j.opts.specialEasing);
        for (;e < g; e++) {
            d = cS[e].call(j, a, k, j.opts);
            if (d) return d;
        }
        return cV(j, k), p.isFunction(j.opts.start) && j.opts.start.call(a, j), p.fx.timer(p.extend(i, {
            anim: j,
            queue: j.opts.queue,
            elem: a
        })), j.progress(j.opts.progress).done(j.opts.done, j.opts.complete).fail(j.opts.fail).always(j.opts.always);
    }
    function cX(a, b) {
        var c, d, e, f, g;
        for (c in a) {
            d = p.camelCase(c), e = b[d], f = a[c], p.isArray(f) && (e = f[1], f = a[c] = f[0]), 
            c !== d && (a[d] = f, delete a[c]), g = p.cssHooks[d];
            if (g && "expand" in g) {
                f = g.expand(f), delete a[d];
                for (c in f) c in a || (a[c] = f[c], b[c] = e);
            } else b[d] = e;
        }
    }
    function cY(a, b, c) {
        var d, e, f, g, h, i, j, k, l = this, m = a.style, n = {}, o = [], q = a.nodeType && bZ(a);
        c.queue || (j = p._queueHooks(a, "fx"), null == j.unqueued && (j.unqueued = 0, k = j.empty.fire, 
        j.empty.fire = function() {
            j.unqueued || k();
        }), j.unqueued++, l.always(function() {
            l.always(function() {
                j.unqueued--, p.queue(a, "fx").length || j.empty.fire();
            });
        })), 1 === a.nodeType && ("height" in b || "width" in b) && (c.overflow = [ m.overflow, m.overflowX, m.overflowY ], 
        "inline" === p.css(a, "display") && "none" === p.css(a, "float") && (!p.support.inlineBlockNeedsLayout || "inline" === cc(a.nodeName) ? m.display = "inline-block" : m.zoom = 1)), 
        c.overflow && (m.overflow = "hidden", p.support.shrinkWrapBlocks || l.done(function() {
            m.overflow = c.overflow[0], m.overflowX = c.overflow[1], m.overflowY = c.overflow[2];
        }));
        for (d in b) {
            f = b[d];
            if (cP.exec(f)) {
                delete b[d];
                if (f === (q ? "hide" : "show")) continue;
                o.push(d);
            }
        }
        g = o.length;
        if (g) {
            h = p._data(a, "fxshow") || p._data(a, "fxshow", {}), q ? p(a).show() : l.done(function() {
                p(a).hide();
            }), l.done(function() {
                var b;
                p.removeData(a, "fxshow", !0);
                for (b in n) p.style(a, b, n[b]);
            });
            for (d = 0; d < g; d++) e = o[d], i = l.createTween(e, q ? h[e] : 0), n[e] = h[e] || p.style(a, e), 
            e in h || (h[e] = i.start, q && (i.end = i.start, i.start = "width" === e || "height" === e ? 1 : 0));
        }
    }
    function cZ(a, b, c, d, e) {
        return new cZ.prototype.init(a, b, c, d, e);
    }
    function c$(a, b) {
        var c, d = {
            height: a
        }, e = 0;
        b = b ? 1 : 0;
        for (;e < 4; e += 2 - b) c = bV[e], d["margin" + c] = d["padding" + c] = a;
        return b && (d.opacity = d.width = a), d;
    }
    function da(a) {
        return p.isWindow(a) ? a : 9 === a.nodeType ? a.defaultView || a.parentWindow : !1;
    }
    var c, d, e = a.document, f = a.location, g = a.navigator, h = a.jQuery, i = a.$, j = Array.prototype.push, k = Array.prototype.slice, l = Array.prototype.indexOf, m = Object.prototype.toString, n = Object.prototype.hasOwnProperty, o = String.prototype.trim, p = function(a, b) {
        return new p.fn.init(a, b, c);
    }, q = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source, r = /\S/, s = /\s+/, t = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, u = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/, v = /^<(\w+)\s*\/?>(?:<\/\1>|)$/, w = /^[\],:{}\s]*$/, x = /(?:^|:|,)(?:\s*\[)+/g, y = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g, z = /"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g, A = /^-ms-/, B = /-([\da-z])/gi, C = function(a, b) {
        return (b + "").toUpperCase();
    }, D = function() {
        e.addEventListener ? (e.removeEventListener("DOMContentLoaded", D, !1), p.ready()) : "complete" === e.readyState && (e.detachEvent("onreadystatechange", D), 
        p.ready());
    }, E = {};
    p.fn = p.prototype = {
        constructor: p,
        init: function(a, c, d) {
            var f, g, h, i;
            if (!a) return this;
            if (a.nodeType) return this.context = this[0] = a, this.length = 1, this;
            if ("string" == typeof a) {
                "<" === a.charAt(0) && ">" === a.charAt(a.length - 1) && a.length >= 3 ? f = [ null, a, null ] : f = u.exec(a);
                if (f && (f[1] || !c)) {
                    if (f[1]) return c = c instanceof p ? c[0] : c, i = c && c.nodeType ? c.ownerDocument || c : e, 
                    a = p.parseHTML(f[1], i, !0), v.test(f[1]) && p.isPlainObject(c) && this.attr.call(a, c, !0), 
                    p.merge(this, a);
                    g = e.getElementById(f[2]);
                    if (g && g.parentNode) {
                        if (g.id !== f[2]) return d.find(a);
                        this.length = 1, this[0] = g;
                    }
                    return this.context = e, this.selector = a, this;
                }
                return !c || c.jquery ? (c || d).find(a) : this.constructor(c).find(a);
            }
            return p.isFunction(a) ? d.ready(a) : (a.selector !== b && (this.selector = a.selector, 
            this.context = a.context), p.makeArray(a, this));
        },
        selector: "",
        jquery: "1.8.2",
        length: 0,
        size: function() {
            return this.length;
        },
        toArray: function() {
            return k.call(this);
        },
        get: function(a) {
            return null == a ? this.toArray() : a < 0 ? this[this.length + a] : this[a];
        },
        pushStack: function(a, b, c) {
            var d = p.merge(this.constructor(), a);
            return d.prevObject = this, d.context = this.context, "find" === b ? d.selector = this.selector + (this.selector ? " " : "") + c : b && (d.selector = this.selector + "." + b + "(" + c + ")"), 
            d;
        },
        each: function(a, b) {
            return p.each(this, a, b);
        },
        ready: function(a) {
            return p.ready.promise().done(a), this;
        },
        eq: function(a) {
            return a = +a, a === -1 ? this.slice(a) : this.slice(a, a + 1);
        },
        first: function() {
            return this.eq(0);
        },
        last: function() {
            return this.eq(-1);
        },
        slice: function() {
            return this.pushStack(k.apply(this, arguments), "slice", k.call(arguments).join(","));
        },
        map: function(a) {
            return this.pushStack(p.map(this, function(b, c) {
                return a.call(b, c, b);
            }));
        },
        end: function() {
            return this.prevObject || this.constructor(null);
        },
        push: j,
        sort: [].sort,
        splice: [].splice
    }, p.fn.init.prototype = p.fn, p.extend = p.fn.extend = function() {
        var a, c, d, e, f, g, h = arguments[0] || {}, i = 1, j = arguments.length, k = !1;
        "boolean" == typeof h && (k = h, h = arguments[1] || {}, i = 2), "object" != typeof h && !p.isFunction(h) && (h = {}), 
        j === i && (h = this, --i);
        for (;i < j; i++) if (null != (a = arguments[i])) for (c in a) {
            d = h[c], e = a[c];
            if (h === e) continue;
            k && e && (p.isPlainObject(e) || (f = p.isArray(e))) ? (f ? (f = !1, g = d && p.isArray(d) ? d : []) : g = d && p.isPlainObject(d) ? d : {}, 
            h[c] = p.extend(k, g, e)) : e !== b && (h[c] = e);
        }
        return h;
    }, p.extend({
        noConflict: function(b) {
            return a.$ === p && (a.$ = i), b && a.jQuery === p && (a.jQuery = h), p;
        },
        isReady: !1,
        readyWait: 1,
        holdReady: function(a) {
            a ? p.readyWait++ : p.ready(!0);
        },
        ready: function(a) {
            if (a === !0 ? --p.readyWait : p.isReady) return;
            if (!e.body) return setTimeout(p.ready, 1);
            p.isReady = !0;
            if (a !== !0 && --p.readyWait > 0) return;
            d.resolveWith(e, [ p ]), p.fn.trigger && p(e).trigger("ready").off("ready");
        },
        isFunction: function(a) {
            return "function" === p.type(a);
        },
        isArray: Array.isArray || function(a) {
            return "array" === p.type(a);
        },
        isWindow: function(a) {
            return null != a && a == a.window;
        },
        isNumeric: function(a) {
            return !isNaN(parseFloat(a)) && isFinite(a);
        },
        type: function(a) {
            return null == a ? String(a) : E[m.call(a)] || "object";
        },
        isPlainObject: function(a) {
            if (!a || "object" !== p.type(a) || a.nodeType || p.isWindow(a)) return !1;
            try {
                if (a.constructor && !n.call(a, "constructor") && !n.call(a.constructor.prototype, "isPrototypeOf")) return !1;
            } catch (c) {
                return !1;
            }
            var d;
            for (d in a) ;
            return d === b || n.call(a, d);
        },
        isEmptyObject: function(a) {
            var b;
            for (b in a) return !1;
            return !0;
        },
        error: function(a) {
            throw new Error(a);
        },
        parseHTML: function(a, b, c) {
            var d;
            return !a || "string" != typeof a ? null : ("boolean" == typeof b && (c = b, b = 0), 
            b = b || e, (d = v.exec(a)) ? [ b.createElement(d[1]) ] : (d = p.buildFragment([ a ], b, c ? null : []), 
            p.merge([], (d.cacheable ? p.clone(d.fragment) : d.fragment).childNodes)));
        },
        parseJSON: function(b) {
            if (!b || "string" != typeof b) return null;
            b = p.trim(b);
            if (a.JSON && a.JSON.parse) return a.JSON.parse(b);
            if (w.test(b.replace(y, "@").replace(z, "]").replace(x, ""))) return new Function("return " + b)();
            p.error("Invalid JSON: " + b);
        },
        parseXML: function(c) {
            var d, e;
            if (!c || "string" != typeof c) return null;
            try {
                a.DOMParser ? (e = new DOMParser(), d = e.parseFromString(c, "text/xml")) : (d = new ActiveXObject("Microsoft.XMLDOM"), 
                d.async = "false", d.loadXML(c));
            } catch (f) {
                d = b;
            }
            return (!d || !d.documentElement || d.getElementsByTagName("parsererror").length) && p.error("Invalid XML: " + c), 
            d;
        },
        noop: function() {},
        globalEval: function(b) {
            b && r.test(b) && (a.execScript || function(b) {
                a.eval.call(a, b);
            })(b);
        },
        camelCase: function(a) {
            return a.replace(A, "ms-").replace(B, C);
        },
        nodeName: function(a, b) {
            return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase();
        },
        each: function(a, c, d) {
            var e, f = 0, g = a.length, h = g === b || p.isFunction(a);
            if (d) {
                if (h) {
                    for (e in a) if (c.apply(a[e], d) === !1) break;
                } else for (;f < g; ) if (c.apply(a[f++], d) === !1) break;
            } else if (h) {
                for (e in a) if (c.call(a[e], e, a[e]) === !1) break;
            } else for (;f < g; ) if (c.call(a[f], f, a[f++]) === !1) break;
            return a;
        },
        trim: o && !o.call(" ") ? function(a) {
            return null == a ? "" : o.call(a);
        } : function(a) {
            return null == a ? "" : (a + "").replace(t, "");
        },
        makeArray: function(a, b) {
            var c, d = b || [];
            return null != a && (c = p.type(a), null == a.length || "string" === c || "function" === c || "regexp" === c || p.isWindow(a) ? j.call(d, a) : p.merge(d, a)), 
            d;
        },
        inArray: function(a, b, c) {
            var d;
            if (b) {
                if (l) return l.call(b, a, c);
                d = b.length, c = c ? c < 0 ? Math.max(0, d + c) : c : 0;
                for (;c < d; c++) if (c in b && b[c] === a) return c;
            }
            return -1;
        },
        merge: function(a, c) {
            var d = c.length, e = a.length, f = 0;
            if ("number" == typeof d) for (;f < d; f++) a[e++] = c[f]; else while (c[f] !== b) a[e++] = c[f++];
            return a.length = e, a;
        },
        grep: function(a, b, c) {
            var d, e = [], f = 0, g = a.length;
            c = !!c;
            for (;f < g; f++) d = !!b(a[f], f), c !== d && e.push(a[f]);
            return e;
        },
        map: function(a, c, d) {
            var e, f, g = [], h = 0, i = a.length, j = a instanceof p || i !== b && "number" == typeof i && (i > 0 && a[0] && a[i - 1] || 0 === i || p.isArray(a));
            if (j) for (;h < i; h++) e = c(a[h], h, d), null != e && (g[g.length] = e); else for (f in a) e = c(a[f], f, d), 
            null != e && (g[g.length] = e);
            return g.concat.apply([], g);
        },
        guid: 1,
        proxy: function(a, c) {
            var d, e, f;
            return "string" == typeof c && (d = a[c], c = a, a = d), p.isFunction(a) ? (e = k.call(arguments, 2), 
            f = function() {
                return a.apply(c, e.concat(k.call(arguments)));
            }, f.guid = a.guid = a.guid || p.guid++, f) : b;
        },
        access: function(a, c, d, e, f, g, h) {
            var i, j = null == d, k = 0, l = a.length;
            if (d && "object" == typeof d) {
                for (k in d) p.access(a, c, k, d[k], 1, g, e);
                f = 1;
            } else if (e !== b) {
                i = h === b && p.isFunction(e), j && (i ? (i = c, c = function(a, b, c) {
                    return i.call(p(a), c);
                }) : (c.call(a, e), c = null));
                if (c) for (;k < l; k++) c(a[k], d, i ? e.call(a[k], k, c(a[k], d)) : e, h);
                f = 1;
            }
            return f ? a : j ? c.call(a) : l ? c(a[0], d) : g;
        },
        now: function() {
            return new Date().getTime();
        }
    }), p.ready.promise = function(b) {
        if (!d) {
            d = p.Deferred();
            if ("complete" === e.readyState) setTimeout(p.ready, 1); else if (e.addEventListener) e.addEventListener("DOMContentLoaded", D, !1), 
            a.addEventListener("load", p.ready, !1); else {
                e.attachEvent("onreadystatechange", D), a.attachEvent("onload", p.ready);
                var c = !1;
                try {
                    c = null == a.frameElement && e.documentElement;
                } catch (f) {}
                c && c.doScroll && function g() {
                    if (!p.isReady) {
                        try {
                            c.doScroll("left");
                        } catch (a) {
                            return setTimeout(g, 50);
                        }
                        p.ready();
                    }
                }();
            }
        }
        return d.promise(b);
    }, p.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(a, b) {
        E["[object " + b + "]"] = b.toLowerCase();
    }), c = p(e);
    var F = {};
    p.Callbacks = function(a) {
        a = "string" == typeof a ? F[a] || G(a) : p.extend({}, a);
        var c, d, e, f, g, h, i = [], j = !a.once && [], k = function(b) {
            c = a.memory && b, d = !0, h = f || 0, f = 0, g = i.length, e = !0;
            for (;i && h < g; h++) if (i[h].apply(b[0], b[1]) === !1 && a.stopOnFalse) {
                c = !1;
                break;
            }
            e = !1, i && (j ? j.length && k(j.shift()) : c ? i = [] : l.disable());
        }, l = {
            add: function() {
                if (i) {
                    var b = i.length;
                    (function d(b) {
                        p.each(b, function(b, c) {
                            var e = p.type(c);
                            "function" === e && (!a.unique || !l.has(c)) ? i.push(c) : c && c.length && "string" !== e && d(c);
                        });
                    })(arguments), e ? g = i.length : c && (f = b, k(c));
                }
                return this;
            },
            remove: function() {
                return i && p.each(arguments, function(a, b) {
                    var c;
                    while ((c = p.inArray(b, i, c)) > -1) i.splice(c, 1), e && (c <= g && g--, c <= h && h--);
                }), this;
            },
            has: function(a) {
                return p.inArray(a, i) > -1;
            },
            empty: function() {
                return i = [], this;
            },
            disable: function() {
                return i = j = c = b, this;
            },
            disabled: function() {
                return !i;
            },
            lock: function() {
                return j = b, c || l.disable(), this;
            },
            locked: function() {
                return !j;
            },
            fireWith: function(a, b) {
                return b = b || [], b = [ a, b.slice ? b.slice() : b ], i && (!d || j) && (e ? j.push(b) : k(b)), 
                this;
            },
            fire: function() {
                return l.fireWith(this, arguments), this;
            },
            fired: function() {
                return !!d;
            }
        };
        return l;
    }, p.extend({
        Deferred: function(a) {
            var b = [ [ "resolve", "done", p.Callbacks("once memory"), "resolved" ], [ "reject", "fail", p.Callbacks("once memory"), "rejected" ], [ "notify", "progress", p.Callbacks("memory") ] ], c = "pending", d = {
                state: function() {
                    return c;
                },
                always: function() {
                    return e.done(arguments).fail(arguments), this;
                },
                then: function() {
                    var a = arguments;
                    return p.Deferred(function(c) {
                        p.each(b, function(b, d) {
                            var f = d[0], g = a[b];
                            e[d[1]](p.isFunction(g) ? function() {
                                var a = g.apply(this, arguments);
                                a && p.isFunction(a.promise) ? a.promise().done(c.resolve).fail(c.reject).progress(c.notify) : c[f + "With"](this === e ? c : this, [ a ]);
                            } : c[f]);
                        }), a = null;
                    }).promise();
                },
                promise: function(a) {
                    return null != a ? p.extend(a, d) : d;
                }
            }, e = {};
            return d.pipe = d.then, p.each(b, function(a, f) {
                var g = f[2], h = f[3];
                d[f[1]] = g.add, h && g.add(function() {
                    c = h;
                }, b[1 ^ a][2].disable, b[2][2].lock), e[f[0]] = g.fire, e[f[0] + "With"] = g.fireWith;
            }), d.promise(e), a && a.call(e, e), e;
        },
        when: function(a) {
            var b = 0, c = k.call(arguments), d = c.length, e = 1 !== d || a && p.isFunction(a.promise) ? d : 0, f = 1 === e ? a : p.Deferred(), g = function(a, b, c) {
                return function(d) {
                    b[a] = this, c[a] = arguments.length > 1 ? k.call(arguments) : d, c === h ? f.notifyWith(b, c) : --e || f.resolveWith(b, c);
                };
            }, h, i, j;
            if (d > 1) {
                h = new Array(d), i = new Array(d), j = new Array(d);
                for (;b < d; b++) c[b] && p.isFunction(c[b].promise) ? c[b].promise().done(g(b, j, c)).fail(f.reject).progress(g(b, i, h)) : --e;
            }
            return e || f.resolveWith(j, c), f.promise();
        }
    }), p.support = function() {
        var b, c, d, f, g, h, i, j, k, l, m, n = e.createElement("div");
        n.setAttribute("className", "t"), n.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", 
        c = n.getElementsByTagName("*"), d = n.getElementsByTagName("a")[0], d.style.cssText = "top:1px;float:left;opacity:.5";
        if (!c || !c.length) return {};
        f = e.createElement("select"), g = f.appendChild(e.createElement("option")), h = n.getElementsByTagName("input")[0], 
        b = {
            leadingWhitespace: 3 === n.firstChild.nodeType,
            tbody: !n.getElementsByTagName("tbody").length,
            htmlSerialize: !!n.getElementsByTagName("link").length,
            style: /top/.test(d.getAttribute("style")),
            hrefNormalized: "/a" === d.getAttribute("href"),
            opacity: /^0.5/.test(d.style.opacity),
            cssFloat: !!d.style.cssFloat,
            checkOn: "on" === h.value,
            optSelected: g.selected,
            getSetAttribute: "t" !== n.className,
            enctype: !!e.createElement("form").enctype,
            html5Clone: "<:nav></:nav>" !== e.createElement("nav").cloneNode(!0).outerHTML,
            boxModel: "CSS1Compat" === e.compatMode,
            submitBubbles: !0,
            changeBubbles: !0,
            focusinBubbles: !1,
            deleteExpando: !0,
            noCloneEvent: !0,
            inlineBlockNeedsLayout: !1,
            shrinkWrapBlocks: !1,
            reliableMarginRight: !0,
            boxSizingReliable: !0,
            pixelPosition: !1
        }, h.checked = !0, b.noCloneChecked = h.cloneNode(!0).checked, f.disabled = !0, 
        b.optDisabled = !g.disabled;
        try {
            delete n.test;
        } catch (o) {
            b.deleteExpando = !1;
        }
        !n.addEventListener && n.attachEvent && n.fireEvent && (n.attachEvent("onclick", m = function() {
            b.noCloneEvent = !1;
        }), n.cloneNode(!0).fireEvent("onclick"), n.detachEvent("onclick", m)), h = e.createElement("input"), 
        h.value = "t", h.setAttribute("type", "radio"), b.radioValue = "t" === h.value, 
        h.setAttribute("checked", "checked"), h.setAttribute("name", "t"), n.appendChild(h), 
        i = e.createDocumentFragment(), i.appendChild(n.lastChild), b.checkClone = i.cloneNode(!0).cloneNode(!0).lastChild.checked, 
        b.appendChecked = h.checked, i.removeChild(h), i.appendChild(n);
        if (n.attachEvent) for (k in {
            submit: !0,
            change: !0,
            focusin: !0
        }) j = "on" + k, l = j in n, l || (n.setAttribute(j, "return;"), l = "function" == typeof n[j]), 
        b[k + "Bubbles"] = l;
        return p(function() {
            var c, d, f, g, h = "padding:0;margin:0;border:0;display:block;overflow:hidden;", i = e.getElementsByTagName("body")[0];
            if (!i) return;
            c = e.createElement("div"), c.style.cssText = "visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px", 
            i.insertBefore(c, i.firstChild), d = e.createElement("div"), c.appendChild(d), d.innerHTML = "<table><tr><td></td><td>t</td></tr></table>", 
            f = d.getElementsByTagName("td"), f[0].style.cssText = "padding:0;margin:0;border:0;display:none", 
            l = 0 === f[0].offsetHeight, f[0].style.display = "", f[1].style.display = "none", 
            b.reliableHiddenOffsets = l && 0 === f[0].offsetHeight, d.innerHTML = "", d.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;", 
            b.boxSizing = 4 === d.offsetWidth, b.doesNotIncludeMarginInBodyOffset = 1 !== i.offsetTop, 
            a.getComputedStyle && (b.pixelPosition = "1%" !== (a.getComputedStyle(d, null) || {}).top, 
            b.boxSizingReliable = "4px" === (a.getComputedStyle(d, null) || {
                width: "4px"
            }).width, g = e.createElement("div"), g.style.cssText = d.style.cssText = h, g.style.marginRight = g.style.width = "0", 
            d.style.width = "1px", d.appendChild(g), b.reliableMarginRight = !parseFloat((a.getComputedStyle(g, null) || {}).marginRight)), 
            "undefined" != typeof d.style.zoom && (d.innerHTML = "", d.style.cssText = h + "width:1px;padding:1px;display:inline;zoom:1", 
            b.inlineBlockNeedsLayout = 3 === d.offsetWidth, d.style.display = "block", d.style.overflow = "visible", 
            d.innerHTML = "<div></div>", d.firstChild.style.width = "5px", b.shrinkWrapBlocks = 3 !== d.offsetWidth, 
            c.style.zoom = 1), i.removeChild(c), c = d = f = g = null;
        }), i.removeChild(n), c = d = f = g = h = i = n = null, b;
    }();
    var H = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/, I = /([A-Z])/g;
    p.extend({
        cache: {},
        deletedIds: [],
        uuid: 0,
        expando: "jQuery" + (p.fn.jquery + Math.random()).replace(/\D/g, ""),
        noData: {
            embed: !0,
            object: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
            applet: !0
        },
        hasData: function(a) {
            return a = a.nodeType ? p.cache[a[p.expando]] : a[p.expando], !!a && !K(a);
        },
        data: function(a, c, d, e) {
            if (!p.acceptData(a)) return;
            var f, g, h = p.expando, i = "string" == typeof c, j = a.nodeType, k = j ? p.cache : a, l = j ? a[h] : a[h] && h;
            if ((!l || !k[l] || !e && !k[l].data) && i && d === b) return;
            l || (j ? a[h] = l = p.deletedIds.pop() || p.guid++ : l = h), k[l] || (k[l] = {}, 
            j || (k[l].toJSON = p.noop));
            if ("object" == typeof c || "function" == typeof c) e ? k[l] = p.extend(k[l], c) : k[l].data = p.extend(k[l].data, c);
            return f = k[l], e || (f.data || (f.data = {}), f = f.data), d !== b && (f[p.camelCase(c)] = d), 
            i ? (g = f[c], null == g && (g = f[p.camelCase(c)])) : g = f, g;
        },
        removeData: function(a, b, c) {
            if (!p.acceptData(a)) return;
            var d, e, f, g = a.nodeType, h = g ? p.cache : a, i = g ? a[p.expando] : p.expando;
            if (!h[i]) return;
            if (b) {
                d = c ? h[i] : h[i].data;
                if (d) {
                    p.isArray(b) || (b in d ? b = [ b ] : (b = p.camelCase(b), b in d ? b = [ b ] : b = b.split(" ")));
                    for (e = 0, f = b.length; e < f; e++) delete d[b[e]];
                    if (!(c ? K : p.isEmptyObject)(d)) return;
                }
            }
            if (!c) {
                delete h[i].data;
                if (!K(h[i])) return;
            }
            g ? p.cleanData([ a ], !0) : p.support.deleteExpando || h != h.window ? delete h[i] : h[i] = null;
        },
        _data: function(a, b, c) {
            return p.data(a, b, c, !0);
        },
        acceptData: function(a) {
            var b = a.nodeName && p.noData[a.nodeName.toLowerCase()];
            return !b || b !== !0 && a.getAttribute("classid") === b;
        }
    }), p.fn.extend({
        data: function(a, c) {
            var d, e, f, g, h, i = this[0], j = 0, k = null;
            if (a === b) {
                if (this.length) {
                    k = p.data(i);
                    if (1 === i.nodeType && !p._data(i, "parsedAttrs")) {
                        f = i.attributes;
                        for (h = f.length; j < h; j++) g = f[j].name, g.indexOf("data-") || (g = p.camelCase(g.substring(5)), 
                        J(i, g, k[g]));
                        p._data(i, "parsedAttrs", !0);
                    }
                }
                return k;
            }
            return "object" == typeof a ? this.each(function() {
                p.data(this, a);
            }) : (d = a.split(".", 2), d[1] = d[1] ? "." + d[1] : "", e = d[1] + "!", p.access(this, function(c) {
                if (c === b) return k = this.triggerHandler("getData" + e, [ d[0] ]), k === b && i && (k = p.data(i, a), 
                k = J(i, a, k)), k === b && d[1] ? this.data(d[0]) : k;
                d[1] = c, this.each(function() {
                    var b = p(this);
                    b.triggerHandler("setData" + e, d), p.data(this, a, c), b.triggerHandler("changeData" + e, d);
                });
            }, null, c, arguments.length > 1, null, !1));
        },
        removeData: function(a) {
            return this.each(function() {
                p.removeData(this, a);
            });
        }
    }), p.extend({
        queue: function(a, b, c) {
            var d;
            if (a) return b = (b || "fx") + "queue", d = p._data(a, b), c && (!d || p.isArray(c) ? d = p._data(a, b, p.makeArray(c)) : d.push(c)), 
            d || [];
        },
        dequeue: function(a, b) {
            b = b || "fx";
            var c = p.queue(a, b), d = c.length, e = c.shift(), f = p._queueHooks(a, b), g = function() {
                p.dequeue(a, b);
            };
            "inprogress" === e && (e = c.shift(), d--), e && ("fx" === b && c.unshift("inprogress"), 
            delete f.stop, e.call(a, g, f)), !d && f && f.empty.fire();
        },
        _queueHooks: function(a, b) {
            var c = b + "queueHooks";
            return p._data(a, c) || p._data(a, c, {
                empty: p.Callbacks("once memory").add(function() {
                    p.removeData(a, b + "queue", !0), p.removeData(a, c, !0);
                })
            });
        }
    }), p.fn.extend({
        queue: function(a, c) {
            var d = 2;
            return "string" != typeof a && (c = a, a = "fx", d--), arguments.length < d ? p.queue(this[0], a) : c === b ? this : this.each(function() {
                var b = p.queue(this, a, c);
                p._queueHooks(this, a), "fx" === a && "inprogress" !== b[0] && p.dequeue(this, a);
            });
        },
        dequeue: function(a) {
            return this.each(function() {
                p.dequeue(this, a);
            });
        },
        delay: function(a, b) {
            return a = p.fx ? p.fx.speeds[a] || a : a, b = b || "fx", this.queue(b, function(b, c) {
                var d = setTimeout(b, a);
                c.stop = function() {
                    clearTimeout(d);
                };
            });
        },
        clearQueue: function(a) {
            return this.queue(a || "fx", []);
        },
        promise: function(a, c) {
            var d, e = 1, f = p.Deferred(), g = this, h = this.length, i = function() {
                --e || f.resolveWith(g, [ g ]);
            };
            "string" != typeof a && (c = a, a = b), a = a || "fx";
            while (h--) d = p._data(g[h], a + "queueHooks"), d && d.empty && (e++, d.empty.add(i));
            return i(), f.promise(c);
        }
    });
    var L, M, N, O = /[\t\r\n]/g, P = /\r/g, Q = /^(?:button|input)$/i, R = /^(?:button|input|object|select|textarea)$/i, S = /^a(?:rea|)$/i, T = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i, U = p.support.getSetAttribute;
    p.fn.extend({
        attr: function(a, b) {
            return p.access(this, p.attr, a, b, arguments.length > 1);
        },
        removeAttr: function(a) {
            return this.each(function() {
                p.removeAttr(this, a);
            });
        },
        prop: function(a, b) {
            return p.access(this, p.prop, a, b, arguments.length > 1);
        },
        removeProp: function(a) {
            return a = p.propFix[a] || a, this.each(function() {
                try {
                    this[a] = b, delete this[a];
                } catch (c) {}
            });
        },
        addClass: function(a) {
            var b, c, d, e, f, g, h;
            if (p.isFunction(a)) return this.each(function(b) {
                p(this).addClass(a.call(this, b, this.className));
            });
            if (a && "string" == typeof a) {
                b = a.split(s);
                for (c = 0, d = this.length; c < d; c++) {
                    e = this[c];
                    if (1 === e.nodeType) if (!e.className && 1 === b.length) e.className = a; else {
                        f = " " + e.className + " ";
                        for (g = 0, h = b.length; g < h; g++) f.indexOf(" " + b[g] + " ") < 0 && (f += b[g] + " ");
                        e.className = p.trim(f);
                    }
                }
            }
            return this;
        },
        removeClass: function(a) {
            var c, d, e, f, g, h, i;
            if (p.isFunction(a)) return this.each(function(b) {
                p(this).removeClass(a.call(this, b, this.className));
            });
            if (a && "string" == typeof a || a === b) {
                c = (a || "").split(s);
                for (h = 0, i = this.length; h < i; h++) {
                    e = this[h];
                    if (1 === e.nodeType && e.className) {
                        d = (" " + e.className + " ").replace(O, " ");
                        for (f = 0, g = c.length; f < g; f++) while (d.indexOf(" " + c[f] + " ") >= 0) d = d.replace(" " + c[f] + " ", " ");
                        e.className = a ? p.trim(d) : "";
                    }
                }
            }
            return this;
        },
        toggleClass: function(a, b) {
            var c = typeof a, d = "boolean" == typeof b;
            return p.isFunction(a) ? this.each(function(c) {
                p(this).toggleClass(a.call(this, c, this.className, b), b);
            }) : this.each(function() {
                if ("string" === c) {
                    var e, f = 0, g = p(this), h = b, i = a.split(s);
                    while (e = i[f++]) h = d ? h : !g.hasClass(e), g[h ? "addClass" : "removeClass"](e);
                } else if ("undefined" === c || "boolean" === c) this.className && p._data(this, "__className__", this.className), 
                this.className = this.className || a === !1 ? "" : p._data(this, "__className__") || "";
            });
        },
        hasClass: function(a) {
            var b = " " + a + " ", c = 0, d = this.length;
            for (;c < d; c++) if (1 === this[c].nodeType && (" " + this[c].className + " ").replace(O, " ").indexOf(b) >= 0) return !0;
            return !1;
        },
        val: function(a) {
            var c, d, e, f = this[0];
            if (!arguments.length) {
                if (f) return c = p.valHooks[f.type] || p.valHooks[f.nodeName.toLowerCase()], c && "get" in c && (d = c.get(f, "value")) !== b ? d : (d = f.value, 
                "string" == typeof d ? d.replace(P, "") : null == d ? "" : d);
                return;
            }
            return e = p.isFunction(a), this.each(function(d) {
                var f, g = p(this);
                if (1 !== this.nodeType) return;
                e ? f = a.call(this, d, g.val()) : f = a, null == f ? f = "" : "number" == typeof f ? f += "" : p.isArray(f) && (f = p.map(f, function(a) {
                    return null == a ? "" : a + "";
                })), c = p.valHooks[this.type] || p.valHooks[this.nodeName.toLowerCase()];
                if (!c || !("set" in c) || c.set(this, f, "value") === b) this.value = f;
            });
        }
    }), p.extend({
        valHooks: {
            option: {
                get: function(a) {
                    var b = a.attributes.value;
                    return !b || b.specified ? a.value : a.text;
                }
            },
            select: {
                get: function(a) {
                    var b, c, d, e, f = a.selectedIndex, g = [], h = a.options, i = "select-one" === a.type;
                    if (f < 0) return null;
                    c = i ? f : 0, d = i ? f + 1 : h.length;
                    for (;c < d; c++) {
                        e = h[c];
                        if (e.selected && (p.support.optDisabled ? !e.disabled : null === e.getAttribute("disabled")) && (!e.parentNode.disabled || !p.nodeName(e.parentNode, "optgroup"))) {
                            b = p(e).val();
                            if (i) return b;
                            g.push(b);
                        }
                    }
                    return i && !g.length && h.length ? p(h[f]).val() : g;
                },
                set: function(a, b) {
                    var c = p.makeArray(b);
                    return p(a).find("option").each(function() {
                        this.selected = p.inArray(p(this).val(), c) >= 0;
                    }), c.length || (a.selectedIndex = -1), c;
                }
            }
        },
        attrFn: {},
        attr: function(a, c, d, e) {
            var f, g, h, i = a.nodeType;
            if (!a || 3 === i || 8 === i || 2 === i) return;
            if (e && p.isFunction(p.fn[c])) return p(a)[c](d);
            if ("undefined" == typeof a.getAttribute) return p.prop(a, c, d);
            h = 1 !== i || !p.isXMLDoc(a), h && (c = c.toLowerCase(), g = p.attrHooks[c] || (T.test(c) ? M : L));
            if (d !== b) {
                if (null === d) {
                    p.removeAttr(a, c);
                    return;
                }
                return g && "set" in g && h && (f = g.set(a, d, c)) !== b ? f : (a.setAttribute(c, d + ""), 
                d);
            }
            return g && "get" in g && h && null !== (f = g.get(a, c)) ? f : (f = a.getAttribute(c), 
            null === f ? b : f);
        },
        removeAttr: function(a, b) {
            var c, d, e, f, g = 0;
            if (b && 1 === a.nodeType) {
                d = b.split(s);
                for (;g < d.length; g++) e = d[g], e && (c = p.propFix[e] || e, f = T.test(e), f || p.attr(a, e, ""), 
                a.removeAttribute(U ? e : c), f && c in a && (a[c] = !1));
            }
        },
        attrHooks: {
            type: {
                set: function(a, b) {
                    if (Q.test(a.nodeName) && a.parentNode) p.error("type property can't be changed"); else if (!p.support.radioValue && "radio" === b && p.nodeName(a, "input")) {
                        var c = a.value;
                        return a.setAttribute("type", b), c && (a.value = c), b;
                    }
                }
            },
            value: {
                get: function(a, b) {
                    return L && p.nodeName(a, "button") ? L.get(a, b) : b in a ? a.value : null;
                },
                set: function(a, b, c) {
                    if (L && p.nodeName(a, "button")) return L.set(a, b, c);
                    a.value = b;
                }
            }
        },
        propFix: {
            tabindex: "tabIndex",
            readonly: "readOnly",
            "for": "htmlFor",
            "class": "className",
            maxlength: "maxLength",
            cellspacing: "cellSpacing",
            cellpadding: "cellPadding",
            rowspan: "rowSpan",
            colspan: "colSpan",
            usemap: "useMap",
            frameborder: "frameBorder",
            contenteditable: "contentEditable"
        },
        prop: function(a, c, d) {
            var e, f, g, h = a.nodeType;
            if (!a || 3 === h || 8 === h || 2 === h) return;
            return g = 1 !== h || !p.isXMLDoc(a), g && (c = p.propFix[c] || c, f = p.propHooks[c]), 
            d !== b ? f && "set" in f && (e = f.set(a, d, c)) !== b ? e : a[c] = d : f && "get" in f && null !== (e = f.get(a, c)) ? e : a[c];
        },
        propHooks: {
            tabIndex: {
                get: function(a) {
                    var c = a.getAttributeNode("tabindex");
                    return c && c.specified ? parseInt(c.value, 10) : R.test(a.nodeName) || S.test(a.nodeName) && a.href ? 0 : b;
                }
            }
        }
    }), M = {
        get: function(a, c) {
            var d, e = p.prop(a, c);
            return e === !0 || "boolean" != typeof e && (d = a.getAttributeNode(c)) && d.nodeValue !== !1 ? c.toLowerCase() : b;
        },
        set: function(a, b, c) {
            var d;
            return b === !1 ? p.removeAttr(a, c) : (d = p.propFix[c] || c, d in a && (a[d] = !0), 
            a.setAttribute(c, c.toLowerCase())), c;
        }
    }, U || (N = {
        name: !0,
        id: !0,
        coords: !0
    }, L = p.valHooks.button = {
        get: function(a, c) {
            var d;
            return d = a.getAttributeNode(c), d && (N[c] ? "" !== d.value : d.specified) ? d.value : b;
        },
        set: function(a, b, c) {
            var d = a.getAttributeNode(c);
            return d || (d = e.createAttribute(c), a.setAttributeNode(d)), d.value = b + "";
        }
    }, p.each([ "width", "height" ], function(a, b) {
        p.attrHooks[b] = p.extend(p.attrHooks[b], {
            set: function(a, c) {
                if ("" === c) return a.setAttribute(b, "auto"), c;
            }
        });
    }), p.attrHooks.contenteditable = {
        get: L.get,
        set: function(a, b, c) {
            "" === b && (b = "false"), L.set(a, b, c);
        }
    }), p.support.hrefNormalized || p.each([ "href", "src", "width", "height" ], function(a, c) {
        p.attrHooks[c] = p.extend(p.attrHooks[c], {
            get: function(a) {
                var d = a.getAttribute(c, 2);
                return null === d ? b : d;
            }
        });
    }), p.support.style || (p.attrHooks.style = {
        get: function(a) {
            return a.style.cssText.toLowerCase() || b;
        },
        set: function(a, b) {
            return a.style.cssText = b + "";
        }
    }), p.support.optSelected || (p.propHooks.selected = p.extend(p.propHooks.selected, {
        get: function(a) {
            var b = a.parentNode;
            return b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex), null;
        }
    })), p.support.enctype || (p.propFix.enctype = "encoding"), p.support.checkOn || p.each([ "radio", "checkbox" ], function() {
        p.valHooks[this] = {
            get: function(a) {
                return null === a.getAttribute("value") ? "on" : a.value;
            }
        };
    }), p.each([ "radio", "checkbox" ], function() {
        p.valHooks[this] = p.extend(p.valHooks[this], {
            set: function(a, b) {
                if (p.isArray(b)) return a.checked = p.inArray(p(a).val(), b) >= 0;
            }
        });
    });
    var V = /^(?:textarea|input|select)$/i, W = /^([^\.]*|)(?:\.(.+)|)$/, X = /(?:^|\s)hover(\.\S+|)\b/, Y = /^key/, Z = /^(?:mouse|contextmenu)|click/, $ = /^(?:focusinfocus|focusoutblur)$/, _ = function(a) {
        return p.event.special.hover ? a : a.replace(X, "mouseenter$1 mouseleave$1");
    };
    p.event = {
        add: function(a, c, d, e, f) {
            var g, h, i, j, k, l, m, n, o, q, r;
            if (3 === a.nodeType || 8 === a.nodeType || !c || !d || !(g = p._data(a))) return;
            d.handler && (o = d, d = o.handler, f = o.selector), d.guid || (d.guid = p.guid++), 
            i = g.events, i || (g.events = i = {}), h = g.handle, h || (g.handle = h = function(a) {
                return "undefined" != typeof p && (!a || p.event.triggered !== a.type) ? p.event.dispatch.apply(h.elem, arguments) : b;
            }, h.elem = a), c = p.trim(_(c)).split(" ");
            for (j = 0; j < c.length; j++) {
                k = W.exec(c[j]) || [], l = k[1], m = (k[2] || "").split(".").sort(), r = p.event.special[l] || {}, 
                l = (f ? r.delegateType : r.bindType) || l, r = p.event.special[l] || {}, n = p.extend({
                    type: l,
                    origType: k[1],
                    data: e,
                    handler: d,
                    guid: d.guid,
                    selector: f,
                    needsContext: f && p.expr.match.needsContext.test(f),
                    namespace: m.join(".")
                }, o), q = i[l];
                if (!q) {
                    q = i[l] = [], q.delegateCount = 0;
                    if (!r.setup || r.setup.call(a, e, m, h) === !1) a.addEventListener ? a.addEventListener(l, h, !1) : a.attachEvent && a.attachEvent("on" + l, h);
                }
                r.add && (r.add.call(a, n), n.handler.guid || (n.handler.guid = d.guid)), f ? q.splice(q.delegateCount++, 0, n) : q.push(n), 
                p.event.global[l] = !0;
            }
            a = null;
        },
        global: {},
        remove: function(a, b, c, d, e) {
            var f, g, h, i, j, k, l, m, n, o, q, r = p.hasData(a) && p._data(a);
            if (!r || !(m = r.events)) return;
            b = p.trim(_(b || "")).split(" ");
            for (f = 0; f < b.length; f++) {
                g = W.exec(b[f]) || [], h = i = g[1], j = g[2];
                if (!h) {
                    for (h in m) p.event.remove(a, h + b[f], c, d, !0);
                    continue;
                }
                n = p.event.special[h] || {}, h = (d ? n.delegateType : n.bindType) || h, o = m[h] || [], 
                k = o.length, j = j ? new RegExp("(^|\\.)" + j.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
                for (l = 0; l < o.length; l++) q = o[l], (e || i === q.origType) && (!c || c.guid === q.guid) && (!j || j.test(q.namespace)) && (!d || d === q.selector || "**" === d && q.selector) && (o.splice(l--, 1), 
                q.selector && o.delegateCount--, n.remove && n.remove.call(a, q));
                0 === o.length && k !== o.length && ((!n.teardown || n.teardown.call(a, j, r.handle) === !1) && p.removeEvent(a, h, r.handle), 
                delete m[h]);
            }
            p.isEmptyObject(m) && (delete r.handle, p.removeData(a, "events", !0));
        },
        customEvent: {
            getData: !0,
            setData: !0,
            changeData: !0
        },
        trigger: function(c, d, f, g) {
            if (!f || 3 !== f.nodeType && 8 !== f.nodeType) {
                var h, i, j, k, l, m, n, o, q, r, s = c.type || c, t = [];
                if ($.test(s + p.event.triggered)) return;
                s.indexOf("!") >= 0 && (s = s.slice(0, -1), i = !0), s.indexOf(".") >= 0 && (t = s.split("."), 
                s = t.shift(), t.sort());
                if ((!f || p.event.customEvent[s]) && !p.event.global[s]) return;
                c = "object" == typeof c ? c[p.expando] ? c : new p.Event(s, c) : new p.Event(s), 
                c.type = s, c.isTrigger = !0, c.exclusive = i, c.namespace = t.join("."), c.namespace_re = c.namespace ? new RegExp("(^|\\.)" + t.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, 
                m = s.indexOf(":") < 0 ? "on" + s : "";
                if (!f) {
                    h = p.cache;
                    for (j in h) h[j].events && h[j].events[s] && p.event.trigger(c, d, h[j].handle.elem, !0);
                    return;
                }
                c.result = b, c.target || (c.target = f), d = null != d ? p.makeArray(d) : [], d.unshift(c), 
                n = p.event.special[s] || {};
                if (n.trigger && n.trigger.apply(f, d) === !1) return;
                q = [ [ f, n.bindType || s ] ];
                if (!g && !n.noBubble && !p.isWindow(f)) {
                    r = n.delegateType || s, k = $.test(r + s) ? f : f.parentNode;
                    for (l = f; k; k = k.parentNode) q.push([ k, r ]), l = k;
                    l === (f.ownerDocument || e) && q.push([ l.defaultView || l.parentWindow || a, r ]);
                }
                for (j = 0; j < q.length && !c.isPropagationStopped(); j++) k = q[j][0], c.type = q[j][1], 
                o = (p._data(k, "events") || {})[c.type] && p._data(k, "handle"), o && o.apply(k, d), 
                o = m && k[m], o && p.acceptData(k) && o.apply && o.apply(k, d) === !1 && c.preventDefault();
                return c.type = s, !g && !c.isDefaultPrevented() && (!n._default || n._default.apply(f.ownerDocument, d) === !1) && ("click" !== s || !p.nodeName(f, "a")) && p.acceptData(f) && m && f[s] && ("focus" !== s && "blur" !== s || 0 !== c.target.offsetWidth) && !p.isWindow(f) && (l = f[m], 
                l && (f[m] = null), p.event.triggered = s, f[s](), p.event.triggered = b, l && (f[m] = l)), 
                c.result;
            }
            return;
        },
        dispatch: function(c) {
            c = p.event.fix(c || a.event);
            var d, e, f, g, h, i, j, l, m, n, o = (p._data(this, "events") || {})[c.type] || [], q = o.delegateCount, r = k.call(arguments), s = !c.exclusive && !c.namespace, t = p.event.special[c.type] || {}, u = [];
            r[0] = c, c.delegateTarget = this;
            if (t.preDispatch && t.preDispatch.call(this, c) === !1) return;
            if (q && (!c.button || "click" !== c.type)) for (f = c.target; f != this; f = f.parentNode || this) if (f.disabled !== !0 || "click" !== c.type) {
                h = {}, j = [];
                for (d = 0; d < q; d++) l = o[d], m = l.selector, h[m] === b && (h[m] = l.needsContext ? p(m, this).index(f) >= 0 : p.find(m, this, null, [ f ]).length), 
                h[m] && j.push(l);
                j.length && u.push({
                    elem: f,
                    matches: j
                });
            }
            o.length > q && u.push({
                elem: this,
                matches: o.slice(q)
            });
            for (d = 0; d < u.length && !c.isPropagationStopped(); d++) {
                i = u[d], c.currentTarget = i.elem;
                for (e = 0; e < i.matches.length && !c.isImmediatePropagationStopped(); e++) {
                    l = i.matches[e];
                    if (s || !c.namespace && !l.namespace || c.namespace_re && c.namespace_re.test(l.namespace)) c.data = l.data, 
                    c.handleObj = l, g = ((p.event.special[l.origType] || {}).handle || l.handler).apply(i.elem, r), 
                    g !== b && (c.result = g, g === !1 && (c.preventDefault(), c.stopPropagation()));
                }
            }
            return t.postDispatch && t.postDispatch.call(this, c), c.result;
        },
        props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
        fixHooks: {},
        keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function(a, b) {
                return null == a.which && (a.which = null != b.charCode ? b.charCode : b.keyCode), 
                a;
            }
        },
        mouseHooks: {
            props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
            filter: function(a, c) {
                var d, f, g, h = c.button, i = c.fromElement;
                return null == a.pageX && null != c.clientX && (d = a.target.ownerDocument || e, 
                f = d.documentElement, g = d.body, a.pageX = c.clientX + (f && f.scrollLeft || g && g.scrollLeft || 0) - (f && f.clientLeft || g && g.clientLeft || 0), 
                a.pageY = c.clientY + (f && f.scrollTop || g && g.scrollTop || 0) - (f && f.clientTop || g && g.clientTop || 0)), 
                !a.relatedTarget && i && (a.relatedTarget = i === a.target ? c.toElement : i), !a.which && h !== b && (a.which = 1 & h ? 1 : 2 & h ? 3 : 4 & h ? 2 : 0), 
                a;
            }
        },
        fix: function(a) {
            if (a[p.expando]) return a;
            var b, c, d = a, f = p.event.fixHooks[a.type] || {}, g = f.props ? this.props.concat(f.props) : this.props;
            a = p.Event(d);
            for (b = g.length; b; ) c = g[--b], a[c] = d[c];
            return a.target || (a.target = d.srcElement || e), 3 === a.target.nodeType && (a.target = a.target.parentNode), 
            a.metaKey = !!a.metaKey, f.filter ? f.filter(a, d) : a;
        },
        special: {
            load: {
                noBubble: !0
            },
            focus: {
                delegateType: "focusin"
            },
            blur: {
                delegateType: "focusout"
            },
            beforeunload: {
                setup: function(a, b, c) {
                    p.isWindow(this) && (this.onbeforeunload = c);
                },
                teardown: function(a, b) {
                    this.onbeforeunload === b && (this.onbeforeunload = null);
                }
            }
        },
        simulate: function(a, b, c, d) {
            var e = p.extend(new p.Event(), c, {
                type: a,
                isSimulated: !0,
                originalEvent: {}
            });
            d ? p.event.trigger(e, null, b) : p.event.dispatch.call(b, e), e.isDefaultPrevented() && c.preventDefault();
        }
    }, p.event.handle = p.event.dispatch, p.removeEvent = e.removeEventListener ? function(a, b, c) {
        a.removeEventListener && a.removeEventListener(b, c, !1);
    } : function(a, b, c) {
        var d = "on" + b;
        a.detachEvent && ("undefined" == typeof a[d] && (a[d] = null), a.detachEvent(d, c));
    }, p.Event = function(a, b) {
        if (this instanceof p.Event) a && a.type ? (this.originalEvent = a, this.type = a.type, 
        this.isDefaultPrevented = a.defaultPrevented || a.returnValue === !1 || a.getPreventDefault && a.getPreventDefault() ? bb : ba) : this.type = a, 
        b && p.extend(this, b), this.timeStamp = a && a.timeStamp || p.now(), this[p.expando] = !0; else return new p.Event(a, b);
    }, p.Event.prototype = {
        preventDefault: function() {
            this.isDefaultPrevented = bb;
            var a = this.originalEvent;
            if (!a) return;
            a.preventDefault ? a.preventDefault() : a.returnValue = !1;
        },
        stopPropagation: function() {
            this.isPropagationStopped = bb;
            var a = this.originalEvent;
            if (!a) return;
            a.stopPropagation && a.stopPropagation(), a.cancelBubble = !0;
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = bb, this.stopPropagation();
        },
        isDefaultPrevented: ba,
        isPropagationStopped: ba,
        isImmediatePropagationStopped: ba
    }, p.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    }, function(a, b) {
        p.event.special[a] = {
            delegateType: b,
            bindType: b,
            handle: function(a) {
                var c, d = this, e = a.relatedTarget, f = a.handleObj, g = f.selector;
                if (!e || e !== d && !p.contains(d, e)) a.type = f.origType, c = f.handler.apply(this, arguments), 
                a.type = b;
                return c;
            }
        };
    }), p.support.submitBubbles || (p.event.special.submit = {
        setup: function() {
            if (p.nodeName(this, "form")) return !1;
            p.event.add(this, "click._submit keypress._submit", function(a) {
                var c = a.target, d = p.nodeName(c, "input") || p.nodeName(c, "button") ? c.form : b;
                d && !p._data(d, "_submit_attached") && (p.event.add(d, "submit._submit", function(a) {
                    a._submit_bubble = !0;
                }), p._data(d, "_submit_attached", !0));
            });
        },
        postDispatch: function(a) {
            a._submit_bubble && (delete a._submit_bubble, this.parentNode && !a.isTrigger && p.event.simulate("submit", this.parentNode, a, !0));
        },
        teardown: function() {
            if (p.nodeName(this, "form")) return !1;
            p.event.remove(this, "._submit");
        }
    }), p.support.changeBubbles || (p.event.special.change = {
        setup: function() {
            if (V.test(this.nodeName)) {
                if ("checkbox" === this.type || "radio" === this.type) p.event.add(this, "propertychange._change", function(a) {
                    "checked" === a.originalEvent.propertyName && (this._just_changed = !0);
                }), p.event.add(this, "click._change", function(a) {
                    this._just_changed && !a.isTrigger && (this._just_changed = !1), p.event.simulate("change", this, a, !0);
                });
                return !1;
            }
            p.event.add(this, "beforeactivate._change", function(a) {
                var b = a.target;
                V.test(b.nodeName) && !p._data(b, "_change_attached") && (p.event.add(b, "change._change", function(a) {
                    this.parentNode && !a.isSimulated && !a.isTrigger && p.event.simulate("change", this.parentNode, a, !0);
                }), p._data(b, "_change_attached", !0));
            });
        },
        handle: function(a) {
            var b = a.target;
            if (this !== b || a.isSimulated || a.isTrigger || "radio" !== b.type && "checkbox" !== b.type) return a.handleObj.handler.apply(this, arguments);
        },
        teardown: function() {
            return p.event.remove(this, "._change"), !V.test(this.nodeName);
        }
    }), p.support.focusinBubbles || p.each({
        focus: "focusin",
        blur: "focusout"
    }, function(a, b) {
        var c = 0, d = function(a) {
            p.event.simulate(b, a.target, p.event.fix(a), !0);
        };
        p.event.special[b] = {
            setup: function() {
                0 === c++ && e.addEventListener(a, d, !0);
            },
            teardown: function() {
                0 === --c && e.removeEventListener(a, d, !0);
            }
        };
    }), p.fn.extend({
        on: function(a, c, d, e, f) {
            var g, h;
            if ("object" == typeof a) {
                "string" != typeof c && (d = d || c, c = b);
                for (h in a) this.on(h, c, d, a[h], f);
                return this;
            }
            null == d && null == e ? (e = c, d = c = b) : null == e && ("string" == typeof c ? (e = d, 
            d = b) : (e = d, d = c, c = b));
            if (e === !1) e = ba; else if (!e) return this;
            return 1 === f && (g = e, e = function(a) {
                return p().off(a), g.apply(this, arguments);
            }, e.guid = g.guid || (g.guid = p.guid++)), this.each(function() {
                p.event.add(this, a, e, d, c);
            });
        },
        one: function(a, b, c, d) {
            return this.on(a, b, c, d, 1);
        },
        off: function(a, c, d) {
            var e, f;
            if (a && a.preventDefault && a.handleObj) return e = a.handleObj, p(a.delegateTarget).off(e.namespace ? e.origType + "." + e.namespace : e.origType, e.selector, e.handler), 
            this;
            if ("object" == typeof a) {
                for (f in a) this.off(f, c, a[f]);
                return this;
            }
            if (c === !1 || "function" == typeof c) d = c, c = b;
            return d === !1 && (d = ba), this.each(function() {
                p.event.remove(this, a, d, c);
            });
        },
        bind: function(a, b, c) {
            return this.on(a, null, b, c);
        },
        unbind: function(a, b) {
            return this.off(a, null, b);
        },
        live: function(a, b, c) {
            return p(this.context).on(a, this.selector, b, c), this;
        },
        die: function(a, b) {
            return p(this.context).off(a, this.selector || "**", b), this;
        },
        delegate: function(a, b, c, d) {
            return this.on(b, a, c, d);
        },
        undelegate: function(a, b, c) {
            return 1 === arguments.length ? this.off(a, "**") : this.off(b, a || "**", c);
        },
        trigger: function(a, b) {
            return this.each(function() {
                p.event.trigger(a, b, this);
            });
        },
        triggerHandler: function(a, b) {
            if (this[0]) return p.event.trigger(a, b, this[0], !0);
        },
        toggle: function(a) {
            var b = arguments, c = a.guid || p.guid++, d = 0, e = function(c) {
                var e = (p._data(this, "lastToggle" + a.guid) || 0) % d;
                return p._data(this, "lastToggle" + a.guid, e + 1), c.preventDefault(), b[e].apply(this, arguments) || !1;
            };
            e.guid = c;
            while (d < b.length) b[d++].guid = c;
            return this.click(e);
        },
        hover: function(a, b) {
            return this.mouseenter(a).mouseleave(b || a);
        }
    }), p.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function(a, b) {
        p.fn[b] = function(a, c) {
            return null == c && (c = a, a = null), arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b);
        }, Y.test(b) && (p.event.fixHooks[b] = p.event.keyHooks), Z.test(b) && (p.event.fixHooks[b] = p.event.mouseHooks);
    }), function(a, b) {
        function bc(a, b, c, d) {
            c = c || [], b = b || r;
            var e, f, i, j, k = b.nodeType;
            if (!a || "string" != typeof a) return c;
            if (1 !== k && 9 !== k) return [];
            i = g(b);
            if (!i && !d) if (e = P.exec(a)) if (j = e[1]) {
                if (9 === k) {
                    f = b.getElementById(j);
                    if (!f || !f.parentNode) return c;
                    if (f.id === j) return c.push(f), c;
                } else if (b.ownerDocument && (f = b.ownerDocument.getElementById(j)) && h(b, f) && f.id === j) return c.push(f), 
                c;
            } else {
                if (e[2]) return w.apply(c, x.call(b.getElementsByTagName(a), 0)), c;
                if ((j = e[3]) && _ && b.getElementsByClassName) return w.apply(c, x.call(b.getElementsByClassName(j), 0)), 
                c;
            }
            return bp(a.replace(L, "$1"), b, c, d, i);
        }
        function bd(a) {
            return function(b) {
                var c = b.nodeName.toLowerCase();
                return "input" === c && b.type === a;
            };
        }
        function be(a) {
            return function(b) {
                var c = b.nodeName.toLowerCase();
                return ("input" === c || "button" === c) && b.type === a;
            };
        }
        function bf(a) {
            return z(function(b) {
                return b = +b, z(function(c, d) {
                    var e, f = a([], c.length, b), g = f.length;
                    while (g--) c[e = f[g]] && (c[e] = !(d[e] = c[e]));
                });
            });
        }
        function bg(a, b, c) {
            if (a === b) return c;
            var d = a.nextSibling;
            while (d) {
                if (d === b) return -1;
                d = d.nextSibling;
            }
            return 1;
        }
        function bh(a, b) {
            var c, d, f, g, h, i, j, k = C[o][a];
            if (k) return b ? 0 : k.slice(0);
            h = a, i = [], j = e.preFilter;
            while (h) {
                if (!c || (d = M.exec(h))) d && (h = h.slice(d[0].length)), i.push(f = []);
                c = !1;
                if (d = N.exec(h)) f.push(c = new q(d.shift())), h = h.slice(c.length), c.type = d[0].replace(L, " ");
                for (g in e.filter) (d = W[g].exec(h)) && (!j[g] || (d = j[g](d, r, !0))) && (f.push(c = new q(d.shift())), 
                h = h.slice(c.length), c.type = g, c.matches = d);
                if (!c) break;
            }
            return b ? h.length : h ? bc.error(a) : C(a, i).slice(0);
        }
        function bi(a, b, d) {
            var e = b.dir, f = d && "parentNode" === b.dir, g = u++;
            return b.first ? function(b, c, d) {
                while (b = b[e]) if (f || 1 === b.nodeType) return a(b, c, d);
            } : function(b, d, h) {
                if (!h) {
                    var i, j = t + " " + g + " ", k = j + c;
                    while (b = b[e]) if (f || 1 === b.nodeType) {
                        if ((i = b[o]) === k) return b.sizset;
                        if ("string" == typeof i && 0 === i.indexOf(j)) {
                            if (b.sizset) return b;
                        } else {
                            b[o] = k;
                            if (a(b, d, h)) return b.sizset = !0, b;
                            b.sizset = !1;
                        }
                    }
                } else while (b = b[e]) if (f || 1 === b.nodeType) if (a(b, d, h)) return b;
            };
        }
        function bj(a) {
            return a.length > 1 ? function(b, c, d) {
                var e = a.length;
                while (e--) if (!a[e](b, c, d)) return !1;
                return !0;
            } : a[0];
        }
        function bk(a, b, c, d, e) {
            var f, g = [], h = 0, i = a.length, j = null != b;
            for (;h < i; h++) if (f = a[h]) if (!c || c(f, d, e)) g.push(f), j && b.push(h);
            return g;
        }
        function bl(a, b, c, d, e, f) {
            return d && !d[o] && (d = bl(d)), e && !e[o] && (e = bl(e, f)), z(function(f, g, h, i) {
                if (f && e) return;
                var j, k, l, m = [], n = [], o = g.length, p = f || bo(b || "*", h.nodeType ? [ h ] : h, [], f), q = a && (f || !b) ? bk(p, m, a, h, i) : p, r = c ? e || (f ? a : o || d) ? [] : g : q;
                c && c(q, r, h, i);
                if (d) {
                    l = bk(r, n), d(l, [], h, i), j = l.length;
                    while (j--) if (k = l[j]) r[n[j]] = !(q[n[j]] = k);
                }
                if (f) {
                    j = a && r.length;
                    while (j--) if (k = r[j]) f[m[j]] = !(g[m[j]] = k);
                } else r = bk(r === g ? r.splice(o, r.length) : r), e ? e(null, g, r, i) : w.apply(g, r);
            });
        }
        function bm(a) {
            var b, c, d, f = a.length, g = e.relative[a[0].type], h = g || e.relative[" "], i = g ? 1 : 0, j = bi(function(a) {
                return a === b;
            }, h, !0), k = bi(function(a) {
                return y.call(b, a) > -1;
            }, h, !0), m = [ function(a, c, d) {
                return !g && (d || c !== l) || ((b = c).nodeType ? j(a, c, d) : k(a, c, d));
            } ];
            for (;i < f; i++) if (c = e.relative[a[i].type]) m = [ bi(bj(m), c) ]; else {
                c = e.filter[a[i].type].apply(null, a[i].matches);
                if (c[o]) {
                    d = ++i;
                    for (;d < f; d++) if (e.relative[a[d].type]) break;
                    return bl(i > 1 && bj(m), i > 1 && a.slice(0, i - 1).join("").replace(L, "$1"), c, i < d && bm(a.slice(i, d)), d < f && bm(a = a.slice(d)), d < f && a.join(""));
                }
                m.push(c);
            }
            return bj(m);
        }
        function bn(a, b) {
            var d = b.length > 0, f = a.length > 0, g = function(h, i, j, k, m) {
                var n, o, p, q = [], s = 0, u = "0", x = h && [], y = null != m, z = l, A = h || f && e.find.TAG("*", m && i.parentNode || i), B = t += null == z ? 1 : Math.E;
                y && (l = i !== r && i, c = g.el);
                for (;null != (n = A[u]); u++) {
                    if (f && n) {
                        for (o = 0; p = a[o]; o++) if (p(n, i, j)) {
                            k.push(n);
                            break;
                        }
                        y && (t = B, c = ++g.el);
                    }
                    d && ((n = !p && n) && s--, h && x.push(n));
                }
                s += u;
                if (d && u !== s) {
                    for (o = 0; p = b[o]; o++) p(x, q, i, j);
                    if (h) {
                        if (s > 0) while (u--) !x[u] && !q[u] && (q[u] = v.call(k));
                        q = bk(q);
                    }
                    w.apply(k, q), y && !h && q.length > 0 && s + b.length > 1 && bc.uniqueSort(k);
                }
                return y && (t = B, l = z), x;
            };
            return g.el = 0, d ? z(g) : g;
        }
        function bo(a, b, c, d) {
            var e = 0, f = b.length;
            for (;e < f; e++) bc(a, b[e], c, d);
            return c;
        }
        function bp(a, b, c, d, f) {
            var g, h, j, k, l, m = bh(a), n = m.length;
            if (!d && 1 === m.length) {
                h = m[0] = m[0].slice(0);
                if (h.length > 2 && "ID" === (j = h[0]).type && 9 === b.nodeType && !f && e.relative[h[1].type]) {
                    b = e.find.ID(j.matches[0].replace(V, ""), b, f)[0];
                    if (!b) return c;
                    a = a.slice(h.shift().length);
                }
                for (g = W.POS.test(a) ? -1 : h.length - 1; g >= 0; g--) {
                    j = h[g];
                    if (e.relative[k = j.type]) break;
                    if (l = e.find[k]) if (d = l(j.matches[0].replace(V, ""), R.test(h[0].type) && b.parentNode || b, f)) {
                        h.splice(g, 1), a = d.length && h.join("");
                        if (!a) return w.apply(c, x.call(d, 0)), c;
                        break;
                    }
                }
            }
            return i(a, m)(d, b, f, c, R.test(a)), c;
        }
        function bq() {}
        var c, d, e, f, g, h, i, j, k, l, m = !0, n = "undefined", o = ("sizcache" + Math.random()).replace(".", ""), q = String, r = a.document, s = r.documentElement, t = 0, u = 0, v = [].pop, w = [].push, x = [].slice, y = [].indexOf || function(a) {
            var b = 0, c = this.length;
            for (;b < c; b++) if (this[b] === a) return b;
            return -1;
        }, z = function(a, b) {
            return a[o] = null == b || b, a;
        }, A = function() {
            var a = {}, b = [];
            return z(function(c, d) {
                return b.push(c) > e.cacheLength && delete a[b.shift()], a[c] = d;
            }, a);
        }, B = A(), C = A(), D = A(), E = "[\\x20\\t\\r\\n\\f]", F = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+", G = F.replace("w", "w#"), H = "([*^$|!~]?=)", I = "\\[" + E + "*(" + F + ")" + E + "*(?:" + H + E + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + G + ")|)|)" + E + "*\\]", J = ":(" + F + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:" + I + ")|[^:]|\\\\.)*|.*))\\)|)", K = ":(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + E + "*((?:-\\d)?\\d*)" + E + "*\\)|)(?=[^-]|$)", L = new RegExp("^" + E + "+|((?:^|[^\\\\])(?:\\\\.)*)" + E + "+$", "g"), M = new RegExp("^" + E + "*," + E + "*"), N = new RegExp("^" + E + "*([\\x20\\t\\r\\n\\f>+~])" + E + "*"), O = new RegExp(J), P = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/, Q = /^:not/, R = /[\x20\t\r\n\f]*[+~]/, S = /:not\($/, T = /h\d/i, U = /input|select|textarea|button/i, V = /\\(?!\\)/g, W = {
            ID: new RegExp("^#(" + F + ")"),
            CLASS: new RegExp("^\\.(" + F + ")"),
            NAME: new RegExp("^\\[name=['\"]?(" + F + ")['\"]?\\]"),
            TAG: new RegExp("^(" + F.replace("w", "w*") + ")"),
            ATTR: new RegExp("^" + I),
            PSEUDO: new RegExp("^" + J),
            POS: new RegExp(K, "i"),
            CHILD: new RegExp("^:(only|nth|first|last)-child(?:\\(" + E + "*(even|odd|(([+-]|)(\\d*)n|)" + E + "*(?:([+-]|)" + E + "*(\\d+)|))" + E + "*\\)|)", "i"),
            needsContext: new RegExp("^" + E + "*[>+~]|" + K, "i")
        }, X = function(a) {
            var b = r.createElement("div");
            try {
                return a(b);
            } catch (c) {
                return !1;
            } finally {
                b = null;
            }
        }, Y = X(function(a) {
            return a.appendChild(r.createComment("")), !a.getElementsByTagName("*").length;
        }), Z = X(function(a) {
            return a.innerHTML = "<a href='#'></a>", a.firstChild && typeof a.firstChild.getAttribute !== n && "#" === a.firstChild.getAttribute("href");
        }), $ = X(function(a) {
            a.innerHTML = "<select></select>";
            var b = typeof a.lastChild.getAttribute("multiple");
            return "boolean" !== b && "string" !== b;
        }), _ = X(function(a) {
            return a.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>", !a.getElementsByClassName || !a.getElementsByClassName("e").length ? !1 : (a.lastChild.className = "e", 
            2 === a.getElementsByClassName("e").length);
        }), ba = X(function(a) {
            a.id = o + 0, a.innerHTML = "<a name='" + o + "'></a><div name='" + o + "'></div>", 
            s.insertBefore(a, s.firstChild);
            var b = r.getElementsByName && r.getElementsByName(o).length === 2 + r.getElementsByName(o + 0).length;
            return d = !r.getElementById(o), s.removeChild(a), b;
        });
        try {
            x.call(s.childNodes, 0)[0].nodeType;
        } catch (bb) {
            x = function(a) {
                var b, c = [];
                for (;b = this[a]; a++) c.push(b);
                return c;
            };
        }
        bc.matches = function(a, b) {
            return bc(a, null, null, b);
        }, bc.matchesSelector = function(a, b) {
            return bc(b, null, null, [ a ]).length > 0;
        }, f = bc.getText = function(a) {
            var b, c = "", d = 0, e = a.nodeType;
            if (e) {
                if (1 === e || 9 === e || 11 === e) {
                    if ("string" == typeof a.textContent) return a.textContent;
                    for (a = a.firstChild; a; a = a.nextSibling) c += f(a);
                } else if (3 === e || 4 === e) return a.nodeValue;
            } else for (;b = a[d]; d++) c += f(b);
            return c;
        }, g = bc.isXML = function(a) {
            var b = a && (a.ownerDocument || a).documentElement;
            return b ? "HTML" !== b.nodeName : !1;
        }, h = bc.contains = s.contains ? function(a, b) {
            var c = 9 === a.nodeType ? a.documentElement : a, d = b && b.parentNode;
            return a === d || !!(d && 1 === d.nodeType && c.contains && c.contains(d));
        } : s.compareDocumentPosition ? function(a, b) {
            return b && !!(16 & a.compareDocumentPosition(b));
        } : function(a, b) {
            while (b = b.parentNode) if (b === a) return !0;
            return !1;
        }, bc.attr = function(a, b) {
            var c, d = g(a);
            return d || (b = b.toLowerCase()), (c = e.attrHandle[b]) ? c(a) : d || $ ? a.getAttribute(b) : (c = a.getAttributeNode(b), 
            c ? "boolean" == typeof a[b] ? a[b] ? b : null : c.specified ? c.value : null : null);
        }, e = bc.selectors = {
            cacheLength: 50,
            createPseudo: z,
            match: W,
            attrHandle: Z ? {} : {
                href: function(a) {
                    return a.getAttribute("href", 2);
                },
                type: function(a) {
                    return a.getAttribute("type");
                }
            },
            find: {
                ID: d ? function(a, b, c) {
                    if (typeof b.getElementById !== n && !c) {
                        var d = b.getElementById(a);
                        return d && d.parentNode ? [ d ] : [];
                    }
                } : function(a, c, d) {
                    if (typeof c.getElementById !== n && !d) {
                        var e = c.getElementById(a);
                        return e ? e.id === a || typeof e.getAttributeNode !== n && e.getAttributeNode("id").value === a ? [ e ] : b : [];
                    }
                },
                TAG: Y ? function(a, b) {
                    if (typeof b.getElementsByTagName !== n) return b.getElementsByTagName(a);
                } : function(a, b) {
                    var c = b.getElementsByTagName(a);
                    if ("*" === a) {
                        var d, e = [], f = 0;
                        for (;d = c[f]; f++) 1 === d.nodeType && e.push(d);
                        return e;
                    }
                    return c;
                },
                NAME: ba && function(a, b) {
                    if (typeof b.getElementsByName !== n) return b.getElementsByName(name);
                },
                CLASS: _ && function(a, b, c) {
                    if (typeof b.getElementsByClassName !== n && !c) return b.getElementsByClassName(a);
                }
            },
            relative: {
                ">": {
                    dir: "parentNode",
                    first: !0
                },
                " ": {
                    dir: "parentNode"
                },
                "+": {
                    dir: "previousSibling",
                    first: !0
                },
                "~": {
                    dir: "previousSibling"
                }
            },
            preFilter: {
                ATTR: function(a) {
                    return a[1] = a[1].replace(V, ""), a[3] = (a[4] || a[5] || "").replace(V, ""), "~=" === a[2] && (a[3] = " " + a[3] + " "), 
                    a.slice(0, 4);
                },
                CHILD: function(a) {
                    return a[1] = a[1].toLowerCase(), "nth" === a[1] ? (a[2] || bc.error(a[0]), a[3] = +(a[3] ? a[4] + (a[5] || 1) : 2 * ("even" === a[2] || "odd" === a[2])), 
                    a[4] = +(a[6] + a[7] || "odd" === a[2])) : a[2] && bc.error(a[0]), a;
                },
                PSEUDO: function(a) {
                    var b, c;
                    if (W.CHILD.test(a[0])) return null;
                    if (a[3]) a[2] = a[3]; else if (b = a[4]) O.test(b) && (c = bh(b, !0)) && (c = b.indexOf(")", b.length - c) - b.length) && (b = b.slice(0, c), 
                    a[0] = a[0].slice(0, c)), a[2] = b;
                    return a.slice(0, 3);
                }
            },
            filter: {
                ID: d ? function(a) {
                    return a = a.replace(V, ""), function(b) {
                        return b.getAttribute("id") === a;
                    };
                } : function(a) {
                    return a = a.replace(V, ""), function(b) {
                        var c = typeof b.getAttributeNode !== n && b.getAttributeNode("id");
                        return c && c.value === a;
                    };
                },
                TAG: function(a) {
                    return "*" === a ? function() {
                        return !0;
                    } : (a = a.replace(V, "").toLowerCase(), function(b) {
                        return b.nodeName && b.nodeName.toLowerCase() === a;
                    });
                },
                CLASS: function(a) {
                    var b = B[o][a];
                    return b || (b = B(a, new RegExp("(^|" + E + ")" + a + "(" + E + "|$)"))), function(a) {
                        return b.test(a.className || typeof a.getAttribute !== n && a.getAttribute("class") || "");
                    };
                },
                ATTR: function(a, b, c) {
                    return function(d, e) {
                        var f = bc.attr(d, a);
                        return null == f ? "!=" === b : b ? (f += "", "=" === b ? f === c : "!=" === b ? f !== c : "^=" === b ? c && 0 === f.indexOf(c) : "*=" === b ? c && f.indexOf(c) > -1 : "$=" === b ? c && f.substr(f.length - c.length) === c : "~=" === b ? (" " + f + " ").indexOf(c) > -1 : "|=" === b ? f === c || f.substr(0, c.length + 1) === c + "-" : !1) : !0;
                    };
                },
                CHILD: function(a, b, c, d) {
                    return "nth" === a ? function(a) {
                        var b, e, f = a.parentNode;
                        if (1 === c && 0 === d) return !0;
                        if (f) {
                            e = 0;
                            for (b = f.firstChild; b; b = b.nextSibling) if (1 === b.nodeType) {
                                e++;
                                if (a === b) break;
                            }
                        }
                        return e -= d, e === c || 0 === e % c && e / c >= 0;
                    } : function(b) {
                        var c = b;
                        switch (a) {
                          case "only":
                          case "first":
                            while (c = c.previousSibling) if (1 === c.nodeType) return !1;
                            if ("first" === a) return !0;
                            c = b;

                          case "last":
                            while (c = c.nextSibling) if (1 === c.nodeType) return !1;
                            return !0;
                        }
                    };
                },
                PSEUDO: function(a, b) {
                    var c, d = e.pseudos[a] || e.setFilters[a.toLowerCase()] || bc.error("unsupported pseudo: " + a);
                    return d[o] ? d(b) : d.length > 1 ? (c = [ a, a, "", b ], e.setFilters.hasOwnProperty(a.toLowerCase()) ? z(function(a, c) {
                        var e, f = d(a, b), g = f.length;
                        while (g--) e = y.call(a, f[g]), a[e] = !(c[e] = f[g]);
                    }) : function(a) {
                        return d(a, 0, c);
                    }) : d;
                }
            },
            pseudos: {
                not: z(function(a) {
                    var b = [], c = [], d = i(a.replace(L, "$1"));
                    return d[o] ? z(function(a, b, c, e) {
                        var f, g = d(a, null, e, []), h = a.length;
                        while (h--) if (f = g[h]) a[h] = !(b[h] = f);
                    }) : function(a, e, f) {
                        return b[0] = a, d(b, null, f, c), !c.pop();
                    };
                }),
                has: z(function(a) {
                    return function(b) {
                        return bc(a, b).length > 0;
                    };
                }),
                contains: z(function(a) {
                    return function(b) {
                        return (b.textContent || b.innerText || f(b)).indexOf(a) > -1;
                    };
                }),
                enabled: function(a) {
                    return a.disabled === !1;
                },
                disabled: function(a) {
                    return a.disabled === !0;
                },
                checked: function(a) {
                    var b = a.nodeName.toLowerCase();
                    return "input" === b && !!a.checked || "option" === b && !!a.selected;
                },
                selected: function(a) {
                    return a.parentNode && a.parentNode.selectedIndex, a.selected === !0;
                },
                parent: function(a) {
                    return !e.pseudos.empty(a);
                },
                empty: function(a) {
                    var b;
                    a = a.firstChild;
                    while (a) {
                        if (a.nodeName > "@" || 3 === (b = a.nodeType) || 4 === b) return !1;
                        a = a.nextSibling;
                    }
                    return !0;
                },
                header: function(a) {
                    return T.test(a.nodeName);
                },
                text: function(a) {
                    var b, c;
                    return "input" === a.nodeName.toLowerCase() && "text" === (b = a.type) && (null == (c = a.getAttribute("type")) || c.toLowerCase() === b);
                },
                radio: bd("radio"),
                checkbox: bd("checkbox"),
                file: bd("file"),
                password: bd("password"),
                image: bd("image"),
                submit: be("submit"),
                reset: be("reset"),
                button: function(a) {
                    var b = a.nodeName.toLowerCase();
                    return "input" === b && "button" === a.type || "button" === b;
                },
                input: function(a) {
                    return U.test(a.nodeName);
                },
                focus: function(a) {
                    var b = a.ownerDocument;
                    return a === b.activeElement && (!b.hasFocus || b.hasFocus()) && (!!a.type || !!a.href);
                },
                active: function(a) {
                    return a === a.ownerDocument.activeElement;
                },
                first: bf(function(a, b, c) {
                    return [ 0 ];
                }),
                last: bf(function(a, b, c) {
                    return [ b - 1 ];
                }),
                eq: bf(function(a, b, c) {
                    return [ c < 0 ? c + b : c ];
                }),
                even: bf(function(a, b, c) {
                    for (var d = 0; d < b; d += 2) a.push(d);
                    return a;
                }),
                odd: bf(function(a, b, c) {
                    for (var d = 1; d < b; d += 2) a.push(d);
                    return a;
                }),
                lt: bf(function(a, b, c) {
                    for (var d = c < 0 ? c + b : c; --d >= 0; ) a.push(d);
                    return a;
                }),
                gt: bf(function(a, b, c) {
                    for (var d = c < 0 ? c + b : c; ++d < b; ) a.push(d);
                    return a;
                })
            }
        }, j = s.compareDocumentPosition ? function(a, b) {
            return a === b ? (k = !0, 0) : (!a.compareDocumentPosition || !b.compareDocumentPosition ? a.compareDocumentPosition : 4 & a.compareDocumentPosition(b)) ? -1 : 1;
        } : function(a, b) {
            if (a === b) return k = !0, 0;
            if (a.sourceIndex && b.sourceIndex) return a.sourceIndex - b.sourceIndex;
            var c, d, e = [], f = [], g = a.parentNode, h = b.parentNode, i = g;
            if (g === h) return bg(a, b);
            if (!g) return -1;
            if (!h) return 1;
            while (i) e.unshift(i), i = i.parentNode;
            i = h;
            while (i) f.unshift(i), i = i.parentNode;
            c = e.length, d = f.length;
            for (var j = 0; j < c && j < d; j++) if (e[j] !== f[j]) return bg(e[j], f[j]);
            return j === c ? bg(a, f[j], -1) : bg(e[j], b, 1);
        }, [ 0, 0 ].sort(j), m = !k, bc.uniqueSort = function(a) {
            var b, c = 1;
            k = m, a.sort(j);
            if (k) for (;b = a[c]; c++) b === a[c - 1] && a.splice(c--, 1);
            return a;
        }, bc.error = function(a) {
            throw new Error("Syntax error, unrecognized expression: " + a);
        }, i = bc.compile = function(a, b) {
            var c, d = [], e = [], f = D[o][a];
            if (!f) {
                b || (b = bh(a)), c = b.length;
                while (c--) f = bm(b[c]), f[o] ? d.push(f) : e.push(f);
                f = D(a, bn(e, d));
            }
            return f;
        }, r.querySelectorAll && function() {
            var a, b = bp, c = /'|\\/g, d = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g, e = [ ":focus" ], f = [ ":active", ":focus" ], h = s.matchesSelector || s.mozMatchesSelector || s.webkitMatchesSelector || s.oMatchesSelector || s.msMatchesSelector;
            X(function(a) {
                a.innerHTML = "<select><option selected=''></option></select>", a.querySelectorAll("[selected]").length || e.push("\\[" + E + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)"), 
                a.querySelectorAll(":checked").length || e.push(":checked");
            }), X(function(a) {
                a.innerHTML = "<p test=''></p>", a.querySelectorAll("[test^='']").length && e.push("[*^$]=" + E + "*(?:\"\"|'')"), 
                a.innerHTML = "<input type='hidden'/>", a.querySelectorAll(":enabled").length || e.push(":enabled", ":disabled");
            }), e = new RegExp(e.join("|")), bp = function(a, d, f, g, h) {
                if (!g && !h && (!e || !e.test(a))) {
                    var i, j, k = !0, l = o, m = d, n = 9 === d.nodeType && a;
                    if (1 === d.nodeType && "object" !== d.nodeName.toLowerCase()) {
                        i = bh(a), (k = d.getAttribute("id")) ? l = k.replace(c, "\\$&") : d.setAttribute("id", l), 
                        l = "[id='" + l + "'] ", j = i.length;
                        while (j--) i[j] = l + i[j].join("");
                        m = R.test(a) && d.parentNode || d, n = i.join(",");
                    }
                    if (n) try {
                        return w.apply(f, x.call(m.querySelectorAll(n), 0)), f;
                    } catch (p) {} finally {
                        k || d.removeAttribute("id");
                    }
                }
                return b(a, d, f, g, h);
            }, h && (X(function(b) {
                a = h.call(b, "div");
                try {
                    h.call(b, "[test!='']:sizzle"), f.push("!=", J);
                } catch (c) {}
            }), f = new RegExp(f.join("|")), bc.matchesSelector = function(b, c) {
                c = c.replace(d, "='$1']");
                if (!g(b) && !f.test(c) && (!e || !e.test(c))) try {
                    var i = h.call(b, c);
                    if (i || a || b.document && 11 !== b.document.nodeType) return i;
                } catch (j) {}
                return bc(c, null, null, [ b ]).length > 0;
            });
        }(), e.pseudos.nth = e.pseudos.eq, e.filters = bq.prototype = e.pseudos, e.setFilters = new bq(), 
        bc.attr = p.attr, p.find = bc, p.expr = bc.selectors, p.expr[":"] = p.expr.pseudos, 
        p.unique = bc.uniqueSort, p.text = bc.getText, p.isXMLDoc = bc.isXML, p.contains = bc.contains;
    }(a);
    var bc = /Until$/, bd = /^(?:parents|prev(?:Until|All))/, be = /^.[^:#\[\.,]*$/, bf = p.expr.match.needsContext, bg = {
        children: !0,
        contents: !0,
        next: !0,
        prev: !0
    };
    p.fn.extend({
        find: function(a) {
            var b, c, d, e, f, g, h = this;
            if ("string" != typeof a) return p(a).filter(function() {
                for (b = 0, c = h.length; b < c; b++) if (p.contains(h[b], this)) return !0;
            });
            g = this.pushStack("", "find", a);
            for (b = 0, c = this.length; b < c; b++) {
                d = g.length, p.find(a, this[b], g);
                if (b > 0) for (e = d; e < g.length; e++) for (f = 0; f < d; f++) if (g[f] === g[e]) {
                    g.splice(e--, 1);
                    break;
                }
            }
            return g;
        },
        has: function(a) {
            var b, c = p(a, this), d = c.length;
            return this.filter(function() {
                for (b = 0; b < d; b++) if (p.contains(this, c[b])) return !0;
            });
        },
        not: function(a) {
            return this.pushStack(bj(this, a, !1), "not", a);
        },
        filter: function(a) {
            return this.pushStack(bj(this, a, !0), "filter", a);
        },
        is: function(a) {
            return !!a && ("string" == typeof a ? bf.test(a) ? p(a, this.context).index(this[0]) >= 0 : p.filter(a, this).length > 0 : this.filter(a).length > 0);
        },
        closest: function(a, b) {
            var c, d = 0, e = this.length, f = [], g = bf.test(a) || "string" != typeof a ? p(a, b || this.context) : 0;
            for (;d < e; d++) {
                c = this[d];
                while (c && c.ownerDocument && c !== b && 11 !== c.nodeType) {
                    if (g ? g.index(c) > -1 : p.find.matchesSelector(c, a)) {
                        f.push(c);
                        break;
                    }
                    c = c.parentNode;
                }
            }
            return f = f.length > 1 ? p.unique(f) : f, this.pushStack(f, "closest", a);
        },
        index: function(a) {
            return a ? "string" == typeof a ? p.inArray(this[0], p(a)) : p.inArray(a.jquery ? a[0] : a, this) : this[0] && this[0].parentNode ? this.prevAll().length : -1;
        },
        add: function(a, b) {
            var c = "string" == typeof a ? p(a, b) : p.makeArray(a && a.nodeType ? [ a ] : a), d = p.merge(this.get(), c);
            return this.pushStack(bh(c[0]) || bh(d[0]) ? d : p.unique(d));
        },
        addBack: function(a) {
            return this.add(null == a ? this.prevObject : this.prevObject.filter(a));
        }
    }), p.fn.andSelf = p.fn.addBack, p.each({
        parent: function(a) {
            var b = a.parentNode;
            return b && 11 !== b.nodeType ? b : null;
        },
        parents: function(a) {
            return p.dir(a, "parentNode");
        },
        parentsUntil: function(a, b, c) {
            return p.dir(a, "parentNode", c);
        },
        next: function(a) {
            return bi(a, "nextSibling");
        },
        prev: function(a) {
            return bi(a, "previousSibling");
        },
        nextAll: function(a) {
            return p.dir(a, "nextSibling");
        },
        prevAll: function(a) {
            return p.dir(a, "previousSibling");
        },
        nextUntil: function(a, b, c) {
            return p.dir(a, "nextSibling", c);
        },
        prevUntil: function(a, b, c) {
            return p.dir(a, "previousSibling", c);
        },
        siblings: function(a) {
            return p.sibling((a.parentNode || {}).firstChild, a);
        },
        children: function(a) {
            return p.sibling(a.firstChild);
        },
        contents: function(a) {
            return p.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : p.merge([], a.childNodes);
        }
    }, function(a, b) {
        p.fn[a] = function(c, d) {
            var e = p.map(this, b, c);
            return bc.test(a) || (d = c), d && "string" == typeof d && (e = p.filter(d, e)), 
            e = this.length > 1 && !bg[a] ? p.unique(e) : e, this.length > 1 && bd.test(a) && (e = e.reverse()), 
            this.pushStack(e, a, k.call(arguments).join(","));
        };
    }), p.extend({
        filter: function(a, b, c) {
            return c && (a = ":not(" + a + ")"), 1 === b.length ? p.find.matchesSelector(b[0], a) ? [ b[0] ] : [] : p.find.matches(a, b);
        },
        dir: function(a, c, d) {
            var e = [], f = a[c];
            while (f && 9 !== f.nodeType && (d === b || 1 !== f.nodeType || !p(f).is(d))) 1 === f.nodeType && e.push(f), 
            f = f[c];
            return e;
        },
        sibling: function(a, b) {
            var c = [];
            for (;a; a = a.nextSibling) 1 === a.nodeType && a !== b && c.push(a);
            return c;
        }
    });
    var bl = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video", bm = / jQuery\d+="(?:null|\d+)"/g, bn = /^\s+/, bo = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, bp = /<([\w:]+)/, bq = /<tbody/i, br = /<|&#?\w+;/, bs = /<(?:script|style|link)/i, bt = /<(?:script|object|embed|option|style)/i, bu = new RegExp("<(?:" + bl + ")[\\s/>]", "i"), bv = /^(?:checkbox|radio)$/, bw = /checked\s*(?:[^=]|=\s*.checked.)/i, bx = /\/(java|ecma)script/i, by = /^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g, bz = {
        option: [ 1, "<select multiple='multiple'>", "</select>" ],
        legend: [ 1, "<fieldset>", "</fieldset>" ],
        thead: [ 1, "<table>", "</table>" ],
        tr: [ 2, "<table><tbody>", "</tbody></table>" ],
        td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
        col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
        area: [ 1, "<map>", "</map>" ],
        _default: [ 0, "", "" ]
    }, bA = bk(e), bB = bA.appendChild(e.createElement("div"));
    bz.optgroup = bz.option, bz.tbody = bz.tfoot = bz.colgroup = bz.caption = bz.thead, 
    bz.th = bz.td, p.support.htmlSerialize || (bz._default = [ 1, "X<div>", "</div>" ]), 
    p.fn.extend({
        text: function(a) {
            return p.access(this, function(a) {
                return a === b ? p.text(this) : this.empty().append((this[0] && this[0].ownerDocument || e).createTextNode(a));
            }, null, a, arguments.length);
        },
        wrapAll: function(a) {
            if (p.isFunction(a)) return this.each(function(b) {
                p(this).wrapAll(a.call(this, b));
            });
            if (this[0]) {
                var b = p(a, this[0].ownerDocument).eq(0).clone(!0);
                this[0].parentNode && b.insertBefore(this[0]), b.map(function() {
                    var a = this;
                    while (a.firstChild && 1 === a.firstChild.nodeType) a = a.firstChild;
                    return a;
                }).append(this);
            }
            return this;
        },
        wrapInner: function(a) {
            return p.isFunction(a) ? this.each(function(b) {
                p(this).wrapInner(a.call(this, b));
            }) : this.each(function() {
                var b = p(this), c = b.contents();
                c.length ? c.wrapAll(a) : b.append(a);
            });
        },
        wrap: function(a) {
            var b = p.isFunction(a);
            return this.each(function(c) {
                p(this).wrapAll(b ? a.call(this, c) : a);
            });
        },
        unwrap: function() {
            return this.parent().each(function() {
                p.nodeName(this, "body") || p(this).replaceWith(this.childNodes);
            }).end();
        },
        append: function() {
            return this.domManip(arguments, !0, function(a) {
                (1 === this.nodeType || 11 === this.nodeType) && this.appendChild(a);
            });
        },
        prepend: function() {
            return this.domManip(arguments, !0, function(a) {
                (1 === this.nodeType || 11 === this.nodeType) && this.insertBefore(a, this.firstChild);
            });
        },
        before: function() {
            if (!bh(this[0])) return this.domManip(arguments, !1, function(a) {
                this.parentNode.insertBefore(a, this);
            });
            if (arguments.length) {
                var a = p.clean(arguments);
                return this.pushStack(p.merge(a, this), "before", this.selector);
            }
        },
        after: function() {
            if (!bh(this[0])) return this.domManip(arguments, !1, function(a) {
                this.parentNode.insertBefore(a, this.nextSibling);
            });
            if (arguments.length) {
                var a = p.clean(arguments);
                return this.pushStack(p.merge(this, a), "after", this.selector);
            }
        },
        remove: function(a, b) {
            var c, d = 0;
            for (;null != (c = this[d]); d++) if (!a || p.filter(a, [ c ]).length) !b && 1 === c.nodeType && (p.cleanData(c.getElementsByTagName("*")), 
            p.cleanData([ c ])), c.parentNode && c.parentNode.removeChild(c);
            return this;
        },
        empty: function() {
            var a, b = 0;
            for (;null != (a = this[b]); b++) {
                1 === a.nodeType && p.cleanData(a.getElementsByTagName("*"));
                while (a.firstChild) a.removeChild(a.firstChild);
            }
            return this;
        },
        clone: function(a, b) {
            return a = null == a ? !1 : a, b = null == b ? a : b, this.map(function() {
                return p.clone(this, a, b);
            });
        },
        html: function(a) {
            return p.access(this, function(a) {
                var c = this[0] || {}, d = 0, e = this.length;
                if (a === b) return 1 === c.nodeType ? c.innerHTML.replace(bm, "") : b;
                if ("string" == typeof a && !bs.test(a) && (p.support.htmlSerialize || !bu.test(a)) && (p.support.leadingWhitespace || !bn.test(a)) && !bz[(bp.exec(a) || [ "", "" ])[1].toLowerCase()]) {
                    a = a.replace(bo, "<$1></$2>");
                    try {
                        for (;d < e; d++) c = this[d] || {}, 1 === c.nodeType && (p.cleanData(c.getElementsByTagName("*")), 
                        c.innerHTML = a);
                        c = 0;
                    } catch (f) {}
                }
                c && this.empty().append(a);
            }, null, a, arguments.length);
        },
        replaceWith: function(a) {
            return bh(this[0]) ? this.length ? this.pushStack(p(p.isFunction(a) ? a() : a), "replaceWith", a) : this : p.isFunction(a) ? this.each(function(b) {
                var c = p(this), d = c.html();
                c.replaceWith(a.call(this, b, d));
            }) : ("string" != typeof a && (a = p(a).detach()), this.each(function() {
                var b = this.nextSibling, c = this.parentNode;
                p(this).remove(), b ? p(b).before(a) : p(c).append(a);
            }));
        },
        detach: function(a) {
            return this.remove(a, !0);
        },
        domManip: function(a, c, d) {
            a = [].concat.apply([], a);
            var e, f, g, h, i = 0, j = a[0], k = [], l = this.length;
            if (!p.support.checkClone && l > 1 && "string" == typeof j && bw.test(j)) return this.each(function() {
                p(this).domManip(a, c, d);
            });
            if (p.isFunction(j)) return this.each(function(e) {
                var f = p(this);
                a[0] = j.call(this, e, c ? f.html() : b), f.domManip(a, c, d);
            });
            if (this[0]) {
                e = p.buildFragment(a, this, k), g = e.fragment, f = g.firstChild, 1 === g.childNodes.length && (g = f);
                if (f) {
                    c = c && p.nodeName(f, "tr");
                    for (h = e.cacheable || l - 1; i < l; i++) d.call(c && p.nodeName(this[i], "table") ? bC(this[i], "tbody") : this[i], i === h ? g : p.clone(g, !0, !0));
                }
                g = f = null, k.length && p.each(k, function(a, b) {
                    b.src ? p.ajax ? p.ajax({
                        url: b.src,
                        type: "GET",
                        dataType: "script",
                        async: !1,
                        global: !1,
                        "throws": !0
                    }) : p.error("no ajax") : p.globalEval((b.text || b.textContent || b.innerHTML || "").replace(by, "")), 
                    b.parentNode && b.parentNode.removeChild(b);
                });
            }
            return this;
        }
    }), p.buildFragment = function(a, c, d) {
        var f, g, h, i = a[0];
        return c = c || e, c = !c.nodeType && c[0] || c, c = c.ownerDocument || c, 1 === a.length && "string" == typeof i && i.length < 512 && c === e && "<" === i.charAt(0) && !bt.test(i) && (p.support.checkClone || !bw.test(i)) && (p.support.html5Clone || !bu.test(i)) && (g = !0, 
        f = p.fragments[i], h = f !== b), f || (f = c.createDocumentFragment(), p.clean(a, c, f, d), 
        g && (p.fragments[i] = h && f)), {
            fragment: f,
            cacheable: g
        };
    }, p.fragments = {}, p.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function(a, b) {
        p.fn[a] = function(c) {
            var d, e = 0, f = [], g = p(c), h = g.length, i = 1 === this.length && this[0].parentNode;
            if ((null == i || i && 11 === i.nodeType && 1 === i.childNodes.length) && 1 === h) return g[b](this[0]), 
            this;
            for (;e < h; e++) d = (e > 0 ? this.clone(!0) : this).get(), p(g[e])[b](d), f = f.concat(d);
            return this.pushStack(f, a, g.selector);
        };
    }), p.extend({
        clone: function(a, b, c) {
            var d, e, f, g;
            p.support.html5Clone || p.isXMLDoc(a) || !bu.test("<" + a.nodeName + ">") ? g = a.cloneNode(!0) : (bB.innerHTML = a.outerHTML, 
            bB.removeChild(g = bB.firstChild));
            if ((!p.support.noCloneEvent || !p.support.noCloneChecked) && (1 === a.nodeType || 11 === a.nodeType) && !p.isXMLDoc(a)) {
                bE(a, g), d = bF(a), e = bF(g);
                for (f = 0; d[f]; ++f) e[f] && bE(d[f], e[f]);
            }
            if (b) {
                bD(a, g);
                if (c) {
                    d = bF(a), e = bF(g);
                    for (f = 0; d[f]; ++f) bD(d[f], e[f]);
                }
            }
            return d = e = null, g;
        },
        clean: function(a, b, c, d) {
            var f, g, h, i, j, k, l, m, n, o, q, r, s = b === e && bA, t = [];
            if (!b || "undefined" == typeof b.createDocumentFragment) b = e;
            for (f = 0; null != (h = a[f]); f++) {
                "number" == typeof h && (h += "");
                if (!h) continue;
                if ("string" == typeof h) if (!br.test(h)) h = b.createTextNode(h); else {
                    s = s || bk(b), l = b.createElement("div"), s.appendChild(l), h = h.replace(bo, "<$1></$2>"), 
                    i = (bp.exec(h) || [ "", "" ])[1].toLowerCase(), j = bz[i] || bz._default, k = j[0], 
                    l.innerHTML = j[1] + h + j[2];
                    while (k--) l = l.lastChild;
                    if (!p.support.tbody) {
                        m = bq.test(h), n = "table" === i && !m ? l.firstChild && l.firstChild.childNodes : "<table>" === j[1] && !m ? l.childNodes : [];
                        for (g = n.length - 1; g >= 0; --g) p.nodeName(n[g], "tbody") && !n[g].childNodes.length && n[g].parentNode.removeChild(n[g]);
                    }
                    !p.support.leadingWhitespace && bn.test(h) && l.insertBefore(b.createTextNode(bn.exec(h)[0]), l.firstChild), 
                    h = l.childNodes, l.parentNode.removeChild(l);
                }
                h.nodeType ? t.push(h) : p.merge(t, h);
            }
            l && (h = l = s = null);
            if (!p.support.appendChecked) for (f = 0; null != (h = t[f]); f++) p.nodeName(h, "input") ? bG(h) : "undefined" != typeof h.getElementsByTagName && p.grep(h.getElementsByTagName("input"), bG);
            if (c) {
                q = function(a) {
                    if (!a.type || bx.test(a.type)) return d ? d.push(a.parentNode ? a.parentNode.removeChild(a) : a) : c.appendChild(a);
                };
                for (f = 0; null != (h = t[f]); f++) if (!p.nodeName(h, "script") || !q(h)) c.appendChild(h), 
                "undefined" != typeof h.getElementsByTagName && (r = p.grep(p.merge([], h.getElementsByTagName("script")), q), 
                t.splice.apply(t, [ f + 1, 0 ].concat(r)), f += r.length);
            }
            return t;
        },
        cleanData: function(a, b) {
            var c, d, e, f, g = 0, h = p.expando, i = p.cache, j = p.support.deleteExpando, k = p.event.special;
            for (;null != (e = a[g]); g++) if (b || p.acceptData(e)) {
                d = e[h], c = d && i[d];
                if (c) {
                    if (c.events) for (f in c.events) k[f] ? p.event.remove(e, f) : p.removeEvent(e, f, c.handle);
                    i[d] && (delete i[d], j ? delete e[h] : e.removeAttribute ? e.removeAttribute(h) : e[h] = null, 
                    p.deletedIds.push(d));
                }
            }
        }
    }), function() {
        var a, b;
        p.uaMatch = function(a) {
            a = a.toLowerCase();
            var b = /(chrome)[ \/]([\w.]+)/.exec(a) || /(webkit)[ \/]([\w.]+)/.exec(a) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(a) || /(msie) ([\w.]+)/.exec(a) || a.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(a) || [];
            return {
                browser: b[1] || "",
                version: b[2] || "0"
            };
        }, a = p.uaMatch(g.userAgent), b = {}, a.browser && (b[a.browser] = !0, b.version = a.version), 
        b.chrome ? b.webkit = !0 : b.webkit && (b.safari = !0), p.browser = b, p.sub = function() {
            function a(b, c) {
                return new a.fn.init(b, c);
            }
            p.extend(!0, a, this), a.superclass = this, a.fn = a.prototype = this(), a.fn.constructor = a, 
            a.sub = this.sub, a.fn.init = function c(c, d) {
                return d && d instanceof p && !(d instanceof a) && (d = a(d)), p.fn.init.call(this, c, d, b);
            }, a.fn.init.prototype = a.fn;
            var b = a(e);
            return a;
        };
    }();
    var bH, bI, bJ, bK = /alpha\([^)]*\)/i, bL = /opacity=([^)]*)/, bM = /^(top|right|bottom|left)$/, bN = /^(none|table(?!-c[ea]).+)/, bO = /^margin/, bP = new RegExp("^(" + q + ")(.*)$", "i"), bQ = new RegExp("^(" + q + ")(?!px)[a-z%]+$", "i"), bR = new RegExp("^([-+])=(" + q + ")", "i"), bS = {}, bT = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }, bU = {
        letterSpacing: 0,
        fontWeight: 400
    }, bV = [ "Top", "Right", "Bottom", "Left" ], bW = [ "Webkit", "O", "Moz", "ms" ], bX = p.fn.toggle;
    p.fn.extend({
        css: function(a, c) {
            return p.access(this, function(a, c, d) {
                return d !== b ? p.style(a, c, d) : p.css(a, c);
            }, a, c, arguments.length > 1);
        },
        show: function() {
            return b$(this, !0);
        },
        hide: function() {
            return b$(this);
        },
        toggle: function(a, b) {
            var c = "boolean" == typeof a;
            return p.isFunction(a) && p.isFunction(b) ? bX.apply(this, arguments) : this.each(function() {
                (c ? a : bZ(this)) ? p(this).show() : p(this).hide();
            });
        }
    }), p.extend({
        cssHooks: {
            opacity: {
                get: function(a, b) {
                    if (b) {
                        var c = bH(a, "opacity");
                        return "" === c ? "1" : c;
                    }
                }
            }
        },
        cssNumber: {
            fillOpacity: !0,
            fontWeight: !0,
            lineHeight: !0,
            opacity: !0,
            orphans: !0,
            widows: !0,
            zIndex: !0,
            zoom: !0
        },
        cssProps: {
            "float": p.support.cssFloat ? "cssFloat" : "styleFloat"
        },
        style: function(a, c, d, e) {
            if (!a || 3 === a.nodeType || 8 === a.nodeType || !a.style) return;
            var f, g, h, i = p.camelCase(c), j = a.style;
            c = p.cssProps[i] || (p.cssProps[i] = bY(j, i)), h = p.cssHooks[c] || p.cssHooks[i];
            if (d === b) return h && "get" in h && (f = h.get(a, !1, e)) !== b ? f : j[c];
            g = typeof d, "string" === g && (f = bR.exec(d)) && (d = (f[1] + 1) * f[2] + parseFloat(p.css(a, c)), 
            g = "number");
            if (null == d || "number" === g && isNaN(d)) return;
            "number" === g && !p.cssNumber[i] && (d += "px");
            if (!h || !("set" in h) || (d = h.set(a, d, e)) !== b) try {
                j[c] = d;
            } catch (k) {}
        },
        css: function(a, c, d, e) {
            var f, g, h, i = p.camelCase(c);
            return c = p.cssProps[i] || (p.cssProps[i] = bY(a.style, i)), h = p.cssHooks[c] || p.cssHooks[i], 
            h && "get" in h && (f = h.get(a, !0, e)), f === b && (f = bH(a, c)), "normal" === f && c in bU && (f = bU[c]), 
            d || e !== b ? (g = parseFloat(f), d || p.isNumeric(g) ? g || 0 : f) : f;
        },
        swap: function(a, b, c) {
            var d, e, f = {};
            for (e in b) f[e] = a.style[e], a.style[e] = b[e];
            d = c.call(a);
            for (e in b) a.style[e] = f[e];
            return d;
        }
    }), a.getComputedStyle ? bH = function(b, c) {
        var d, e, f, g, h = a.getComputedStyle(b, null), i = b.style;
        return h && (d = h[c], "" === d && !p.contains(b.ownerDocument, b) && (d = p.style(b, c)), 
        bQ.test(d) && bO.test(c) && (e = i.width, f = i.minWidth, g = i.maxWidth, i.minWidth = i.maxWidth = i.width = d, 
        d = h.width, i.width = e, i.minWidth = f, i.maxWidth = g)), d;
    } : e.documentElement.currentStyle && (bH = function(a, b) {
        var c, d, e = a.currentStyle && a.currentStyle[b], f = a.style;
        return null == e && f && f[b] && (e = f[b]), bQ.test(e) && !bM.test(b) && (c = f.left, 
        d = a.runtimeStyle && a.runtimeStyle.left, d && (a.runtimeStyle.left = a.currentStyle.left), 
        f.left = "fontSize" === b ? "1em" : e, e = f.pixelLeft + "px", f.left = c, d && (a.runtimeStyle.left = d)), 
        "" === e ? "auto" : e;
    }), p.each([ "height", "width" ], function(a, b) {
        p.cssHooks[b] = {
            get: function(a, c, d) {
                if (c) return 0 === a.offsetWidth && bN.test(bH(a, "display")) ? p.swap(a, bT, function() {
                    return cb(a, b, d);
                }) : cb(a, b, d);
            },
            set: function(a, c, d) {
                return b_(a, c, d ? ca(a, b, d, p.support.boxSizing && "border-box" === p.css(a, "boxSizing")) : 0);
            }
        };
    }), p.support.opacity || (p.cssHooks.opacity = {
        get: function(a, b) {
            return bL.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? .01 * parseFloat(RegExp.$1) + "" : b ? "1" : "";
        },
        set: function(a, b) {
            var c = a.style, d = a.currentStyle, e = p.isNumeric(b) ? "alpha(opacity=" + 100 * b + ")" : "", f = d && d.filter || c.filter || "";
            c.zoom = 1;
            if (b >= 1 && "" === p.trim(f.replace(bK, "")) && c.removeAttribute) {
                c.removeAttribute("filter");
                if (d && !d.filter) return;
            }
            c.filter = bK.test(f) ? f.replace(bK, e) : f + " " + e;
        }
    }), p(function() {
        p.support.reliableMarginRight || (p.cssHooks.marginRight = {
            get: function(a, b) {
                return p.swap(a, {
                    display: "inline-block"
                }, function() {
                    if (b) return bH(a, "marginRight");
                });
            }
        }), !p.support.pixelPosition && p.fn.position && p.each([ "top", "left" ], function(a, b) {
            p.cssHooks[b] = {
                get: function(a, c) {
                    if (c) {
                        var d = bH(a, b);
                        return bQ.test(d) ? p(a).position()[b] + "px" : d;
                    }
                }
            };
        });
    }), p.expr && p.expr.filters && (p.expr.filters.hidden = function(a) {
        return 0 === a.offsetWidth && 0 === a.offsetHeight || !p.support.reliableHiddenOffsets && "none" === (a.style && a.style.display || bH(a, "display"));
    }, p.expr.filters.visible = function(a) {
        return !p.expr.filters.hidden(a);
    }), p.each({
        margin: "",
        padding: "",
        border: "Width"
    }, function(a, b) {
        p.cssHooks[a + b] = {
            expand: function(c) {
                var d, e = "string" == typeof c ? c.split(" ") : [ c ], f = {};
                for (d = 0; d < 4; d++) f[a + bV[d] + b] = e[d] || e[d - 2] || e[0];
                return f;
            }
        }, bO.test(a) || (p.cssHooks[a + b].set = b_);
    });
    var cd = /%20/g, ce = /\[\]$/, cf = /\r?\n/g, cg = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i, ch = /^(?:select|textarea)/i;
    p.fn.extend({
        serialize: function() {
            return p.param(this.serializeArray());
        },
        serializeArray: function() {
            return this.map(function() {
                return this.elements ? p.makeArray(this.elements) : this;
            }).filter(function() {
                return this.name && !this.disabled && (this.checked || ch.test(this.nodeName) || cg.test(this.type));
            }).map(function(a, b) {
                var c = p(this).val();
                return null == c ? null : p.isArray(c) ? p.map(c, function(a, c) {
                    return {
                        name: b.name,
                        value: a.replace(cf, "\r\n")
                    };
                }) : {
                    name: b.name,
                    value: c.replace(cf, "\r\n")
                };
            }).get();
        }
    }), p.param = function(a, c) {
        var d, e = [], f = function(a, b) {
            b = p.isFunction(b) ? b() : null == b ? "" : b, e[e.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b);
        };
        c === b && (c = p.ajaxSettings && p.ajaxSettings.traditional);
        if (p.isArray(a) || a.jquery && !p.isPlainObject(a)) p.each(a, function() {
            f(this.name, this.value);
        }); else for (d in a) ci(d, a[d], c, f);
        return e.join("&").replace(cd, "+");
    };
    var cj, ck, cl = /#.*$/, cm = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm, cn = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/, co = /^(?:GET|HEAD)$/, cp = /^\/\//, cq = /\?/, cr = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, cs = /([?&])_=[^&]*/, ct = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/, cu = p.fn.load, cv = {}, cw = {}, cx = [ "*/" ] + [ "*" ];
    try {
        ck = f.href;
    } catch (cy) {
        ck = e.createElement("a"), ck.href = "", ck = ck.href;
    }
    cj = ct.exec(ck.toLowerCase()) || [], p.fn.load = function(a, c, d) {
        if ("string" != typeof a && cu) return cu.apply(this, arguments);
        if (!this.length) return this;
        var e, f, g, h = this, i = a.indexOf(" ");
        return i >= 0 && (e = a.slice(i, a.length), a = a.slice(0, i)), p.isFunction(c) ? (d = c, 
        c = b) : c && "object" == typeof c && (f = "POST"), p.ajax({
            url: a,
            type: f,
            dataType: "html",
            data: c,
            complete: function(a, b) {
                d && h.each(d, g || [ a.responseText, b, a ]);
            }
        }).done(function(a) {
            g = arguments, h.html(e ? p("<div>").append(a.replace(cr, "")).find(e) : a);
        }), this;
    }, p.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function(a, b) {
        p.fn[b] = function(a) {
            return this.on(b, a);
        };
    }), p.each([ "get", "post" ], function(a, c) {
        p[c] = function(a, d, e, f) {
            return p.isFunction(d) && (f = f || e, e = d, d = b), p.ajax({
                type: c,
                url: a,
                data: d,
                success: e,
                dataType: f
            });
        };
    }), p.extend({
        getScript: function(a, c) {
            return p.get(a, b, c, "script");
        },
        getJSON: function(a, b, c) {
            return p.get(a, b, c, "json");
        },
        ajaxSetup: function(a, b) {
            return b ? cB(a, p.ajaxSettings) : (b = a, a = p.ajaxSettings), cB(a, b), a;
        },
        ajaxSettings: {
            url: ck,
            isLocal: cn.test(cj[1]),
            global: !0,
            type: "GET",
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            processData: !0,
            async: !0,
            accepts: {
                xml: "application/xml, text/xml",
                html: "text/html",
                text: "text/plain",
                json: "application/json, text/javascript",
                "*": cx
            },
            contents: {
                xml: /xml/,
                html: /html/,
                json: /json/
            },
            responseFields: {
                xml: "responseXML",
                text: "responseText"
            },
            converters: {
                "* text": a.String,
                "text html": !0,
                "text json": p.parseJSON,
                "text xml": p.parseXML
            },
            flatOptions: {
                context: !0,
                url: !0
            }
        },
        ajaxPrefilter: cz(cv),
        ajaxTransport: cz(cw),
        ajax: function(a, c) {
            function y(a, c, f, i) {
                var k, s, t, u, w, y = c;
                if (2 === v) return;
                v = 2, h && clearTimeout(h), g = b, e = i || "", x.readyState = a > 0 ? 4 : 0, f && (u = cC(l, x, f));
                if (a >= 200 && a < 300 || 304 === a) l.ifModified && (w = x.getResponseHeader("Last-Modified"), 
                w && (p.lastModified[d] = w), w = x.getResponseHeader("Etag"), w && (p.etag[d] = w)), 
                304 === a ? (y = "notmodified", k = !0) : (k = cD(l, u), y = k.state, s = k.data, 
                t = k.error, k = !t); else {
                    t = y;
                    if (!y || a) y = "error", a < 0 && (a = 0);
                }
                x.status = a, x.statusText = (c || y) + "", k ? o.resolveWith(m, [ s, y, x ]) : o.rejectWith(m, [ x, y, t ]), 
                x.statusCode(r), r = b, j && n.trigger("ajax" + (k ? "Success" : "Error"), [ x, l, k ? s : t ]), 
                q.fireWith(m, [ x, y ]), j && (n.trigger("ajaxComplete", [ x, l ]), --p.active || p.event.trigger("ajaxStop"));
            }
            "object" == typeof a && (c = a, a = b), c = c || {};
            var d, e, f, g, h, i, j, k, l = p.ajaxSetup({}, c), m = l.context || l, n = m !== l && (m.nodeType || m instanceof p) ? p(m) : p.event, o = p.Deferred(), q = p.Callbacks("once memory"), r = l.statusCode || {}, t = {}, u = {}, v = 0, w = "canceled", x = {
                readyState: 0,
                setRequestHeader: function(a, b) {
                    if (!v) {
                        var c = a.toLowerCase();
                        a = u[c] = u[c] || a, t[a] = b;
                    }
                    return this;
                },
                getAllResponseHeaders: function() {
                    return 2 === v ? e : null;
                },
                getResponseHeader: function(a) {
                    var c;
                    if (2 === v) {
                        if (!f) {
                            f = {};
                            while (c = cm.exec(e)) f[c[1].toLowerCase()] = c[2];
                        }
                        c = f[a.toLowerCase()];
                    }
                    return c === b ? null : c;
                },
                overrideMimeType: function(a) {
                    return v || (l.mimeType = a), this;
                },
                abort: function(a) {
                    return a = a || w, g && g.abort(a), y(0, a), this;
                }
            };
            o.promise(x), x.success = x.done, x.error = x.fail, x.complete = q.add, x.statusCode = function(a) {
                if (a) {
                    var b;
                    if (v < 2) for (b in a) r[b] = [ r[b], a[b] ]; else b = a[x.status], x.always(b);
                }
                return this;
            }, l.url = ((a || l.url) + "").replace(cl, "").replace(cp, cj[1] + "//"), l.dataTypes = p.trim(l.dataType || "*").toLowerCase().split(s), 
            null == l.crossDomain && (i = ct.exec(l.url.toLowerCase()) || !1, l.crossDomain = i && i.join(":") + (i[3] ? "" : "http:" === i[1] ? 80 : 443) !== cj.join(":") + (cj[3] ? "" : "http:" === cj[1] ? 80 : 443)), 
            l.data && l.processData && "string" != typeof l.data && (l.data = p.param(l.data, l.traditional)), 
            cA(cv, l, c, x);
            if (2 === v) return x;
            j = l.global, l.type = l.type.toUpperCase(), l.hasContent = !co.test(l.type), j && 0 === p.active++ && p.event.trigger("ajaxStart");
            if (!l.hasContent) {
                l.data && (l.url += (cq.test(l.url) ? "&" : "?") + l.data, delete l.data), d = l.url;
                if (l.cache === !1) {
                    var z = p.now(), A = l.url.replace(cs, "$1_=" + z);
                    l.url = A + (A === l.url ? (cq.test(l.url) ? "&" : "?") + "_=" + z : "");
                }
            }
            (l.data && l.hasContent && l.contentType !== !1 || c.contentType) && x.setRequestHeader("Content-Type", l.contentType), 
            l.ifModified && (d = d || l.url, p.lastModified[d] && x.setRequestHeader("If-Modified-Since", p.lastModified[d]), 
            p.etag[d] && x.setRequestHeader("If-None-Match", p.etag[d])), x.setRequestHeader("Accept", l.dataTypes[0] && l.accepts[l.dataTypes[0]] ? l.accepts[l.dataTypes[0]] + ("*" !== l.dataTypes[0] ? ", " + cx + "; q=0.01" : "") : l.accepts["*"]);
            for (k in l.headers) x.setRequestHeader(k, l.headers[k]);
            if (!l.beforeSend || l.beforeSend.call(m, x, l) !== !1 && 2 !== v) {
                w = "abort";
                for (k in {
                    success: 1,
                    error: 1,
                    complete: 1
                }) x[k](l[k]);
                g = cA(cw, l, c, x);
                if (!g) y(-1, "No Transport"); else {
                    x.readyState = 1, j && n.trigger("ajaxSend", [ x, l ]), l.async && l.timeout > 0 && (h = setTimeout(function() {
                        x.abort("timeout");
                    }, l.timeout));
                    try {
                        v = 1, g.send(t, y);
                    } catch (B) {
                        if (v < 2) y(-1, B); else throw B;
                    }
                }
                return x;
            }
            return x.abort();
        },
        active: 0,
        lastModified: {},
        etag: {}
    });
    var cE = [], cF = /\?/, cG = /(=)\?(?=&|$)|\?\?/, cH = p.now();
    p.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
            var a = cE.pop() || p.expando + "_" + cH++;
            return this[a] = !0, a;
        }
    }), p.ajaxPrefilter("json jsonp", function(c, d, e) {
        var f, g, h, i = c.data, j = c.url, k = c.jsonp !== !1, l = k && cG.test(j), m = k && !l && "string" == typeof i && !(c.contentType || "").indexOf("application/x-www-form-urlencoded") && cG.test(i);
        if ("jsonp" === c.dataTypes[0] || l || m) return f = c.jsonpCallback = p.isFunction(c.jsonpCallback) ? c.jsonpCallback() : c.jsonpCallback, 
        g = a[f], l ? c.url = j.replace(cG, "$1" + f) : m ? c.data = i.replace(cG, "$1" + f) : k && (c.url += (cF.test(j) ? "&" : "?") + c.jsonp + "=" + f), 
        c.converters["script json"] = function() {
            return h || p.error(f + " was not called"), h[0];
        }, c.dataTypes[0] = "json", a[f] = function() {
            h = arguments;
        }, e.always(function() {
            a[f] = g, c[f] && (c.jsonpCallback = d.jsonpCallback, cE.push(f)), h && p.isFunction(g) && g(h[0]), 
            h = g = b;
        }), "script";
    }), p.ajaxSetup({
        accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
            script: /javascript|ecmascript/
        },
        converters: {
            "text script": function(a) {
                return p.globalEval(a), a;
            }
        }
    }), p.ajaxPrefilter("script", function(a) {
        a.cache === b && (a.cache = !1), a.crossDomain && (a.type = "GET", a.global = !1);
    }), p.ajaxTransport("script", function(a) {
        if (a.crossDomain) {
            var c, d = e.head || e.getElementsByTagName("head")[0] || e.documentElement;
            return {
                send: function(f, g) {
                    c = e.createElement("script"), c.async = "async", a.scriptCharset && (c.charset = a.scriptCharset), 
                    c.src = a.url, c.onload = c.onreadystatechange = function(a, e) {
                        if (e || !c.readyState || /loaded|complete/.test(c.readyState)) c.onload = c.onreadystatechange = null, 
                        d && c.parentNode && d.removeChild(c), c = b, e || g(200, "success");
                    }, d.insertBefore(c, d.firstChild);
                },
                abort: function() {
                    c && c.onload(0, 1);
                }
            };
        }
    });
    var cI, cJ = a.ActiveXObject ? function() {
        for (var a in cI) cI[a](0, 1);
    } : !1, cK = 0;
    p.ajaxSettings.xhr = a.ActiveXObject ? function() {
        return !this.isLocal && cL() || cM();
    } : cL, function(a) {
        p.extend(p.support, {
            ajax: !!a,
            cors: !!a && "withCredentials" in a
        });
    }(p.ajaxSettings.xhr()), p.support.ajax && p.ajaxTransport(function(c) {
        if (!c.crossDomain || p.support.cors) {
            var d;
            return {
                send: function(e, f) {
                    var g, h, i = c.xhr();
                    c.username ? i.open(c.type, c.url, c.async, c.username, c.password) : i.open(c.type, c.url, c.async);
                    if (c.xhrFields) for (h in c.xhrFields) i[h] = c.xhrFields[h];
                    c.mimeType && i.overrideMimeType && i.overrideMimeType(c.mimeType), !c.crossDomain && !e["X-Requested-With"] && (e["X-Requested-With"] = "XMLHttpRequest");
                    try {
                        for (h in e) i.setRequestHeader(h, e[h]);
                    } catch (j) {}
                    i.send(c.hasContent && c.data || null), d = function(a, e) {
                        var h, j, k, l, m;
                        try {
                            if (d && (e || 4 === i.readyState)) {
                                d = b, g && (i.onreadystatechange = p.noop, cJ && delete cI[g]);
                                if (e) 4 !== i.readyState && i.abort(); else {
                                    h = i.status, k = i.getAllResponseHeaders(), l = {}, m = i.responseXML, m && m.documentElement && (l.xml = m);
                                    try {
                                        l.text = i.responseText;
                                    } catch (a) {}
                                    try {
                                        j = i.statusText;
                                    } catch (n) {
                                        j = "";
                                    }
                                    !h && c.isLocal && !c.crossDomain ? h = l.text ? 200 : 404 : 1223 === h && (h = 204);
                                }
                            }
                        } catch (o) {
                            e || f(-1, o);
                        }
                        l && f(h, j, l, k);
                    }, c.async ? 4 === i.readyState ? setTimeout(d, 0) : (g = ++cK, cJ && (cI || (cI = {}, 
                    p(a).unload(cJ)), cI[g] = d), i.onreadystatechange = d) : d();
                },
                abort: function() {
                    d && d(0, 1);
                }
            };
        }
    });
    var cN, cO, cP = /^(?:toggle|show|hide)$/, cQ = new RegExp("^(?:([-+])=|)(" + q + ")([a-z%]*)$", "i"), cR = /queueHooks$/, cS = [ cY ], cT = {
        "*": [ function(a, b) {
            var c, d, e = this.createTween(a, b), f = cQ.exec(b), g = e.cur(), h = +g || 0, i = 1, j = 20;
            if (f) {
                c = +f[2], d = f[3] || (p.cssNumber[a] ? "" : "px");
                if ("px" !== d && h) {
                    h = p.css(e.elem, a, !0) || c || 1;
                    do i = i || ".5", h /= i, p.style(e.elem, a, h + d); while (i !== (i = e.cur() / g) && 1 !== i && --j);
                }
                e.unit = d, e.start = h, e.end = f[1] ? h + (f[1] + 1) * c : c;
            }
            return e;
        } ]
    };
    p.Animation = p.extend(cW, {
        tweener: function(a, b) {
            p.isFunction(a) ? (b = a, a = [ "*" ]) : a = a.split(" ");
            var c, d = 0, e = a.length;
            for (;d < e; d++) c = a[d], cT[c] = cT[c] || [], cT[c].unshift(b);
        },
        prefilter: function(a, b) {
            b ? cS.unshift(a) : cS.push(a);
        }
    }), p.Tween = cZ, cZ.prototype = {
        constructor: cZ,
        init: function(a, b, c, d, e, f) {
            this.elem = a, this.prop = c, this.easing = e || "swing", this.options = b, this.start = this.now = this.cur(), 
            this.end = d, this.unit = f || (p.cssNumber[c] ? "" : "px");
        },
        cur: function() {
            var a = cZ.propHooks[this.prop];
            return a && a.get ? a.get(this) : cZ.propHooks._default.get(this);
        },
        run: function(a) {
            var b, c = cZ.propHooks[this.prop];
            return this.options.duration ? this.pos = b = p.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration) : this.pos = b = a, 
            this.now = (this.end - this.start) * b + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), 
            c && c.set ? c.set(this) : cZ.propHooks._default.set(this), this;
        }
    }, cZ.prototype.init.prototype = cZ.prototype, cZ.propHooks = {
        _default: {
            get: function(a) {
                var b;
                return null == a.elem[a.prop] || !!a.elem.style && null != a.elem.style[a.prop] ? (b = p.css(a.elem, a.prop, !1, ""), 
                !b || "auto" === b ? 0 : b) : a.elem[a.prop];
            },
            set: function(a) {
                p.fx.step[a.prop] ? p.fx.step[a.prop](a) : a.elem.style && (null != a.elem.style[p.cssProps[a.prop]] || p.cssHooks[a.prop]) ? p.style(a.elem, a.prop, a.now + a.unit) : a.elem[a.prop] = a.now;
            }
        }
    }, cZ.propHooks.scrollTop = cZ.propHooks.scrollLeft = {
        set: function(a) {
            a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now);
        }
    }, p.each([ "toggle", "show", "hide" ], function(a, b) {
        var c = p.fn[b];
        p.fn[b] = function(d, e, f) {
            return null == d || "boolean" == typeof d || !a && p.isFunction(d) && p.isFunction(e) ? c.apply(this, arguments) : this.animate(c$(b, !0), d, e, f);
        };
    }), p.fn.extend({
        fadeTo: function(a, b, c, d) {
            return this.filter(bZ).css("opacity", 0).show().end().animate({
                opacity: b
            }, a, c, d);
        },
        animate: function(a, b, c, d) {
            var e = p.isEmptyObject(a), f = p.speed(b, c, d), g = function() {
                var b = cW(this, p.extend({}, a), f);
                e && b.stop(!0);
            };
            return e || f.queue === !1 ? this.each(g) : this.queue(f.queue, g);
        },
        stop: function(a, c, d) {
            var e = function(a) {
                var b = a.stop;
                delete a.stop, b(d);
            };
            return "string" != typeof a && (d = c, c = a, a = b), c && a !== !1 && this.queue(a || "fx", []), 
            this.each(function() {
                var b = !0, c = null != a && a + "queueHooks", f = p.timers, g = p._data(this);
                if (c) g[c] && g[c].stop && e(g[c]); else for (c in g) g[c] && g[c].stop && cR.test(c) && e(g[c]);
                for (c = f.length; c--; ) f[c].elem === this && (null == a || f[c].queue === a) && (f[c].anim.stop(d), 
                b = !1, f.splice(c, 1));
                (b || !d) && p.dequeue(this, a);
            });
        }
    }), p.each({
        slideDown: c$("show"),
        slideUp: c$("hide"),
        slideToggle: c$("toggle"),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(a, b) {
        p.fn[a] = function(a, c, d) {
            return this.animate(b, a, c, d);
        };
    }), p.speed = function(a, b, c) {
        var d = a && "object" == typeof a ? p.extend({}, a) : {
            complete: c || !c && b || p.isFunction(a) && a,
            duration: a,
            easing: c && b || b && !p.isFunction(b) && b
        };
        d.duration = p.fx.off ? 0 : "number" == typeof d.duration ? d.duration : d.duration in p.fx.speeds ? p.fx.speeds[d.duration] : p.fx.speeds._default;
        if (null == d.queue || d.queue === !0) d.queue = "fx";
        return d.old = d.complete, d.complete = function() {
            p.isFunction(d.old) && d.old.call(this), d.queue && p.dequeue(this, d.queue);
        }, d;
    }, p.easing = {
        linear: function(a) {
            return a;
        },
        swing: function(a) {
            return .5 - Math.cos(a * Math.PI) / 2;
        }
    }, p.timers = [], p.fx = cZ.prototype.init, p.fx.tick = function() {
        var a, b = p.timers, c = 0;
        for (;c < b.length; c++) a = b[c], !a() && b[c] === a && b.splice(c--, 1);
        b.length || p.fx.stop();
    }, p.fx.timer = function(a) {
        a() && p.timers.push(a) && !cO && (cO = setInterval(p.fx.tick, p.fx.interval));
    }, p.fx.interval = 13, p.fx.stop = function() {
        clearInterval(cO), cO = null;
    }, p.fx.speeds = {
        slow: 600,
        fast: 200,
        _default: 400
    }, p.fx.step = {}, p.expr && p.expr.filters && (p.expr.filters.animated = function(a) {
        return p.grep(p.timers, function(b) {
            return a === b.elem;
        }).length;
    });
    var c_ = /^(?:body|html)$/i;
    p.fn.offset = function(a) {
        if (arguments.length) return a === b ? this : this.each(function(b) {
            p.offset.setOffset(this, a, b);
        });
        var c, d, e, f, g, h, i, j = {
            top: 0,
            left: 0
        }, k = this[0], l = k && k.ownerDocument;
        if (!l) return;
        return (d = l.body) === k ? p.offset.bodyOffset(k) : (c = l.documentElement, p.contains(c, k) ? ("undefined" != typeof k.getBoundingClientRect && (j = k.getBoundingClientRect()), 
        e = da(l), f = c.clientTop || d.clientTop || 0, g = c.clientLeft || d.clientLeft || 0, 
        h = e.pageYOffset || c.scrollTop, i = e.pageXOffset || c.scrollLeft, {
            top: j.top + h - f,
            left: j.left + i - g
        }) : j);
    }, p.offset = {
        bodyOffset: function(a) {
            var b = a.offsetTop, c = a.offsetLeft;
            return p.support.doesNotIncludeMarginInBodyOffset && (b += parseFloat(p.css(a, "marginTop")) || 0, 
            c += parseFloat(p.css(a, "marginLeft")) || 0), {
                top: b,
                left: c
            };
        },
        setOffset: function(a, b, c) {
            var d = p.css(a, "position");
            "static" === d && (a.style.position = "relative");
            var e = p(a), f = e.offset(), g = p.css(a, "top"), h = p.css(a, "left"), i = ("absolute" === d || "fixed" === d) && p.inArray("auto", [ g, h ]) > -1, j = {}, k = {}, l, m;
            i ? (k = e.position(), l = k.top, m = k.left) : (l = parseFloat(g) || 0, m = parseFloat(h) || 0), 
            p.isFunction(b) && (b = b.call(a, c, f)), null != b.top && (j.top = b.top - f.top + l), 
            null != b.left && (j.left = b.left - f.left + m), "using" in b ? b.using.call(a, j) : e.css(j);
        }
    }, p.fn.extend({
        position: function() {
            if (!this[0]) return;
            var a = this[0], b = this.offsetParent(), c = this.offset(), d = c_.test(b[0].nodeName) ? {
                top: 0,
                left: 0
            } : b.offset();
            return c.top -= parseFloat(p.css(a, "marginTop")) || 0, c.left -= parseFloat(p.css(a, "marginLeft")) || 0, 
            d.top += parseFloat(p.css(b[0], "borderTopWidth")) || 0, d.left += parseFloat(p.css(b[0], "borderLeftWidth")) || 0, 
            {
                top: c.top - d.top,
                left: c.left - d.left
            };
        },
        offsetParent: function() {
            return this.map(function() {
                var a = this.offsetParent || e.body;
                while (a && !c_.test(a.nodeName) && "static" === p.css(a, "position")) a = a.offsetParent;
                return a || e.body;
            });
        }
    }), p.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(a, c) {
        var d = /Y/.test(c);
        p.fn[a] = function(e) {
            return p.access(this, function(a, e, f) {
                var g = da(a);
                if (f === b) return g ? c in g ? g[c] : g.document.documentElement[e] : a[e];
                g ? g.scrollTo(d ? p(g).scrollLeft() : f, d ? f : p(g).scrollTop()) : a[e] = f;
            }, a, e, arguments.length, null);
        };
    }), p.each({
        Height: "height",
        Width: "width"
    }, function(a, c) {
        p.each({
            padding: "inner" + a,
            content: c,
            "": "outer" + a
        }, function(d, e) {
            p.fn[e] = function(e, f) {
                var g = arguments.length && (d || "boolean" != typeof e), h = d || (e === !0 || f === !0 ? "margin" : "border");
                return p.access(this, function(c, d, e) {
                    var f;
                    return p.isWindow(c) ? c.document.documentElement["client" + a] : 9 === c.nodeType ? (f = c.documentElement, 
                    Math.max(c.body["scroll" + a], f["scroll" + a], c.body["offset" + a], f["offset" + a], f["client" + a])) : e === b ? p.css(c, d, e, h) : p.style(c, d, e, h);
                }, c, g ? e : b, g, null);
            };
        });
    }), a.jQuery = a.$ = p, "function" == typeof define && define.amd && define.amd.jQuery && define("jquery", [], function() {
        return p;
    });
})(window);

(function() {
    var _cache = {};
    String.format = function(str) {
        if ("object" != typeof arguments[1]) {
            for (var i = 1; i < arguments.length; i++) {
                var regexp = _cache[i] || (_cache[i] = new RegExp("%" + i, "g"));
                str = str.replace(regexp, arguments[i]);
            }
            return str;
        }
        var output = "", lastIndex = 0, obj = arguments[1];
        while (1) {
            var index = str.indexOf("#{", lastIndex);
            if (index == -1) break;
            output += str.substring(lastIndex, index);
            var end = str.indexOf("}", index);
            output += Object.getProperty(obj, str.substring(index + 2, end));
            lastIndex = ++end;
        }
        output += str.substring(lastIndex);
        return output;
    };
    Object.defaults = function(obj, def) {
        for (var key in def) if (null == obj[key]) obj[key] = def[key];
        return obj;
    };
    Object.clear = function(obj, arg) {
        if (arg instanceof Array) for (var i = 0, x, length = arg.length; i < length; i++) {
            x = arg[i];
            if (x in obj) delete obj[x];
        } else if ("object" === typeof arg) for (var key in arg) if (key in obj) delete obj[key];
        return obj;
    };
    Object.extend = function(target, source) {
        if (null == target) target = {};
        if (null == source) return target;
        for (var key in source) if (null != source[key]) target[key] = source[key];
        return target;
    };
    Object.getProperty = function(o, chain) {
        if ("object" !== typeof o || null == chain) return o;
        if ("string" === typeof chain) chain = chain.split(".");
        if (1 === chain.length) return o[chain[0]];
        return Object.getProperty(o[chain.shift()], chain);
    };
    Object.setProperty = function(o, xpath, value) {
        var arr = xpath.split("."), obj = o, key = arr[arr.length - 1];
        while (arr.length > 1) {
            var prop = arr.shift();
            obj = obj[prop] || (obj[prop] = {});
        }
        obj[key] = value;
    };
    Object.lazyProperty = function(o, xpath, fn) {
        if ("object" === typeof xpath) {
            for (var key in xpath) Object.lazyProperty(o, key, xpath[key]);
            return;
        }
        var arr = xpath.split("."), obj = o, lazy = arr[arr.length - 1];
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
        if (null == obj.__observers) Object.defineProperty(obj, "__observers", {
            value: {},
            enumerable: false
        });
        if (obj.__observers[property]) {
            obj.__observers[property].push(callback);
            return;
        }
        (obj.__observers[property] || (obj.__observers[property] = [])).push(callback);
        var chain = property.split("."), parent = obj, key = property;
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
                for (var i = 0, length = observers.length; i < length; i++) observers[i](x);
            }
        });
    };
    Date.format = function(date, format) {
        if (!format) format = "MM/dd/yyyy";
        function pad(value) {
            return value > 9 ? value : "0" + value;
        }
        format = format.replace("MM", pad(date.getMonth() + 1));
        var _year = date.getFullYear();
        if (format.indexOf("yyyy") > -1) format = format.replace("yyyy", _year); else if (format.indexOf("yy") > -1) format = format.replace("yy", _year.toString().substr(2, 2));
        format = format.replace("dd", pad(date.getDate()));
        if (format.indexOf("HH") > -1) format = format.replace("HH", pad(date.getHours()));
        if (format.indexOf("mm") > -1) format = format.replace("mm", pad(date.getMinutes()));
        if (format.indexOf("ss") > -1) format = format.replace("ss", pad(date.getSeconds()));
        return format;
    };
    Function.invoke = function() {
        var arr = Array.prototype.slice.call(arguments), obj = arr.shift(), fn = arr.shift();
        return function() {
            return obj[fn].apply(obj, arr);
        };
    };
})();

(function(global) {
    "use strict";
    var r = global.ruqq || (global.ruqq = {});
    function getProperty(o, chain) {
        if ("object" !== typeof o || null == chain) return o;
        var value = o, props = chain.split("."), length = props.length, i = 0, key;
        for (;i < length; i++) {
            key = props[i];
            value = value[key];
            if (null == value) return value;
        }
        return value;
    }
    function extend(target, source) {
        for (var key in source) if (source[key]) target[key] = source[key];
        return target;
    }
    function check(item, arg1, arg2, arg3) {
        if ("function" === typeof arg1) return arg1(item) ? item : null;
        if ("undefined" === typeof arg2) return item == arg1 ? item : null;
        var value = null != arg1 ? getProperty(item, arg1) : item, comparer = arg2, compareToValue = arg3;
        switch (comparer) {
          case ">":
            return value > compareToValue ? item : null;

          case "<":
            return value < compareToValue ? item : null;

          case ">=":
            return value >= compareToValue ? item : null;

          case "<=":
            return value <= compareToValue ? item : null;

          case "!=":
            return value != compareToValue ? item : null;

          case "==":
            return value == compareToValue ? item : null;
        }
        console.error("InvalidArgumentException: arr.js:check", arguments);
        return null;
    }
    var arr = {
        where: function(items, arg1, arg2, arg3) {
            var array = [];
            if (null == items) return array;
            var i = 0, length = items.length, item;
            for (;i < length; i++) {
                item = items[i];
                if (null != check(item, arg1, arg2, arg3)) array.push(item);
            }
            return array;
        },
        each: "undefined" !== typeof Array.prototype.forEach ? function(items, fn) {
            if (null == items) return items;
            items.forEach(fn);
            return items;
        } : function(items, func) {
            if (null == items) return items;
            for (var i = 0, length = items.length; i < length; i++) func(items[i]);
            return items;
        },
        remove: function(items, arg1, arg2, arg3) {
            for (var i = 0, length = items.length; i < length; i++) if (null != check(items[i], arg1, arg2, arg3)) {
                items.splice(i, 1);
                i--;
                length--;
            }
            return items;
        },
        invoke: function() {
            var args = Array.prototype.slice.call(arguments);
            var items = args.shift(), method = args.shift(), results = [];
            for (var i = 0; i < items.length; i++) if ("function" === typeof items[i][method]) results.push(items[i][method].apply(items[i], args)); else results.push(null);
            return results;
        },
        last: function(items, arg1, arg2, arg3) {
            if (null == items) return null;
            if (null == arg1) return items[items.length - 1];
            for (var i = items.length; i > -1; --i) if (null != check(items[i], arg1, arg2, arg3)) return items[i];
            return null;
        },
        first: function(items, arg1, arg2, arg3) {
            if (null == arg1) return items[0];
            for (var i = 0, length = items.length; i < length; i++) if (null != check(items[i], arg1, arg2, arg3)) return items[i];
            return null;
        },
        any: function(items, arg1, arg2, arg3) {
            for (var i = 0, length = items.length; i < length; i++) if (null != check(items[i], arg1, arg2, arg3)) return true;
            return false;
        },
        isIn: function(items, checkValue) {
            for (var i = 0; i < items.length; i++) if (checkValue == items[i]) return true;
            return false;
        },
        map: "undefined" !== typeof Array.prototype.map ? function(items, func) {
            if (null == items) return [];
            return items.map(func);
        } : function(items, func) {
            var agg = [];
            if (null == items) return agg;
            for (var i = 0, length = items.length; i < length; i++) agg.push(func(items[i], i));
            return agg;
        },
        aggr: function(items, aggr, fn) {
            for (var i = 0, length = items.length; i < length; i++) {
                var result = fn(items[i], aggr, i);
                if (null != result) aggr = result;
            }
            return aggr;
        },
        select: function(items, arg) {
            if (null == items) return [];
            var arr = [];
            for (var item, i = 0, length = items.length; i < length; i++) {
                item = items[i];
                if ("string" === typeof arg) arr.push(item[arg]); else if ("function" === typeof arg) arr.push(arg(item)); else if (arg instanceof Array) {
                    var obj = {};
                    for (var j = 0; j < arg.length; j++) obj[arg[j]] = items[i][arg[j]];
                    arr.push(obj);
                }
            }
            return arr;
        },
        indexOf: function(items, arg1, arg2, arg3) {
            for (var i = 0, length = items.length; i < length; i++) if (null != check(items[i], arg1, arg2, arg3)) return i;
            return -1;
        },
        count: function(items, arg1, arg2, arg3) {
            var count = 0, i = 0, length = items.length;
            for (;i < length; i++) if (null != check(items[i], arg1, arg2, arg3)) count++;
            return count;
        },
        distinct: function(items, compareF) {
            var array = [];
            if (null == items) return array;
            var i = 0, length = items.length;
            for (;i < length; i++) {
                var unique = true;
                for (var j = 0; j < array.length; j++) if (compareF && compareF(items[i], array[j]) || null == compareF && items[i] == array[j]) {
                    unique = false;
                    break;
                }
                if (unique) array.push(items[i]);
            }
            return array;
        }
    };
    arr.each([ "min", "max" ], function(x) {
        arr[x] = function(array, property) {
            if (null == array) return null;
            var number = null;
            for (var i = 0, length = array.length; i < length; i++) {
                var prop = getProperty(array[i], property);
                if (null == number) {
                    number = prop;
                    continue;
                }
                if ("max" === x && prop > number) {
                    number = prop;
                    continue;
                }
                if ("min" === x && prop < number) {
                    number = prop;
                    continue;
                }
            }
            return number;
        };
    });
    r.arr = function(items) {
        return new Expression(items);
    };
    extend(r.arr, arr);
    function Expression(items) {
        this.items = items;
    }
    function extendClass(method) {
        Expression.prototype[method] = function() {
            var l = arguments.length, result = arr[method](this.items, l > 0 ? arguments[0] : null, l > 1 ? arguments[1] : null, l > 2 ? arguments[2] : null, l > 3 ? arguments[3] : null);
            if (result instanceof Array) {
                this.items = result;
                return this;
            }
            return result;
        };
    }
    for (var method in arr) extendClass(method);
})("undefined" !== typeof window ? window : global);

if ("undefined" === typeof Function.prototype.bind) Function.prototype.bind = function() {
    if (arguments.length < 2 && "undefined" == typeof arguments[0]) return this;
    var __method = this, args = Array.prototype.slice.call(arguments), object = args.shift();
    return function() {
        return __method.apply(object, args.concat(Array.prototype.slice.call(arguments)));
    };
};

if ("undefined" === typeof Object.defineProperty) if ("undefined" !== {}.__defineGetter__) Object.defineProperty = function(obj, prop, data) {
    if (data.set) obj.__defineSetter__(prop, data.set);
    if (data.get) obj.__defineGetter__(prop, data.get);
};

if ("undefined" === typeof Date.now) Date.now = function() {
    return new Date().getTime();
};

if ("undefined" === typeof window.requestAnimationFrame) {
    window.requestAnimationFrame = function() {
        var w = window;
        return w.webkitRequestAnimationFrame || w.mozRequestAnimationFrame || function(callback) {
            return setTimeout(callback, 17);
        };
    }();
    window.cancelAnimationFrame = function() {
        var w = window;
        return w.webkitCancelAnimationFrame || w.mozCancelAnimationFrame || function(timeout) {
            clearTimeout(timeout);
        };
    }();
}

if ("undefined" === typeof String.prototype.trim) String.prototype.trim = function() {
    return this.replace(/(^\s)|(\s$)/g, "");
};

if ("undefined" === typeof Array.prototype.indexOf) Array.prototype.indexOf = function(value) {
    for (var i = 0; i < this.length; i++) if (value === this[i]) return i;
    return -1;
};

(function(global, document) {
    "use strict";
    var regexpWhitespace = /\s/g, regexpLinearCondition = /([!]?['"A-Za-z0-9_\-\.]+)([!<>=]{1,2})?([^\|&]+)?([\|&]{2})?/g, regexpEscapedChar = {
        "'": /\\'/g,
        '"': /\\"/g,
        "{": /\\\{/g,
        ">": /\\>/g,
        ";": /\\>/g
    }, regexpTabsAndNL = /[\t\n\r]{1,}/g, regexpMultipleSpaces = / {2,}/g, hasOwnProp = {}.hasOwnProperty, listeners = null;
    var Helper = {
        extend: function(target, source) {
            var key;
            if (null == source) return target;
            if (null == target) target = {};
            for (key in source) if (hasOwnProp.call(source, key)) target[key] = source[key];
            return target;
        },
        getProperty: function(o, chain) {
            var value = o, props, key, i, length;
            if ("object" !== typeof o || null == chain) return o;
            if ("string" === typeof chain) props = chain.split(".");
            for (i = 0, length = props.length; i < length; i++) {
                key = props[i];
                value = value[key];
                if (!value) return value;
            }
            return value;
        },
        templateFunction: function(arr, o) {
            var output = "", even = true, utility, value, index, key, i, length;
            for (i = 0, length = arr.length; i < length; i++) {
                if (even) output += arr[i]; else {
                    key = arr[i];
                    value = null;
                    index = key.indexOf(":");
                    if (~index) {
                        utility = index > 0 ? key.substring(0, index).replace(regexpWhitespace, "") : "";
                        if ("" === utility) utility = "condition";
                        key = key.substring(index + 1);
                        value = "function" === typeof ValueUtilities[utility] ? ValueUtilities[utility](key, o) : null;
                    } else value = Helper.getProperty(o, key);
                    output += null == value ? "" : value;
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
        next: function() {
            this.index++;
            return this;
        },
        skipWhitespace: function() {
            var template = this.template, index = this.index, length = this.length;
            for (;index < length; index++) if (32 !== template.charCodeAt(index)) break;
            this.index = index;
            return this;
        },
        skipToChar: function(c) {
            var template = this.template, index;
            do index = template.indexOf(c, this.index); while (~index && 92 !== template.charCodeAt(index - 1));
            this.index = index;
            return this;
        },
        skipToAttributeBreak: function() {
            var template = this.template, index = this.index, length = this.length, c;
            do {
                c = template.charCodeAt(++index);
                if (35 === c && 123 === template.charCodeAt(index + 1)) {
                    this.index = index;
                    this.sliceToChar("}");
                    this.index++;
                    return;
                }
            } while (46 !== c && 35 !== c && 62 !== c && 123 !== c && 32 !== c && 59 !== c && index < length);
            this.index = index;
            return this;
        },
        sliceToChar: function(c) {
            var template = this.template, index = this.index, start = index, isEscaped = false, value, nindex;
            while ((nindex = template.indexOf(c, index)) > -1) {
                index = nindex;
                if (92 !== template.charCodeAt(index - 1)) break;
                isEscaped = true;
                index++;
            }
            value = template.substring(start, index);
            this.index = index;
            return isEscaped ? value.replace(regexpEscapedChar[c], c) : value;
        }
    };
    function ICustomTag() {
        this.attr = {};
    }
    ICustomTag.prototype.render = function(values, stream) {
        return Builder.build(this.nodes, values, stream);
    };
    var CustomTags = function() {
        var renderICustomTag = ICustomTag.prototype.render;
        function List() {
            this.attr = {};
        }
        List.prototype.render = function(values, container, cntx) {
            var attr = this.attr, attrTemplate = attr.template, value = Helper.getProperty(values, attr.value), nodes, template, i, length;
            if (!(value instanceof Array)) return container;
            if (null != attrTemplate) {
                template = document.querySelector(attrTemplate).innerHTML;
                this.nodes = nodes = Mask.compile(template);
            }
            if (null == this.nodes) return container;
            for (i = 0, length = value.length; i < length; i++) Builder.build(this.nodes, value[i], container, cntx);
            return container;
        };
        function Visible() {
            this.attr = {};
        }
        Visible.prototype.render = function(values, container, cntx) {
            if (!ValueUtilities.out.isCondition(this.attr.check, values)) return container; else return renderICustomTag.call(this, values, container, cntx);
        };
        function Binding() {
            this.attr = {};
        }
        Binding.prototype.render = function() {
            var objectDefineProperty = Object.defineProperty, supportsDefineProperty = false, watchedObjects, ticker;
            if (objectDefineProperty) try {
                supportsDefineProperty = Object.defineProperty({}, "x", {
                    get: function() {
                        return true;
                    }
                }).x;
            } catch (e) {
                supportsDefineProperty = false;
            } else if (Object.prototype.__defineGetter__) {
                objectDefineProperty = function(obj, prop, desc) {
                    if (hasOwnProp.call(desc, "get")) obj.__defineGetter__(prop, desc.get);
                    if (hasOwnProp.call(desc, "set")) obj.__defineSetter__(prop, desc.set);
                };
                supportsDefineProperty = true;
            }
            if (!supportsDefineProperty) {
                watchedObjects = [];
                objectDefineProperty = function(obj, prop, desc) {
                    var objectWrapper, found = false, i, length;
                    for (i = 0, length = watchedObjects.length; i < length; i++) {
                        objectWrapper = watchedObjects[i];
                        if (objectWrapper.obj === obj) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) objectWrapper = watchedObjects[i] = {
                        obj: obj,
                        props: {}
                    };
                    objectWrapper.props[prop] = {
                        value: obj[prop],
                        set: desc.set
                    };
                };
                ticker = function() {
                    var objectWrapper, i, length, props, prop, propObj, newValue;
                    for (i = 0, length = watchedObjects.length; i < length; i++) {
                        objectWrapper = watchedObjects[i];
                        props = objectWrapper.props;
                        for (prop in props) if (hasOwnProp.call(props, prop)) {
                            propObj = props[prop];
                            newValue = objectWrapper.obj[prop];
                            if (newValue !== propObj.value) propObj.set.call(null, newValue);
                        }
                    }
                    setTimeout(ticker, 16);
                };
                ticker();
            }
            return (Binding.prototype.render = function(values, container) {
                var attrValue = this.attr.value, value = values[attrValue];
                objectDefineProperty.call(Object, values, attrValue, {
                    get: function() {
                        return value;
                    },
                    set: function(x) {
                        container.innerHTML = value = x;
                    }
                });
                container.innerHTML = value;
                return container;
            }).apply(this, arguments);
        };
        return {
            all: {
                list: List,
                visible: Visible,
                bind: Binding
            }
        };
    }();
    var ValueUtilities = function() {
        function getAssertionValue(value, model) {
            var c = value.charCodeAt(0);
            if (34 === c || 39 === c) return value.substring(1, value.length - 1); else if (45 === c || c > 47 && c < 58) return value << 0; else return Helper.getProperty(model, value);
            return "";
        }
        var parseLinearCondition = function(line) {
            var cond = {
                assertions: []
            }, buffer = {
                data: line.replace(regexpWhitespace, "")
            }, match, expr;
            buffer.index = buffer.data.indexOf("?");
            if (buffer.index === -1) console.error('Invalid Linear Condition: "?" is not found');
            expr = buffer.data.substring(0, buffer.index);
            while (null != (match = regexpLinearCondition.exec(expr))) cond.assertions.push({
                join: match[4],
                left: match[1],
                sign: match[2],
                right: match[3]
            });
            buffer.index++;
            parseCase(buffer, cond, "case1");
            buffer.index++;
            parseCase(buffer, cond, "case2");
            return cond;
        }, parseCase = function(buffer, obj, key) {
            var c = buffer.data[buffer.index], end = null;
            if (null == c) return;
            if ('"' === c || "'" === c) {
                end = buffer.data.indexOf(c, ++buffer.index);
                obj[key] = buffer.data.substring(buffer.index, end);
            } else {
                end = buffer.data.indexOf(":", buffer.index);
                if (end === -1) end = buffer.data.length;
                obj[key] = {
                    value: buffer.data.substring(buffer.index, end)
                };
            }
            if (null != end) buffer.index = ++end;
        }, isCondition = function(con, values) {
            if ("string" === typeof con) con = parseLinearCondition(con);
            var current = false, a, value1, value2, i, length;
            for (i = 0, length = con.assertions.length; i < length; i++) {
                a = con.assertions[i];
                if (null == a.right) {
                    current = 33 === a.left.charCodeAt(0) ? !Helper.getProperty(values, a.left.substring(1)) : !!Helper.getProperty(values, a.left);
                    if (true === current) {
                        if ("&&" === a.join) continue;
                        break;
                    }
                    if ("||" === a.join) continue;
                    break;
                }
                value1 = getAssertionValue(a.left, values);
                value2 = getAssertionValue(a.right, values);
                switch (a.sign) {
                  case "<":
                    current = value1 < value2;
                    break;

                  case "<=":
                    current = value1 <= value2;
                    break;

                  case ">":
                    current = value1 > value2;
                    break;

                  case ">=":
                    current = value1 >= value2;
                    break;

                  case "!=":
                    current = value1 !== value2;
                    break;

                  case "==":
                    current = value1 === value2;
                }
                if (true === current) {
                    if ("&&" === a.join) continue;
                    break;
                }
                if ("||" === a.join) continue;
                break;
            }
            return current;
        };
        return {
            condition: function(line, values) {
                var con = parseLinearCondition(line), result = isCondition(con, values) ? con.case1 : con.case2;
                if (null == result) return "";
                if ("string" === typeof result) return result;
                return Helper.getProperty(values, result.value);
            },
            out: {
                isCondition: isCondition,
                parse: parseLinearCondition
            }
        };
    }();
    var Parser = {
        toFunction: function(template) {
            var arr = template.split("#{"), length = arr.length, i;
            for (i = 1; i < length; i++) {
                var key = arr[i], index = key.indexOf("}");
                arr.splice(i, 0, key.substring(0, index));
                i++;
                length++;
                arr[i] = key.substring(index + 1);
            }
            template = null;
            return function(o) {
                return Helper.templateFunction(arr, o);
            };
        },
        parseAttributes: function(T, node) {
            var key, value, _classNames, quote, c, start, i;
            if (null == node.attr) node.attr = {};
            loop: for (;T.index < T.length; ) {
                key = null;
                value = null;
                c = T.template.charCodeAt(T.index);
                switch (c) {
                  case 32:
                    T.index++;
                    continue;

                  case 123:
                  case 59:
                  case 62:
                    break loop;

                  case 46:
                    start = T.index + 1;
                    T.skipToAttributeBreak();
                    value = T.template.substring(start, T.index);
                    _classNames = null != _classNames ? _classNames + " " + value : value;
                    break;

                  case 35:
                    key = "id";
                    start = T.index + 1;
                    T.skipToAttributeBreak();
                    value = T.template.substring(start, T.index);

                    break;

                  default:
                    start = i = T.index;
                    var whitespaceAt = null;
                    do {
                        c = T.template.charCodeAt(++i);
                        if (null == whitespaceAt && 32 === c) whitespaceAt = i;
                    } while (61 !== c && i <= T.length);
                    key = T.template.substring(start, whitespaceAt || i);
                    do quote = T.template.charAt(++i); while (" " === quote);
                    T.index = ++i;
                    value = T.sliceToChar(quote);
                    T.index++;
                }
                if (null != key) {
                    if (value.indexOf("#{") > -1) value = true !== T.serialize ? this.toFunction(value) : {
                        template: value
                    };
                    node.attr[key] = value;
                }
            }
            if (null != _classNames) node.attr["class"] = _classNames.indexOf("#{") > -1 ? true !== T.serialize ? this.toFunction(_classNames) : {
                template: _classNames
            } : _classNames;
        },
        parse: function(T) {
            var current = T;
            for (;T.index < T.length; T.index++) {
                var c = T.template.charCodeAt(T.index);
                switch (c) {
                  case 32:
                    continue;

                  case 39:
                  case 34:
                    T.index++;
                    var content = T.sliceToChar(39 === c ? "'" : '"');
                    if (content.indexOf("#{") > -1) content = true !== T.serialize ? this.toFunction(content) : {
                        template: content
                    };
                    var t = {
                        content: content
                    };
                    if (null == current.nodes) current.nodes = t; else if (null == current.nodes.push) current.nodes = [ current.nodes, t ]; else current.nodes.push(t);
                    if (current.__single) {
                        if (null == current) continue;
                        current = current.parent;
                        while (null != current && null != current.__single) current = current.parent;
                    }
                    continue;

                  case 62:
                    current.__single = true;
                    continue;

                  case 123:
                    continue;

                  case 59:
                    if (null != current.nodes) continue;

                  case 125:
                    if (null == current) continue;
                    do current = current.parent; while (null != current && null != current.__single);
                    continue;
                }
                var tagName = null;
                if (46 === c || 35 === c) tagName = "div"; else {
                    var start = T.index;
                    do c = T.template.charCodeAt(++T.index); while (32 !== c && 35 !== c && 46 !== c && 59 !== c && 123 !== c && 62 !== c && T.index <= T.length);
                    tagName = T.template.substring(start, T.index);
                }
                if ("" === tagName) console.error("Parse Error: Undefined tag Name %d/%d %s", T.index, T.length, T.template.substring(T.index, T.index + 10));
                var tag = {
                    tagName: tagName,
                    parent: current
                };
                if (null == current) console.log("T", T, "rest", T.template.substring(T.index));
                if (null == current.nodes) current.nodes = tag; else if (null == current.nodes.push) current.nodes = [ current.nodes, tag ]; else current.nodes.push(tag);
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
            if (null != obj.nodes) this.cleanObject(obj.nodes);
            return obj;
        }
    };
    var Builder = {
        build: function(nodes, values, container, cntx) {
            if (null == nodes) return container;
            if (null == container) container = document.createDocumentFragment();
            if (null == cntx) cntx = {};
            var isarray = nodes instanceof Array, length = true === isarray ? nodes.length : 1, i, node, j;
            for (i = 0; i < length; i++) {
                node = true === isarray ? nodes[i] : nodes;
                if (null != CustomTags.all[node.tagName]) {
                    var Handler = CustomTags.all[node.tagName], custom = Handler instanceof Function ? new Handler(values) : Handler;
                    custom.compoName = node.tagName;
                    custom.nodes = node.nodes;
                    custom.attr = Helper.extend(custom.attr, node.attr);
                    (cntx.components || (cntx.components = [])).push(custom);
                    custom.parent = cntx;
                    if (null != listeners) {
                        var fns = listeners["customCreated"];
                        if (null != fns) for (j = 0; j < fns.length; j++) fns[j](custom, values, container);
                    }
                    custom.render(values, container, custom);
                    continue;
                }
                if (null != node.content) {
                    container.appendChild(document.createTextNode("function" === typeof node.content ? node.content(values) : node.content));
                    continue;
                }
                var tag = document.createElement(node.tagName), attr = node.attr;
                for (var key in attr) if (true === hasOwnProp.call(attr, key)) {
                    var value = "function" === typeof attr[key] ? attr[key](values) : attr[key];
                    if (value) tag.setAttribute(key, value);
                }
                if (null != node.nodes) this.build(node.nodes, values, tag, cntx);
                container.appendChild(tag);
            }
            return container;
        }
    };
    var cache = {}, Mask = {
        render: function(template, model, container, cntx) {
            if ("string" === typeof template) template = this.compile(template);
            return Builder.build(template, model, container, cntx);
        },
        compile: function(template, serializeOnly) {
            if (hasOwnProp.call(cache, template)) return cache[template];
            var T = new Template(template.replace(regexpTabsAndNL, "").replace(regexpMultipleSpaces, " "));
            if (true === serializeOnly) T.serialize = true;
            return cache[template] = Parser.parse(T);
        },
        registerHandler: function(tagName, TagHandler) {
            CustomTags.all[tagName] = TagHandler;
        },
        getHandler: function(tagName) {
            return null != tagName ? CustomTags.all[tagName] : CustomTags.all;
        },
        registerUtility: function(utilityName, fn) {
            ValueUtilities[utilityName] = fn;
        },
        serialize: function(template) {
            return Parser.cleanObject(this.compile(template, true));
        },
        deserialize: function(serialized) {
            var i, key, attr;
            if (serialized instanceof Array) {
                for (i = 0; i < serialized.length; i++) this.deserialize(serialized[i]);
                return serialized;
            }
            if (null != serialized.content) {
                if (null != serialized.content.template) serialized.content = Parser.toFunction(serialized.content.template);
                return serialized;
            }
            if (null != serialized.attr) {
                attr = serialized.attr;
                for (key in attr) if (true === hasOwnProp.call(attr, key)) {
                    if (null == attr[key].template) continue;
                    attr[key] = Parser.toFunction(attr[key].template);
                }
            }
            if (null != serialized.nodes) this.deserialize(serialized.nodes);
            return serialized;
        },
        clearCache: function(key) {
            if ("string" === typeof key) delete cache[key]; else cache = {};
        },
        ICustomTag: ICustomTag,
        ValueUtils: ValueUtilities,
        plugin: function(source) {
            eval(source);
        },
        on: function(event, fn) {
            if (null == listeners) listeners = {};
            (listeners[event] || (listeners[event] = [])).push(fn);
        },
        delegateReload: function() {}
    };
    Mask.renderDom = Mask.render;
    if ("undefined" !== typeof module && module.exports) module.exports = Mask; else global.mask = Mask;
})(this, "undefined" === typeof document ? null : document);

(function() {
    "use strict";
    var global = window, document = global.document;
    var domLib = "undefined" == typeof $ ? null : $;
    var extend = function(target, source) {
        for (var key in source) target[key] = source[key];
        return target;
    }, containerArray = function() {
        var arr = [];
        arr.appendChild = function(child) {
            this.push(child);
        };
        return arr;
    };
    var Children_ = {
        select: function(component, compos) {
            for (var name in compos) {
                var data = compos[name], events = null, selector = null;
                if (data instanceof Array) {
                    selector = data[0];
                    events = data.splice(1);
                }
                if ("string" == typeof data) selector = data;
                if (null == data) {
                    console.error("Unknown component child", name, compos[name]);
                    return;
                }
                var index = selector.indexOf(":"), engine = selector.substring(0, index);
                engine = Compo.config.selectors[engine];
                if (null == engine) component.compos[name] = component.$[0].querySelector(selector); else {
                    selector = selector.substring(++index).trim();
                    component.compos[name] = engine(component, selector);
                }
                var element = component.compos[name];
                if (null != events) {
                    if (element instanceof Compo) element = element.$;
                    Events_.on(component, events, element);
                }
            }
        }
    };
    var Shots = {
        emit: function(component, event, args) {
            if (null != component.listeners && event in component.listeners) {
                component.listeners[event].apply(component, args);
                delete component.listeners[event];
            }
            if (component.components instanceof Array) for (var i = 0; i < component.components.length; i++) Shots.emit(component.components[i], event, args);
        },
        on: function(component, event, fn) {
            if (null == component.listeners) component.listeners = {};
            component.listeners[event] = fn;
        }
    }, Events_ = {
        on: function(component, events, $element) {
            if (null == $element) $element = component.$;
            var isarray = events instanceof Array, length = isarray ? events.length : 1;
            for (var i = 0, x; isarray ? i < length : i < 1; i++) {
                x = isarray ? events[i] : events;
                if (x instanceof Array) {
                    $element.on.apply($element, x);
                    continue;
                }
                for (var key in x) {
                    var fn = "string" === typeof x[key] ? component[x[key]] : x[key], parts = key.split(":");
                    $element.on(parts[0] || "click", parts.splice(1).join(":").trim() || null, fn.bind(component));
                }
            }
        }
    };
    var Compo = function() {
        return function(arg) {
            if ("string" === typeof arg) this.nodes = mask.compile(arg);
        };
    }();
    (function() {
        var parseSelector = function(selector, type, direction) {
            var key, prop, nextKey;
            if (null == key) switch (selector[0]) {
              case "#":
                key = "id";
                selector = selector.substring(1);
                prop = "attr";
                break;

              case ".":
                key = "class";
                selector = new RegExp("\\b" + selector.substring(1) + "\\b");
                prop = "attr";
                break;

              default:
                key = "node" == type ? "tagName" : "compoName";
            }
            if ("up" == direction) nextKey = "parent"; else nextKey = "node" == type ? "nodes" : "components";
            return {
                key: key,
                prop: prop,
                selector: selector,
                nextKey: nextKey
            };
        }, match = function(compo, selector, type) {
            if ("string" === typeof selector) {
                if (null == type) type = compo.compoName ? "compo" : "node";
                selector = parseSelector(selector, type);
            }
            var obj = selector.prop ? compo[selector.prop] : compo;
            if (null == obj) return false;
            if (null != selector.selector.test) {
                if (selector.selector.test(obj[selector.key])) return true;
            } else if (obj[selector.key] == selector.selector) return true;
            return false;
        }, find = function(compo, selector, direction, type) {
            if ("object" !== typeof compo) {
                console.warn("Invalid Compo", arguments);
                return null;
            }
            if ("string" === typeof selector) {
                if (null == type) type = compo.compoName ? "compo" : "node";
                selector = parseSelector(selector, type, direction);
            }
            if (compo instanceof Array) {
                for (var i = 0, x, length = compo.length; i < length; i++) {
                    x = compo[i];
                    var r = find(x, selector);
                    if (null != r) return r;
                }
                return null;
            }
            if (true === match(compo, selector)) return compo;
            return (compo = compo[selector.nextKey]) && find(compo, selector);
        }, findAll = function(compo, selector, type, out) {
            if (null == out) out = [];
            if ("string" === typeof selector) selector = parseSelector(selector, type);
            if (match(compo, selector)) out.push(compo);
            var childs = compo[selector.nextKey];
            if (null != childs) for (var i = 0; i < childs.length; i++) findAll(childs[i], selector, null, out);
            return out;
        };
        extend(Compo, {
            find: find,
            findAll: findAll,
            findCompo: function(compo, selector, direction) {
                return find(compo, selector, direction, "compo");
            },
            findNode: function(compo, selector, direction) {
                return find(compo, selector, direction, "node");
            },
            closest: function(compo, selector, type) {
                return find(compo, selector, "up", type);
            }
        });
    })();
    (function() {
        function addClass(compo, _class) {
            compo.attr["class"] = (compo.attr["class"] ? compo.attr["class"] + " " : "") + _class;
        }
        extend(Compo, {
            addClass: addClass
        });
    })();
    (function() {
        var ensureTemplate = function(compo) {
            if (null != compo.nodes) return;
            var template;
            if (null != compo.attr.template) {
                if ("#" === compo.attr.template[0]) {
                    var node = document.getElementById(compo.attr.template.substring(1));
                    template = node.innerHTML;
                } else template = compo.attr.template;
                delete compo.attr.template;
            }
            if ("string" == typeof template) template = mask.compile(template);
            if (null != template) {
                compo.nodes = template;
                return;
            }
            return;
        };
        extend(Compo, {
            render: function(compo, model, container, cntx) {
                if (null == cntx) cntx = compo;
                ensureTemplate(compo);
                var elements = mask.render(null == compo.tagName ? compo.nodes : compo, model, containerArray(), cntx);
                compo.$ = domLib(elements);
                if (null != compo.events) Events_.on(compo, compo.events);
                if (null != compo.compos) Children_.select(compo, compo.compos);
                if (null != container) for (var i = 0; i < elements.length; i++) container.appendChild(elements[i]);
                return this;
            },
            dispose: function(compo) {
                compo.dispose && compo.dispose();
                var i = 0, compos = compo.components, length = compos && compos.length;
                if (length) for (;i < length; i++) Compo.dispose(compos[i]);
            },
            config: {
                selectors: {
                    $: function(compo, selector) {
                        var r = compo.$.find(selector);
                        return r.length > 0 ? r : compo.$.filter(selector);
                    },
                    compo: function(compo, selector) {
                        var r = Compo.findCompo(compo, selector);
                        return r;
                    }
                },
                setDOMLibrary: function(lib) {
                    domLib = lib;
                }
            },
            shots: Shots
        });
    })();
    Compo.prototype = {
        render: function(model, container, cntx) {
            Compo.render(this, model, container, cntx);
            return this;
        },
        insert: function(parent) {
            for (var i = 0; i < this.$.length; i++) parent.appendChild(this.$[i]);
            Shots.emit(this, "DOMInsert");
            return this;
        },
        append: function(template, values, selector) {
            var parent;
            if (null == this.$) {
                var dom = "string" == typeof template ? mask.compile(template) : template;
                parent = selector ? Compo.findNode(this, selector) : this;
                if (null == parent.nodes) this.nodes = dom; else if (parent.nodes instanceof Array) parent.nodes.push(dom); else parent.nodes = [ this.nodes, dom ];
                return this;
            }
            var array = mask.render(template, values, containerArray(), this);
            parent = selector ? this.$.find(selector) : this.$;
            for (var i = 0; i < array.length; i++) parent.append(array[i]);
            Shots.emit(this, "DOMInsert");
            return this;
        },
        on: function() {
            var x = Array.prototype.slice.call(arguments);
            if (arguments.length < 3) {
                console.error("Invalid Arguments Exception @use .on(type,selector,fn)");
                return this;
            }
            if (null != this.$) Events_.on(this, [ x ]);
            if (null == this.events) this.events = [ x ]; else if (this.events instanceof Array) this.events.push(x); else this.events = [ x, this.events ];
            return this;
        },
        remove: function() {
            this.$ && this.$.remove();
            Compo.dispose(this);
            if (null != this.parent) {
                var i = this.parent.components.indexOf(this);
                this.parent.components.splice(i, 1);
            }
            return this;
        }
    };
    var CompoUtils = function() {};
    (function() {
        function extendClass(method) {
            CompoUtils.prototype[method] = function() {
                var l = arguments.length;
                return Compo[method](this, l > 0 ? arguments[0] : null, l > 1 ? arguments[1] : null, l > 2 ? arguments[2] : null, l > 3 ? arguments[3] : null);
            };
        }
        for (var key in Compo) {
            if (false === Compo.hasOwnProperty(key)) continue;
            if ("function" === typeof Compo[key]) extendClass(key);
        }
    })();
    global.Compo = Compo;
    global.CompoUtils = CompoUtils;
})();

(function() {
    "use strict";
    var w = window, r = "undefined" === typeof w.ruqq ? w.ruqq = {} : ruqq;
    r.doNothing = function() {
        return false;
    };
    (function(r) {
        var div = document.createElement("div"), I = r.info || {};
        r.info = I;
        I.hasTouchSupport = function() {
            if ("createTouch" in document) return true;
            try {
                return !!document.createEvent("TouchEvent").initTouchEvent;
            } catch (error) {
                return false;
            }
        }();
        I.prefix = function() {
            if ("transition" in div.style) return "";
            if ("webkitTransition" in div.style) return "webkit";
            if ("MozTransition" in div.style) return "Moz";
            if ("OTransition" in div.style) return "O";
            if ("msTransition" in div.style) return "ms";
            return "";
        }();
        I.cssprefix = I.prefix ? "-" + I.prefix.toLowerCase() + "-" : "";
        I.supportTransitions = I.prefix + "TransitionProperty" in div.style;
    })(r);
    return r;
})();

(function() {
    "use strict";
    var w = window, r = ruqq, prfx = r.info.cssprefix, vendorPrfx = r.info.prefix, getTransitionEndEvent = function() {
        var el = document.createElement("fakeelement"), transitions = {
            transition: "transitionend",
            OTransition: "oTransitionEnd",
            MSTransition: "msTransitionEnd",
            MozTransition: "transitionend",
            WebkitTransition: "webkitTransitionEnd"
        }, event = null;
        for (var t in transitions) if (void 0 !== el.style[t]) {
            event = transitions[t];
            break;
        }
        getTransitionEndEvent = function() {
            return event;
        };
        el = null;
        transitions = null;
        return getTransitionEndEvent();
    }, I = {
        prop: prfx + "transition-property",
        duration: prfx + "transition-duration",
        timing: prfx + "transition-timing-function",
        delay: prfx + "transition-delay"
    };
    var Animate = function(element, property, valueTo, duration, callback, valueFrom, timing) {
        var data = "string" === typeof property ? {
            property: property,
            valueFrom: valueFrom,
            valueTo: valueTo,
            duration: duration,
            timing: timing,
            callback: callback
        } : property, $this = $(element);
        if (null == data.timing) data.timing = "linear";
        if (null == data.duration) data.duration = 300;
        if (null != data.valueFrom) {
            var css = {};
            css[data.property] = data.valueFrom;
            css[prfx + "transition-property"] = "none";
            css[prfx + "transition-duration"] = "0ms";
            $this.css(css);
        }
        setTimeout(function() {
            var css = {};
            css[data.property] = data.valueTo;
            css[prfx + "transition-property"] = data.property;
            css[prfx + "transition-duration"] = data.duration + "ms";
            css[prfx + "transition-timing-function"] = data.timing;
            $this.css(css);
            if (data.callback) {
                var callback = function() {
                    element.removeEventListener(getTransitionEndEvent(), callback, false);
                    data.callback();
                };
                element.addEventListener(getTransitionEndEvent(), callback, false);
            }
        }, 0);
        return this;
    };
    var TransformModel = function() {
        var regexp = /([\w]+)\([^\)]+\)/g;
        function extract(str) {
            var props = null;
            regexp.lastIndex = 0;
            while (1) {
                var match = regexp.exec(str);
                if (!match) return props;
                (props || (props = {}))[match[1]] = match[0];
            }
        }
        function stringify(props) {
            var keys = Object.keys(props).sort().reverse();
            for (var i = 0; i < keys.length; i++) keys[i] = props[keys[i]];
            return keys.join(" ");
        }
        return Class({
            Construct: function() {
                this.transforms = {};
            },
            handle: function(data) {
                var start = extract(data.from), end = extract(data.to), prop = null;
                if (start) {
                    for (prop in this.transforms) if (false === prop in start) start[prop] = this.transforms[prop];
                    data.from = stringify(start);
                    for (prop in start) this.transforms[prop] = start[prop];
                }
                for (prop in this.transforms) if (false === prop in end) end[prop] = this.transforms[prop];
                data.to = stringify(end);
                for (prop in end) this.transforms[prop] = end[prop];
            }
        });
    }();
    var ModelData = function() {
        var vendorProperties = {
            transform: null
        };
        function parse(model) {
            var arr = model.split(/ *\| */g), data = {}, length = arr.length;
            data.prop = arr[0] in vendorProperties ? prfx + arr[0] : arr[0];
            var vals = arr[1].split(/ *> */);
            if (vals[0]) data.from = vals[0];
            data.to = vals[vals.length - 1];
            if (length > 2) {
                var info = /(\d+m?s)?\s*([a-z]+[^\s]*)?\s*(\d+m?s)?/.exec(arr[2]);
                if (null != info) {
                    data.duration = info[1] || "200ms";
                    data.timing = info[2] || "linear";
                    data.delay = info[3] || "0";
                    return data;
                }
            }
            data.duration = "200ms";
            data.timing = "linear";
            data.delay = "0";
            return data;
        }
        return Class({
            Construct: function(data, parent) {
                this.parent = parent;
                this.transformModel = parent && parent.transformModel || new TransformModel();
                var model = data.model || data;
                if (model instanceof Array) {
                    this.model = [];
                    for (var i = 0, length = model.length; i < length; i++) this.model.push(new ModelData(model[i], this));
                } else if (model instanceof Object) this.model = [ new ModelData(model, this) ]; else if ("string" === typeof model) {
                    this.model = parse(model);
                    if (~this.model.prop.indexOf("transform")) this.transformModel.handle(this.model);
                }
                if (null != data.next) this.next = new ModelData(data.next, this);
                this.state = 0;
                this.modelCount = this.model instanceof Array ? this.model.length : 1;
                this.nextCount = 0;
                if (null != this.next) this.nextCount = this.next instanceof Array ? this.next.length : 1;
            },
            reset: function() {
                this.state = 0;
                this.modelCount = this.model instanceof Array ? this.model.length : 1;
                this.nextCount = 0;
                if (null != this.next) this.nextCount = this.next instanceof Array ? this.next.length : 1;
                var isarray = this.model instanceof Array, length = isarray ? this.model.length : 1, x = null;
                for (var i = 0; isarray ? i < length : i < 1; i++) {
                    x = isarray ? this.model[i] : this.model;
                    x.reset && x.reset();
                }
            },
            getNext: function() {
                if (0 === this.state) {
                    this.state = 1;
                    return this;
                }
                if (1 == this.state && this.modelCount > 0) --this.modelCount;
                if (1 == this.state && 0 === this.modelCount) {
                    this.state = 2;
                    if (this.next) return this.next;
                }
                if (2 == this.state && this.nextCount > 0) --this.nextCount;
                if (2 == this.state && 0 === this.nextCount && this.parent) return this.parent.getNext && this.parent.getNext();
                return null;
            }
        });
    }();
    var Stack = Class({
        Construct: function() {
            this.arr = [];
        },
        put: function(modelData) {
            if (null == modelData) return false;
            var next = modelData.getNext(), result = false, length, i;
            if (null == next) return false;
            if (next instanceof Array) {
                for (i = 0, length = next.length; i < length; i++) if (true === this.put(next[i])) r = true;
                return r;
            }
            if (0 === next.state) next.state = 1;
            if (next.model instanceof Array) {
                r = false;
                for (i = 0, length = next.model.length; i < length; i++) if (true === this.put(next.model[i])) r = true;
                return r;
            }
            this.resolve(next.model.prop);
            this.arr.push(next);
            return true;
        },
        resolve: function(prop) {
            for (var i = 0, x, length = this.arr.length; i < length; i++) {
                x = this.arr[i];
                if (x.model.prop == prop) {
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
                if ("from" in x.model) startCss[x.model.prop] = x.model.from;
                css[x.model.prop] = x.model.to;
                for (key in I) (css[I[key]] || (css[I[key]] = [])).push(x.model[key]);
            }
            for (key in I) css[I[key]] = css[I[key]].join(",");
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
            var startCss = {}, css = {};
            this.model.reset();
            this.stack.clear();
            this.stack.put(this.model);
            this.stack.getCss(startCss, css);
            element.addEventListener(getTransitionEndEvent(), this.transitionEnd, false);
            this.element = element;
            this.apply(startCss, css);
        },
        transitionEnd: function(event) {
            if (true === this.stack.resolve(event.propertyName)) {
                var startCss = {}, css = {};
                this.stack.getCss(startCss, css);
                this.apply(startCss, css);
            } else if (this.stack.arr.length < 1) {
                this.element.removeEventListener(getTransitionEndEvent(), this.transitionEnd, false);
                this.onComplete && this.onComplete();
            }
        },
        apply: function(startCss, css) {
            startCss[prfx + "transition"] = "none";
            var style = this.element.style;
            if (null != startCss) for (var key in startCss) style.setProperty(key, startCss[key], "");
            setTimeout(function() {
                for (var key in css) style.setProperty(key, css[key], "");
            }, 0);
        }
    });
    var Sprite = function() {
        var keyframes = {}, vendor = null, initVendorStrings = function() {
            vendor = {
                keyframes: "@" + vendorPrfx + "keyframes",
                AnimationIterationCount: vendorPrfx + "AnimationIterationCount",
                AnimationDuration: vendorPrfx + "AnimationDuration",
                AnimationTimingFunction: vendorPrfx + "AnimationTimingFunction",
                AnimationFillMode: vendorPrfx + "AnimationFillMode",
                AnimationName: vendorPrfx + "AnimationName"
            };
        };
        return {
            create: function(data) {
                if (null == vendor) initVendorStrings();
                if (null == keyframes[data.id]) {
                    var pos = document.styleSheets[0].insertRule(vendor.keyframes + " " + data.id + " {}", 0), keyFrameAnimation = document.styleSheets[0].cssRules[pos], frames = data.frames - (data.frameStart || 0), step = 0 | 100 / frames, property = data.property || "background-position-x";
                    for (var i = 0; i < frames; i++) {
                        var rule = step * (i + 1) + "% { " + property + ": " + -data.frameWidth * (i + (data.frameStart || 0)) + "px}";
                        keyFrameAnimation.insertRule(rule);
                    }
                    keyFrameAnimation.iterationCount = data.iterationCount;
                    keyFrameAnimation.frameToStop = data.frameToStop;
                    keyframes[data.id] = keyFrameAnimation;
                }
            },
            start: function($element, animationId, msperframe) {
                var style = $element.get(0).style;
                style[vendor.AnimationName] = "none";
                setTimeout(function() {
                    var keyframe = keyframes[animationId];
                    if ("forwards" == style[vendor.AnimationFillMode]) {
                        Sprite.stop($element);
                        return;
                    }
                    $element.on(vendor + "AnimationEnd", function() {
                        var css;
                        if (keyframe.frameToStop) {
                            var styles = keyframe.cssRules[keyframe.cssRules.length - 1].style;
                            css = {};
                            for (var i = 0; i < styles.length; i++) css[styles[i]] = styles[styles[i]];
                        }
                        Sprite.stop($element, css);
                    });
                    style[vendor.AnimationIterationCount] = keyframe.iterationCount || 1;
                    style[vendor.AnimationDuration] = keyframe.cssRules.length * msperframe + "ms";
                    style[vendor.AnimationTimingFunction] = "step-start";
                    style[vendor.AnimationFillMode] = keyframe.frameToStop ? "forwards" : "none";
                    style[vendor.AnimationName] = animationId;
                }, 0);
            },
            stop: function($element, css) {
                var style = $element.get(0).style;
                style[vendor.AnimationFillMode] = "none";
                style[vendor.AnimationName] = "";
                if (null != css) $element.css(css);
            }
        };
    }();
    r.animate = Animate;
    r.animate.Model = Model;
    r.animate.sprite = Sprite;
})();

include.setCurrent({
    id: "/script/preview/preview.js",
    namespace: "component.preview",
    url: "/script/preview/preview.js"
});

(function(resp) {
    var _window, _document, _body, _iframe, _style;
    var Window = function() {
        return {
            init: function(iframe) {
                if (null != {}.__proto__ && 0) {
                    _window = iframe.contentWindow;
                    _window.Function.prototype.apply.prototype = Function.prototype.apply.bind(Function);
                    _window.Function.prototype.call = Function.prototype.call.bind(Function);
                    Object.extend(_window, {
                        Class: Class,
                        Compo: Compo,
                        mask: mask,
                        include: include.instance(),
                        ruqq: ruqq,
                        Object: Object
                    });
                } else _window = window;
                _document = iframe.contentDocument || iframe.contentWindow.contentDocument;
                _document.open();
                _document.write("<html><head><style></style><style>body{font-family:sans-serif;}</style></head><body></body></html>");
                _document.close();
                _style = _document.getElementsByTagName("style")[0];
            },
            eval: function(code) {
                _window.eval(code);
            },
            reload: function() {
                if (_window == window) return;
                _window.location = "about:blank";
            },
            setStyle: function(preview, style) {
                if (preview._style == style && _window == window) return;
                _style.innerHTML = preview._style = style;
            },
            setCode: function(preview, code) {
                if (preview._code == code && _window == window) return;
                if (_window.dispose instanceof Function) try {
                    _window.dispose();
                } catch (error) {
                    console.error("dispose:", error.toString());
                }
                _window.eval(code);
                preview._code = code;
            },
            setTemplate: function(preview, template) {
                if (preview._compo) preview._compo.remove();
                preview._template = template;
                preview._compo = new Compo(template).render(_window.model || {}).insert(_document.body);
            },
            setHTML: function(preview, template) {
                var div = document.createElement("div");
                div.appendChild(mask.render(template, _window.model));
                _document.body.innerHTML = "<pre><code></code></pre>";
                var $code = _document.body.getElementsByTagName("code")[0], html = style_html(div.innerHTML);
                $code.textContent = html;
            }
        };
    }();
    mask.registerHandler("preview", Class({
        Base: Compo,
        Construct: function() {
            this.compos = {
                $notification: "$: .notification",
                $btnHTML: "$: #btnHTML"
            };
        },
        events: {
            "click: #btnHTML": function() {
                this.asHTML = this.compos.$btnHTML.toggleClass("active").hasClass("active");
                this.update(this._code, this._style, this._template);
            }
        },
        render: function(model, container, cntx) {
            this.tagName = "div";
            this.nodes = mask.compile('.notification; iframe src="about:blank"; button#btnHTML > "HTML"');
            Compo.render(this, model, container, cntx);
            Compo.shots.on(this, "DOMInsert", this.DOMInsert);
        },
        DOMInsert: function() {
            Window.init(_iframe = this.$.find("iframe")[0]);
        },
        prepair: function(code, style, template, callback) {
            if (_document) {
                if (code || template) _document.body.innerHTML = "";
                if (_window == window) {
                    callback && callback();
                    return;
                }
            }
            Window.reload();
            setTimeout(function() {
                Window.init(_iframe);
                callback && callback();
            });
        },
        resolveHTML: function() {},
        update: function(code, style, template) {
            this.prepair(code, style, template, function() {
                var error;
                try {
                    if (template && this.asHTML) {
                        code && Window.setCode(this, code);
                        Window.setHTML(this, template);
                        this._style = style;
                        this._template = template;
                        return;
                    }
                    if (code || template) {
                        code && Window.setCode(this, code);
                        Window.setTemplate(this, template || this._template);
                    }
                    style && Window.setStyle(this, style);
                } catch (err) {
                    error = err;
                }
                this.notify(error);
            }.bind(this));
        },
        notify: function(error) {
            error && console.error(error.toString());
            var klass = error ? "red" : "green", $notification = this.compos.$notification;
            clearTimeout(this.timeout);
            $notification.removeClass("red green").addClass(klass);
            this.timeout = setTimeout(function() {
                $notification.removeClass(klass);
            }, 1e3);
        }
    }));
})();

include.getResource("/script/preview/preview.js", "js").readystatechanged(3);

(function(resp) {
    function activate($this, name) {
        $this.compos.$panels.removeClass("active").filter('[name="' + name + '"]').addClass("active");
        $this.compos.$buttons.removeClass("active").filter('[name="' + name + '"]').addClass("active");
        var editor = editors[name];
        editor.renderer.updateFull();
        editor.focus();
    }
    mask.registerHandler("tabs", Class({
        Base: Compo,
        Construct: function() {
            this.attr = {
                "class": "tabs"
            };
            this.compos = {
                $panels: "$: .panels > div",
                $buttons: "$: .header > button"
            };
            Class.bind(this, "next");
        },
        events: {
            "click: .header > button:not(.active)": function(event) {
                activate(this, $(event.currentTarget).attr("name"));
            }
        },
        render: function(model, container, cntx) {
            this.tagName = "div";
            Compo.render(this, model, container, cntx);
        },
        next: function() {
            var $next = this.compos.$buttons.filter(".active").next("button");
            if (0 == $next.length) $next = this.compos.$buttons.first();
            activate(this, $next.attr("name"));
        },
        current: function() {
            return this.compos.$buttons.filter(".active").attr("name");
        }
    }));
})();

(function(resp) {
    var itemTemplate = 'list > .-ddmenu.item data-item="#{id}" > "#{title}"';
    mask.registerHandler("dropdownMenu", Class({
        Base: Compo,
        Construct: function() {
            this.attr = {
                "class": "dropdownMenu"
            };
            this.compos = {
                button: "$: .caption"
            };
        },
        events: {
            "click: .caption": function() {
                this.$.addClass("visible");
                this.compos.button.addClass("active");
                $(document).on("mousedown", function(e) {
                    if ($(e.target).closest(".dropdownMenu").length) return;
                    this.hide();
                }.bind(this));
            },
            "click: .item": function(e) {
                this.hide();
                this.$.trigger("selected", [ $(e.currentTarget).data("id") ]);
            }
        },
        hide: function() {
            this.$.removeClass("visible");
            this.compos.button.removeClass("active");
            $(document).off("mousedown");
        },
        render: function(model, container, cntx) {
            this.tagName = "div";
            if (false === this.nodes instanceof Array) this.nodes = [ this.nodes ];
            Compo.render(this, model, container, cntx);
        },
        add: function(items) {
            var dom = mask.render(itemTemplate, items, null, this);
            this.$.find(".items").append(dom);
        }
    }));
})();

include.setCurrent({
    id: "/script/shortend-dialog/shortend-dialog.js",
    namespace: "component.shortend-dialog",
    url: "/script/shortend-dialog/shortend-dialog.js"
});

include.load("shortend-dialog.mask::Template").done(function(resp) {
    var animations = {};
    Object.lazyProperty(animations, "model", function() {
        var Model = ruqq.animate.Model;
        return {
            show: {
                overlay: new Model({
                    model: [ "display | block", "opacity | 0 > 1 | 200ms" ]
                }),
                panel: new Model({
                    model: [ "transform | translate(0px,130%) > translate(0px, 0px) | 300ms ease-in 150ms", "opacity | 0 > 1 | 300ms linear 200 ms" ]
                })
            },
            hide: {
                panel: new Model({
                    model: [ "transform | translate(0px,0px) > translate3d(0px, 120%) | 300ms ease-in", "opacity | 1 > 0 | 300ms ease-in" ]
                }),
                overlay: new Model({
                    model: "opacity | 1 > 0 | 400ms linear 450ms",
                    next: "display | > none"
                })
            }
        };
    });
    Object.lazyProperty(include.promise("compo"), "shortendDialog", function() {
        return new Dialog().render().insert(document.body);
    });
    var cache = {};
    var Dialog = Class({
        Base: Compo,
        compos: {
            panel: [ "$: .modalOverlay", {
                "click:": function(e) {
                    var _class = $(e.target).attr("class");
                    if (!_class) return;
                    if (_class.indexOf("modalOverlay") > -1 || _class.indexOf("cell") > -1) this.hide();
                }
            } ],
            container: "$: .shortend-container"
        },
        attr: {
            template: resp.load.Template
        },
        show: function(date) {
            animations.model.show.overlay.start(this.$.filter(".modalOverlay").get(0));
            animations.model.show.panel.start(this.$.find(".shortend-container").get(0));
            return this;
        },
        hide: function() {
            animations.model.hide.panel.start(this.$.find(".shortend-container").get(0));
            animations.model.hide.overlay.start(this.$.filter(".modalOverlay").get(0));
        },
        state: function(state) {
            this.compos.container.children(".active").removeClass("active");
            this.compos.container.children("." + state).addClass("active");
        },
        process: function(url) {
            var cached = cache[url];
            if (cached) {
                this.$.find("input").val(cached);
                this.state("result");
                return;
            }
            this.state("progress");
            var that = this;
            setTimeout(function() {
                UrlCode.getShortend(url, function(response) {
                    if (!response) {
                        alert("Sorry, could not resolve the shortend url");
                        that.hide();
                        return;
                    }
                    cache[url] = response;
                    that.process(url);
                });
            }, 200);
            return this;
        }
    });
});

include.getResource("/script/shortend-dialog/shortend-dialog.js", "js").readystatechanged(3);

(function(e) {
    function a(e, t) {
        var n = e.length;
        while (n--) if (e[n] === t) return n;
        return -1;
    }
    function f(e, t) {
        var i, o, f, l, c;
        i = e.keyCode, a(u, i) == -1 && u.push(i);
        if (93 == i || 224 == i) i = 91;
        if (i in r) {
            r[i] = !0;
            for (f in s) s[f] == i && (h[f] = !0);
            return;
        }
        if (!h.filter.call(this, e)) return;
        if (!(i in n)) return;
        for (l = 0; l < n[i].length; l++) {
            o = n[i][l];
            if (o.scope == t || "all" == o.scope) {
                c = o.mods.length > 0;
                for (f in r) if (!r[f] && a(o.mods, +f) > -1 || r[f] && a(o.mods, +f) == -1) c = !1;
                (0 == o.mods.length && !r[16] && !r[18] && !r[17] && !r[91] || c) && o.method(e, o) === !1 && (e.preventDefault ? e.preventDefault() : e.returnValue = !1, 
                e.stopPropagation && e.stopPropagation(), e.cancelBubble && (e.cancelBubble = !0));
            }
        }
    }
    function l(e) {
        var t = e.keyCode, n, i = a(u, t);
        i >= 0 && u.splice(i, 1);
        if (93 == t || 224 == t) t = 91;
        if (t in r) {
            r[t] = !1;
            for (n in s) s[n] == t && (h[n] = !1);
        }
    }
    function c() {
        for (t in r) r[t] = !1;
        for (t in s) h[t] = !1;
    }
    function h(e, t, r) {
        var i, u, a, f;
        void 0 === r && (r = t, t = "all"), e = e.replace(/\s/g, ""), i = e.split(","), 
        "" == i[i.length - 1] && (i[i.length - 2] += ",");
        for (a = 0; a < i.length; a++) {
            u = [], e = i[a].split("+");
            if (e.length > 1) {
                u = e.slice(0, e.length - 1);
                for (f = 0; f < u.length; f++) u[f] = s[u[f]];
                e = [ e[e.length - 1] ];
            }
            e = e[0], e = o[e] || e.toUpperCase().charCodeAt(0), e in n || (n[e] = []), n[e].push({
                shortcut: i[a],
                scope: t,
                method: r,
                key: i[a],
                mods: u
            });
        }
    }
    function p(e) {
        if ("string" == typeof e) {
            if (1 != e.length) return !1;
            e = e.toUpperCase().charCodeAt(0);
        }
        return a(u, e) != -1;
    }
    function d() {
        return u;
    }
    function v(e) {
        var t = (e.target || e.srcElement).tagName;
        return "INPUT" != t && "SELECT" != t && "TEXTAREA" != t;
    }
    function m(e) {
        i = e || "all";
    }
    function g() {
        return i || "all";
    }
    function y(e) {
        var t, r, i;
        for (t in n) {
            r = n[t];
            for (i = 0; i < r.length; ) r[i].scope === e ? r.splice(i, 1) : i++;
        }
    }
    function b(e, t, n) {
        e.addEventListener ? e.addEventListener(t, n, !1) : e.attachEvent && e.attachEvent("on" + t, function() {
            n(window.event);
        });
    }
    function E() {
        var t = e.key;
        return e.key = w, t;
    }
    var t, n = {}, r = {
        16: !1,
        18: !1,
        17: !1,
        91: !1
    }, i = "all", s = {
        "⇧": 16,
        shift: 16,
        "⌥": 18,
        alt: 18,
        option: 18,
        "⌃": 17,
        ctrl: 17,
        control: 17,
        "⌘": 91,
        command: 91
    }, o = {
        backspace: 8,
        tab: 9,
        clear: 12,
        enter: 13,
        "return": 13,
        esc: 27,
        escape: 27,
        space: 32,
        left: 37,
        up: 38,
        right: 39,
        down: 40,
        del: 46,
        "delete": 46,
        home: 36,
        end: 35,
        pageup: 33,
        pagedown: 34,
        ",": 188,
        ".": 190,
        "/": 191,
        "`": 192,
        "-": 189,
        "=": 187,
        ";": 186,
        "'": 222,
        "[": 219,
        "]": 221,
        "\\": 220
    }, u = [];
    for (t = 1; t < 20; t++) s["f" + t] = 111 + t;
    for (t in s) h[t] = !1;
    b(document, "keydown", function(e) {
        f(e, i);
    }), b(document, "keyup", l), b(window, "focus", c);
    var w = e.key;
    e.key = h, e.key.setScope = m, e.key.getScope = g, e.key.deleteScope = y, e.key.filter = v, 
    e.key.isPressed = p, e.key.getPressedKeyCodes = d, e.key.noConflict = E, "undefined" != typeof module && (module.exports = key);
})(this);

include.setCurrent({
    id: "/script/presets.js",
    namespace: "script.presets",
    url: "/script/presets.js"
});

include.load("/presets/presets.txt").done(function(resp) {
    var id = 0, Preset = Class({
        Construct: function(str) {
            this.id = ++id;
            var items = str.split("----");
            if (items.length < 4) {
                console.warn(this);
                this.valid = false;
                return;
            }
            ruqq.arr.aggr(items, this, function(x, aggr) {
                if (!x) return;
                x = x.replace(/^[\s]+/, "");
                var index = x.indexOf(":"), key = x.substring(0, index), value = x.substring(++index).replace(/^[\s]+/, "");
                aggr[key] = value;
            });
        }
    });
    var arr = resp.load.presets.split(/[\s]*====[\s]*/g);
    window.XX = include.exports = ruqq.arr(arr).where(function(x) {
        return !!x;
    }).map(function(x) {
        return new Preset(x);
    }).items;
});

include.getResource("/script/presets.js", "js").readystatechanged(3);

(function() {
    window.UrlCode = new (Class({
        parse: function() {
            var hash = window.location.hash.replace(/^[#\/]+/, "");
            hash = decodeURIComponent(hash);
            if (0 !== hash.indexOf("code:")) return "";
            hash = hash.substring("code:".length);
            function split(arr, type) {
                return ruqq.arr.aggr(arr, [], function(x, aggr) {
                    var parts = x.split(type);
                    if (parts.length > 1) parts[1] = type + parts[1];
                    return aggr.concat(parts);
                });
            }
            function clean(arr) {
                return ruqq.arr.remove(arr, function(x) {
                    return !x;
                });
            }
            var arr = [ hash ];
            arr = split(arr, "-mask-");
            arr = split(arr, "-javascript-");
            arr = split(arr, "-style-");
            arr = clean(arr);
            var source = {};
            ruqq.arr.each(arr, function(x) {
                var type = x.substring(1, x.indexOf("-", 1)), code = x.substring(x.indexOf("-", 1) + 1);
                source[type] = code;
            });
            console.log(source);
            return source;
        },
        set: function(javascript, style, mask) {
            var line = "code:";
            if (mask) line += "-mask-" + mask;
            if (javascript) line += "-javascript-" + javascript;
            if (style) line += "-style-" + style;
            window.location.hash = encodeURIComponent(line);
        },
        getShortend: function(url, callback) {
            $.getJSON("http://api.bitly.com/v3/shorten?callback=?", {
                format: "json",
                longUrl: url,
                apiKey: "R_76ebf1167111bc97cdd1a4486fef729c",
                login: "tenbits"
            }, function(response) {
                callback && callback(response.data && response.data.url);
            });
        }
    }))();
})();

include.setCurrent({
    id: "/script/main.js",
    namespace: "",
    url: "/script/main.js"
});

include.routes({
    component: "/script/{0}/{1}.js",
    vendor: "/.reference/libjs/vendor-lib/{0}/{1}.js",
    script: "/script/{0}.js"
}).instance().js({
    component: [ "preview", "shortend-dialog" ],
    script: [ "presets" ]
}).ready(function(resp) {
    window.app = new (Class({
        Base: Compo,
        attr: {
            template: document.getElementById("layout").innerHTML
        },
        compos: {
            preview: "compo: preview",
            tabs: "compo: tabs",
            ddMenu: "compo: dropdownMenu",
            btnSetLink: "$: #setLink",
            btnShortend: "$: #getShortend"
        }
    }))().render({
        presets: resp.presets
    }).insert(document.body);
    window.editors = {};
    function createEditor(type, highlight) {
        editors[type] = ace.edit("editor-" + type);
        editors[type].setTheme("ace/theme/monokai");
        editors[type].getSession().setMode("ace/mode/" + (highlight || type));
    }
    createEditor("mask", "coffee");
    createEditor("javascript");
    createEditor("style", "css");
    (function() {
        var editors = window.editors, preview = app.compos.preview, deferredTimer, types;
        function getSource(type) {
            return editors[type].getValue();
        }
        function deferUpdate(type) {
            if (types && !types.push) debugger;
            types = types ? types.concat([ type ]) : [ type ];
            cancelAnimationFrame(deferredTimer);
            deferredTimer = requestAnimationFrame(update);
        }
        function update() {
            if (null == types) return;
            var source = {};
            for (var i = 0, x, length = types.length; i < length; i++) {
                x = types[i];
                source[x] = getSource(x);
            }
            types = null;
            preview.update(source.javascript, source.style, source.mask);
        }
        function setValues(source) {
            for (var key in editors) {
                if (!source[key]) continue;
                editors[key].setValue(source[key], 1);
            }
            editors[app.compos.tabs.current()].focus();
        }
        var command = {
            name: "nextTab",
            bindKey: {
                mac: "Shift-Tab",
                win: "Shift-Tab"
            },
            exec: app.compos.tabs.next
        };
        for (var x in editors) {
            editors[x].on("change", deferUpdate.bind(this, x));
            editors[x].commands.addCommand(command);
            editors[x].setHighlightActiveLine(false);
            editors[x].setShowPrintMargin(false);
        }
        key("shift+tab", function(e) {
            app.compos.tabs.next();
            e.preventDefault();
            return false;
        });
        app.compos.ddMenu.$.on("selected", function(event, id) {
            setValues(ruqq.arr.first(resp.presets, "id", "==", id));
        });
        var code = UrlCode.parse();
        if (code) setValues(code); else setValues(resp.presets[1]);
        app.compos.btnSetLink.on("click", function() {
            UrlCode.set(getSource("javascript"), getSource("style"), getSource("mask"));
        });
        app.compos.btnShortend.on("click", function() {
            UrlCode.set(getSource("javascript"), getSource("style"), getSource("mask"));
            window.compo.shortendDialog.show().process(window.location.toString());
        });
    })();
    window.app = app;
});

include.getResource("/script/main.js", "js").readystatechanged(3);