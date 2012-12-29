include.load('comment.mask').done(function(resp) {


    mask.registerHandler('commentView',Class({
        Base: mask.getHandler('view'),
        attr: {
            id: 'commentView',
            template: resp.load.comment,
			style: 'background-color:rgba(240,240,240,.8)'
        }
    }));

    resp = null;
});