module.exports = function (app, uuidv4) {

    var bricksInModels, modelsInBrick, currentProcesses = {};
    fs = require('fs');
    fs.readFile('../bricksInModes.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        bricksInModels = JSON.parse(data);
    });
    fs.readFile('../modelsInBrick.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        modelsInBrick = JSON.parse(data);
    });


    app.get('/api/todos:id', function (req, res) {
        if (!req.params.id) {
            req.params.id = uuidv4();
            currentProcesses[req.params.id] = [];
        }

    });

    function handleResponse(id) {

    }

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};