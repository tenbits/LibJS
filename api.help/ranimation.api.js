/**
 *	Simple Single Css Property Animation
 *
 *	@param element - {HTMLElement}
 *	@param propertyName - {String} - css style name, 
 * 	@param valueTo - {String} - animate that property to this value
 *  @param duration (optional @default=200) - {Number} - in miliseconds
 *  @param callback (optional) - {Function} - On Animation End Callback
 *  @param valueFrom (optional) - {String} - start animating from this value
 *  @param timing (optional @default=linear) - timing function
 *	*/
ruqq.animate(element,propertyName,valueTo, duration, callback, valueFrom, timing);


/**
 *	Complex Model Animation
 *
 *	Main Part of any Animation Model is CSS Property Model,
 *	this is a string, that is very similar to '-[vendor]-transition' css property,
 *	but additionaly it contains 'from' and 'to' embraced in '|'
 *
 *	Syntax:
 *		'propertyName | from > to | duration timing delay'
 *
 *		(from, timing and delay are optional)
 *	Example:
 *		(1) 'transform | scale(1) > scale(0) | 1s ease-in 5s'
 *		(2) 'border-radius | > 50% | 200ms'
 *	
 *	That was CssPropertyModel, and the Animation Model consists of one or more
 *	nested cssmodels
 *	
 *	Simple Animation Model:
 */

var ModelData = {
	/* CssPropertyModel|[CssPropertyModel]|ModelData|[ModelData] */
	model: ['opacity | 1 > 0 | 1s', 'border-width | 1px > 5px | 500ms'],
	
	/*
	 * next - is ModelData that will be applied to object
	 *		after model animation is done
	 */
	next: {
		model: 'opacity | > 1 | 1s',
		next: 'border-width | > 1px | 1.5s'
	}
}

/**
 *	And so, with nested ModelData, it possibe easy to declare animation sequence.
 */

/**
 *	Model Instance
 *
 *	Constructor:
 *		@param model - {ModelData := JSON}
 */ 
new ruqq.animate.Model(ModelData)
/**
 *	Starting Animation
 *	@param element - HTMLElement - element wir apply animation to
 *	@param callback - Function - on end callback
 */
	.start(element, animationEndCallback)
 
 
 
 
 