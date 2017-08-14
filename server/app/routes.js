module.exports = function (app) {
    fs = require('fs');
    const uuidv4 = require('uuid/v4');
    var path = require('path');
    var currentProcesses = {};
    var bricksInModel = JSON.parse(fs.readFileSync('../data/bricksInModel.json'));
    var bricksInModelsMap = JSON.parse(fs.readFileSync('../data/bricksInModelsMap.json'));
    var bricksByPopularity = JSON.parse(fs.readFileSync('../data/bricksByPopularity.json'));
    var pdfsInModel = JSON.parse(fs.readFileSync('../data/pdfsInModel.json'));
    var modelNames = Object.keys(bricksInModelsMap);
    var modelsDict = {};
    modelNames.forEach(function (name) {
        modelsDict[name] = true;
    });

    app.get('/download-image', function (req, res) {
        req.query.name += '.jpg';
        var file = '../data/blocks/' + req.query.name;
        res.download(path.resolve(file));
    });

    app.get('/download-preview', function (req, res) {
        var model = req.query.model;
        var num = req.query.num;
        var file = pdfsInModel[model][num] + '.jpg';
        res.download(path.resolve(file));
    });

    app.get('/download-pdf', function (req, res) {
        // var items = fs.readdirSync('../data/pdfs/' + req.query.name);
        res.download(path.resolve(pdfsInModel[req.query.name][req.query.pdfNum] + '.pdf'));
    });

    app.get('/count-pdf', function (req, res) {
        var length = fs.readdirSync('../data/pdfs/' + req.query.name).length;
        res.send({count: length, name: req.query.name});
    });

    app.get('/api/ask', function (req, res) {
        var resBody = {};
        if (!req.query.id) {
            req.query.id = uuidv4();
            createNewClientData(req.query.id, resBody);
        }
        var clientData = currentProcesses[req.query.id];
        resBody.id = req.query.id;
        handleResponse(req.query.id, req.query.contains, req.query.brick, resBody, req.query.onlyContinue);
        resBody.matches = currentProcesses[req.query.id].matches;
        resBody.containing = Object.keys(clientData.containing);
        resBody.missing = Object.keys(clientData.missing);
        res.send(resBody);
    });

    app.get('/api/add', function (req, res) {
        var resBody = {};
        var model = req.query.model;
        var clientData = currentProcesses[req.query.id];
        resBody.id = req.query.id;
        for (var i = 0; i < Object.keys(clientData.models.length); i++) {
            if (clientData.models[i] === model) {
                break;
            }
        }
        handleAddModel(clientData, model, i);
        populateMinRemaining(clientData, resBody, false, bricksInModelsMap);
        findBrick(clientData, resBody, resBody.minRemainingName);
        resBody.matches = currentProcesses[req.query.id].matches;
        res.send(resBody);
    });

    function handleResponse(id, contains, brick, resBody, onlyContinue) {
        var clientData = currentProcesses[id];
        // in case this is new
        if (!brick) {
            populateMinRemaining(clientData, resBody, undefined, bricksInModelsMap);
            return resBody;
        }
        if (!contains) {
            clientData.missing[brick] = brick;
            populateModels(clientData);
        } else if (!onlyContinue) {
            clientData.containing[brick] = brick;
        } else {
            if (!clientData.ignoredBricks) {
                clientData.ignoredBricks = {};
            }
            clientData.ignoredBricks[brick] = true;
        }
        populateMinRemaining(clientData, resBody, contains, bricksInModelsMap);
        if (clientData.models.length > 0) {
            findBrick(clientData, resBody);
        } else {
            resBody.finalResult = true;
        }
        return resBody;
    }

    function createNewClientData(id, resBody) {
        var missing = currentProcesses[id] ? currentProcesses[id].missing : {},
            containing = currentProcesses[id] ? currentProcesses[id].containing : {},
            matches = currentProcesses[id] ? currentProcesses[id].matches : {},
            brick = bricksByPopularity[Math.round(Math.random() * 500)];
        var counter = 1;
        while (missing[brick]) {
            brick = bricksByPopularity[counter];
            counter += 1;
        }
        currentProcesses[id] =
            {
                models: [],
                containing: containing,
                matches: matches,
                missing: missing,
                model: undefined
            };
        populateModels(currentProcesses[id]);
        resBody.brick = brick;
        return brick;
    }

    function findBrick(clientData, resBody) {
        delete resBody.brick;
        var bestBrick, bestScore = bricksByPopularity.length;
        bricksInModel[resBody.minRemainingName].forEach(function (brick) {
            if (!clientData.containing[brick]
                && !clientData.ignoredBricks[brick]
                && bricksByPopularity.indexOf(brick) < bestScore) {
                bestBrick = brick;
                bestScore = bricksByPopularity.indexOf(brick);
            }
        });
        resBody.brick = bestBrick;
    }

    function handleAddModel(clientData, model, i) {
        if (!clientData.matches[model]) {
            clientData.matches[model] = pdfsInModel[model].length;
        }
        clientData.models.splice(i, 1);
    }

    function populateMinRemaining(clientData, resBody, haveModel, bricksInModelMap) {
        if (!haveModel) {
            clientData.ignoredBricks = {};
        }
        for (var i = clientData.models.length - 1; i >= 0; i--) {
            var model = clientData.models[i];
            if (bricksInModel[model].length < 20) {
                continue;
            }
            if (clientData.model && haveModel && model !== clientData.model) {
                continue;
            }
            var containingCounter = 0;
            Object.keys(clientData.containing).forEach(function (k) {
                if (bricksInModelMap[model][k]) {
                    containingCounter += 1;
                }
            });
            Object.keys(clientData.ignoredBricks).forEach(function (k) {
                if (bricksInModelMap[model][k]) {
                    containingCounter += 1;
                }
            });
            var remaining = bricksInModel[model].length - containingCounter;
            if (typeof resBody.minRemaining === 'undefined' || remaining < resBody.minRemaining
                || (remaining === resBody.minRemaining && Math.random() > 0.5)) {
                if (remaining === 0) {
                    handleAddModel(clientData, model, i);
                    if (clientData.model === model) {
                        return populateMinRemaining(clientData, resBody, false, bricksInModelMap);
                    }
                } else {
                    resBody.minRemaining = remaining;
                    resBody.minRemainingName = model;
                    resBody.modelPreviewsCount = pdfsInModel[model].length;
                    clientData.model = model;
                }
            }
        }
        return i;
    }

    function populateModels(clientData) {
        clientData.models = JSON.parse(JSON.stringify(modelsDict));
        Object.keys(clientData.missing).forEach(function (missing) {
            modelNames.forEach(function (model) {
                if (Object.keys(bricksInModelsMap[model]).length < 5 || bricksInModelsMap[model][missing]) {
                    delete clientData.models[model];
                }
            });
        });
        clientData.models = Object.keys(clientData.models);
    }

// application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};
