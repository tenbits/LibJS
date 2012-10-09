window.onerror = function(e, a, b) {
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
}).ready(function() {
    console.log('main.done');
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
            }
        },
        aggr = function(keys, fn) {
            var arr = [];
            if (keys == null) keys = Object.keys(views);
            for (var i = 0; i < keys.length; i++) arr.push(fn(keys[i], views[keys[i]]));
            return arr;
        };

    var model = {
        libraries: aggr(['classView', 'maskView', 'includeView','includeBuilderView', 'compoView'], function(key, x) {
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
                viewsManager.show(view);
                w.location.hash = view.replace('View','');
            }
        }
    }));



    w.app.render(model).insert(document.body);

    
    var lib = (window.location.hash || '').substring(1) 
    if (lib + 'View' in views == false) lib = null;
    
    viewsManager.show((lib || 'about')+ 'View');



});