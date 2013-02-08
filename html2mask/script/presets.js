include.load('/presets/presets.txt').done(function(resp) {

	var id = 0,
		Preset = Class({
			Construct: function(str) {
				this.id = ++id;


				var items = str.split('----');
				if (items.length < 4) {
					console.warn(this);
					this.valid = false;
					return;
				}


				ruqq.arr.aggr(items, this, function(x, aggr) {
					if (!x) {
						return;
					}
					x = x.replace(/^[\s]+/, '');

					var index = x.indexOf(':'),
						key = x.substring(0, index),
						value = x.substring(++index).replace(/^[\s]+/, '');
					aggr[key] = value;
				});

			}
		});

	var arr = resp.load.presets.split(/[\s]*====[\s]*/g);
	window.XX = include.exports = ruqq.arr(arr).where(function(x) {
		return !!x;
	}).map(function(x) {
		return new Preset(x);
	}).items;

});
