include //
//.load('preview.mask::Template') //
.css('preview.css') //
.done(function(resp) {

	var _window, _document, _body, _iframe, _style;

	var Window = (function() {

		return {
			init: function(iframe) {
				if (({}).__proto__ != null && 0) {
					_window = iframe.contentWindow;
					_window.Function.prototype.apply.prototype = Function.prototype.apply.bind(Function);
					_window.Function.prototype.call = Function.prototype.call.bind(Function);

					Object.extend(_window, {
						Class: Class,
						Compo: Compo,
						mask: mask,
						include: include.instance(),
						ruqq: ruqq,
						Object: Object
					});
				} else {
					_window = window;

				}

				_document = iframe.contentDocument || iframe.contentWindow.contentDocument;
				_document.open();
				_document.write('<html><head><style></style><style>body{font-family:sans-serif;}</style></head><body><pre><code></code></pre></body></html>');
				_document.close();
				_style = _document.getElementsByTagName('style')[0];
			},

			eval: function(code) {
				_window.eval(code);
			},
			reload: function() {
				if (_window == window) {
					return;
				}
				_window.location = 'about:blank';
			},
			setStyle: function(preview, style) {
				if (preview._style == style && _window == window) {
					return;
				}

				_style.innerHTML = preview._style = style;
			},
			setCode: function(preview, code) {
				if (preview._code == code && _window == window) {
					return;
				}

				if (_window.dispose instanceof Function) {
					try {
						_window.dispose();
					} catch (error) {
						console.error('dispose:', error.toString());
					}
				}

				_window.eval(code);

				preview._code = code;
			},
			setTemplate: function(preview, template) {
				if (preview._compo) {
					preview._compo.remove();
				}

				preview._template = template;

				preview._compo = (new Compo(template)).render(_window.model || {}).insert(_document.body);
			},

			setHTML: function(preview, template) {

				var div = document.createElement('div');
				div.appendChild(mask.render(template, _window.model));

				_document.body.innerHTML = '<pre><code></code></pre>';

				var $code = _document.body.getElementsByTagName('code')[0],
					html = style_html(div.innerHTML);


				$code.textContent = html;

			}
		};

	}());



	mask.registerHandler('preview', Compo({
		constructor: function() {
			this.compos = {
				$notification: '$: .notification',
				////$btnHTML: '$: #btnHTML'
			};
		},
		//////events: {
		//////	'click: #btnHTML': function() {
		//////		this.asHTML = this.compos.$btnHTML.toggleClass('active').hasClass('active');
		//////		this.update(this._code, this._style, this._template);
		//////	}
		//////},
		onRenderStart: function(model, cntx, container) {
			this.tagName = 'div';
			this.nodes = mask.compile('.notification; iframe src="about:blank";');;

			Compo.shots.on(this, 'DOMInsert', this.DOMInsert);
		},
		DOMInsert: function() {
			Window.init(_iframe = this.$.find('iframe')[0]);

			this.element = _document.getElementsByTagName('code')[0];
		},
		prepair: function(code, style, template, callback) {

			if (_document){

				if (code || template){
					_document.body.innerHTML = '';
				}

				if (_window == window){
					callback && callback();
					return;

				}

			}


			/**
			 *	This all is about reloading iframe for dropping all older javascript,
			 *	this is good to prevent any collisions with new code
			 */
			Window.reload();

			setTimeout(function() {
				Window.init(_iframe);
				callback && callback();
			});
		},
		resolveHTML: function() {

		},
		update: function(html) {
				var error;
				//try {
					this.element.innerText = mask.HtmlToMask(html);
				//} catch (err) {
				//	error = err;
				//}
				this.notify(error);
		},

		notify: function(error) {
			error && console.error(error.toString());

			var klass = error ? 'red' : 'green',
				$notification = this.compos.$notification;

			clearTimeout(this.timeout);

			$notification.removeClass('red green').addClass(klass);


			this.timeout = setTimeout(function() {
				$notification.removeClass(klass);
			}, 1000);
		}
	}));



});
