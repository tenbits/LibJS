include //
.load('shortend-dialog.mask::Template') //
.css('shortend-dialog.css') //
.done(function(resp){

	var animations = {};

	Object.lazyProperty(animations, 'model', function() {
		var Model = ruqq.animate.Model;
		return {
			show: {
				overlay: new Model({
					model: ['display | block', 'opacity | 0 > 1 | 200ms']
				}),
				panel: new Model({
					model: ['transform | translate(0px,130%) > translate(0px, 0px) | 300ms ease-in 150ms', //
					'opacity | 0 > 1 | 300ms linear 200 ms']
				})
			},
			hide: {
				panel: new Model({
					model: ['transform | translate(0px,0px) > translate3d(0px, 120%) | 300ms ease-in', //
					'opacity | 1 > 0 | 300ms ease-in']
				}),
				overlay: new Model({
					model: 'opacity | 1 > 0 | 400ms linear 450ms',
					next: 'display | > none'
				})
			}
		}
	});

	Object.lazyProperty(include.promise('compo'), 'shortendDialog', function() {
		return Compo.initialize(Dialog, null, null, document.body);
	});

	var cache = {};
	var Dialog = Compo({
		compos: {
			'panel': ['$: .modalOverlay',
			{
				'click:': function(e) {
					var _class = $(e.target).attr('class');
					if (!_class){
						return;
					}

					if (_class.indexOf('modalOverlay') > -1 || _class.indexOf('cell') > -1){
						this.hide();
					}
				}
			}],
			'container': '$: .shortend-container'
		},
		attr: {
			template: resp.load.Template
		},
		show: function(date) {
			animations.model.show.overlay.start(this.$.filter('.modalOverlay').get(0));
			animations.model.show.panel.start(this.$.find('.shortend-container').get(0));
			return this;
		},
		hide: function() {
			animations.model.hide.panel.start(this.$.find('.shortend-container').get(0));
			animations.model.hide.overlay.start(this.$.filter('.modalOverlay').get(0));
		},
		/** result | progress	*/
		state: function(state){
			this.compos.container.children('.active').removeClass('active');
			this.compos.container.children('.' + state).addClass('active');
		},
		process: function(url){
			var cached = cache[url];

			if (cached){
				this.$.find('input').val(cached);
				this.state('result');
				return;
			}

			this.state('progress');

			var that = this;
			setTimeout(function(){

				UrlCode.getShortend(url, function(response){
					if (!response){
						alert('Sorry, could not resolve the shortend url');
						that.hide();
						return;
					}

					cache[url] = response;
					that.process(url);
				})

			},200);

			return this;

		}
	});



});
