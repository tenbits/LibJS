include.load('feedback.mask').done(function(resp) {


    mask.registerHandler('feedbackView',Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'feedbackView',
            template: resp.load.feedback,
			style: 'background-color:rgba(240,240,240,.8)'
        }
    }));

    resp = null;
});