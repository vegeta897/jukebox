'use strict';
Application.Services.factory('Global',function($rootScope,FireService) {
    var username, user = {}, dj, jackpot;
    $rootScope.$on('newVideo',function() {
        if(!username) return;
        FireService.remove('users/'+username+'/vote');
    });
    FireService.onValue('dj',function(theDJ) { dj = theDJ; });
    FireService.onValue('jackpot',function(theJackpot) { jackpot = theJackpot; });
    // TODO: Maybe move dj, jackpot, and users back into jukebox.js, use scope bindings in directives
    return {
        setName: function(name) {
            username = name;
            FireService.onValue('users/'+username,function(data){ user = data; });
        },
        changeKudos: function(amount) {
            FireService.transact('users/'+username+'/kudos',parseInt(amount));
        },
        getKudos: function() { return user && user.kudos ? user.kudos : 0; }, 
        getVote: function() { return user && user.vote ? user.vote : -1; },
        getName: function() { return username ? username : false; },
        getDJ: function() { return dj ? dj : false; },
        getJackpot: function() { return jackpot ? jackpot : 0; }
    };
});