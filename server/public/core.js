var scotchTodo = angular.module('legoApp', []);

function mainController($scope,
                        $http,
                        $window) {
    $scope.formData = {};
    $scope.modelToImages = {};

    $scope.getNumber = function (num) {
        return new Array(num);
    };

    function handleMatchingModels() {
        $scope.hasMatches = Object.keys($scope.formData.matches).length > 0;
        if (Object.keys($scope.formData.matches).length > 0) {
            angular.forEach($scope.formData.matches, function (len, model) {
                if (!$scope.modelToImages[model]) {
                    $scope.modelToImages[model] = [];
                    for (var i = 0; i < $scope.formData.matches[model]; i++) {
                        $scope.modelToImages[model].push('http://localhost:8080/download-preview?model=' + model + '&num=' + i);
                    }
                }
            });
        }
    }

    function handleCurrentPreviews() {
        $scope.modelPreviews = [];
        for (var i = 0; i < $scope.formData.modelPreviewsCount; i++) {
            $scope.modelPreviews.push('http://localhost:8080/download-preview?model=' + $scope.formData.minRemainingName + '&num=' + i);
        }
    }

    $scope.modelSizes = [
        false,
        false,
        false,
        false,
        false
    ];

    function resetModelSizes(num) {
        $scope.modelSizes[num] = 'true';
        for (var i = 0; i < $scope.modelSizes.length; i++) {
            if (i !== num) {
                $scope.modelSizes[i] = false;
            }
        }
    }

    resetModelSizes(1);

    function callResetModelSize(min) {
        switch (min) {
            case 5:
                resetModelSizes(0);
                break;
            case 20:
                resetModelSizes(1);
                break;
            case 40:
                resetModelSizes(2);
                break;
            case 60:
                resetModelSizes(3);
                break;
            case 80:
                resetModelSizes(4);
                break;
        }
    }

    $scope.updateSize = function (min, max) {
        $http.get('/update-size',
            {
                params: {
                    min: min,
                    max: max,
                    id: $scope.formData.id,
                    userName: $scope.userName
                }
            })
            .success(function () {
                callResetModelSize(min);
                $scope.skipModel($scope.formData.minRemainingName, true);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    $scope.addName = function (userName) {
        $scope.userName = userName;
        $scope.formData.userName = $scope.userName;
        $http.get('/load-user',
            {
                params: $scope.formData
            })
            .success(function (data) {
                handleAskResponse(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    $scope.addModel = function (model) {
        $http.get('/api/add',
            {
                params: {
                    model: model,
                    id: $scope.formData.id,
                    userName: $scope.userName
                }
            })
            .success(function (data) {
                handleAskResponse(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    $scope.skipModel = function (model, onlyUpdateSize) {
        $http.get('/api/skip',
            {
                params: {
                    model: model,
                    id: $scope.formData.id,
                    userName: $scope.userName,
                    onlyUpdateSize: onlyUpdateSize
                }
            })
            .success(function (data) {
                handleAskResponse(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    function handleAskResponse(data) {
        $scope.formData = data;
        $scope.image = 'http://localhost:8080/download-image?name=' + $scope.formData.brick;
        callResetModelSize($scope.formData.minModelSize);
        handleCurrentPreviews();
        handleMatchingModels();
    }

    $scope.askServer = function (contains, onlyContinue) {
        $scope.formData.contains = contains;
        $scope.formData.onlyContinue = onlyContinue;
        $scope.formData.userName = $scope.userName;
        $http.get('/api/ask',
            {
                params: $scope.formData
            })
            .success(function (data) {
                handleAskResponse(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    $scope.humanize = function (str) {
        var frags = str.split('_');
        for (var i = 0; i < frags.length; i++) {
            frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
        }
        return frags.join(' ');
    };


    $scope.askServer();
    // var first = true;
    // doLoop = function (count) {
    //     $timeout(function () {
    //         if (!first) {
    //             if (count < 40) {
    //                 count++;
    //                 $scope.askServer(true);
    //                 doLoop(count);
    //             }
    //         } else {
    //             count++;
    //             first = false;
    //             $scope.askServer();
    //             doLoop(count);
    //         }
    //     }, 100);
    // };
    // doLoop(0);

    $scope.getImage = function () {
        $http.get('/download-image',
            {
                params: {name: $scope.formData.brick}
            })
            .success(function (data) {
                $scope.image = data;
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    $scope.openPdf = function (name, pdfNum) {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", "/download-pdf?name=" + name + "&pdfNum=" + pdfNum, true);
        oReq.responseType = "arraybuffer";
        oReq.onload = function () {
            var file = new Blob([oReq.response], {type: "application/pdf"});
            var fileURL = URL.createObjectURL(file);
            // $scope.content = $sce.trustAsResourceUrl(fileURL);
            $window.open(fileURL);
        };
        oReq.send();
    };
}
