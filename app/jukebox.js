'use strict';
Application.Controllers.controller('Main', function($rootScope,$scope,$timeout,localStorageService,Canvas,FireService,DJ,Global) {
    
    // We gonna refactor this shit
    
    var username = localStorageService.get('username');
    var passcode = localStorageService.get('passcode');
    var fireRef = new Firebase('https://jukebox897.firebaseio.com/box1'), fireUser;

    $scope.version = Global.version; $scope.versionName = Global.versionName;
    $scope.eventLog = [];
    $scope.username = username; $scope.passcode = passcode;
    $scope.getKudos = Global.getKudos;
    $scope.getDJ = Global.getDJ;
    $scope.getJackpot = Global.getJackpot;
    $scope.getUsers = Global.getUsers;
    $scope.isInit = Global.isInit;
    $scope.needUpdate = Global.needUpdate;
    $scope.becomeDJ = DJ.becomeDJ;
    $scope.forceVote = DJ.forceVote;
    $scope.getListenerClasses = function(listener) {
        if(!listener) return; return 'fa-' + (listener.avatar ? listener.avatar : 'headphones');
    };
    
    $rootScope.$on('interval',function() {
        $scope.theTime = FireService.getServerTime();
        $timeout(function(){});
    });
    
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
});