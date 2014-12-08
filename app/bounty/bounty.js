'use strict';
Application.Directives.directive('bounty',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/bounty/bounty.html',
        replace: true,
        scope: true,
        //require: '^Main',
        controller: function($rootScope,$scope,Bounty) {
            $scope.bounty = Bounty.init();
            $rootScope.$on('newSelection',function() {
                $scope.bounty = Bounty.init();
            });
            
            $rootScope.$on('newVideo',function() {
                Bounty.awardBounty();
            });
            
            $scope.addBounty = function() {
                Bounty.addBounty();
                $scope.controlAddBounty = false;
            };
            
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('Bounty',function($rootScope,Videos,User,FireService,Util) {
    var bounty;
    
    return {
        addBounty: function() {
            var amount = bounty.bountyAmount, index = bounty.bountyIndex;
            if(!amount || amount < 0 || amount > User.getKudos()) return;
            amount = parseInt(amount);
            bounty = { bountyAmount: amount, bountyIndex: index, bountySet: true };
            FireService.transact('selection/'+index+'/bounty',amount);
            User.changeKudos(amount*-1);
            FireService.sendEvent(User.getName(),
                'placed a <strong>'+amount+'</strong> kudo bounty on "'+Videos.getVideo(index).title+'"!');
        },
        awardBounty: function() {
            var playing = Videos.getPlaying();
            if(!playing.bounty || +playing.index === +bounty.bountyIndex) return;
            if(bounty.bountySet) { // Set bounty but didn't win
                User.changeKudos(bounty.bountyAmount); // Refund
            }
            if(playing.votes && playing.votes[User.getName()]) { // Voted on winner
                User.changeKudos(playing.bounty / Math.max(1,Util.countProperties(playing.votes,false)-1));
            }
        },
        init: function() {
            bounty = { bountyAmount: 1, bountyIndex: 0, bountySet: false }; return bounty;
        }
    };
});