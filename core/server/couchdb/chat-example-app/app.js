var couchapp = require('couchapp'); // needed if you want to use node.js to deploy it as well

var ddoc = {
    _id: '_design/chat',
    language: 'javascript',
    updates: {},
    filters: {}
};

ddoc.updates['sendMessage'] = function(doc, req) {
    if (doc == null) {
        var newDoc = JSON.parse(req.body);
        newDoc.sent_by = req.userCtx.name;
        newDoc.sent_at = new Date();
        return [newDoc, '"New message sent."'];
    }
    throw (['error', 'document_already_exists', 'ID already exists.']);
};

ddoc.filters['message'] = function(doc, req) {
    if (doc.message)
        return true;
    else
        return false;
};

module.exports = ddoc; // needed if you want to use node.js and for Lively Kernel deployment