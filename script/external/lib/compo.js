include.js({
    lib: 'mask'
}).done(function() {

    var w = window,
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
                if (e == null) console.error('Template Element not Found:', arg);
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
                        var fn = x[key],
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
        append: function(template, values) {
            if (this.$ != null) {
                var array = mask.renderDom(template, values, Helper.containerArray(), this);
                for (var i = 0; i < array.length; i++) {
                    this.$.append(array[i]);
                }
                Shots.emit(this, 'DOMInsert');
            } else {
                var dom = typeof template == 'string' ? mask.compile(template) : template;
                if (this.nodes == null) this.nodes = dom;
                else if (this.nodes instanceof Array) this.nodes.push(dom);
                else this.nodes = [this.nodes, dom];
            }
            return this;
        },
        create: function(values, cntx) {
            if (cntx == null) cntx = this;

            Helper.ensureTemplate(this);

            var elements = mask.renderDom(this.tagName == null ? this.nodes : this, values, Helper.containerArray(), cntx);
            this.$ = $(elements);

            if (this.events != null) {
                //for (var key in this.events) {
                //    var fn = this.events[key],
                //        parts = key.split(':');
                //
                //    this.$.on(parts[0] || 'click', parts.splice(1).join(':'), fn.bind(this));
                //}
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

                    this.compos[key] = engine(this, selector.substring(++index));
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
                        return Compo.find(compo, selector);
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
            find: function(compo, selector, direction, type) {
                if (compo == null) return null;
                if (compo instanceof Array) {
                    for (var i = 0, x, length = compo.length; x = compo[i], i < length; i++) {
                        var r = Compo.find(x, selector, direction, type);
                        if (r != null) return r;
                    }
                    return null;
                }

                if (type == null) {
                    type = compo.compoName ? 'node' : 'compo';
                }

                var key = arguments[4],
                    prop = arguments[5],
                    nextKey = arguments[6];

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

                var obj = prop ? compo[prop] : compo;
                if (obj == null) return null;


                if (selector.test != null) {
                    if (selector.test(obj[key])) return compo;
                } else {
                    if (obj[key] == selector) return compo;
                }

                if (nextKey == null) {
                    if (direction == 'up') nextKey = 'parent';
                    else nextKey = type == 'node' ? 'nodes' : 'components';
                }

                return Compo.find(compo[nextKey], selector, direction, type, key, prop, nextKey);
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


    w.CompoUtils = Class({
        Construct: function(compo) {
            if (compo instanceof Compo) {
                compo.addClass = this.addClass;
                return compo;
            }
            return this;
        },
        addClass: function(_class) {
            this.attr.class = this.attr.class ? this.attr.class + ' ' + _class : _class;
        },
        find: function(selector, direction, type) {
            return Compo.find(this, selector, direction, type);
        }
    })

});