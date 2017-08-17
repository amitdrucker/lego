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

    app.get('/update-size', function (req, res) {
        loadUserData(req);
        var clientData = currentProcesses[req.query.id];
        clientData.minModelSize = req.query.min;
        clientData.maxModelSize = req.query.max;
        completeResponse(res, undefined, clientData);
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

    function loadUserData(req) {
        if (req.query.userName) {
            var filename = '../data/users/' + req.query.userName + '.json';
            if (fs.existsSync(filename)) {
                var userData = JSON.parse(fs.readFileSync(filename));
                req.query.id = userData.id;
                currentProcesses[userData.id] = userData;
            } else if (req.query.id && currentProcesses[req.query.id]) {
                currentProcesses[req.query.id].userName = req.query.userName;
            }
        }
    }

    app.get('/api/ask', function (req, res) {
        var resBody = {};
        loadUserData(req);
        if (!req.query.id) {
            req.query.id = uuidv4();
            createNewClientData(req.query.id, resBody);
        }
        var clientData = currentProcesses[req.query.id];
        resBody.id = req.query.id;
        handleResponse(req.query.id, req.query.contains, req.query.brick, resBody, req.query.onlyContinue);
        completeResponse(res, resBody, clientData);
    });

    app.get('/api/add', function (req, res) {
        loadUserData(req);
        var resBody = {};
        var model = req.query.model;
        var clientData = currentProcesses[req.query.id];
        resBody.id = req.query.id;
        for (var i = 0; i < Object.keys(modelsDict).length; i++) {
            if (modelsDict[i] === model) {
                break;
            }
        }
        handleAddModel(clientData, model, i);
        populateMinRemaining(clientData, resBody, false, bricksInModelsMap);
        findBrick(clientData, resBody, resBody.minRemainingName);
        completeResponse(res, resBody, clientData);
    });

    app.get('/load-user', function (req, res) {
        loadUserData(req);
        var clientData = currentProcesses[req.query.id];
        res.send(clientData);
    });

    app.get('/api/skip', function (req, res) {
        loadUserData(req);
        var resBody = {};
        var model = req.query.model;
        var clientData = currentProcesses[req.query.id];
        clientData.skippedModels[model] = true;
        resBody.id = req.query.id;
        populateMinRemaining(clientData, resBody, false, bricksInModelsMap);
        findBrick(clientData, resBody, resBody.minRemainingName);
        completeResponse(res, resBody, clientData);
    });

    function completeResponse(res, resBody, clientData) {
        clientData.brick = resBody.brick;
        resBody.matches = clientData.matches;
        resBody.containing = Object.keys(clientData.containing);
        resBody.missing = Object.keys(clientData.missing);
        resBody.skippedModels = Object.keys(clientData.skippedModels);

        if (resBody.remaining) {
            clientData.remaining = resBody.remaining;
        }
        if (resBody.minRemainingName) {
            clientData.minRemainingName = resBody.minRemainingName;
        }
        if (resBody.modelPreviewsCount) {
            clientData.modelPreviewsCount = resBody.modelPreviewsCount;
        }
        if (clientData.userName) {
            fs.writeFileSync('../data/users/' + clientData.userName + '.json',
                JSON.stringify(clientData));
        }
        res.send(resBody);
    }

    function handleResponse(id, contains, brick, resBody, onlyContinue) {
        var clientData = currentProcesses[id];
        // in case this is new
        if (!brick) {
            populateMinRemaining(clientData, resBody, undefined, bricksInModelsMap);
            return resBody;
        }
        if (!contains) {
            clientData.missing[brick] = brick;
        } else if (!onlyContinue) {
            clientData.containing[brick] = brick;
        } else {
            if (!clientData.ignoredBricks) {
                clientData.ignoredBricks = {};
            }
            clientData.ignoredBricks[brick] = true;
        }
        populateMinRemaining(clientData, resBody, contains, bricksInModelsMap);
        if (modelNames.length -
            Object.keys(clientData.missing).length -
            Object.keys(clientData.matches).length -
            Object.keys(clientData.skippedModels).length > 0) {
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
            brick = bricksByPopularity[Math.round(Math.random() * 500)],
            skippedModels = currentProcesses[id] ? currentProcesses[id].skippedModels : {},
            minModelSize = currentProcesses[id] ? currentProcesses[id].minModelSize : 20,
            maxModelSize = currentProcesses[id] ? currentProcesses[id].maxModelSize : 60,
            userName = currentProcesses[id] ? currentProcesses[id].userName : undefined;

        var counter = 1;
        while (missing[brick]) {
            brick = bricksByPopularity[counter];
            counter += 1;
        }
        currentProcesses[id] =
            {
                id: id,
                models: [],
                containing: containing,
                matches: matches,
                missing: missing,
                model: undefined,
                skippedModels: skippedModels,
                minModelSize: minModelSize,
                maxModelSize: maxModelSize,
                userName: userName
            };
        resBody.brick = brick;
        currentProcesses[id].brick = brick;
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
    }

    function populateMinRemaining(clientData, resBody, haveModel, bricksInModelMap) {
        if (!haveModel) {
            clientData.ignoredBricks = {};
        }
        var i, shuffled = {},
            modelsLength = modelNames.length;

        while (Object.keys(shuffled).length < modelsLength) {
            i = Math.floor(Math.random() * modelsLength);
            while (shuffled[i]) {
                i = Math.floor(Math.random() * modelsLength);
            }
            shuffled[i] = true;
            var model = modelNames[i];
            if (clientData.skippedModels[model] || clientData.matches[model]) {
                continue;
            }
            if (bricksInModel[model].length < clientData.minModelSize ||
                (clientData.maxModelSize > 0 && bricksInModel[model].length >= clientData.maxModelSize)) {
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
            if (typeof resBody.containing === 'undefined' || containingCounter > resBody.containing) {
                var remaining = bricksInModel[model].length - containingCounter;
                if (remaining === 0) {
                    handleAddModel(clientData, model, i);
                    if (clientData.model === model) {
                        return populateMinRemaining(clientData, resBody, false, bricksInModelMap);
                    }
                } else {
                    resBody.remaining = remaining;
                    resBody.minRemainingName = model;
                    resBody.modelPreviewsCount = pdfsInModel[model].length;
                    clientData.model = model;
                }
            }
        }
        return i;
    }

// application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};
