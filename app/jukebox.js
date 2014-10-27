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
    var sec, min, stamp;
    if(utc.indexOf('S') >= 0 && utc.indexOf('M') >= 0) { // M and S
        sec = parseInt(utc.substring(utc.indexOf('M')+1,utc.indexOf('S')));
        min = parseInt(utc.substring(2,utc.indexOf('M')));
        stamp = utc.substring(2,utc.indexOf('S')).replace('M',':').split(':');
        stamp = stamp[0] + ':' + ( stamp[1].length > 1 ? stamp[1] : '0' + stamp[1] );
        return { totalSec: (min*60 + sec), min: min, sec: sec, stamp: stamp };
    } else if (utc.indexOf('S') >= 0 && utc.indexOf('M') < 0) { // Just S
        min = 0;
        sec = parseInt(utc.substring(utc.indexOf('T')+1,utc.indexOf('S')));
        stamp = '0:' + ((sec+'').length == 1 ? '0'+sec : sec);
        return { totalSec: (min*60 + sec), min: min, sec: sec, stamp: stamp };
    } else { // Just M
        min = parseInt(utc.substring(2,utc.indexOf('M')));
        sec = 0;
        stamp = min + ':00';
        return { totalSec: (min*60 + sec), min: min, sec: sec, stamp: stamp };
    }
}

