/**
 *  Creates Function
 *
 *  @param data {Object} with Properties:
 *      @Base - {Function} Base Function Class
 *              @Base's prototype will be copied to current {Function} prototype
 *              @Base Function will also be called with current object context
 *          (i) To Call Base Function use .apply or .call:
 *              (example)
 *              SomeBaseFunction.prototype.functionToCall.call(this)
 *              
 *      @Extends - {Function, Object, Array[Function|Object]} -
 *          {Function}s-prototypes will be copied to current {Function} prototype
 *          {Function(-s)} will be called with current object context;
 *          
 *          Actually, in case of {Function} @Extends is the same as @Base,
 *          but only with @Base "instanceof" will work.
 *          
 *          the Objects keys will be copied to current function prototype
 *
 *      @Construct - {Function} will be called while Object Initialization,
 *          (i) if {@Construct} @returns object, then that object will
 *              be applied to created class instance
 *                   
 *      @Static - {Object} its values will be applied as static values to
 *          created Function
 */

Class({
    Base: BaseFunction,
    Extends: ObjectFunction,
    Construct: function(){},
    Static: {
        staticFunction: function(){}
    }
})