window['DEBUG'] = true;

include.routes({
     "lib": "/.reference/libjs/{0}/lib/{1}.js",
     "ruqq": "/.reference/libjs/ruqq/lib/{0}.js",
     "compo": "/.reference/libjs/compos/{0}/lib/{1}.js"
}).cfg({
	lockedToFolder: true,
	version: 1.2
});


if (DEBUG){
	include.embed({
		lib: 'include/include.autoreload'
	});
}
