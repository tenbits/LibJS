void

function() {
   "use strict";

   var w = window,
       r = typeof w.ruqq === 'undefined' ? (w.ruqq = {}) : ruqq;

   r.doNothing = function() {
      return false;
   };


   /** aka Modernizr */
   void

   function(r) {
      var div = document.createElement('div'),
          I = {};
      r.info = I;

      I.hasTouchSupport = (function() {
         if ('createTouch' in document) return true;
         try {
            return !!document.createEvent("TouchEvent").initTouchEvent;
         } catch (error) {
            return false;
         }
      })();
      I.prefix = (function() {
         if ('webkitTransition' in div.style) return 'webkit';
         if ('MozTransition' in div.style) return 'Moz';
         if ('OTransition' in div.style) return 'O';
         if ('msTransition' in div.style) return 'ms';
         return '';
      })();
      I.cssprefix = I.prefix ? '-' + I.prefix.toLowerCase() + '-' : '';
      I.supportTransitions = I.prefix + 'TransitionProperty' in div.style;

   }(r);


   return r;

}();