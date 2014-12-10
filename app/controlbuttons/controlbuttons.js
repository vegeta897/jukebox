'use strict';
Application.Directives.directive('controlButtons',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/controlbuttons/controlbuttons.html',
        replace: true,
        scope: true,
        //require: '^Main',
        controller: function($rootScope,$scope,$timeout,ControlButtons) {
            $scope.controlList = ControlButtons.init();

            $scope.showControl = function(name) {
                ControlButtons.showControl(name);
                $rootScope.$broadcast('open:'+name);
                $timeout(function(){ window.scrollTo(0,document.body.scrollHeight); }); // Scroll to bottom
                
            };
        },
        link: function(scope,element,attrs) {

        }
    }
});

Application.Services.factory('ControlButtons',function(User) {
    var controlList;
    return {
        init: function() { 
            controlList = {
                //addVideo: {title: 'Add Videos'}, curator: {title: 'Curator'},
                ///*addBounty: {title: 'Add Bounty'}, titleGamble: {title: 'Title Gamble'},*/
                //fillBlank: {title: 'Fill the B_ank'}, avatarShop: {title: 'Avatar Shop'},
                //mumble: {title: 'Mumble'}, changelog: {title: 'Changelog'},
                //meta: {title: 'Meta'}, admin: {title: 'Admin', admin: true}
            }; 
            return controlList;
        },
        addControl: function(name,title,admin,isNew) {
            controlList[name] = { title: title, admin: admin, new: isNew };
            return controlList[name];
        },
        showControl: function(name) {
            var control = controlList[name];
            if(control.show) { control.show = false; return; }
            for(var key in controlList) { if(!controlList.hasOwnProperty(key)) continue;
                controlList[key].show = key == name;
            }
            console.log(controlList);
            // TODO: Listen for broadcast in mumble and changelog directives
            //if(name == "mumble") {
            //    jQuery.ajax({ // Get mumble server status
            //        url: 'http://api.commandchannel.com/cvp.json?email=vegeta897@gmail.com&apiKey=4BC693B4-11FD-4E9E-8BA5-E3B39D5A04B9&callback=?', dataType: 'jsonp',
            //        success: function(results) {
            //            if(results.name) {
            //                $scope.mumble = { empty: true };
            //                for(var i = 0, il = results.root.channels.length; i < il; i++) {
            //                    var channel = results.root.channels[i];
            //                    if(channel.users.length == 0) { continue; }
            //                    $scope.mumble.empty = false;
            //                    $scope.mumble[channel.name] = channel.users;
            //                }
            //            }
            //        }
            //    });
            //}
            //if(name == "changelog") {
            //    jQuery.ajax({ // Get last 8 commits from github
            //        url: 'https://api.github.com/repos/vegeta897/jukebox/commits', dataType: 'jsonp',
            //        success: function (results) {
            //            $scope.commits = [];
            //            if (!results.data) return;
            //            for (var i = 0; i < results.data.length; i++) {
            //                $scope.commits.push({
            //                    message: results.data[i].commit.message,
            //                    date: Date.parse(results.data[i].commit.committer.date)
            //                });
            //                if ($scope.commits.length > 9) break;
            //            }
            //        }
            //    });
            //}
        }
    };
});