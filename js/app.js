var app = angular.module('expensesApp', ['ngRoute']);

var myHelpers = {
  //from http://stackoverflow.com/questions/2280104/convert-javascript-to-date-object-to-mysql-date-format-yyyy-mm-dd
  dateObjToString: function(dateObj) {
    var year, month, day;
    year = String(dateObj.getFullYear());
    month = String(dateObj.getMonth() + 1);
    if (month.length == 1) {
        month = "0" + month;
    }
    day = String(dateObj.getDate());
    if (day.length == 1) {
        day = "0" + day;
    }
    return year + "-" + month + "-" + day;
  },
  stringToDateObj: function(string) {
    return new Date(string.substring(0,4), string.substring(5,7) - 1, string.substring(8,10));
  }
};

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'views/expenses.html',
      controller: 'ExpensesViewController'
    })
    .when('/expenses', {
      templateUrl: 'views/expenses.html',
      controller: 'ExpensesViewController'
    })
    .when('/expenses/new', {
      templateUrl: 'views/expenseForm.html',
      controller: 'ExpenseViewController'
    })
    .when('/expenses/edit/:id', {
      templateUrl: 'views/expenseForm.html',
      controller: 'ExpenseViewController'
    })
    .otherwise({
      redirectTo: '/'
    });
}]);

app.factory('Expenses', function($http) {
  var service = {};

  service.entries = [];

  $http.get('data/get_all.json')
    .success(function(data){
      service.entries = data;

      service.entries.forEach(element => {
        element.date = myHelpers.stringToDateObj(element.date);
      });
    })
    .error(function(data, status){
      alert('error!');
    });

  // service.getNewId = function() {
  //   if(service.newId) {
  //     service.newId++;
  //     return service.newId;
  //   } else {
  //     //Use underscore.js method 'max' to find largest entry id
  //     var entryMaxId = _.max(service.entries, function(entry){return entry.id});
  //     service.newId = entryMaxId.id + 1;
  //     return service.newId;
  //   }
  // }

  service.getById = function(id) {
    //User underscore.js method 'find' to find first occurance of id number
    return _.find(service.entries, function(entry){return entry.id == id;})
  }

  service.save = function(entry) {
    var toUpdate = service.getById(entry.id);

    if(toUpdate) {
      //_.extend copies from object (second) to target object (first)
      $http.post('data/update.json', entry)
        .success(function(data){
          if(data.success) {
            _.extend(toUpdate, entry);
          }
        })
        .error(function(data, status){
          alert('error!');
        })
    } else {
      $http.post('data/create.json', entry)
        .success(function(data){
          entry.id = data.newId;
          service.entries.push(entry);
        })
        .error(function(data, status){
          alert('error!');
        });
    }
  }

  service.remove = function(entry) {
    $http.post('data/delete.json', {id: entry.id })
      .success(function(data){
        if(data.success) {
          service.entries = _.reject(service.entries, function(element) {
            return element.id == entry.id
          });
        }
      })
      .error(function(data, status) {
        alert('error!');
      })
  };

  return service;
});

//list all expenses
app.controller('ExpensesViewController', ['$scope', 'Expenses', function($scope, Expenses) {
  $scope.expenses = Expenses.entries;

  $scope.remove = function(expense) {
    Expenses.remove(expense);
  };

  $scope.$watch(function(){
    return Expenses.entries
  },
  function(entries) {
    $scope.expenses = entries;
  });
}]);

//create or edit expense
app.controller('ExpenseViewController', ['$scope', '$routeParams', '$location', 'Expenses', function($scope, $routeParams, $location, Expenses) {
    if(!$routeParams.id) {
      $scope.expense = {date: new Date()};
    } else {
      //Use underscore.js 'clone' to copy expense object to avoid modifying the object directly due to 2-way databinding
      $scope.expense = _.clone(Expenses.getById($routeParams.id));
    }

    $scope.save = function() {
        Expenses.save($scope.expense);
        $location.path('/');
    }
}]);

app.directive('tutExpense', function() {
  return {
    restrict: 'E',
    templateUrl: 'views/expense.html'
  }
})
