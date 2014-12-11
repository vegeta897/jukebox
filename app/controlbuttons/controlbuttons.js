'use strict';
Application.Directives.directive('controlButtons',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/controlbuttons/controlbuttons.html',
        replace: true,
        scope: {},
        controller: function($rootScope,$scope,$timeout,ControlButtons,Global) {
            $scope.controlList = ControlButtons.init();

            $scope.showControl = function(name) {
                ControlButtons.showControl(name);
                $timeout(function(){ window.scrollTo(0,document.body.scrollHeight); }); // Scroll to bottom
            };
            $scope.getUsername = Global.getName;
        },
        link: function(scope,element,attrs) {

        }
    }
});

Application.Services.factory('ControlButtons',function() {
    var controlList = {};
    return {
        init: function() { 
            //controlList = {
                //fillBlank: {title: 'Fill the B_ank'}, avatarShop: {title: 'Avatar Shop'},
                //mumble: {title: 'Mumble'}, changelog: {title: 'Changelog'},
                //meta: {title: 'Meta'}, admin: {title: 'Admin', admin: true}
            //}; 
            return controlList;
        },
        addControl: function(name,title,admin,isNew) {
            controlList[name] = { title: title, admin: admin, new: isNew };
            return controlList[name];
        },
        showControl: function(name) {
            var control = controlList[name];
            if(control.show) { control.show = false; return; }
            for(var key in controlList) { if(!controlList.hasOwnProperty(key)) continue;
                controlList[key].show = key == name;
                if(key == name && controlList[key].hasOwnProperty('openPanel')) controlList[key].openPanel();
            }
        }
    };
});