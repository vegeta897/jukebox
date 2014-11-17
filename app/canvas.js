'use strict';

Application.Services.service('Canvas', function(Polyominoes, Util) {
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
    
    var modes = {polyominoes: Polyominoes}, mode;
    
    for(var m in modes) { if(!modes.hasOwnProperty(m)) continue;
        modes[m].attachCanvases(mainCanvas,mainUnderCanvas,highCanvas,highUnderCanvas,mainContext,mainUnderContext,highContext,highUnderContext);
    }
    
    var onMouseMove = function(e) { mode.onMouseMove(e); };
    var onMouseDown = function(e) { mode.onMouseDown(e); };
    var onMouseOut = function() { mode.onMouseOut(); };
    highCanvas.addEventListener('mousemove',onMouseMove,false);
    highCanvas.addEventListener('mouseleave',onMouseOut,false);
    highCanvas.addEventListener('mousedown',onMouseDown,false);

    return {
        getModes: function() {
            var modeList = [];
            for(var m in modes) { if(!modes.hasOwnProperty(m)) continue;
                modeList.push(m);
            }
            return modeList;
        },
        changeMode: function(m) {
            mode = modes[m];
        },
        clear: function() {
            mode.clear();
        },
        attachFire: function(fire) {
            for(var m in modes) { if(!modes.hasOwnProperty(m)) continue;
                modes[m].attachFire(fire.child(m));
            }
        }
    };
});