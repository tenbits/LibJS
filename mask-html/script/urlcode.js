(function() {

	window.UrlCode = new(Class({
		parse: function() {
			var hash = window.location.hash.replace(/^[#\/]+/, '');

			hash = decodeURIComponent(hash);

			if (hash.indexOf('html:') !== 0) {
				return '';
			}

			return {
				html: hash.substring('html:'.length)
			}

		},

		set: function(html) {
			var line = 'html:' + html;
			
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
