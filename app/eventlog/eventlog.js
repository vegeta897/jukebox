'use strict';
Application.Directives.directive('eventLog',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/eventlog/eventlog.html',
        replace: true,
        scope: {},
        controller: function($rootScope,$scope,EventLog,AvatarShop) {
            $scope.eventLog = EventLog.init();
            $scope.getUserColor = AvatarShop.getUserColor;
            $rootScope.$on('interval',EventLog.purgeEventLog);
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('EventLog',function(FireService) {
    var eventLog;
    var purgeEventLog = function() {
        if(!eventLog) return;
        for(var il = eventLog.events.length-1, i = il; i >= 0; i--) { // Age and remove old events (locally)
            eventLog.events[i].age = FireService.getServerTime() - eventLog.events[i].time;
            if(eventLog.events[i].age > 300000) {
                eventLog.events.splice(i,1);
            }
        }
    };
    
    return {
        purgeEventLog: purgeEventLog,
        init: function() { 
            eventLog = { events: [] };
            FireService.ref.child('eventLog').endAt().limit(15).on('child_added',function(snap) {
                eventLog.events.push(snap.val());
                eventLog.events = eventLog.events.slice(Math.max(eventLog.events.length - 15, 0));
                purgeEventLog();
            });
            return eventLog;
        }
    };
});