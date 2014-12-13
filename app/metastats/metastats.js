'use strict';
Application.Directives.directive('metaStats',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/metastats/metastats.html',
        replace: true,
        scope: {},
        controller: function($scope,MetaStats,ControlButtons) {
            $scope.control = ControlButtons.addControl('metaStats','Meta',false,false);
            $scope.meta = MetaStats.init();
            $scope.getVidCount = MetaStats.getVidCount;
            $scope.viewVidCountDay = function(index) {
                $scope.meta.vidCount.day = index >= 0 ? $scope.meta.vidCount[index] : null;
            };
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('MetaStats',function(FireService,API,Message) {
    var meta;
    return {
        getVidCount: function() {
            meta.loading = true;
            FireService.once('meta/vidCount',function(vidCount) {
                if(vidCount && vidCount.lastFetch && vidCount.lastFetch + 900000 > FireService.getServerTime()) {
                    meta.vidCount = vidCount;
                    meta.loading = false;
                    console.log(meta.vidCount);
                    return; // Data on firebase is less than 15 min old, so we're using that
                }
                API.getVideoCount().then(function(data) { // Get new data
                    if(!data || !data.data) {
                        Message.set({ type:'error',
                            text:'Error retrieving stats. You can probably blame my hosting service.' }); 
                        return;
                    }
                    meta.vidCount.data = data.data;
                    var countMax = 0;
                    meta.vidCount.barWidth = (100/meta.vidCount.data.length)-(10/meta.vidCount.data.length);
                    meta.vidCount.barMargin = 5/meta.vidCount.data.length;
                    // If less than 48 pixels, only show ever other label
                    var labelRoom = (meta.vidCount.barWidth + meta.vidCount.barMargin)/100*528;
                    var labelFrequency = labelRoom < 6 ? 5 : labelRoom < 12 ? 4 : 
                        labelRoom < 24 ? 3 : labelRoom < 48 ? 2 : 1;
                    var videoTotal = 0;
                    for(var i = 0, il = meta.vidCount.data.length; i < il; i++) {
                        var thisDay = meta.vidCount.data[i];
                        thisDay.add_date = new Date(thisDay.add_date).getTime();
                        thisDay.showLabel = i % labelFrequency == 0;
                        countMax = countMax < +thisDay.vidCount ? +thisDay.vidCount : countMax;
                        videoTotal += +thisDay.vidCount;
                    }
                    for(var j = 0, jl = meta.vidCount.data.length; j < jl; j++) {
                        thisDay = meta.vidCount.data[j];
                        thisDay.barHeight = (thisDay.vidCount/countMax)*100;
                    }
                    meta.vidCount.yAxisLabels = [];
                    for(var k = 4; k > 0; k--) {
                        meta.vidCount.yAxisLabels.push(Math.round(countMax * (k/4)));
                    }
                    meta.vidCount.max = countMax;
                    meta.vidCount.total = videoTotal;
                    meta.vidCount.lastFetch = FireService.getServerTime();
                    console.log(meta.vidCount);
                    FireService.set('meta/vidCount',meta.vidCount);
                    meta.loading = false;
                });
            });
        },
        init: function() { meta = { vidCount: {} }; return meta; }
    };
});