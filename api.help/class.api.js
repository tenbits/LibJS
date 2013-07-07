/**
 *  Class - Creates / Generates Constructor Function
 */

Class({
    /**
     *   @Base - {Function} Base Function Class
     *           @Base's prototype will be copied to current {Function} prototype
     *           @Base Function will also be called with current object context
     *       (i) To Call Base Function use .apply or .call:
     *           (example)
     *           SomeBaseFunction.prototype.functionToCall.call(this)
     */
    Base: BaseFunction,
    
    /**
     *  @Extends - {Function, Object, Array[Function|Object]} -
     *     {Function}s-prototypes will be copied to current {Function} prototype
     *     {Function(-s)} will be called with current object context;
     *          
     *     Actually, in case of {Function} @Extends is the same as @Base,
     *     but only with @Base "instanceof" will work.
     *          
     *     the Objects keys will be copied to current function prototype
     */
    Extends: Object | Function | [Object | Function],
    
    /**
     * @Contructor - normal javascript constructor function
     *
     *   (i) can also return any other new instance
     */
    Construct: function(){},
    
    /**
     *  Override any Base or Extended Function
     *
     *  Using this object, there will be access to overriden function
     *  via this.super();
     */
    Override: {
      
        log: function(arg, arg2, arg3){
            // do smth
            
            // call super with default arguments
            this.super(arguments);
            
            //call super with some overriden argument
            return this.super(arg, arg2, 'hello');
        }
    },
    
    
    /**
     *  Instance Serialization and Storage
     *
     *  Any type of storage receives a route
     *  that would be generated on fetching / saving
     */
    
    // LocalStorage
    Store: Class.LocalStore('app/settings'),
    
    // RESTful
    Store: Class.Remote('user/:id'),
    
    /**
     *  Define Validation Functions to validate an instance.
     *
     *  Validation Function should return a string if object is not valid
     */
    
    Validation: < Function | ValidationObject >
    // => Function
    Validation: function(){
        if (this.number < 10)
            return 'Number is less then 10';
    },
    // => Validation Object
    //  This validation could be done, before property is set
    Validation: {
        number: function(value){
            if (value < 10) {
                return 'Number is less then 10';
        }
    }
    
    Static: {
        staticFunction: function(){}
    },
    
    
    /**
     *  Private property "_" (underline)- wont be stringified to JSON
     */
    _letter: 'A'
})


/**
 * Collections -
 *  (i) A Collection is ARRAY Like objects
 */

Class.Collection(Function, CollectionsPrototype);


var User  = Class({name: ''});

var Users = Class.Collection(User, {
        Store: Class.LocalStore('users'),
        log: function(){ }
    });

var users = Users.fetch();

