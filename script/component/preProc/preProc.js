include.load('preProc.mask').done(function(r) {

	mask.registerHandler('preProcView', Class({
		Base: mask.getHandler('view'),
		attr: {
			id: 'preProcView',
			template: r.load[0]
		},
		defaultCategory: 'api'
	}));
});