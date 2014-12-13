'use strict';
Application.Directives.directive('user',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/user/user.html',
        replace: true,
        scope: {},
        controller: function($scope,User,Jukebox) {
            $scope.user = User.init();
            $scope.getKudos = User.getKudos;
            $scope.isInit = Jukebox.isInit;
            $scope.needUpdate = Jukebox.needUpdate;
            $scope.login = User.login;
            $scope.isAuthed = User.isAuthed;
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('User',function($rootScope,FireService,localStorageService,Jukebox) {
    var user, auth;

    $rootScope.$on('newVideo',function() {
        if(!auth || !auth.uid) return;
        FireService.remove('users/'+user.username+'/vote');
    });

    var initUser = function() {
        FireService.onValue('users/'+user.username,function(data){ user.data = data; });
        localStorageService.set('username',user.username);
        localStorageService.set('passcode',user.passcode);
        var fireUser = FireService.ref.child('users/'+user.username);
        fireUser.child('version').set(Jukebox.version);
        var lastOnlineRef = fireUser.child('lastOnline');
        var fireAuths = FireService.ref.child('auths');
        fireAuths.child(auth.uid).set({username:user.username,passcode:user.passcode});
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
    
    return {
        login: function() {
            auth = FireService.ref.getAuth();
            if(!user.username || !user.passcode || user.username == '' || user.passcode == '') return;
            console.log('Logging in',user.username);
            if(auth && auth.hasOwnProperty('expires') && auth.expires*1000 > FireService.getServerTime()) {
                console.log('Firebase authenticated!',auth);
                initUser();
            } else {
                FireService.ref.authAnonymously(function(error, authData) {
                    auth = error ? null : authData;
                    console.log('Firebase re-authenticated!',auth);
                    initUser();
                });
            }
        },
        changeKudos: function(amount) {
            FireService.transact('users/'+user.username+'/kudos',parseInt(amount));
        },
        setUserProperty: function(property,value) {
            if(!user.username) return;
            FireService.set('users/'+user.username+'/'+property,value);
        },
        getKudos: function() { return user && user.data && user.data.kudos ? user.data.kudos : 0; },
        getVote: function() { return user && user.data && user.data.vote ? user.data.vote : -1; },
        getName: function() { return user && user.username ? user.username : false; },
        getUserData: function() { return user && user.data ? user.data : false; },
        isAuthed: function() { return auth && auth.uid; },
        hasAvatar: function(avatar) {
            return avatar == 'headphones' ? true : user && user.data && user.data.avatars ?
                user.data.avatars.hasOwnProperty(avatar) : false;
        },
        hasAvatarColor: function(color) {
            return color == 'normal' ? true : user && user.data && user.data.avatarColors ?
                user.data.avatarColors.hasOwnProperty(color) : false;
        },
        init: function() {
            user = { 
                username: localStorageService.get('username'), passcode: localStorageService.get('passcode')
            }; 
            return user; 
        }
    };
});