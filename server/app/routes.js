module.exports = function (app, uuidv4) {

    var numOfModels,
        bricksInModelsMap, bricksInModel, modelsInBrick, modelNames, currentProcesses = {};
    fs = require('fs');
    fs.readFile('../bricksInModelsMap.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        bricksInModelsMap = JSON.parse(data);
        modelNames = Object.keys(bricksInModelsMap);
        numOfModels = modelNames.length;
    });
    fs.readFile('../bricksInModel.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        bricksInModel = JSON.parse(data);
    });
    fs.readFile('../modelsInBrick.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        modelsInBrick = JSON.parse(data);
    });


    app.get('/api/todos', function (req, res) {
        if (!req.query.id) {
            req.query.id = uuidv4();
            req.query.contains = true;
            var model = modelNames[Math.round(Math.random() * numOfModels)];
            req.query.brick = bricksInModel[model][0];
            currentProcesses[req.query.id] = [
                {
                    models: [model],
                    excluded: {},
                    matches: []
                }];
        }
    });

    function handleResponse(id, contains, brick) {
        var res = {}, clientData = currentProcesses[id];
        res.matches = 0;
        if (!contains) {
            var currModel;
            for (var i = clientData.models.length - 1; i >= 0; i--) {
                currModel = clientData.models[i];
                if (bricksInModelsMap[currModel][brick]) {
                    clientData.models.splice(i, 1);
                }
            }
            if (!clientData.models) {
                res.msg = 'none found, starting again';
                clientData.models.push(modelNames[Math.round(Math.random() * numOfModels)]);
                clientData.excluded = {};
                res.brick = bricksInModel[clientData.models[0]][0];
            }
        } else {
            clientData.excluded[brick] = brick;
            for (i = clientData.models.length - 1; i >= 0; i--) {
                var model = clientData.models[i];
                if (bricksInModel[model].length === clientData.excluded.length) {
                    res.matches += 1;
                    clientData.matches.push(model);
                    clientData.models.splice(i, 1);
                }
            }
            if (clientData.models) {
                bricksInModel[clientData.models[0]].some(function ())
            }
        }


    }

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};