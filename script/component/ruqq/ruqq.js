include.load('ruqq.mask').done(function(r) {

    mask.registerHandler('ruqqView', Class({
        Base: mask.getHandler('view'),
        attr: {
            template: r.load[0],
            id: 'ruqqView'
        },
        
        activate: function(){
            console.log('activate',this.$.find('.animatedPanel').get(0));
            
            new ruqq.animate.Model3({
                model: [
                    {
                        model: '-webkit-transform | translate(0px,0px) > translate(300px,300px) | 2s',
                        next: {
                            model: '-webkit-transform | translate(300px,300px) scale(1) > translate(0px,100px) scale(.5) | 600ms',
                            next: [
                                '-webkit-transform | translate(0px,100px) scale(.5) > translate(0px,100px) scale(1.5) | 2s',
                                'opacity | 1 > 0 | 2s',
                                'background-color | > violet | 1s'
                            ]
                        }
                    },
                    
                    {
                        model : 'background-color | red > blue | 2s',
                        next: 'background-color | > yellow | 2s',
                    },
                    {
                        model: 'border-radius | 0% > 60% | 2s',
                        next: 'border-radius | 60% > 0% | 2s'
                    }
                    
                ]
            }).start(this.$.find('.animatedPanel').get(0));
        },
        deactivate: function(){
            
        }
    }));

});