var scotchTodo = angular.module('legoApp', []);

function mainController($scope,
                        $http,
                        $sce,
                        $window,
                        $timeout) {
    $scope.formData = {};
    $scope.matches = {};

    $scope.getNumber = function (num) {
        return new Array(num);
    };

    $scope.askServer = function (contains) {
        $scope.formData.contains = contains;
        $http.get('/api/ask',
            {
                params: $scope.formData
            })
            .success(function (data) {
                $scope.formData = data;
                $scope.image = 'http://localhost:8080/download-image?name=' + $scope.formData.brick;
                if ($scope.formData.matches.length > 0) {
                    angular.forEach($scope.formData.matches, function (m) {
                        if (!$scope.matches[m]) {
                            $scope.matches[m] = [];
                            $http.get('/count-pdf?name=' + m)
                                .success(function (res) {
                                    $scope.matches[res.name] = res.count;
                                })
                                .error(function (data) {
                                    console.log('Error: ' + data);
                                });
                        }
                    });
                }
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };
    var first = true;
    doLoop = function (count) {
        $timeout(function () {
            if (!first) {
                if (count < 40) {
                    count++;
                    $scope.askServer(true);
                    doLoop(count);
                }
            } else {
                count++;
                first = false;
                $scope.askServer();
                doLoop(count);
            }
        }, 100);
    };
    doLoop(0);

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
