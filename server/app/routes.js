module.exports = function (app) {

    const uuidv4 = require('uuid/v4');
    var numOfModels, allBricksCount, allBricks,
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
        allBricks = Object.keys(modelsInBrick);
        allBricksCount = allBricks.length;
    });


    app.get('/api/ask', function (req, res) {
        if (!req.query.id) {
            req.query.id = uuidv4();
            req.query.contains = true;
            createNewClientData(req.query.id);
        }
        res.send(handleResponse(req.query.id, req.query.contains, req.query.brick));
    });

    function createNewClientData(id) {
        var brick = allBricks[Math.round(Math.random() * allBricksCount)];
        currentProcesses[id] =
            {
                models: [],
                excluded: {},
                matches: []
            };
        currentProcesses[id].models = JSON.parse(JSON.stringify(modelsInBrick[brick]));
    }

    function handleResponse(id, contains, brick) {
        var res = {id: id}, clientData = currentProcesses[id];
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
            // if !brick this is a new search
            if (brick) {
                clientData.excluded[brick] = brick;
                var minRemaining, minRemainingName;
                for (i = clientData.models.length - 1; i >= 0; i--) {
                    var model = clientData.models[i];
                    var remaining = bricksInModel[model].length - Object.keys(clientData.excluded).length;
                    if (typeof minRemaining === 'undefined' || remaining < minRemaining) {
                        minRemaining = remaining;
                        minRemainingName = model;
                    }
                    if (remaining === 0) {
                        res.matches += 1;
                        clientData.matches.push(model);
                        clientData.models.splice(i, 1);
                    }
                }
                res.minRemaining = minRemaining;
                res.minRemainingName = minRemainingName;
            }
            if (clientData.models) {
                bricksInModel[clientData.models[0]].some(function (brick) {
                    if (!clientData.excluded[brick]) {
                        res.brick = brick;
                        return true;
                    }
                });
            }
        }
        return res;
    }

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};
