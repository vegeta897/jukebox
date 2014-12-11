'use strict';
Application.Services.factory('Global',function($rootScope,FireService) {
    var init, needUpdate, users, dj, jackpot;
    var version = 0.357, versionName = 'Jukes of Hazzard';
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
        getDJ: function() { return dj ? dj : false; },
        getJackpot: function() { return jackpot ? jackpot : 0; },
        getUsers: function() { return users ? users : 0; },
        getListenerClasses: function(listener) {
            if(!listener) return; return 'fa-' + (listener.avatar ? listener.avatar : 'headphones');
        },
        version: version, versionName: versionName
    };
});