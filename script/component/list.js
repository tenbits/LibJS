void function() {
    var Template = "list value='array' > div > '#{index} * #{index} = #{result}'";

    mask.registerHandler('listView', Class({
        Base: Compo,
        attr: {
            template: Template
        },
        render: function(values, container, cntx) {
            
            var arr = [];
            for (var i=0; i < 5; i++) arr.push({index: i, result : i * i});
            
            values.array = arr;
            Compo.prototype.render.call(this, values, container, cntx);            
        }
    }));

}();