include.css('view.css').done(function() {


   function when(idfrs, callback) {
      var wait = idfrs.length,
          ondone = function() {
            if (--wait == 0) callback();
          };
          
      for (var i = 0, x, length = idfrs.length; x = idfrs[i], i < length; i++) {         
         x.done(ondone);
      }
   }


   mask.registerHandler('view', Class({
      Base: Compo,
      Extends: CompoUtils,
      Construct: function() {
         (this.attr || (this.attr = {})).class = 'view';
      },
      render: function(values, container, cntx) {
         this.tagName = 'div';

         Compo.prototype.render.apply(this, arguments);
      },
      events: {
         'changed: .radioButtons': function(e, target) {
            var name = this.attr.id.replace('View', '');
            window.routes.set(name + '/' + target.name);
         }
      },

      tab: function(name) {
         this.$.find('.tabPanel > .active').removeClass('active');
         this.$.find('.tabPanel > .' + name).addClass('active');
         
         var scroller = Compo.find(this, 'scroller');
         if (scroller && (scroller = scroller.scroller)){
            scroller.scrollTo(0,0);
            scroller.refresh();
         }
         
      },

      section: function(info) {
         if (!info.category) info.category = this.defaultCategory || 'info';

         var buttons = Compo.findCompo(this, '.radioButtons');

         if (buttons) {
            buttons.setActive(info.category);
            this.tab(info.category);
         }
         
         
         var prisms = this.all('prism','compo');
         if (prisms && prisms.length){
            when(this.all('prism', 'compo'), this.update.bind(this, info));
            return;
         }
         
         this.update(info);
      
      },
      update: function(info){
         var scroller = Compo.find(this, 'scroller');
         scroller && scroller.scroller && scroller.scroller.refresh();
         
         if (info.anchor){
            var element = this.$.find('a[name="' + info.anchor + '"]').get(0);
            scroller && scroller.scroller && scroller.scroller.scrollToElement(element, 100);
         }
      },
      activate: function() {
         var scroller = Compo.find(this, 'scroller');
         scroller && scroller.scroller && scroller.scroller.refresh();
      }

   }));
});