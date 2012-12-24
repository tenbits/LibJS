(function() {
    var replaces = null;
    mask.registerHandler('formatter:pre', Class({
        Construct: function() {
            if (replaces == null) {
                replaces = {
                    regexps: [/\\n/g, /\\t/g],
                    values: ['\n', '    ']
                };
            }
        },
        makePre: function(nodes) {
            var isarray = nodes instanceof Array,
                length = isarray ? nodes.length : 1,
                x = null;
            for (var i = 0; isarray ? i < length : i < 1; i++) {
				x = isarray ? nodes[i] : nodes;
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
            mask.renderDom(this.nodes, values, container, cntx);
        }
    }));
}());