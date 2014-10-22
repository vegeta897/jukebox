'use strict';

var fireRef = new Firebase('https://jukebox897.firebaseio.com/box1');

// 1. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 2. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        //videoId: 'M7lc1UVf-VE',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 3. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    //event.target.playVideo();
    event.target.unMute(); event.target.setVolume(100);
}

// 4. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var playing = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !playing) {
        //setTimeout(stopVideo, 6000);
        playing = true;
    }
}
function stopVideo() {
    player.stopVideo();
    //player.loadVideoById('TgoAgYR4584');
    //player.unMute(); player.setVolume(100);
}

Application.Services.factory("services", ['$http', function($http) {
    var serviceBase = 'php/', obj = {};
    obj.getVideos = function(){
        return $http.get(serviceBase + 'videos');
    };
    obj.addVideo = function (videoId, title, artist, track, addedBy) {
        return $http.post(serviceBase + 'addVideo', {video_id:videoId,title:title,artist:artist,track:track,added_by:addedBy}).then(function (results) {
            return results;
        });
    };
    obj.deleteVideo = function (id) {
        return $http.delete(serviceBase + 'deleteVideo?id=' + id).then(function (status) {
            return status.data;
        });
    };
    return obj;
}]);


Application.Controllers.controller('Main', function($scope, services) {
    console.log('Main controller initialized');
    
    services.getVideos().then(function(data) {
        console.log(data);
        $scope.videoSelection = data.data;
    });
    
    $scope.parseURL = function() {
        if(!$scope.add_url && !$scope.batchList) { return; }
        var urls = $scope.enableBatch ? $scope.batchList.split('\n') : [$scope.add_url];
        console.log(urls);
        $scope.parsedIds = [];
        for(var i = 0, il = urls.length; i < il; i++) {
            var re = /(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
            var parsed = urls[i].replace(re,'$1').replace('http://','').replace('https://','').substr(0,11);
            if(parsed.length == 11) {
                $scope.parsedIds.push(parsed);
                $scope.add_valid = true;
            } else {
                $scope.add_valid = false;
                break;
            }
        }
    };
    
    $scope.parseTitle = function() {
        $scope.add_artist = $scope.add_name.split(' - ')[0];
        $scope.add_track = $scope.add_name.split(' - ')[1];
    };
    
    $scope.addVideo = function() {
        if($scope.parsedIds.length != 1 || !$scope.add_valid) { return; }
        console.log('adding',$scope.parsedId, $scope.add_name);
        $scope.addingVideo = true;
        services.addVideo($scope.parsedIds[0], $scope.add_name, $scope.add_artist, $scope.add_track, 'vegeta897').then(function(results) {
            console.log(results);
            $scope.parsedIds = [];
            delete $scope.add_url;
            delete $scope.add_name;
            delete $scope.batchList;
            $scope.addingVideo = false;
        });
    };
    
    $scope.playVideo = function(index) {
        $scope.playing = $scope.videoSelection[index];
        $scope.playing.startTime = new Date().getTime();
        console.log('playing',$scope.playing.title);
        player.loadVideoById($scope.playing.video_id);
        player.unMute(); player.setVolume(100);
        fireRef.child('playing').set(angular.copy($scope.playing));
    }
});