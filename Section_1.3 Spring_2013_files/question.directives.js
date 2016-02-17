angular.module("Question.Directives", ["Latex.Service"])

  .directive("errors", function() {
      return {
          templateUrl: "/service/question/js/angular/partials/errors.html",
          scope: {
              errors: '='
          }
      }
  })

  .directive('compile', function ($compile, latexService) {
      return {
        link: function(scope, element, attrs) {
            latexService.compileLatex(element); 
        }
      };
  })

  .directive("feedback", function () {
      return {
          template: "<div class='feedback'></div>",

          scope: {
              feedback: '='
          },

          controller: function($scope, $sce, $element, latexService) {
              $scope.$watch('feedback', function(value) {
                  if (value) {
                      $element.html(value);
                      latexService.compileLatex($element);
                  } else {
                      $element.html("");
                  }
              });
          }
      };
  })

  .directive("solution", function () {
      return {
          template: "<div class='solution'></div>",

          scope: {
              solution: '='
          },

          controller: function($scope, $sce, $element, latexService) {
              $scope.$watch('solution', function(solution) {
                  if (solution) {
                      $element.html(solution.solution);
                      latexService.compileLatex($element);
                  } else {
                      $element.html("");
                  }
              });
          }
      };
  })

  .directive("pattern", function() {
      return {
          link: function(scope, elem, attrs) {
              var matches = attrs.pattern.match("/(.*)/(i)?");
              var pattern = new RegExp(matches[1], matches[2]); 
              var statuses, value, i;
              elem.on("keyup", function() {   
                  value = this.value;             
                  scope.$apply(function() {       
                     statuses = scope.status[attrs.name];

                     if (statuses) {
                         i = statuses.indexOf("invalid");
                         if (i != -1) {
                            scope.status[attrs.name].splice(i, 1);   
                         }

                         if (!pattern.test(value)) {
                            statuses.push("invalid");
                         }
                     }
                  });
              }); 
          }
      }; 
  })

  .directive("key", function() {
    return {
      template: "<div ng-show='key != null' class='key'>{{key}}</div>",

      scope: {
        key: '='
      }
    }
  })

  .directive('checklistModel', ['$parse', '$compile', function($parse, $compile) {
    // contains
    function contains(arr, item) {
      if (angular.isArray(arr)) {
        for (var i = 0; i < arr.length; i++) {
          if (angular.equals(arr[i], item)) {
            return true;
          }
        }
      }
      return false;
    }

    // add
    function add(arr, item) {
      arr = angular.isArray(arr) ? arr : [];
      for (var i = 0; i < arr.length; i++) {
        if (angular.equals(arr[i], item)) {
          return arr;
        }
      }    
      arr.push(item);
      return arr;
    }  

    // remove
    function remove(arr, item) {
      if (angular.isArray(arr)) {
        for (var i = 0; i < arr.length; i++) {
          if (angular.equals(arr[i], item)) {
            arr.splice(i, 1);
            break;
          }
        }
        if (arr.length === 0) { 
          return "";
        }
      }
      return arr;
    }

    // http://stackoverflow.com/a/19228302/1458162
    function postLinkFn(scope, elem, attrs) {
      // compile with `ng-model` pointing to `checked`
      $compile(elem)(scope);

      // getter / setter for original model
      var getter = $parse(attrs.checklistModel);
      var setter = getter.assign;

      // value added to list
      var value = attrs.checklistValue;//$parse(attrs.checklistValue)(scope.$parent);

      // watch UI checked change
      scope.$watch('checked', function(newValue, oldValue) {
        if (newValue === oldValue) { 
          return;
        } 
        var current = getter(scope.$parent);
        if (newValue === true) {
          setter(scope.$parent, add(current, value));
        } else {
          setter(scope.$parent, remove(current, value));
        }
      });

      // watch original model change
      scope.$parent.$watch(attrs.checklistModel, function(newArr, oldArr) {
        scope.checked = contains(newArr, value);
      }, true);
    }

    return {
      restrict: 'A',
      priority: 1000,
      terminal: true,
      scope: true,
      compile: function(tElement, tAttrs) {
        if (tElement[0].tagName !== 'INPUT' || tElement.attr('type') !== 'checkbox') {
          throw 'checklist-model should be applied to `input[type="checkbox"]`.';
        }

        if (!tAttrs.checklistValue) {
          throw 'You should provide `checklist-value`.';
        }

        // exclude recursion
        tElement.removeAttr('checklist-model');
        
        // local scope var storing individual checkbox model
        tElement.attr('ng-model', 'checked');

        return postLinkFn;
      }
    };
  }])

  .factory('mathJax', function ($window) {
      return $window.MathJax;
  });
