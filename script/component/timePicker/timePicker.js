include.js({compo: 'timePicker'}).load('timePicker.mask').done(function(r) {

    mask.registerHandler('timePickerView', Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'timePickerView',
            template: r.load[0]
        },
        defaultCategory: 'api'
    }));
});