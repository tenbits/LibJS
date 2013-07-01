include //
.load('menu.mask::Template') //
.css('menu.less') //
.done(function(resp){

	mask.registerHandler(':menu', Compo({
		template: resp.load.Template,
		
		constructor: function(){
			
			window.compos.menu = this;
		},

        onRenderStart: function(model, cntx, container){
            // ..
        },
        onRenderEnd: function(elements, cntx, container){
            // ..
        },
		
		
		focus: function(){
			this.$.removeClass('hidden');
		},
		
		blur: function(){
			this.$.addClass('hidden');
		}
	}));


});
