include.cfg({
	lockedToFolder: true,
	lib: '/../../script/external/lib/{name}.js',
	framework: '/../../script/external/framework/{name}.js'
})
.js({
    lib: 'compo',
    framework: 'dom/zepto'
}).wait().js({
   '':['lib/highlight.js']
}).ready(function(){
   
   Compo.config.setDOMLibrary($);   
   document.body.appendChild(mask.renderDom("highlight language='javascript' > 'var a = 10;'"));
    
});