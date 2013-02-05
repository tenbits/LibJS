(function() {

	window.UrlCode = new(Class({
		parse: function() {
			var hash = window.location.hash.replace(/^[#\/]+/, '');

			hash = decodeURIComponent(hash);

			if (hash.indexOf('code:') !== 0) {
				return '';
			}

			hash = hash.substring('code:'.length);



			function split(arr, type) {
				return ruqq.arr.aggr(arr, [], function(x, aggr) {
					var parts = x.split(type);
					if (parts.length > 1) {
						parts[1] = type + parts[1];
					}

					return aggr.concat(parts);
				});
			}

			function clean(arr) {
				return ruqq.arr.remove(arr, function(x) {
					return !x;
				});
			}

			var arr = [hash];

			arr = split(arr, '-mask-');
			arr = split(arr, '-javascript-');
			arr = split(arr, '-style-');

			arr = clean(arr);


			var source = {};

			ruqq.arr.each(arr, function(x) {
				var type = x.substring(1, x.indexOf('-', 1)),
					code = x.substring(x.indexOf('-', 1) + 1);

				source[type] = code;
			})

			console.log(source);
			return source;
		},

		set: function(javascript, style, mask) {
			var line = 'code:'
			if (mask) {
				line += '-mask-' + mask;
			}
			if (javascript) {
				line += '-javascript-' + javascript;
			}
			if (style) {
				line += '-style-' + style;
			}

			window.location.hash = encodeURIComponent(line);
		},

		getShortend: function(url, callback) {

			$.getJSON("http://api.bitly.com/v3/shorten?callback=?", {
				"format": "json",
				"longUrl": url,
				"apiKey": "R_76ebf1167111bc97cdd1a4486fef729c",
				"login": "tenbits"
			}, function(response) {
				callback && callback(response.data && response.data.url);
			});

		}
	}));

}())
