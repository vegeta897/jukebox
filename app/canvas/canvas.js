'use strict';
Application.Directives.directive('canvas',function() {
    return {
        restrict: 'C',
        templateUrl: 'app/canvas/canvas.html',
        replace: true,
        scope: {},
        controller: function($scope,User,Jukebox,Canvas) {
            $scope.getKudos = User.getKudos;
            $scope.isAuthed = User.isAuthed;
            this.init = function(mcv,mucv,hcv,hucv,mc,muc,hc,huc) {
                Canvas.attachCanvases({
                    main: mc, mainUnder: muc, high: hc, highUnder: huc,
                    mainCanvas: mcv, mainUnderCanvas: mucv, highCanvas: hcv, highUnderCanvas: hucv
                });
                Canvas.initListeners(jQuery(hcv)[0]);
            };
        },
        link: function(scope,elem,attrs,ctrl) {
            var mcv = document.getElementById('mainCanvas');
            var mucv = document.getElementById('mainUnderCanvas');
            var hcv = document.getElementById('highCanvas');
            var hucv = document.getElementById('highUnderCanvas');
            var mc = mcv.getContext ? mcv.getContext('2d') : null;
            var muc = mucv.getContext ? mucv.getContext('2d') : null;
            var hc = hcv.getContext ? hcv.getContext('2d') : null;
            var huc = hucv.getContext ? hucv.getContext('2d') : null;

            hcv.onselectstart = function() { return false; }; // Disable selecting and right clicking
            jQuery('body').on('contextmenu', '#highCanvas', function(){ return false; });

            ctrl.init(mcv,mucv,hcv,hucv,mc,muc,hc,huc);
        }
    }
});

Application.Services.factory('Canvas', function(FireService) {
    var canvases, modes = {}, mode;
    
    var onMouseMove = function(e) { if(mode) mode.onMouseMove(e); };
    var onMouseDown = function(e) { if(mode) mode.onMouseDown(e); };
    var onMouseUp = function(e) { if(mode) mode.onMouseUp(e); };
    var onMouseOut = function() { if(mode) mode.onMouseOut(); };

    return {
        attachCanvases: function(c) { canvases = c; },
        getCanvases: function() { return canvases; },
        initListeners: function(c) {
            c.addEventListener('mousemove',onMouseMove,false);
            c.addEventListener('mouseleave',onMouseOut,false);
            c.addEventListener('mousedown',onMouseDown,false);
            c.addEventListener('mouseup',onMouseUp,false);
        },
        getFireService: function(prefix) {
            return { // Override some FireService functions to include path prefix
                set: function(path,value) { FireService.set('canvas/'+prefix+'/'+path,value); },
                push: function(path,value) { FireService.push('canvas/'+prefix+'/'+path,value); },
                once: function(path,callback) { FireService.once('canvas/'+prefix+'/'+path,callback); },
                remove: function(path) { FireService.remove('canvas/'+prefix+'/'+path); },
                onValue: function(path,callback) { FireService.onValue('canvas/'+prefix+'/'+path,callback); },
                onAddChild: function(path,callback) { FireService.onAddChild('canvas/'+prefix+'/'+path,callback); },
                off: function(path) { FireService.off('canvas/'+prefix+'/'+path); },
                ref: FireService.ref.child('canvas/'+prefix)
            };
        },
        addMode: function(name,mode) { modes[name] = mode; },
        getModes: function() { return modes; },
        changeMode: function(m) {
            if(modes[m] == mode) return;
            if(mode) mode.disable();
            mode = modes[m];
            mode.activate();
        },
        clear: function() { 
            if(!mode) return;
            mode.clear(); 
        }
    };
});