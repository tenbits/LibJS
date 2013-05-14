include //

.routes({
	preset: '/presets/{0}.txt'
}) //

.load({
	preset: ['simple', 'animate', 'bindings', 'collapse', 'todo']
}) //

.done(function(resp) {

	var id = 0,
		Preset = Class({
			Construct: function(str) {
				this.id = ++id;

				ruqq.arr.aggr(str.split('----'), this, function(x, aggr) {
					x = x.trim();
					if (!x) {
						return;
					}
					
					var index = x.indexOf(':'),
						key = x.substring(0, index),
						value = x.substring(++index).replace(/^[\s]+/, '');
					aggr[key] = value;
				});

			}
		});

	include.exports = [];

	for (var key in resp.load) {
		include.exports.push(new Preset(resp.load[key]));
	}

});
