include.load('postProc.mask').done(function(r) {


	var replaces;
	



	mask.registerHandler('postProcView', Class({
		Base: mask.getHandler('view'),
		attr: {
			id: 'postProcView',
			template: r.load[0]
		},
		defaultCategory: 'api'
	}));
});