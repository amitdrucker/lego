module.exports = function (app) {
    fs = require('fs');
    const uuidv4 = require('uuid/v4');
    var path = require('path');
    var currentProcesses = {};
    var bricksInModel = JSON.parse(fs.readFileSync('../data/bricksInModel.json'));
    var bricksInModelsMap = JSON.parse(fs.readFileSync('../data/bricksInModelsMap.json'));
    var bricksByPopularity = JSON.parse(fs.readFileSync('../data/bricksByPopularity.json'));
    var countPdfs = JSON.parse(fs.readFileSync('../data/countPdfs.json'));
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

    app.get('/get-preview', function (req, res) {
        var model = req.query.model;
        var num = req.query.num;
        var file = countPdfs[model][num];
        res.download(path.resolve(file));
    });

    app.get('/download-pdf', function (req, res) {
        // var items = fs.readdirSync('../data/pdfs/' + req.query.name);
        res.download(path.resolve(countPdfs[req.query.name][req.query.pdfNum] + '.pdf'));
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
        resBody.id = req.query.id;
        var newRes = handleResponse(req.query.id, req.query.contains, req.query.brick, resBody);
        resBody.matches = currentProcesses[req.query.id].matches;
        res.send(newRes);
    });

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
            if (!clientData.containing[brick] && bricksByPopularity.indexOf(brick) < bestScore) {
                bestBrick = brick;
                bestScore = bricksByPopularity.indexOf(brick);
            }
        });
        resBody.brick = bestBrick;
    }

    function populateMinRemaining(clientData, resBody, haveModel, bricksInModelMap) {
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
            var remaining = bricksInModel[model].length - containingCounter;
            if (typeof resBody.minRemaining === 'undefined' || remaining < resBody.minRemaining
                || (remaining === resBody.minRemaining && Math.random() > 0.5)) {
                if (remaining === 0) {
                    if (!clientData.matches[model]) {
                        clientData.matches[model] = countPdfs[model].length;
                    }
                    clientData.models.splice(i, 1);
                    if (clientData.model === model) {
                        return populateMinRemaining(clientData, resBody, false, bricksInModelMap);
                    }
                } else {
                    resBody.minRemaining = remaining;
                    resBody.minRemainingName = model;
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

    function handleResponse(id, contains, brick, resBody) {
        var clientData = currentProcesses[id];
        // in case this is new
        if (!brick) {
            populateMinRemaining(clientData, resBody, undefined, bricksInModelsMap);
            return resBody;
        }
        if (!contains) {
            clientData.missing[brick] = brick;
            populateModels(clientData);
        } else {
            clientData.containing[brick] = brick;
        }
        populateMinRemaining(clientData, resBody, contains, bricksInModelsMap);
        if (clientData.models.length > 0) {
            findBrick(clientData, resBody, resBody.minRemainingName);
        } else {
            resBody.finalResult = true;
        }
        return resBody;
    }

// application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};
