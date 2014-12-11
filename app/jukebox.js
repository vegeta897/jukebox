'use strict';

Application.Services.factory("API", function($http) {
    var serviceBase = 'php/';
    return {
        getVideos: function (count, currentID) {
            return $http.get(serviceBase + 'videos?count=' + count + '&current_id=' + currentID);
        },
        updateVideo: function (videoID, votes) {
            return $http.post(serviceBase + 'updateVideo', {video_id: videoID, votes: votes});
        },
        addVideo: function (videoIds, artist, track, addedBy) {
            return $http.post(serviceBase + 'addVideo', {
                video_ids: videoIds,
                artist: artist,
                track: track,
                added_by: addedBy
            }).then(function (results) {
                return results;
            });
        },
        deleteVideo: function (id) {
            return $http.delete(serviceBase + 'deleteVideo?id=' + id).then(function (status) {
                return status.data;
            });
        },
        pullUncurated: function (locked) {
            return $http.get(serviceBase + 'pullUncurated?locked=' + locked);
        },
        saveCurated: function (videos, curator) {
            return $http.post(serviceBase + 'saveCurated', {videos: videos, curator: curator});
        },
        getVideoCount: function () {
            return $http.get(serviceBase + 'getVideoCount');
        }
    };
});

Application.Controllers.controller('Main', function($rootScope,$scope,$timeout,localStorageService,API,Canvas,Util,Player,Videos,FireService,DJ,Global,AvatarShop) {
    
    // We gonna refactor this shit
    
    var username = localStorageService.get('username');
    var passcode = localStorageService.get('passcode');
    var volume = localStorageService.get('volume');
    var fireRef = new Firebase('https://jukebox897.firebaseio.com/box1'), fireUser;
    var init = false, muted;

    $scope.version = 0.355; $scope.versionName = 'Jukes of Hazzard'; $scope.needUpdate = false;
    $scope.initializing = true; $scope.eventLog = [];
    $scope.username = username; $scope.passcode = passcode;
    $scope.countProperties = Util.countProperties;
    $scope.getKudos = Global.getKudos;
    $scope.getDJ = Global.getDJ;
    $scope.getJackpot = Global.getJackpot;
    $scope.getUsers = Global.getUsers;

    fireRef.parent().child('version').once('value', function(snap) {
        $scope.initializing = false;
        if($scope.version < snap.val()) {
            $scope.needUpdate = true;
        } else {
            fireRef.parent().child('version').on('value',function(snap){ 
                $scope.needUpdate = snap.val() > $scope.version;
                setInterval(interval,500);
            });
        }
        $timeout(function(){});
    });
    
    var purgeEventLog = function() {
        for(var il = $scope.eventLog.length-1, i = il; i >= 0; i--) { // Age and remove old events (locally)
            $scope.eventLog[i].age = FireService.getServerTime() - $scope.eventLog[i].time;
            if($scope.eventLog[i].age > 300000) {
                $scope.eventLog.splice(i,1);
            }
        }
        $timeout(function(){});
    };
    
    $scope.login = function() {
        if(!$scope.username || !$scope.passcode) return;
        var initUser = function() {
            $scope.auth = auth;
            Global.setName($scope.username);
            localStorageService.set('username',username);
            localStorageService.set('passcode',passcode);
            fireUser = fireRef.child('users/'+username);
            fireUser.child('version').set($scope.version);
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
            //$scope.canvasModes = Canvas.getModes();
            //$scope.canvasData = {};
            //$scope.canvasMode = 'polyominoes';
            //Canvas.attachVars(fireRef.child('canvas'),$scope.canvasData,{
            //    myColor: AvatarShop.avatarColors[$scope.user.avatarColor ? $scope.user.avatarColor : 'normal'][1],
            //    fireUser: fireUser, api: services, playing: $scope.playing, users: Global.getUsers(), username: username
            //}); 
            //Canvas.changeMode($scope.canvasMode);
            //$scope.changeCanvasMode = Canvas.changeMode;
        };
        username = $scope.username; passcode = $scope.passcode;
        console.log('Logging in',username);
        var auth = fireRef.getAuth();
        if(auth && auth.hasOwnProperty('expires') && auth.expires*1000 > FireService.getServerTime()) {
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

    $scope.becomeDJ = DJ.becomeDJ;
    
    $scope.getListenerClasses = function(listener) { 
        if(!listener) return; return 'fa-' + (listener.avatar ? listener.avatar : 'headphones'); 
    };
    $scope.getUserColor = AvatarShop.getUserColor;

    $scope.forceVote = DJ.forceVote;
    
    $scope.requireVersion = function() { fireRef.parent().child('version').set($scope.version); }; // Set firebase version
    $scope.clearCanvas = function() { fireRef.child('canvas').remove(); Canvas.clear(); };
    
    var everyThirtySeconds = 30;
    var interval = function() {
        if(!init && Player.isReady()) {
            init = true; console.log('Jukebox initializing...');
            $rootScope.$broadcast('playerReady');
            fireRef.once('value', function(snap) {
                if(Global.getDJ() && !snap.val().users[Global.getDJ()].hasOwnProperty('connections')) {
                    fireRef.child('dj').remove();
                }
                fireRef.child('eventLog').endAt().limit(15).on('child_added',function(snap) { $scope.eventLog.push(snap.val()); $scope.eventLog = $scope.eventLog.slice(Math.max($scope.eventLog.length - 15, 0)); purgeEventLog(); });
                $timeout(function(){});
            });
        }
        if(init && Videos.getPlaying()) {
            if(muted != Player.isMuted()) {
                Global.setUserProperty('muted',Player.isMuted());
            }
            if(parseInt(Player.getVolume()) != volume) {
                volume = parseInt(Player.getVolume()) || 0;
                Global.setUserProperty('volume',volume);
                localStorageService.set('volume',volume);
            }
        }
        if(init) DJ.interval();
        $scope.theTime = FireService.getServerTime();
        purgeEventLog();
        everyThirtySeconds += 0.5;
        if(everyThirtySeconds >= 30) {
            everyThirtySeconds = 0;
            /* TODO: Chance for bird to fly in for everyone
            Not just DJ, so that the more people around, the higher the chance */
        }
        $timeout(function(){});
    };
});