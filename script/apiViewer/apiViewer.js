include //
.css(['apiViewer.css']) //
.done(function(){

	mask.registerHandler('apiViewer', Compo({
		constructor: function(){
			this.attr = {
				'class': 'api'
			};
		},
		renderStart: function(model, cntx, container){

			var src = this.attr.src,
                base = this.attr.base;

            this.routeHandler = window.routes;

            if (base){
                this.routeHandler = this.routeHandler.createHandler(base);
            }

			this.tagName = 'div';
			Compo.render(this, model, container, cntx);

            include.instance().load(src + '::Api').done(this.onload.bind(this));

            this.routeHandler.add('/:docname/?:type', this.show.bind(this));


		},
		onload: function(resp){
			var html = resp.load.Api;

			var $api = this.$.html(html),
                that = this;

			$api.on('click', '.api-files > li', function(e) {
				var $this = $(e.currentTarget),
					docname = $this.data('docname');

				if ($this.hasClass('active')) {
					return;
				}

                that.routeHandler.navigate(docname);
			});

            $api.on('click', '.api-tab > li', function(e){
                var $this = $(e.currentTarget),
					name = $this.data('name'),
                    docname = $this.data('docname');

				if ($this.hasClass('active')) {
					return;
				}

                that.routeHandler.navigate(docname + '/' + name);
            });

            $api.on('click', 'a', function(e){
                var href = $(e.currentTarget).attr('href');

                if (href[0] == '#'){
                    that.routeHandler.navigate(href.substring(1));
                }

                return false;
            });

			this.routeHandler.hashchanged();

		},
		show: function(data) {

            var apiDoc = data.docname,
                type = data.type;

			var $api = this.$;

			var $apiMenu = $api.find('.api-files');
			$apiMenu.children('.active').removeClass('active');
			$apiMenu.children('[data-docname="' + apiDoc + '"]').addClass('active');


			var $apiTabs = $api.find('.api-tabs');

			$apiTabs.children('.active').removeClass('active');
			$apiTabs.children('[data-docname="' + apiDoc + '"]').addClass('active');


			var $apiDocs = $api.find('.api-documentation');

			$apiDocs.children('.active').removeClass('active');

			$apiDoc = $apiDocs.children('[data-docname="' + apiDoc + '"]').addClass('active');

			if (type) {
				var $doc = $apiDoc.find('[data-name="' + type + '"]');

				if ($doc.length) {
					this.scrollTo($doc.get(0));

				}
			}
		},
		scrollTo: function(element){
			var scroller = Compo.closest(this, 'scroller', 'node');

			if (scroller){
				scroller.scroller.scrollToElement(element);
				return;
			}

			var container = document.body;

			container.scrollTop = element.offsetTop - container.offsetTop + container.scrollTop;
		}
	}));


});
