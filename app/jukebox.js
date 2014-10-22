'use strict';

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: 'M7lc1UVf-VE',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    //event.target.playVideo();
    event.target.unMute(); event.target.setVolume(100);
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
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
    obj.addVideo = function (videoId, title, addedBy) {
        return $http.post(serviceBase + 'addVideo', {video_id:videoId,title:title,added_by:addedBy}).then(function (results) {
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
    $scope.addVideo = function() {
        console.log('adding',$scope.add_url, $scope.add_name);
        if($scope.add_url && $scope.add_name) {
            services.addVideo($scope.add_url, $scope.add_name, 'vegeta897').then(function(results) {
                console.log(results);
            });
        }
    };
    $scope.playVideo = function(index) {
        $scope.playing = $scope.videoSelection[index];
        console.log('playing',$scope.playing.title);
        player.loadVideoById($scope.playing.video_id);
        player.unMute(); player.setVolume(100);
    }
});