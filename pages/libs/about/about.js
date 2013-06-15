(function() {

	
	include.exports = Class({
		Base: DefaultController,
		
		Override: {
			section: function(route) {
	
				if (route.category === 'download') {
					this.find(':downloader').initialize();
				}
				
				this.super(route);
			}
		},
		load: function(tag) {
		
		},
		show: function(tag) {

		}
	});


}());
