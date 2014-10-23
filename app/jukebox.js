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
    console.log('player ready');
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
    event.target.unMute();
}

// 4. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var playing = false;
function onPlayerStateChange(event) {
    if(event.data == YT.PlayerState.PAUSED && playing) {
        player.playVideo();
    }
    if (event.data == YT.PlayerState.PLAYING && !playing) {
        //setTimeout(stopVideo, 6000);
        playing = true;
    }
}
function stopVideo() {
    player.stopVideo();
}

function parseUTCtime(utc) { // Converts 'PT#M#S' to an object
    if(!utc || utc.hasOwnProperty('stamp')) return utc;
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


Application.Controllers.controller('Main', function($scope, $timeout, services, localStorageService) {
    console.log('Main controller initialized');
    
    var username = localStorageService.get('username');
    var passcode = localStorageService.get('passcode');
    var volume = localStorageService.get('volume');
    $scope.username = username; $scope.passcode = passcode;
    var fireRef = new Firebase('https://jukebox897.firebaseio.com/box1');
    var init = false, fireBusy = false, resumeTime = 0, voting;
    
    $scope.login = function() {
        if(!$scope.username || !$scope.passcode) return;
        var initUser = function() {
            $scope.auth = auth;
            localStorageService.set('username',username);
            localStorageService.set('passcode',passcode);
            var fireUser = fireRef.child('users/'+username);
            var lastOnlineRef = fireUser.child('lastOnline');
            var fireAuths = fireRef.child('auths');
            fireAuths.child(auth.uid).set({username:username,passcode:passcode});
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
        player.loadVideoById($scope.playing.video_id,0,'large');
        fireRef.child('playing').set(angular.copy($scope.playing));
        delete $scope.videoSelection;
        fireRef.child('selection').remove();
    };
    
    $scope.becomeDJ = function() {
        $scope.dj = username;
        fireRef.child('dj').set(username);
    };

    var getVideos = function() {
        fireBusy = true;
        console.log('video close to ending or ended');
        // 30 seconds til end of video, get a new video list
        services.getVideos().then(function(data) {
            console.log('Videos retrieved',data.data);
            if(data.data.length != 6) { return; }
            for(var d = 0, dl = data.data.length; d < dl; d++) {
                data.data[d].duration = parseUTCtime(data.data[d].duration);
            }
            $scope.videoSelection = data.data;
            fireRef.child('selection').set(angular.copy($scope.videoSelection));
            fireBusy = false; voting = true;
            $timeout(function(){});
        });
    };
    
    var interval = function() {
        if(!init && player && player.hasOwnProperty('loadVideoById')) {
            init = true;
            console.log('Player initialized');
            fireRef.once('value', function(snap) {
                $scope.dj = snap.val().dj;
                $scope.videoSelection = snap.val().selection;
                $scope.playing = snap.val().playing;
                if($scope.playing) {
                    var startTime = parseInt((new Date().getTime()-$scope.playing.startTime)/1000);
                    console.log('starting video',startTime,'seconds in');
                    resumeTime = startTime;
                    startTime = startTime > $scope.playing.duration.totalSec ? 0 : startTime;
                    player.loadVideoById($scope.playing.video_id,startTime,'large');
                }
                if($scope.dj && !snap.val().users[$scope.dj].hasOwnProperty('connections')) {
                    $scope.dj = ''; fireRef.child('dj').remove();
                }
                $timeout(function(){});
            });
        }
        if(init && playing && $scope.playing) {
            player.setVolume(volume);
            if(player.isMuted()) player.unMute();
            player.setVolume(player.getVolume() == 0 ? 100 : player.getVolume()); // Unmute
            localStorageService.set('volume',parseInt(player.getVolume()));
            if(fireBusy || $scope.dj != username) return; // If already talking to firebase, don't try again
            // DJ responsibilities
            var elapsed = player.getCurrentTime() + resumeTime;
            if(elapsed + 30 > $scope.playing.duration.totalSec && !voting) {
                getVideos();
            } else { // Video not expired or close to being over, remove selection list
                console.log('video still goin');
                fireRef.child('selection').remove();
            }
            if(elapsed > $scope.playing.duration.totalSec) { // Video expired
                console.log('video expired');
                delete $scope.playing;
                fireRef.child('playing').remove();
            }
        }
        if($scope.dj == username && !$scope.playing && !$scope.videoSelection) {
            getVideos(); // Get video list have none and nothing playing
        }
        $timeout(function(){});
    };
    setInterval(interval,500);
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