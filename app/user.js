'use strict';
Application.Services.factory('User',function($rootScope,FireService) {
    var username, user;
    $rootScope.$on('newVideo',function() {
        if(!username) return;
        FireService.remove('users/'+username+'/vote');
    });
    return {
        setName: function(name) {
            username = name;
            FireService.syncVariable('users/'+username,user);
        },
        changeKudos: function(amount) {
            FireService.transact('users/'+username+'/kudos',parseInt(amount));
        },
        getKudos: function() { return user && user.kudos ? user.kudos : 0; }, 
        getVote: function() { return user && user.vote ? user.vote : -1; },
        getName: function() { return username ? username : false; }
    };
});