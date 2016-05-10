function set_new_href(item) {
    var href = item.getAttribute('href');
    if(href[0] !== '/' || href[0] == '#') {
        return href; // Probably external url
    }
    return '/click' + item.getAttribute('href').replace('/wiki', '');
}

var app = angular.module('wikiraces', ['ngRoute', 'ngSanitize'])

.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
          controller: 'MainController',
      })
      /*.when('/seed/:seed', {
          controller: 'MainController',
      })*/
      ;

    $locationProvider.html5Mode(true);
}])

.filter('toTrusted', function ($sce) {
    return function (value) {
        return $sce.trustAsHtml(value);
    };
})

.factory('wikipediaFactory', ['$http', function($http) {
    return {
        'article': function (pageid) {
            return $http.jsonp('https://en.wikipedia.org/w/api.php?action=parse&page=' + pageid + '&callback=JSON_CALLBACK&format=json');
        }
    }
}])
.factory('apiFactory', ['$http', '$q', function($http, $q) {
    return {
        'getSeed': function(seed) {
            var d = $q.defer();
            d.resolve({ data: {'source': {'title': 'Batman'}, 'dest': {'title': 'Tulip'}}});
            return d.promise;
            //return $http.get('/api/seed/' + seed);
        }
    }
}])

.controller('MainController', ['$scope', '$filter','$routeParams', '$route', '$location', 'wikipediaFactory', 'apiFactory','$compile', '$anchorScroll',
    function($scope, $filter, $routeParams, $route, $location, wikipedia, api, $compile, $anchorScroll) {
        
        $scope.source = {};
        $scope.dest = {};
        $scope.WIKI = '';
        $scope.path = [];
        
        $scope.load_article = function(pagename) {
            // Get source page
            $scope.path.push(pagename);
            wikipedia.article(pagename).then(function(resp) {
                var content = resp.data.parse.text['*'];
                $scope.WIKI = content;
            });
        }
        
        api.getSeed($routeParams.seed).then(function(resp) {
            $scope.source = resp.data.source;
            $scope.dest = resp.data.dest;
            
            $scope.load_article($scope.source.title);
        });
        
        $scope.wiki_click = function(href) {
            // Navigate to this page, and track
            $scope.load_article(href);
        };
        
        // Scroll to specified anchor
        $scope.wiki_anchor = function(href) {
            var scrollTo = 'ngScroll' + href;
            $anchorScroll(scrollTo);
        }
    }
])

.directive('wikiTemplate', function ($compile) {
    return {
      restrict: 'E',
      replace: true,
      scope: { 'using': '=' },
      
      link: function(scope, element, attrs) {
          scope.$watch('using', function(newVal, oldVal, sc) {
                // Wait for html to load from wiki
                var data = scope.$parent.WIKI;
                var parser = new DOMParser();
                var wikiContent = parser.parseFromString(data, "text/html");
                
                var a = wikiContent.querySelectorAll('a');
                for (var i = 0; i < a.length; ++i) {
                    var item = a[i];  //
                    var href = set_new_href(item);
                    var clickfn;
                    if (href[0] == '#') {
                        clickfn = 'wiki_anchor("' + href.substr(1) + '")';
                        item.setAttribute('id', 'ngScroll' + href.substr(1));
                    } else {
                        clickfn = 'wiki_click("' + href.replace('/click/', '') + '")';
                    }
                    item.setAttribute('href', href);
                    item.setAttribute('ng-click', clickfn);
                }
                
                var parser_back = new XMLSerializer().serializeToString(wikiContent);
                
                // Put into template
                element.html(parser_back);
                $compile(element.contents())(scope.$parent);
              
          });
      }
    };
  });

;