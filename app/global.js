'use strict';
Application.Services.factory('Global',function($rootScope,FireService) {
    var username, user = {}, // TODO: Move user stuff into user directive/service
        init, needUpdate, users, dj, jackpot;
    var version = 0.356, versionName = 'Jukes of Hazzard';
    FireService.onceGlobal('version',function(ver) {
        if(version < ver) {
            needUpdate = true;
        } else {
            FireService.onGlobal('version',function(newVer){
                needUpdate = newVer > version;
            });
        }
    });

    var everyThirtySeconds = 30;
    var interval = function() {
        $rootScope.$broadcast('interval');
        everyThirtySeconds += 0.5;
        if(everyThirtySeconds >= 30) {
            everyThirtySeconds = 0;
            // TODO: Chance for bird to fly in for everyone
            // Not just DJ, so that the more people around, the higher the chance
        }
    };
    
    $rootScope.$on('newVideo',function() {
        if(!username) return;
        FireService.remove('users/'+username+'/vote');
    });
    FireService.onValue('dj',function(theDJ) { dj = theDJ; });
    FireService.onValue('jackpot',function(theJackpot) { jackpot = theJackpot; });
    FireService.onValue('users',function(theUsers) { users = theUsers; });
    
    return {
        initialize: function() {
            init = true;
            setInterval(interval,500);
            console.log('Jukebox initializing...');
            $rootScope.$broadcast('playerReady');
            FireService.ref.once('value', function(snap) {
                dj = snap.val().dj;
                if(dj && !snap.val().users[dj].hasOwnProperty('connections')) {
                    FireService.remove('dj');
                }
            });
        },
        isInit: function() { return init; },
        needUpdate: function() { return needUpdate; },
        setName: function(name) {
            username = name;
            FireService.onValue('users/'+username,function(data){ user = data; });
        },
        changeKudos: function(amount) {
            FireService.transact('users/'+username+'/kudos',parseInt(amount));
        },
        setUserProperty: function(property,value) { 
            if(!username) return;
            FireService.set('users/'+username+'/'+property,value); 
        },
        getKudos: function() { return user && user.kudos ? user.kudos : 0; }, 
        getVote: function() { return user && user.vote ? user.vote : -1; },
        getUser: function() { return user ? user : false; },
        getName: function() { return username ? username : false; },
        getDJ: function() { return dj ? dj : false; },
        getJackpot: function() { return jackpot ? jackpot : 0; },
        getUsers: function() { return users ? users : 0; },
        hasAvatar: function(avatar) {
            return avatar == 'headphones' ? true : user && user.avatars ? 
                user.avatars.hasOwnProperty(avatar) : false;
        },
        hasAvatarColor: function(color) {
            return color == 'normal' ? true : user && user.avatarColors ? 
                user.avatarColors.hasOwnProperty(color) : false;
        },
        version: version, versionName: versionName
    };
});