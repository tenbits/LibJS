include.exports = Class({
	Base: window.DefaultController,
	Construct: function() {

		this.compos = {
			panel: '$: #ranimateExample',
			button: '$: button[name=start]'
		}

		this.on('click', 'button[name=start]', function() {
			this.compos.button.hide();

			new ruqq.animate.Model({
				model: [{
					model: 'transform | translate(0px, 0px) > translate(300px, 300px) | 1s',
					next: {
						model: 'transform | scale(1) > translate(200px, 200px) scale(.5) | 600ms',
						next: [ //
						'transform | scale(.5) > scale(1.5) | 900ms', 'opacity | 1 > 0 | 1s', //
						'background-color | > violet | 1s']
					}
				}, {
					model: 'background-color | > blue | 1s',
					next: 'background-color | > yellow | 1s',
				}],
				next: {
					model: 'opacity | 0 > 1 | 1.5s',
					next: ['transform | rotate(0deg) > scale(1) rotate(360deg) translate(0px,0px) | 2s', 'background-color | > rgb(240,10,10) | 2s ease-in']
				}
			}).start(this.compos.panel.get(0), function() {
				this.compos.button.show();
			}.bind(this));


		}.bind(this));
	}

});
