'use strict';
//Application.Directives.directive('player',function() {
//    return {
//        restrict: 'E',
//        templateUrl: 'app/player/player.html',
//        replace: true,
//        scope: true,
//        controller: function($scope) {
//
//        },
//        link: function(scope,element,attrs) {
//            console.log('player directive initialized');
//        }
//    }
//});

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390', width: '640', events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange }
    });
}

function onPlayerReady(event) { }
var playing = false;
function onPlayerStateChange(event) {
    if(event.data == YT.PlayerState.PAUSED && playing) { player.playVideo(); }
    if (event.data == YT.PlayerState.PLAYING && !playing) {
        playing = true; player.setPlaybackQuality('large');
    }
}
function stopVideo() { player.stopVideo(); }

Application.Services.factory('Player',function() {
    
    return {
        loadVideo: function(videoID,start,quality) {
            if(!player) return;
            player.loadVideoById(videoID,start,quality);
            player.setPlaybackQuality('large');
        },
        isReady: function() {
            return player && player.hasOwnProperty('loadVideoById');
        },
        isMuted: function() { return player ? player.isMuted() : false; }, 
        getVolume: function() { return player ? player.getVolume() : 0; } 
    };
});