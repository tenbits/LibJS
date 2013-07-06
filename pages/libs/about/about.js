(function() {

	
	include.exports = Class({
		Base: DefaultController,
		
		Override: {
			section: function(route) {
	
				if (route.category === 'download') 
					this.find(':downloader').initialize();
				
				this.super(route);
			},
			
			activate: function(){
				
				window.compos.menu.blur();
			},
			
			deactivate: function(){
				
				window.compos.menu.focus();
			}
		},
		load: function(tag) {
		
		},
		show: function(tag) {
			//window.compos.menu.blur();
		}
	});


}());
