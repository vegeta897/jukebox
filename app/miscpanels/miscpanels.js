'use strict';
Application.Directives.directive('changelog',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/miscpanels/changelog.html',
        replace: true,
        scope: {},
        controller: function($scope,MiscPanels,ControlButtons) {
            $scope.control = ControlButtons.addControl('changelog','Changelog',false,false);
            $scope.control.openPanel = MiscPanels.getChangelog;
            $scope.changelog = MiscPanels.initChangelog();
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Directives.directive('mumble',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/miscpanels/mumble.html',
        replace: true,
        scope: {},
        controller: function($scope,MiscPanels,ControlButtons) {
            $scope.control = ControlButtons.addControl('mumble','Mumble',false,false);
            $scope.control.openPanel = MiscPanels.getMumble;
            $scope.mumble = MiscPanels.initMumble();
        },
        link: function(scope,element,attrs) {

        }
    }
});

Application.Directives.directive('admin',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/miscpanels/admin.html',
        replace: true,
        scope: {},
        controller: function($scope,ControlButtons,FireService,Jukebox,Canvas) {
            $scope.control = ControlButtons.addControl('admin','Admin',true,false);
            $scope.requireVersion = function() { // Set firebase version
                FireService.setGlobal('version',Jukebox.version);
            };
            $scope.clearCanvas = function() { FireService.remove('canvas'); Canvas.clear(); };
        },
        link: function(scope,element,attrs) {

        }
    }
});

Application.Services.factory('MiscPanels',function() {
    var changelog, mumble;
    return {
        getChangelog: function() {
            changelog.loading = true;
            jQuery.ajax({ // Get last 10 commits from github
                url: 'https://api.github.com/repos/vegeta897/jukebox/commits', dataType: 'jsonp',
                success: function (results) {
                    changelog.loading = false;
                    changelog.commits = [];
                    if (!results.data) return;
                    for (var i = 0; i < results.data.length; i++) {
                        changelog.commits.push({
                            message: results.data[i].commit.message,
                            date: Date.parse(results.data[i].commit.committer.date)
                        });
                        if (changelog.commits.length > 9) break;
                    }
                }
            });
        },
        getMumble: function() {
            mumble.loading = true;
            jQuery.ajax({ // Get mumble server status
                url: 'http://api.commandchannel.com/cvp.json?email=vegeta897@gmail.com&apiKey=4BC693B4-11FD-4E9E-8BA5-E3B39D5A04B9&callback=?', dataType: 'jsonp',
                success: function(results) {
                    mumble.loading = false;
                    mumble.channels = {};
                    if(results.name) {
                        mumble.empty = true;
                        for(var i = 0, il = results.root.channels.length; i < il; i++) {
                            var channel = results.root.channels[i];
                            if(channel.users.length == 0) { continue; }
                            mumble.empty = false;
                            mumble.channels[channel.name] = channel.users;
                        }
                    }
                }
            });
        },
        initChangelog: function() { changelog = { }; return changelog; },
        initMumble: function() { mumble = { }; return mumble; }
    };
});