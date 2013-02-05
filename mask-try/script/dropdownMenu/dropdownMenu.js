include //
//.load('dropdownMenu.mask::Template') //
.css('dropdownMenu.css') //
.done(function(resp){

	var itemTemplate = 'list > .-ddmenu.item data-item="#{id}" > "#{title}"'

	mask.registerHandler('dropdownMenu', Class({
		Base: Compo,
		Construct: function(){
			this.attr = {
				//template: resp.load.Template,
				'class': 'dropdownMenu'
			};

			this.compos = {
				button: '$: .caption'
			}
		},
		events: {
			'click: .caption' : function(){
				this.$.addClass('visible');
				this.compos.button.addClass('active');

				$(document).on('mousedown', function(e){

					if ($(e.target).closest('.dropdownMenu').length){
						return;
					}
					this.hide();

				}.bind(this));
			},
			'click: .item': function(e){
				this.hide();
				this.$.trigger('selected', [$(e.currentTarget).data('id')]);
			}
		},
		hide: function(){
			this.$.removeClass('visible');
			this.compos.button.removeClass('active');
			$(document).off('mousedown');
		},
		render: function(model, container, cntx){
			this.tagName = 'div';
			if (this.nodes instanceof Array === false){
				this.nodes = [this.nodes];
			}
			Compo.render(this, model, container, cntx);
		},
		add: function(items){
			var dom = mask.render(itemTemplate, items, null, this);

			this.$.find('.items').append(dom);
		}
	}));


});
