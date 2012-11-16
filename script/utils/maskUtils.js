void
function() {
    var replaces;
    mask.registerHandler('formatter:pre', Class({
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
            mask.renderDom(this.nodes, values, container, cntx);
        }
    }));
}();