include.load(['examples.txt::Source','examples.mask::Template']).done(function(resp) {

	include.exports = Class({
		Base: window.DefaultController,
		
		compos : {
			tabsexamples: 'compo: #tabs-examples'
		},
		
		Override: {
			onRenderStart: function(){
				
				var examples = parse_Examples();
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
	
	
	function parse_Examples() {
		var examples = resp.load.Source.split('====');
		
		return ruqq.arr.aggr(examples, [], function(x, aggr){
			var item = new Example(x);
			
			if (item.valid !== false)
				aggr.push(item);
		});

	}

	mask.registerHandler('maskExamples', Compo({
		render: function(model, cntx, container) {
			var examples = resp.load.Source.split('===='),
				arr = [],
				self = this;

			for (var i = 0; i < examples.length; i++) {
				var item = new Example(examples[i]);
				if (item.valid != false) {
					arr.push(item);
				}
			}


			for (var i = 0, x, length = arr.length; x = arr[i], i < length; i++) {
				x.index = i;

				var fragment = jmask(resp.load.Template).render(x);

				fragment.querySelector('.result').appendChild(x.result);

				container.appendChild(fragment);
			}

			$('.collapsable', container).on('click', function() {
				var $this = $(this),
					closed = $this.hasClass('closed');

				$this.closest('.example').children('.data').toggle(closed);
				$this.toggleClass('closed', !closed);

				self.closest('scroller').scroller.refresh();
			});

		}
	}));


	var Example = Class({
		Construct: function(str) {
			var items = str.split('----');
			if (items.length < 4) {
				this.valid = false;
				return;
			}

			for (var i = 0, x, length = items.length; x = items[i], i < length; i++) {
				if (!x) continue;
				x = x.replace(/^[\s]+/, '');

				var index = x.indexOf(':'),
					key = x.substring(0, index),
					value = x.substring(++index).replace(/^[\s]+/, '');
				this[key] = value;
			}

			if (this.template && this.javascript) {
				try {
					var template = this.template;
					this.result = eval(this.javascript);
				} catch (e) {
					console.error('Example Evaluation Error', e, this.javascript);
				}
			}
			
			this.name = this.title.replace(/[^\w]/g, '').toLowerCase();
		}
	});
});
