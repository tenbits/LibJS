include.js({compo: 'datePicker'}).load('datePicker.mask').done(function(r) {

    mask.registerHandler('datePickerView', Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'datePickerView',
            template: r.load[0]
        },
        defaultCategory: 'api'
    }));
});