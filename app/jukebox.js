'use strict';
Application.Controllers.controller('Main', function($rootScope,$scope,$timeout,localStorageService,Canvas,FireService,DJ,Global,AvatarShop,User) {

    $scope.version = Global.version; $scope.versionName = Global.versionName;
    $scope.getKudos = User.getKudos;
    $scope.getDJ = Global.getDJ;
    $scope.getJackpot = Global.getJackpot;
    $scope.getUsers = Global.getUsers;
    $scope.isInit = Global.isInit;
    $scope.needUpdate = Global.needUpdate;
    $scope.becomeDJ = DJ.becomeDJ;
    $scope.forceVote = DJ.forceVote;
    $scope.getUserColor = AvatarShop.getUserColor;
    $scope.getListenerClasses = Global.getListenerClasses;
    
    $rootScope.$on('interval',function() {
        $scope.theTime = FireService.getServerTime();
        $timeout(function(){});
    });
});