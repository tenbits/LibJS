include //
.load('menu.mask::Template') //
.css('menu.less') //
.done(function(resp){

	mask.registerHandler(':menu', Compo({
		template: resp.load.Template,
		
		constructor: function(){
			
			window.compos.menu = this;
			
			
			this.removeForced = this.removeForced.bind(this);
		},
		
		events: {
			'click: .menu-show': function(){
				this.$.addClass('forced');
				
				//this.$.on('mouseout', this.removeForced);
				this.$.on('mouseleave', this.removeForced);
			}
		},
		
		removeForced: function(){
			this.$.removeClass('forced');
			this.$.off('mouseout mouseleave');
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
