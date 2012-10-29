include.load('postProc.mask').js({
	compo: 'layout'
}).done(function(r) {


	var replaces;
	mask.registerHandler('formatter:pre', Class({
		Base: Compo,
		Construct: function() {
			if (replaces == null) {
				replaces = {
					regexps: [/\\n/g, /\\t/g],
					values: ['\n', '    ']
				}
			}
		},
		makePre: function(nodes) {
			var isarray = nodes instanceof Array,
				length = isarray ? nodes.length : 1,
				x = null;
			for (var i = 0; x = isarray ? nodes[i] : nodes, isarray ? i < length : i < 1; i++) {
				if (x.content != null) {
					x.content = x.content.replace(replaces.regexps[0], '\n').replace(replaces.regexps[1], '    ');
				}
				if (x.nodes != null) {
					this.makePre(x.nodes);
				}
			}
		},
		render: function(values, container, cntx) {
			this.makePre(this.nodes);
			Compo.prototype.render.call(this, values, container, cntx);
		}
	}));



	mask.registerHandler('postProcView', Class({
		Base: mask.getHandler('view'),
		attr: {
			id: 'postProcView',
			template: r.load[0]
		},
		defaultCategory: 'api'
	}));
});