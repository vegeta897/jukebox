'use strict';
Application.Directives.directive('titleGamble',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/titlegamble/titlegamble.html',
        replace: true,
        scope: {},
        controller: function($rootScope,$scope,Jukebox,User,TitleGamble,ControlButtons,Videos,Util) {
            $scope.control = ControlButtons.addControl('titleGamble','Title Gamble',false,false);
            $scope.control.showPanel = TitleGamble.getWins;
            $scope.titleGamble = TitleGamble.init();
            $rootScope.$on('newSelection',function() { TitleGamble.awardGamble(); });
            $rootScope.$on('newVideo',function() { $scope.titleGamble = TitleGamble.init(); });
            $scope.placeTitleBet = function() {
                TitleGamble.placeBet();
                $scope.control.show = false;
            };
            $scope.titleGambleCalcMulti = TitleGamble.calcMulti;
            $scope.getKudos = User.getKudos;
            $scope.getDJ = Jukebox.getDJ;
            $scope.getVideoSelection = Videos.getSelection;
            $scope.restrictNumber = Util.restrictNumber;
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('TitleGamble',function(Videos,User,FireService,Message) {
    var titleGamble;
    return {
        getWins: function() {
            if(titleGamble.gambleSet) return;
            FireService.once('titleGamble/wins',function(wins) { titleGamble.wins = wins || {}; });
        },
        calcMulti: function() {
            if(!titleGamble.string) return;
            titleGamble.string = titleGamble.string.trim(); // Remove leading and trailing spaces
            if(titleGamble.string.length < 2) { titleGamble.multi = null; return; }
            var multi = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 8, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000];
            var gambleReduction = titleGamble.wins.hasOwnProperty(titleGamble.string) ? 
                1/(titleGamble.wins[titleGamble.string]+1) : 1;
            titleGamble.multi = multi[titleGamble.string.length-2] * gambleReduction;
        },
        placeBet: function() {
            titleGamble.gambleAmount = parseInt(titleGamble.gambleAmount);
            if(!titleGamble.gambleAmount || titleGamble.gambleAmount < 1) {
                Message.set({ type:'error',text:'That ain\'t no valid amount yo' }); 
                return;
            }
            if(titleGamble.gambleAmount > User.getKudos()) {
                Message.set({ type:'error', text:'You only have <strong>'+$scope.user.kudos+'</strong> kudos!' });
                return;
            }
            console.log('betting',titleGamble.gambleAmount,'on title to include "'+titleGamble.string+'"');
            User.changeKudos(titleGamble.gambleAmount*-1);
            titleGamble.gambleSet = true;
            FireService.sendEvent(User.getName(),
                'made a <strong>'+titleGamble.gambleAmount+'</strong> kudo title bet!');
        },
        awardGamble: function() {
            if(!titleGamble.gambleSet || !titleGamble.string || titleGamble.string == '') return;
            var won = false;
            var gambleString = (titleGamble.string+'').toLowerCase(); // Cast as string, lowercase
            var winnings = Math.floor(+titleGamble.gambleAmount + (titleGamble.gambleAmount * titleGamble.multi));
            var videoList = Videos.getSelection(); if(!videoList) return;
            for(var i = 0, il = videoList.length; i < il; i++) {
                var theIndex = videoList[i].title.toUpperCase().indexOf(gambleString.toUpperCase());
                if(theIndex >= 0) {
                    won = true;
                    videoList[i].title = videoList[i].title.substring(0,theIndex) + '<strong>' +
                    videoList[i].title.substring(theIndex,theIndex+gambleString.length) + '</strong>' +
                    videoList[i].title.substring(theIndex+gambleString.length,videoList[i].title.length);
                    Message.set({ type: 'success', kudos: winnings,
                        text: 'String "<strong>'+gambleString+'</strong>" found in title "<strong>'+
                        videoList[i].title+'</strong>"!' });
                    FireService.sendEvent(User.getName(),'won <strong>'+(winnings-titleGamble.gambleAmount)+'</strong> kudos by betting '+titleGamble.gambleAmount+' on "'+gambleString+'"!');
                    User.changeKudos(winnings);
                    FireService.transact('titleGamble/wins/'+gambleString,1);
                    break;
                }
            }
            if(!won) {
                Message.set({ text: 'Sorry, no titles contained "'+gambleString+'".' });
                FireService.sendEvent(User.getName(),'lost <strong>'+titleGamble.gambleAmount+'</strong> kudos by betting on "'+gambleString+'"!');
                FireService.transact('jackpot',titleGamble.gambleAmount);
            }
        },
        init: function() {
            titleGamble = { gambleAmount: 1, string: '', multi: 0, gambleSet: false,
                wins: titleGamble ? titleGamble.wins : {} };
            return titleGamble;
        }
    };
});