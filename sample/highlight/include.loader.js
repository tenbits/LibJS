/**
 *  Dev Depended Routes
 *
 *  This Script loads ClassJS and IncludeJS and the script that is in tags attribute main
 *      <script href='include.loader.js' main='script/main.js' />
 */
(function() {

    var routes = {
        lib: 'file:///c:/Development/libjs/{name}/lib/{name}.js',
        framework: 'file:///c:/Development/libjs/framework/lib/{name}.js'
    };


    var Loader = (function() {
        var load = function(url, callback) {
                var script = document.createElement('script');
                script.type = 'application/javascript';
                script.src = url;
                script.onload = callback;
                (head || (head = document.getElementsByTagName('head')[0])).appendChild(script);
            },
            head = null,
            scripts = document && document.getElementsByTagName('script') || null,
            main = scripts[scripts.length - 1].getAttribute('main');
            
        if (typeof BUILDER_LOAD === 'function'){
            load = BUILDER_LOAD;
            main = 'MAIN';
        }

        return function(url, callback) {
            load(url, callback);
        }
    })();


    function loadInclude() {
        load(routes.lib.replace(/\{name\}/g, 'include'), ondone);
    };

    function ondone() {
        include.cfg(routes);
        load(main)
    }

    load(routes.lib.replace(/\{name\}/g, 'class'), loadInclude);

    return routes;
})();