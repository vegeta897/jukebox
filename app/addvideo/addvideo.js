'use strict';
Application.Directives.directive('addVideo',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/addvideo/addvideo.html',
        replace: true,
        scope: {},
        controller: function($rootScope,$scope,AddVideo,ControlButtons) {
            $scope.control = ControlButtons.addControl('addVideo','Add Videos',false,false);
            $scope.adding = AddVideo.init();
            $scope.addVideo = AddVideo.addVideo;
            $scope.parseURL = AddVideo.parseURL;
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('AddVideo',function(Videos,User,FireService,API,Util,Message) {
    var adding;
    return {
        parseURL: function() {
            if(!adding.urlSingle && !adding.urlBatch) { return; }
            var urls = adding.batchMode ? adding.urlBatch.split('\n') : [adding.urlSingle];
            adding.parsedIds = '';
            for(var i = 0, il = urls.length; i < il; i++) {
                var re = /(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
                var parsed = urls[i].replace(re,'$1').replace('http://','').replace('https://','').substr(0,11);
                if(parsed.length == 11) {
                    adding.parsedIds += parsed+',';
                    adding.valid = true;
                } else {
                    adding.valid = false; break;
                }
            }
            adding.parsedIds = adding.parsedIds.substring(0,adding.parsedIds.length-1);
        },
        addVideo: function() {
            if(adding.parsedIds.length < 11 || !adding.valid) { return; }
            console.log('adding',adding.parsedIds);
            adding.processing = true;
            if(adding.artist) adding.artist = adding.artist.trim();
            if(adding.track) adding.track = adding.track.trim();
            if(adding.artist == '') delete adding.artist;
            if(adding.track == '') delete adding.track;
            API.addVideo(adding.parsedIds, adding.artist, adding.track, User.getName()).then(function(results) {
                console.log(results);
                adding.parsedIds = adding.urlSingle = adding.urlBatch = '';
                adding.processing = false;
                if(typeof results.data == 'string' && results.data.substr(0,9) == 'Duplicate') {
                    console.log('video id already exists!');
                    Message.set({ type: 'error', text: 'That video has already been added.' });
                } else {
                    if(!results.data || !results.data.data) {
                        Message.set({ type: 'error', 
                            text: 'Sorry, there was a server error. Tell Vegeta about it.' }); 
                        return;
                    }
                    var justAdded = results.data.data.items.length == 1 ? 
                        results.data.data.items[0].snippet.title : 'Videos';
                    var reward = parseInt(results.data.data.items.length * 25);
                    Message.set({ type: 'success', 
                        text: '<strong>'+justAdded + '</strong> added successfully!', kudos: reward });
                    var addQuantity = results.data.data.items.length == 1 ? 'a video' : results.data.data.items.length + ' videos';
                    FireService.sendEvent(User.getName(),'just added ' + addQuantity + '! What ' + 
                        Util.buildSubject() + '!');
                    User.changeKudos(reward);
                }
            });
        },
        init: function() { adding = { urlSingle: '', urlBatch: '', batchMode: false }; return adding; }
    };
});