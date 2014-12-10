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
        setUserProperty: function(property,value) { FireService.set('users/'+username+'/'+property,value); },
        getKudos: function() { return user && user.kudos ? user.kudos : 0; }, 
        getVote: function() { return user && user.vote ? user.vote : -1; },
        getUser: function() { return user ? user : false; },
        getName: function() { return username ? username : false; },
        getDJ: function() { return dj ? dj : false; },
        getJackpot: function() { return jackpot ? jackpot : 0; },
        hasAvatar: function(avatar) {
            return avatar == 'headphones' ? true : user && user.avatars ? 
                user.avatars.hasOwnProperty(avatar) : false;
        },
        hasAvatarColor: function(color) {
            return color == 'normal' ? true : user && user.avatarColors ? 
                user.avatarColors.hasOwnProperty(color) : false;
        }
    };
});