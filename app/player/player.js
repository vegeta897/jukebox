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

Application.Services.factory('Player',function($rootScope,Jukebox,localStorageService,User) {
    var interval, muted, volume = localStorageService.get('volume');
    
    interval = setInterval(function(){
        if(player && player.hasOwnProperty('loadVideoById')) {
            Jukebox.initialize(); clearInterval(interval);
        }
    },100);
    
    $rootScope.$on('interval',function() {
        if(!playing) return;
        if(muted != player.isMuted()) {
            User.setUserProperty('muted',player.isMuted());
        }
        if(parseInt(player.getVolume()) != volume) {
            volume = parseInt(player.getVolume()) || 0;
            User.setUserProperty('volume',volume);
            localStorageService.set('volume',volume);
        }
    });
    
    return {
        loadVideo: function(videoID,start,quality) {
            if(!player) return;
            player.loadVideoById(videoID,start,quality);
            player.setPlaybackQuality('large');
        },
        isMuted: function() { return player ? player.isMuted() : false; }, 
        getVolume: function() { return player ? player.getVolume() : 0; } 
    };
});