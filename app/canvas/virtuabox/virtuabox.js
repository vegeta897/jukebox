'use strict';
Application.Directives.directive('virtuaBox',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/canvas/virtuabox/virtuabox.html',
        replace: true,
        scope: {},
        controller: function($scope,User,VirtuaBox,$timeout) {
            $scope.virtuaBox = VirtuaBox.init();
            $timeout(function(){});
            $scope.$watch('[virtuaBox.cube.rotation.x,virtuaBox.cube.rotation.y,virtuaBox.cube.rotation.z]',
                VirtuaBox.redraw);
            // TODO: Sliders are not initializing properly
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('VirtuaBox', function(Canvas,Renderer,MeshBuilder,Util) {

    var c = Canvas.getCanvases(); Renderer.setCanvas(c);
    var fire = Canvas.getFireService('virtuaBox');
    var virtuaBox, cursor = { x: '-', y: '-'}, grid = 1;
    var cube = MeshBuilder.makeBox(0,0,0,2,2,2);
    
    var controller = {
        name: 'VirtuaBox',
        onMouseMove: function(e) {
            var offset = jQuery(c.highCanvas).offset();
            var newX = e.pageX - offset.left < 0 ? 0 : Math.floor((e.pageX - offset.left)/grid);
            var newY = e.pageY - offset.top < 0 ? 0 : Math.floor((e.pageY - offset.top)/grid);
            var moved = cursor.x != newX || cursor.y != newY;
            cursor.x = newX; cursor.y = newY;
        },
        onMouseDown: function(e) {
            if(e.which == 3) { return; } // Right mouse
            if(e.which == 2) return; // Middle mouse
        },
        onMouseUp: function(e) {  },
        onMouseOut: function() {
            cursor.x = cursor.y = '-';
        },
        activate: function() {
            virtuaBox.active = true;
            c.main.clearRect(0,0,c.mainCanvas.width,c.mainCanvas.height);
            c.mainUnder.clearRect(0,0,c.mainUnderCanvas.width,c.mainUnderCanvas.height);
            render();
        },
        disable: function() { fire.off('pieces'); virtuaBox.active = false; },
        isActive: function() { return virtuaBox ? virtuaBox.active : false; },
        clear: function() {
            c.main.clearRect(0,0, c.mainCanvas.width, c.mainCanvas.height);
            c.mainUnder.clearRect(0,0, c.mainUnderCanvas.width, c.mainUnderCanvas.height);
        }
    };
    Canvas.addMode('virtuaBox',controller);
    
    var camera = { position: new BABYLON.Vector3(0,0,10), target: new BABYLON.Vector3(0,0,0) };
    var meshes = [cube];
    
    var drawBackground = function() {
        c.main.clearRect(0,0, c.mainCanvas.width, c.mainCanvas.height);
        c.main.fillStyle = '#1B1B1B'; // YT player color
        c.main.fillRect(0,0, c.mainCanvas.width, c.mainCanvas.height-1);
    };
    
    var render = function() {
        if(!virtuaBox.active) return;
        drawBackground();
        //var cubeRender = makeCube(cube.x,cube.y,cube.z,cube.w,cube.h,cube.d);
        //for(var p = 0; p < cubeRender.length; p++) {
        //    drawPoly(cubeRender[p]);
        //}
        Renderer.render(camera,meshes);
    };
    
    return {
        init: function() {
            virtuaBox = { cursor: cursor, active: false, cube: cube };
            return virtuaBox;
        },
        redraw: render
    };
});