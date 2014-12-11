'use strict';
Application.Directives.directive('curator',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/curator/curator.html',
        replace: true,
        scope: {},
        controller: function($rootScope,$scope,Curator,ControlButtons) {
            $scope.control = ControlButtons.addControl('curator','Curator',false,false);
            $scope.curator = Curator.init();
            $scope.beginCurator = Curator.beginCurator;
            $scope.removeFromCurator =  Curator.removeFromCurator;
            $scope.saveCurated =  Curator.saveCurated;
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('Curator',function(User,FireService,Util,API,Message) {
    var curator;
    return {
        beginCurator: function() {
            curator.fetching = true;
            FireService.once('curating',function(curating) {
                var locked = [];
                for(var videoID in curating) { if(!curating.hasOwnProperty(videoID)) continue;
                    locked.push("'"+videoID+"'");
                }
                locked = locked.length == 0 ? "''" : locked.join(',');
                console.log(locked);
                API.pullUncurated(locked).then(function(data) {
                    console.log('Videos retrieved to be curated',data.data);
                    if(!data || !data.data || data.data.length != 5) {
                        Message.set({ type:'error',
                            text:'Error retrieving videos. You can probably blame my hosting service.' }); 
                        return;
                    }
                    var curating = {}; // Object of video IDs 
                    for(var d = 0, dl = data.data.length; d < dl; d++) {
                        curating[data.data[d].video_id] = User.getName();
                        data.data[d].duration = Util.parseUTCtime(data.data[d].duration);
                        data.data[d].index = d;
                    }
                    FireService.update('curating',curating);
                    curator.fetching = false;
                    curator.curateList = data.data;
                    $timeout(function(){});
                });
            });
        },
        removeFromCurator: function(index) {
            FireService.remove('curating/'+curator.curateList[index].video_id);
            curator.curateList.splice(index,1);
        },
        saveCurated: function() {
            curator.saving = true;
            API.saveCurated(curator.curateList, User.getName()).then(function(results) {
                console.log(results);
                curator.saving = false;
                if(!results.data || !results.data.data) {
                    Message.set({ type: 'error', 
                        text: 'Sorry, there was a server error. Tell Vegeta about it.' }); 
                    return;
                }
                Message.set({ type: 'success', 
                    text: '<strong>Thank you</strong> for your help curating the database!' });
                var addQuantity = results.data.data.videos.length == 1 ? 'a video' : results.data.data.videos.length + ' videos';
                FireService.sendEvent(User.getName(),
                    'just curated ' + addQuantity + '! What ' + Util.buildSubject() + '!');
                for(var i = 0, il = curator.curateList.length; i < il; i++) {
                    FireService.remove('curating/'+curator.curateList[i].video_id);
                }
                delete curator.curateList;
            });
        },
        init: function() { curator = { }; return curator; }
    };
});