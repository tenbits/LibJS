
include.js({
    framework: 'ruqq.base'
}).done(function() {
    var w = window,
        r = ruqq,
        prfx = r.info.cssprefix;

    r.animate = (function() {
        function Animate(element, property, valueTo, duration, callback, valueFrom, timing) {
            
            
            var data = typeof property === 'string' ? {
                property: property,
                valueFrom: valueFrom,
                valueTo: valueTo,
                duration: duration,
                timing: timing,
                callback: callback
            } : property,
                $this = $(element);

            if (data.timing == null) data.timing = 'linear';
            if (data.duration == null) data.duration = 300;

            if (typeof data.duration == 'string') {
                var speeds = {
                    slow: 600,
                    fast: 200
                }
                data.duration = speeds[data.duration] || 400;
            }
            if (data.valueFrom != null) {
                var css = {};
                css[data.property] = data.valueFrom;
                css[prfx + 'transition-property'] = 'none';
                css[prfx + 'transition-duration'] = '0ms';

                $this.css(css);
            }
            setTimeout(function() {
                var css = {};
                css[data.property] = data.valueTo;
                css[prfx + 'transition-property'] = data.property;
                css[prfx + 'transition-duration'] = data.duration + 'ms';
                css[prfx + 'transition-timing-function'] = data.timing;

                $this.css(css);

                if (data.callback) {
                    var timeout = setTimeout(data.callback.bind($this), data.duration);
                    $this.data('cssAnimationCallback', timeout);
                }

                element = null;
                data = null;
            }, 0);

            return this;
        }

        function AnimateModel(model, ondone) {
            var isarray = model instanceof Array,
                length = isarray ? model.length : 1,
                x = null;

            for (var i = 0; x = isarray ? model[i] : model, isarray ? i < length : i < 1; i++) {
                var callback = x.onComplete ? scopeModel(x.onComplete) : ondone;
                Animate(x.element, x.prop, x.to, x.duration, callback, x.from, x.timing);
            }
        }

        function scopeModel(model, callback) {
            return function() {
                AnimateModel(model, callback);
            }
        }

        return function(argument, property, valueTo, duration, callback, valueFrom, timing) {
            if (argument instanceof HTMLElement) {
                Animate(argument, property, valueTo, duration, callback, valueFrom, timing);
                return this;
            }
            AnimateModel(argument, property);
            return this;
        }
    })();




    r.spriteAnimation = (function() {
        var keyframes = {},
            prfx = r.info.cssprefix,
            vendor = null,
            initVendorStrings = function(){
                var prfx = r.info.prefix;
                vendor = {
                    keyframes: "@" + prfx+ "keyframes",
                    AnimationIterationCount: prfx + 'AnimationIterationCount',
                    AnimationDuration: prfx + 'AnimationDuration',
                    AnimationTimingFunction: prfx + 'AnimationTimingFunction',
                    AnimationFillMode: prfx + 'AnimationFillMode',
                    AnimationName: prfx + 'AnimationFillMode'
                }
            }
        return {
            /**
             * {id, frameWidth, frames, frameStart?, property?}
             */
            create: function(data) {
                if (vendor == null) {
                    initVendorStrings();
                }
                if (keyframes[data.id] == null) {
                    
                    var pos = document.styleSheets[0].insertRule(vendor.keyframes + " " + data.id + " {}", 0),
                        keyFrameAnimation = document.styleSheets[0].cssRules[pos],
                        frames = data.frames - (data.frameStart || 0),
                        step = 100 / frames | 0,
                        property = data.property || 'background-position-x';

                    for (var i = 0; i < frames; i++) {
                        var rule = (step * (i + 1)) + '% { ' + property + ': ' + (-data.frameWidth * (i + (data.frameStart || 0))) + 'px}';
                        keyFrameAnimation.insertRule(rule);
                    }
                    keyFrameAnimation.iterationCount = data.iterationCount;
                    keyFrameAnimation.frameToStop = data.frameToStop;

                    keyframes[data.id] = keyFrameAnimation;
                }
            },
            start: function($element, animationId, msperframe) {
                var style = $element.get(0).style;
                
                style[vendor.AnimationName] = 'none';
                setTimeout(function() {
                    var keyframe = keyframes[animationId];
                    
                    if (style[vendor.AnimationFillMode] == 'forwards') {
                        spriteAnimation.stop($element);
                        return;
                    }
                    $element.on(vendor + 'AnimationEnd', function() {
                        var css;
                        if (keyframe.frameToStop) {
                            //TODO: now only last cssRule is taken
                            var styles = keyframe.cssRules[keyframe.cssRules.length - 1].style;
                            css = {};
                            for (var i = 0; i < styles.length; i++) {
                                css[styles[i]] = styles[styles[i]];
                            }
                        }
                        spriteAnimation.stop($element, css);
                    });

                    style[vendor.AnimationIterationCount] = keyframe.iterationCount || 1;
                    style[vendor.AnimationDuration] = (keyframe.cssRules.length * msperframe) + 'ms';
                    style[vendor.AnimationTimingFunction] = 'step-start';
                    style[vendor.AnimationFillMode] = keyframe.frameToStop ? 'forwards' : 'none';
                    style[vendor.AnimationName] = animationId;

                }, 0);
            },
            stop: function($element, css) {
                var style = $element.get(0).style;
                style[vendor.AnimationFillMode] = 'none';
                style[vendor.AnimationName] = '';
                if (css != null) $element.css(css);
            }
        }
    })();

});