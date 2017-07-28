module.exports = function (app, uuidv4) {

    var currentProcesses = {};
    app.get('/api/todos:id', function (req, res) {
        if (!req.params.id) {
            req.params.id = uuidv4();
            currentProcesses[req.params.id] = [];
        }
        res.json({'res':'ok'});
    });

    function handleResponse(id) {

    }

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};