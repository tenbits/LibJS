include.load('mask.examples.txt').done(function(r) {


	include.exports = window.DefaultController;

	mask.registerHandler('maskExamples', Class({
		render: function(values, container, cntx) {
			var examples = r.load['mask.examples'].split('===='),
				arr = [];

			for (var i = 0; i < examples.length; i++) {
				var item = new Example(examples[i]);
				if (item.valid != false) {
					arr.push(item);
				}
			}

			var Template = "div.example {\
								h4 {\
									\
									span.collapsable.#{:index==0?'':'closed'} {\
										span > '∨' span > '∨' span > '∨' span > '∨'\
									}\
									'#{title}'\
								}\
								div.data style='#{:index > 0 ? \"display:none\"}; padding-left:20px;' {\
									h6 > 'Template'\
									prism > '#{template}'\
									h6 > 'Javascript'\
									prism > '#{javascript}'\
									h6 > 'Result'\
									div.result;\
								}\
							}";

			for (var i = 0, x, length = arr.length; x = arr[i], i < length; i++) {
				x.index = i;
				mask.renderDom(Template, x, container);
				container.lastChild.lastChild /*querySelector('.result')*/
				.appendChild(x.result);
			}

			$('.collapsable', container).on('click', function() {
				var $this = $(this),
					closed = $this.hasClass('closed');

				$this.closest('.example').children('.data').toggle(closed);
				$this.toggleClass('closed', !closed);

				Compo.find(cntx, 'scroller', 'up').scroller.refresh();
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
					console.error('Example Evaluation Error', e);
				}
			}
		}
	});
});
