
include
	.load('class.example::Examples')
	.done(function(resp) {
		
	
		include.exports = Class({
			Base: window.DefaultController,
			
			compos : {
				tabsexamples: 'compo: #tabs-examples'
			},
			
			Override: {
				onRenderStart: function(){
					
					var examples = resp.load.Examples;
					this.model = {
						examples: examples,
						sideMenu: [{
							name: 'examples',
							list: ruqq.arr.select(examples, ['name', 'title'])
						}]
					}
					
					this.super();
				},
				
				onRenderEnd: function(){
					
				}
			}
		});
		
	});
