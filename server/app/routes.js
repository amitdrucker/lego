module.exports = function (app) {

    const uuidv4 = require('uuid/v4');
    var path = require('path');
    var numOfModels, allBricksCount, allBricks,
        bricksInModelsMap, bricksByPopularity, bricksInModel, modelsInBrick, modelNames, currentProcesses = {};
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

    fs.readFile('../bricksByPopularity.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        bricksByPopularity = JSON.parse(data);
    });
    fs.readFile('../modelsInBrick.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        modelsInBrick = JSON.parse(data);
        allBricks = Object.keys(modelsInBrick);
        allBricksCount = allBricks.length;
    });


    app.get('/download-image', function (req, res) {
        if (req.query.name.indexOf('png') === -1) {
            req.query.name += '.jpg';
        }
        var file = '../blocks/' + req.query.name;
        res.download(path.resolve(file));
    });

    app.get('/download-pdf', function (req, res) {
        fs.readdir('../data/' + req.query.name, function (err, items) {
            res.download(path.resolve('../data/' + req.query.name + '/' + items[0]));
        });
    });


    app.get('/api/ask', function (req, res) {
        var resBody = {};
        if (!req.query.id) {
            req.query.id = uuidv4();
            createNewClientData(req.query.id, resBody);
        }
        resBody.id = req.query.id;
        res.send(handleResponse(req.query.id, req.query.contains, req.query.brick, resBody));
    });

    function createNewClientData(id, resBody) {
        var missing = currentProcesses[id] ? currentProcesses[id].missing : {},
            containing = currentProcesses[id] ? currentProcesses[id].containing : [],

            brick = bricksByPopularity[0];
        var counter = 1;
        while (missing[brick]) {
            brick = bricksByPopularity[counter];
            counter += 1;
        }
        currentProcesses[id] =
            {
                models: [],
                containing: containing,
                matches: [],
                missing: missing
            };
        currentProcesses[id].models = JSON.parse(JSON.stringify(modelsInBrick[brick]));
        resBody.brick = brick;
        return brick;
    }

    function findBrick(clientData, resBody) {
        delete resBody.brick;
        var bestBrick, bestScore = 0;
        bricksInModel[resBody.minRemainingName].forEach(function (brick) {
            if (!clientData.containing[brick] && modelsInBrick[brick].length > bestScore) {
                bestBrick = brick;
                bestScore = bricksByPopularity[brick];
            }
        });
        resBody.brick = bestBrick;
    }

    function populateMinRemaining(clientData, resBody) {
        for (var i = clientData.models.length - 1; i >= 0; i--) {
            var model = clientData.models[i];
            var containingCounter = 0;
            for (var j = clientData.containing.length - 1; i >= 0; i--) {
                var containingBrick = clientData.containing[j];
                if (bricksInModel[model][containingBrick]) {
                    containingCounter += 1;
                }
            }
            var remaining = bricksInModel[model].length - containingCounter;
            if (typeof resBody.minRemaining === 'undefined' || remaining < resBody.minRemaining) {
                resBody.minRemaining = remaining;
                resBody.minRemainingName = model;
                if (remaining === 0) {
                    resBody.matches.push(model);
                    clientData.matches.push(model);
                    clientData.models.splice(i, 1);
                }
            }
        }
        return i;
    }

    function handleResponse(id, contains, brick, resBody) {
        var clientData = currentProcesses[id];
        // in case this is new
        if (!brick) {
            populateMinRemaining(clientData, resBody);
            return resBody;
        }
        resBody.matches = [];
        if (!contains) {
            var currModel;
            clientData.missing[brick] = brick;
            for (var i = clientData.models.length - 1; i >= 0; i--) {
                currModel = clientData.models[i];
                if (bricksInModelsMap[currModel][brick]) {
                    clientData.models.splice(i, 1);
                }
            }
            if (clientData.models.length === 0) {
                resBody.msg = 'none found, starting again';
                createNewClientData(id, resBody);
                clientData = currentProcesses[id];
                populateMinRemaining(clientData, resBody);
                return resBody;
            }
        } else {
            clientData.containing[brick] = brick;
            populateMinRemaining(clientData, resBody);
            if (clientData.models.length > 0) {
                findBrick(clientData, resBody, resBody.minRemainingName);
            } else {
                resBody.finalResult = true;
            }
        }
        return resBody;
    }

// application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};
