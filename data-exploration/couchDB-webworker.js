
function getDocsPaginated(baseURL, page, pageSize) {
    page = page || 0;
    pageSize = pageSize || 100;
    var skip = page * pageSize,
        url = baseURL + "?include_docs=true&limit=" + pageSize + '&skip=' + skip;
    self.httpRequest({
        url: url,
        done: function(req) {
            if (req.status >= 400) {
                console.log('Error in request %s: %s', url, req.statusText);
                return;
            }
            var docs = JSON.parse(req.responseText).rows.map(function(row) { return row.doc });

            console.log("Got page " + page + ' ' + docs.length + ' docs');
            self.postMessage(dataExploration.classify(docs));
        }
    });
}