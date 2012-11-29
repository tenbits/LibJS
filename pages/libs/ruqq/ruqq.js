include.load('ruqq.mask').done(function(r) {

    mask.registerHandler('ruqqView', Class({
        Base: mask.getHandler('view'),
        attr: {
            template: r.load[0],
            id: 'ruqqView'
        },

        activate: function() {
            console.log('activate', this.$.find('.animatedPanel').get(0));



            var panel = this.$.find('.animatedPanel');


            panel.css({
                webkitTransform: 'translate(0px,0px) scale(1) '
            });
            panel.css({
                webkitTransition: '-webkit-transform linear 10s 1s, -webkit-transform linear 1s'
            });
            
            setTimeout(function() {
                panel.css({
                    webkitTransform: 'translate(300px,300px) scale(.1)'
                });
            })


            return;
            ///setTimeout(function(){
            new ruqq.animate.Model3({
                model: [{
                    model: 'transform | translate3d(0px, 0px, 0px) > translate3d(300px, 300px, 0px) | 1s',
                    next: {
                        model: 'transform | scale(1) > translate3d(200px, 200px,0px) scale(.5) | 600ms',
                        next: ['transform | scale(.5) > scale(1.5) | 2s', 'opacity | 1 > 0 | 2s', 'background-color | > violet | 1s']
                    }
                }, {
                    model: 'transform | > skew(10deg) | 1s linear 100ms'
                }, {
                    model: 'background-color | > blue | 1s',
                    next: 'background-color | > yellow | 1s',
                }, {
                    model: 'border-radius | 0% > 60% | 1s',
                    next: 'border-radius | 60% > 0% | 1s'
                }

                ]
            }).start(this.$.find('.animatedPanel').get(0));
            //}.bind(this), 1000);
        },
        deactivate: function() {

        }
    }));

    //'translate(0px,100px) scale(.5)'.split(/\)\s+/g);

    ///([\w]+)\([^\)]+\)/g.exec('translate(0px,100px) scale(.5)')[1];

});