'use strict';

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
    if(event.data == YT.PlayerState.PAUSED) {
        player.playVideo();
    }
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

function parseUTCtime(utc) { // Converts 'PT#M#S' to an object
    if(utc.hasOwnProperty('stamp')) return utc;
    var sec = parseInt(utc.substring(utc.indexOf('M')+1,utc.indexOf('S')));
    var min = parseInt(utc.substring(2,utc.indexOf('M')));
    var stamp = utc.substring(2,utc.indexOf('S')).replace('M',':').split(':');
    stamp = stamp[0] + ':' + ( stamp[1].length > 1 ? stamp[1] : '0' + stamp[1] );
    return { totalSec: (min*60 + sec), min: min, sec: sec, stamp: stamp };
}

Application.Services.factory("services", ['$http', function($http) {
    var serviceBase = 'php/', obj = {};
    obj.getVideos = function(){
        return $http.get(serviceBase + 'videos');
    };
    obj.addVideo = function (videoId, artist, track, addedBy) {
        return $http.post(serviceBase + 'addVideo', {video_id:videoId,artist:artist,track:track,added_by:addedBy}).then(function (results) {
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


Application.Controllers.controller('Main', function($scope, services, localStorageService) {
    console.log('Main controller initialized');
    
    var username = localStorageService.get('username');
    var passcode = localStorageService.get('passcode');
    $scope.username = username; $scope.passcode = passcode;
    var fireRef = new Firebase('https://jukebox897.firebaseio.com/box1');
    
    $scope.login = function() {
        if(!$scope.username || !$scope.passcode) return;
        var initUser = function() {
            $scope.auth = auth;
            localStorageService.set('username',username);
            localStorageService.set('passcode',passcode);
            var fireUser = fireRef.child('users/'+username);
            var lastOnlineRef = fireUser.child('lastOnline');
            var fireAuths = fireRef.child('auths');
            fireAuths.child(auth.uid).set(passcode);
            var connectedRef = new Firebase('https://jukebox897.firebaseio.com/.info/connected');
            connectedRef.on('value', function(snap) {
                if (snap.val() === true) {
                    var conRef = fireUser.child('connections').push(auth.uid);
                    conRef.onDisconnect().remove();
                    fireUser.child('uid').set(auth.uid);
                    lastOnlineRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
                }
            });
        };
        username = $scope.username;
        passcode = $scope.passcode;
        console.log('Logging in',username);
        var auth = fireRef.getAuth();
        if(auth.hasOwnProperty('expires') && auth.expires*1000 > new Date().getTime()) {
            console.log('Firebase authenticated!',auth);
            initUser();
        } else {
            fireRef.authAnonymously(function(error, authData) {
                auth = error ? null : authData;
                console.log('Firebase re-authenticated!',auth);
                initUser();
            });
        }
    };
    
    services.getVideos().then(function(data) {
        console.log('Videos retrieved',data);
        for(var d = 0, dl = data.data.length; d < dl; d++) {
            data.data[d].duration = parseUTCtime(data.data[d].duration);
        }
        $scope.videoSelection = data.data;
        fireRef.child('selection').set(angular.copy($scope.videoSelection));
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
    
    $scope.addVideo = function() {
        if($scope.parsedIds.length != 1 || !$scope.add_valid) { return; }
        console.log('adding',$scope.parsedIds);
        $scope.addingVideo = true;
        services.addVideo($scope.parsedIds[0], $scope.add_artist, $scope.add_track, 'vegeta897').then(function(results) {
            console.log(results);
            $scope.parsedIds = [];
            delete $scope.add_url;
            delete $scope.batchList;
            $scope.addingVideo = false;
            if(results.data.substr(0,9) == 'Duplicate') {
                console.log('video id already exists!');
                $scope.message = { type: 'error', text: 'That video has already been added.' };
            } else {
                $scope.message = { type: 'success', text: 'Video added successfully!' };
            }
        });
    };
    
    $scope.playVideo = function(index) {
        if(!$scope.auth) return;
        $scope.playing = $scope.videoSelection[index];
        $scope.playing.startTime = new Date().getTime();
        console.log('playing',$scope.playing);
        player.loadVideoById($scope.playing.video_id);
        fireRef.child('playing').set(angular.copy($scope.playing));
        delete $scope.videoSelection;
        fireRef.child('selection').remove();
    };
    
    setInterval(function() { // Run every second
        player.unMute(); player.setVolume(player.getVolume() == 0 ? 100 : player.getVolume()); // Unmute
    },1000);
    
});

Application.Filters.filter('capitalize', function() {
    return function(input) {
        if(!input) { return ''; }
        var words = input.split(' '), result = '';
        for(var i = 0; i < words.length; i++) {
            result += words[i].substring(0,1).toUpperCase()+words[i].substring(1);
            result += i == words.length - 1 ? '' : ' ';
        }
        return result;
    }
});