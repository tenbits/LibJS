(function(global) {

    var handler, _stack = [];

    /** convert line parameters to object. : 'e=10' to {e:10} */

    function query_deserialize(line) {
        var o = {};
        if (!line) {
            return o;
        }
        for (var item, i = 0, parts = line.split('&'); i < parts.length; i++) {
            item = parts[i].split('=');
            //if (item.length == 2){
                o[item[0]] = item[1];
            //}
        }
        return o;
    }

    /** parse route.match(string '/:route1/:route2') into route object */
    var parse = (function() {
        function regexpify(line) {
            return line.replace(/([\\\[\]\(\)])/g, '\\$1');
        }


        var part = {
            ':': '(/([\\w\\.\\-_]+))',
            '?': '(/([\\w\\.\\-_]+))?',
            'var' : '([\\w\\.\\-_]+)'
        };

        return function(route) {
            var parts = route.match.split('/'),
                param = '',
                regexpIndex = 2,
                prefix, var_, var_index, c, isConditional;

            console.log(route);
            for (var i = 0, x, length = parts.length; i < length; i++) {
                x = parts[i];
                if (!x) {
                    parts.splice(i, 1);
                    i--;
                    length--;
                    continue;
                }

                c = x[0];
                
                isConditional = x[0] === '?';
                if (isConditional) {
                    x = x.substring(1);
                    
                }
                
                var_index = x.indexOf(':');
                if (var_index !== -1) {
                    prefix = x.substring(0, var_index);
                    
                    
                    param += (param ? '&' : '') + x.substring(var_index + 1) + '=$' + regexpIndex;
                    x = prefix + part['var'];
                }
                
                if (isConditional || var_index !== -1) {
                    
                    parts[i] = '(/' + x + ')' + (isConditional ? '?' : '');
                    regexpIndex += 2;
                    continue;
                }
                
                parts[i] = '/' + regexpify(x);
            }

            route.match = new RegExp('^' + parts.join(''));
            route.param = param;
            
            console.log('match', parts.join(''), param);
            window.r = route.match;
            
            return route;
        };
    }());

    var match = function(routes, hash) {
        if (!routes) {
            return;
        }

        for (var i = 0, x, length = routes.length; i < length; i++) {
            x = routes[i];
            var result = x.match.exec(hash);
            if (!result || !result.length) {
                continue;
            }

            x.callback(query_deserialize(hash.replace(x.match, x.param)), hash);
        }

    };

    function route_resolveMany(routes, hash) {
        if (routes == null) {
            return null;
        }

        var i = 0,
            imax = routes.length,
            x, result, match;
        for (; i < imax; i++) {
            x = routes[i];

            if (x.match.test(hash)) {
                if (result == null) {
                    result = [x];
                    continue;
                }
                result.push(x);
            }
        }

        return result;

    };

    var combine = function(_1, _2) {
        if (!_1) return _2;
        if (!_2) return _1;
        if (_2[0] == '/') _2 = _2.substring(1);
        if (_1[_1.length - 1] == '/') return _1 + _2;
        return _1 + '/' + _2;
    };

    var getHash = function() {
        return (global.location.hash || '').replace(/^#\/?/, '/');
    };

    var regexpify = function(value) {
        if (value instanceof RegExp) {
            return value;
        }
        if (typeof value !== 'string') {
            console.error('Unsupported type', value);
            value = '';
        }

        value = value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        return new RegExp('^' + value, 'i');
    };


    function HashHandler(root) {
        this.root = root;
        this.rootRegexp = regexpify(root);
        this.routes = [];
    }

    HashHandler.prototype = {
        constructor: HashHandler,
        hashchanged: function(hash) {
            if (hash == null) {
                hash = getHash();

/*  root handler calls childrens hashchanged alwas with
                 *  cutted hash */
                if (this.root !== '/') {
                    if (this.rootRegexp.test(hash) === false) {
                        return;
                    }
                    hash = hash.replace(this.rootRegexp, '');
                }
            }

            _stack.push(hash);
            match(this.routes, hash);
        },
        /**
         *      routes = {Object} =
         *      {
         *              match: {regexp},
         *              param: {querystring} // 'key=$1&key2=$2'
         *      }
         *
         *      routes = {String} = '/:key/value'
         */
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
                x = null,
                i = 0;
            for (; i < length; i++) {
                x = isarray ? routes[i] : routes;

                if (typeof x.match === 'string') {
                    parse(x);
                }

                this.routes.push(x);
            }
        },

        clear: function() {
            this.routes = [];
        },

        navigate: function(hash) {
            global.location.hash = !hash ? '' : combine(this.root, hash);
        },
        current: function() {
            var hash = getHash(),
                routes = route_resolveMany(this.routes, hash),
                current = {},
                obj;

            if (routes == null) {
                return null;
            }

            var i = 0,
                imax = routes.length,
                x, key;
            for (; i < imax; i++) {
                x = routes[i];
                current = obj_extend(current, query_deserialize(hash.replace(x.match, x.param)));
            }

            return current;
        },

        createHandler: function(path) {

            path = path.replace(/(^[\/]+)|([\/]+$)/g, '');

            var root = combine(this.root, path),
                handler = new HashHandler(root);

            this.add(path, function(hash, raw) {
                handler.hashchanged(raw.replace(root, ''));
            });

            return handler;
        },
        
        back: function(){
            if (_stack.length < 2) {
                return;
            }
            
            var current = _stack.pop(),
                last = _stack.pop();
            
            this.navigate(last);
            
        },
        stack: function(){
            return _stack;
        }
    };



    global.routes = handler = new HashHandler('/');



    global.onhashchange = function() {
        handler.hashchanged(getHash());
    };


    function obj_extend(target, source) {
        if (source == null) {
            return target;
        }
        if (target == null) {
            target = {};
        }

        for (var key in source) {
            target[key] = source[key];
        }

        return target;
    }
}(window));
