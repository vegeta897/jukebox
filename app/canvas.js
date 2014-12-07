'use strict';

Application.Services.factory('Canvas', function(Polyominoes, Isketch, Util, $timeout) {
    var mainCanvas = document.getElementById('mainCanvas');
    var mainUnderCanvas = document.getElementById('mainUnderCanvas');
    var highCanvas = document.getElementById('highCanvas');
    var highUnderCanvas = document.getElementById('highUnderCanvas');
    var mainContext = mainCanvas.getContext ? mainCanvas.getContext('2d') : null;
    var mainUnderContext = mainUnderCanvas.getContext ? mainUnderCanvas.getContext('2d') : null;
    var highContext = highCanvas.getContext ? highCanvas.getContext('2d') : null;
    var highUnderContext = highUnderCanvas.getContext ? highUnderCanvas.getContext('2d') : null;
    
    highCanvas.onselectstart = function() { return false; }; // Disable selecting and right clicking
    jQuery('body').on('contextmenu', '#highCanvas', function(e){ return false; });
    
    var modes = {polyominoes: Polyominoes, isketch: Isketch}, mode = Polyominoes, scope;
    
    for(var m in modes) { if(!modes.hasOwnProperty(m)) continue;
        modes[m].attachCanvases(mainCanvas,mainUnderCanvas,highCanvas,highUnderCanvas,mainContext,mainUnderContext,highContext,highUnderContext);
    }
    
    var onMouseMove = function(e) { mode.onMouseMove(e); };
    var onMouseDown = function(e) { mode.onMouseDown(e); };
    var onMouseUp = function(e) { mode.onMouseUp(e); };
    var onMouseOut = function() { mode.onMouseOut(); };

    return {
        getModes: function() {
            var modeList = [];
            for(var m in modes) { if(!modes.hasOwnProperty(m)) continue;
                modeList.push(m);
            }
            return modeList;
        },
        changeMode: function(m) {
            if(mode) mode.disable();
            mode = modes[m];
            mode.init();
            scope.canvasMode = m; $timeout(function(){});
        },
        clear: function() {
            mode.clear();
        },
        attachVars: function(fire,s,l) {
            scope = s;
            for(var m in modes) { if(!modes.hasOwnProperty(m)) continue;
                s[m] = {}; modes[m].attachVars(fire.child(m), s[m], l);
            }
            highCanvas.addEventListener('mousemove',onMouseMove,false);
            highCanvas.addEventListener('mouseleave',onMouseOut,false);
            highCanvas.addEventListener('mousedown',onMouseDown,false);
            highCanvas.addEventListener('mouseup',onMouseUp,false);
        }
    };
});