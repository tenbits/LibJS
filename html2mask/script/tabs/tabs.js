include //
//.load('tabs.mask::Template') //
.css('tabs.css') //
.done(function(resp) {

	function activate($this, name) {
		$this.compos //
		.$panels //
		.removeClass('active') //
		.filter('[name="' + name + '"]') //
		.addClass('active');

		$this.compos //
		.$buttons //
		.removeClass('active') //
		.filter('[name="' + name + '"]') //
		.addClass('active');

		var editor = editors[name];

		editor.renderer.updateFull()
		editor.focus();
	}

	mask.registerHandler('tabs', Compo({
		constructor: function() {
			this.attr = {
				'class': 'tabs'
			};

			this.compos = {
				$panels: '$: .panels > div',
				$buttons: '$: .header > button'
			};

			Class.bind(this, 'next');

			this.tagName = 'div';
		},
		events: {
			'click: .header > button:not(.active)': function(event) {
				activate(this, $(event.currentTarget).attr('name'));
			}
		},

		next: function() {
			var $next = this.compos.$buttons.filter('.active').next('button');

			if ($next.length == 0){
				$next = this.compos.$buttons.first();
			}
			activate(this, $next.attr('name'));
		},
		current: function(){
			return this.compos.$buttons.filter('.active').attr('name');
		}
	}));


});