function randomIntRange(min,max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function countProperties(obj,exception) { // Return number of properties an object has
    if(!obj) return 0; var count = 0; for(var key in obj) { if(!obj.hasOwnProperty(key) || key == exception) { continue; } count++; } return count; 
}
// Return a random element from input array
function pickInArray(array) { return array[Math.floor(Math.random()*array.length)]; }
function pickInObject(object) { // Return a random property from input object (attach name)
    var array = [];
    for(var key in object) { if(object.hasOwnProperty(key)) {
        var property = object[key]; array.push(property); } }
    return pickInArray(array);
}

function flip() { return Math.random() > 0.5; } // Flip a coin
function isInt(input) { return parseInt(input) === input; }

Application.Services.factory("services", ['$http', function($http) {
    var serviceBase = 'php/', obj = {};
    obj.getVideos = function(currentID){
        return $http.get(serviceBase + 'videos?current_id=' + currentID);
    };
    obj.updateVideo = function(videoID,votes){
        return $http.post(serviceBase + 'updateVideo', {video_id:videoID,votes:votes});
    };
    obj.addVideo = function (videoIds, artist, track, addedBy) {
        return $http.post(serviceBase + 'addVideo', {video_ids:videoIds,artist:artist,track:track,added_by:addedBy}).then(function (results) {
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
    
    // TODO: Sync time against firebase server time (remember to set a server time then grab it it)
    
    var username = localStorageService.get('username');
    var passcode = localStorageService.get('passcode');
    var volume = localStorageService.get('volume');
    var fireRef = new Firebase('https://jukebox897.firebaseio.com/box1');
    var fireUser;
    var init = false, gettingVideos = false, voting, voteEnd, muted, myVote;
    
    $scope.username = username; $scope.passcode = passcode;
    $scope.controlList = [{name:'controlAddVideo',title:'Add a video'},{name:'controlAddBounty',title:'Add a bounty'}];
    
    var onVideoChange = function(snap) {
        if(snap.val() == null) { delete $scope.playing; return; }
        console.log('playing update',snap.val());
        if(!$scope.playing || snap.val().video_id != $scope.playing.video_id) { // If video changed, load it
            console.log('video changed');
            player.loadVideoById(snap.val().video_id,0,'large');
        }
        $scope.playing = snap.val();
        if(!$scope.auth) return;
        if($scope.playing.index === myVote) {
            console.log('the vid you voted for won!');
            console.log($scope.bountySelect.index,$scope.playing.index,$scope.playing.bounty,countProperties($scope.playing.votes,username));
            if(!$scope.playing.bounty || ($scope.bountySelect.index === $scope.playing.index && $scope.bountySet)) {
                console.log('there was no bounty, or it was your own bounty');
                fireUser.child('kudos').transaction(function(userKudos) {
                    return userKudos ? parseInt(userKudos) + 2 : 2;
                });
            } else {
                console.log('you won the bounty!');
                fireUser.child('kudos').transaction(function(userKudos) {
                    var reward = parseInt($scope.playing.bounty / Math.max(1,countProperties($scope.playing.votes,username)) + 2);
                    return userKudos ? parseInt(userKudos) + reward : reward ;
                });
            }
        } else if(myVote) {
            console.log('you got a kudo for voting');
            fireUser.child('kudos').transaction(function(userKudos) {
                return userKudos ? parseInt(userKudos) + 1 : 1;
            });
        }
        delete $scope.bountyAmount; delete $scope.bountySelect; delete $scope.bountySet;
        myVote = null;
    };
    
    var onSelectionChange = function(snap) {
        if(snap.val() == null) { delete $scope.videoSelection; return; }
        $scope.videoSelection = snap.val();
        $scope.bountySelect = $scope.videoSelection[0];
        $scope.bountyAmount = 0;
    };
    
    $scope.login = function() {
        if(!$scope.username || !$scope.passcode) return;
        var initUser = function() {
            $scope.auth = auth;
            localStorageService.set('username',username);
            localStorageService.set('passcode',passcode);
            fireUser = fireRef.child('users/'+username);
            fireUser.once('value',function(snap){ $scope.user = snap.val(); });
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
        if(auth && auth.hasOwnProperty('expires') && auth.expires*1000 > new Date().getTime()) {
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

    $scope.vote = function(index) {
        if(!$scope.auth) return;
        if(player.isMuted()) {
            $scope.message = { type: 'error', text: 'You can\'t vote while muted!' };
            return;
        }
        myVote = index;
        fireRef.child('votes/'+username).set(index);
        for(var i = 0, il = $scope.videoSelection.length; i < il; i++) {
            fireRef.child('selection/'+i+'/votes/'+username).set(i == index ? true : null);
        }
    };

    $scope.becomeDJ = function() {
        $scope.dj = username;
        fireRef.child('dj').set(username);
    };
    
    $scope.closeMessage = function() { delete $scope.message; };
    
    $scope.showControl = function(control) {
        if($scope[control]) { $scope[control] = false; return; }
        for(var i = 0, il = $scope.controlList.length; i < il; i++) {
            $scope[$scope.controlList[i].name] = control == $scope.controlList[i].name;
        }
    };
    $scope.controlEnabled = function(control) { return $scope[control]; };
    
    $scope.addBounty = function() {
        $scope.bountyAmount = parseInt($scope.bountyAmount);
        if(!$scope.bountyAmount || $scope.bountyAmount < 0) { $scope.message = { type:'error',text:'That ain\'t no valid amount yo' }; return; }
        if(!$scope.user.kudos || $scope.bountyAmount > $scope.user.kudos) { $scope.message = { type:'error',text:'You only have '+$scope.user.kudos+' kudos!' }; return; }
        console.log('adding',$scope.bountyAmount,'kudos to video #',$scope.bountySelect.index+1);
        fireUser.child('kudos').transaction(function(userKudos) {
            return userKudos ? 0 : userKudos-$scope.bountyAmount == 0 ? null : userKudos-$scope.bountyAmount; 
        });
        fireRef.child('selection/'+$scope.bountySelect.index+'/bounty').transaction(function(bounty) {
            return bounty ? parseInt(bounty) + $scope.bountyAmount : $scope.bountyAmount;
        });
        $scope.bountySet = true;
    };

    $scope.restrictNumber = function(input) { input = input.replace(/[^\d.-]/g, '').replace('..','.').replace('..','.').replace('-',''); return input; };
    
    $scope.parseURL = function() {
        if(!$scope.add_url && !$scope.batchList) { return; }
        var urls = $scope.enableBatch ? $scope.batchList.split('\n') : [$scope.add_url];
        $scope.parsedIds = '';
        for(var i = 0, il = urls.length; i < il; i++) {
            var re = /(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
            var parsed = urls[i].replace(re,'$1').replace('http://','').replace('https://','').substr(0,11);
            if(parsed.length == 11) {
                $scope.parsedIds += parsed+',';
                $scope.add_valid = true;
            } else {
                $scope.add_valid = false;
                break;
            }
        }
        $scope.parsedIds = $scope.parsedIds.substring(0,$scope.parsedIds.length-1);
    };
    
    $scope.addVideo = function() {
        if($scope.parsedIds.length < 11 || !$scope.add_valid) { return; }
        console.log('adding',$scope.parsedIds);
        $scope.addingVideo = true;
        services.addVideo($scope.parsedIds, $scope.add_artist, $scope.add_track, username).then(function(results) {
            console.log(results);
            $scope.parsedIds = '';
            delete $scope.add_url;
            delete $scope.batchList;
            $scope.addingVideo = false;
            if(typeof results.data == 'string' && results.data.substr(0,9) == 'Duplicate') {
                console.log('video id already exists!');
                $scope.message = { type: 'error', text: 'That video has already been added.' };
            } else {
                var justAdded = results.data.data.items.length == 1 ? results.data.data.items[0].snippet.title : 'Videos';
                $scope.message = { type: 'success', text: justAdded + ' added successfully!' };
            }
        });
    };

    $scope.forceVote = function() {
        var offset = $scope.playing ? $scope.playing.duration.totalSec*1000 - 90000 : 0;
        fireRef.child('playing/startTime').set(new Date().getTime() - offset);
    };

    var playVideo = function() { // Tally votes and pick the video with the most
        if(!$scope.auth || $scope.dj != username) return;
        var winner = 0;
        fireRef.child('votes').once('value', function(snap) {
            var snapped = angular.copy(snap.val());
            winner = snapped ? pickInObject(snapped) : randomIntRange(0,$scope.videoSelection.length-1);
            console.log('winner chosen:',winner);
            var play = $scope.videoSelection[winner];
            play.startTime = new Date().getTime();
            fireRef.child('playing').set(angular.copy(play));
            fireRef.child('selection').remove();
            voting = false;
            fireRef.child('votes').remove();
            services.updateVideo(play.video_id,countProperties(play.votes,''));
        });
    };

    var getVideos = function() {
        fireRef.child('votes').remove();
        voting = true;
        gettingVideos = true;
        // 30 seconds til end of video, get a new video list
        var currentID = $scope.playing ? $scope.playing.video_id : '';
        services.getVideos(currentID).then(function(data) {
            console.log('Videos retrieved',data.data);
            if(data.data.length != 6) { return; }
            for(var d = 0, dl = data.data.length; d < dl; d++) {
                data.data[d].duration = parseUTCtime(data.data[d].duration);
                data.data[d].index = d;
            }
            $scope.videoSelection = data.data;
            fireRef.child('selection').set(angular.copy($scope.videoSelection));
            gettingVideos = false;
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
                    startTime = Math.max(0,startTime > $scope.playing.duration.totalSec ? 0 : startTime);
                    player.loadVideoById($scope.playing.video_id,startTime+3,'large'); // 3 sec head-start
                }
                if($scope.dj && !snap.val().users[$scope.dj].hasOwnProperty('connections')) {
                    $scope.dj = ''; fireRef.child('dj').remove();
                }
                fireRef.child('playing').on('value', onVideoChange); // Listen for video changes
                fireRef.child('selection').on('value', onSelectionChange); // Listen for selection changes
                fireRef.child('voting').on('value', function(snap) { voteEnd = snap.val() || 0; }); // Listen for vote changes
                fireRef.child('users').on('value', function(snap) { $scope.users = snap.val(); $scope.user = snap.val()[username]; }); // Listen for user changes
                fireRef.child('dj').on('value', function(snap) { $scope.dj = snap.val(); }); // Listen for DJ changes
                $timeout(function(){});
            });
        }
        if($scope.videoSelection) {
            $scope.voteTimeLeft = Math.max(0,parseInt((voteEnd - new Date().getTime())/1000));
        }
        if(init && playing && $scope.playing) {
            if(muted != player.isMuted()) {
                muted = player.isMuted();
                if($scope.auth) fireUser.child('muted').set(muted);
            }
            if(parseInt(player.getVolume()) != volume) {
                volume = parseInt(player.getVolume());
                if($scope.auth) fireUser.child('volume').set(volume);
                localStorageService.set('volume',volume);
            }
            if(!gettingVideos && $scope.dj && $scope.dj == username) { // If already getting videos, don't try again
                // DJ responsibilities
                var elapsed = parseInt((new Date().getTime() - $scope.playing.startTime) / 1000);
                if (elapsed + 90 > $scope.playing.duration.totalSec && !voting) {
                    console.log('video close to ending or ended');
                    getVideos();
                    $timeout(playVideo, Math.min($scope.playing.duration.totalSec*1000,90000)); // Voting for 90 seconds
                    fireRef.child('voting').set(new Date().getTime() + Math.min($scope.playing.duration.totalSec*1000,90000));
                } else if (!voting) { // Video not expired or close to being over, remove selection list
                    fireRef.child('selection').remove();
                }
                if (elapsed > $scope.playing.duration.totalSec && !voting) { // Video expired
                    console.log('video expired');
                    fireRef.child('playing').remove();
                    getVideos();
                    $timeout(playVideo, 15000); // Voting for 15 seconds
                    fireRef.child('voting').set(new Date().getTime() + 90000);
                }
            }
        }
        if($scope.dj && $scope.dj == username && !$scope.playing && !$scope.videoSelection && !voting) {
            console.log('nothing playing, get list');
            getVideos(); // Get video list have none and nothing playing
        }
        if($scope.dj && $scope.dj == username && !$scope.playing && $scope.videoSelection && !voting) {
            console.log('nothing playing, have list, voting ends in 10 seconds');
            $timeout(playVideo, 10000); // Voting for 10 seconds
            fireRef.child('voting').set(new Date().getTime()+10000);
            voting = true;
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