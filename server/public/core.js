var scotchTodo = angular.module('legoApp', []);

function mainController($scope, $http, $sce) {
    $scope.formData = {};

    $scope.askServer = function (contains) {
        $scope.formData.contains = contains;
        $http.get('/api/ask',
            {
                params: $scope.formData
            })
            .success(function (data) {
                $scope.formData = data;
                $scope.image = 'http://localhost:8080/download-image?name='+$scope.formData.brick;
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };
    $scope.askServer();

    $scope.getImage = function () {
        $http.get('/download-image',
            {
                params: {name:$scope.formData.brick}
            })
            .success(function (data) {
                $scope.image = data;
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    $scope.openPdf = function (name) {
        $http.get('/download-pdf',
            {
                params: {name:name}
            })
            .success(function (data) {
                var file = new Blob([data], {type: 'application/pdf'});
                var fileURL = URL.createObjectURL(file);
                $scope.content = $sce.trustAsResourceUrl(fileURL);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };


    // when submitting the add form, send the text to the node API
    $scope.createTodo = function () {
        $http.post('/api/todos', $scope.formData)
            .success(function (data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.todos = data;
                console.log(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    // delete a todo after checking it
    $scope.deleteTodo = function (id) {
        $http.delete('/api/todos/' + id)
            .success(function (data) {
                $scope.todos = data;
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

}
