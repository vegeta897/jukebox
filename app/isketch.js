'use strict';

Application.Services.service('Isketch', function(Util) {

    var mainCanvas, mainUnderCanvas, highCanvas, highUnderCanvas,
        mainContext, mainUnderContext, highContext, highUnderContext;
    var cursor = { x: '-', y: '-'}, cursorLast = {x: '-', y: '-'}, grid = 1, fireRef, 
        myColor, drawing, erasing, drawTimer, currentSegment, segmentCount = 0, lineWidth = 2, eraseWidth = 12;

    setInterval(function(){ segmentCount = segmentCount < 10 ? 0 : segmentCount - 10; },500);
    
    var drawPoints = function() {
        if(!drawing && !erasing) return;
        if(cursor.x == '-' || cursor.y == '-') return;
        if(Math.abs(cursorLast.x - cursor.x) < 3 && Math.abs(cursorLast.y - cursor.y) < 3) return;
        highContext.lineTo(cursor.x,cursor.y);
        highContext.stroke();
        highContext.beginPath();
        highContext.moveTo(cursor.x,cursor.y);
        currentSegment.push(cursor.x+':'+cursor.y);
        cursorLast.x = cursor.x; cursorLast.y = cursor.y;
        if(currentSegment.length > 100) finishSegment();
    };
    
    var finishSegment = function() {
        drawing = erasing = false;
        if(!currentSegment) return;
        if(cursor.x != '-' && cursor.y != '-') currentSegment.push(cursor.x+':'+cursor.y);
        if(!currentSegment || currentSegment.length < 3) return;
        segmentCount += currentSegment.length-1;
        fireRef.child('segments/').push(currentSegment.join('&'));
        currentSegment = null;
    };
    
    var segmentAdded = function(snap) {
        var segment = snap.val().split('&');
        mainContext.strokeStyle = '#'+segment[0];
        mainContext.lineWidth = segment[0] == 'erase' ? eraseWidth : lineWidth;
        mainUnderContext.lineWidth = segment[0] == 'erase' ? eraseWidth - 2 : lineWidth + 2;
        mainContext.globalCompositeOperation = segment[0] == 'erase' ? 'destination-out' : 'source-over';
        mainUnderContext.globalCompositeOperation = segment[0] == 'erase' ? 'destination-out' : 'source-over';
        mainContext.beginPath();
        mainUnderContext.beginPath();
        var x = +segment[1].split(':')[0], y = +segment[1].split(':')[1];
        mainContext.moveTo(x,y);
        mainUnderContext.moveTo(x,y);
        for(var i = 2, il = segment.length; i < il; i++) {
            x = +segment[i].split(':')[0]; y = +segment[i].split(':')[1];
            mainContext.lineTo(x,y);
            mainUnderContext.lineTo(x,y);
        }
        mainContext.stroke();
        mainUnderContext.stroke();
    };
    
    return {
        onMouseMove: function(e) {
            var offset = jQuery(highCanvas).offset();
            var newX = e.pageX - offset.left < 0 ? 0 : Math.floor((e.pageX - offset.left)/grid);
            var newY = e.pageY - offset.top < 0 ? 0 : Math.floor((e.pageY - offset.top)/grid);
            var moved = cursor.x != newX || cursor.y != newY;
            cursor.x = newX; cursor.y = newY;
            //if(moved) 
        },
        onMouseDown: function(e) {
            if(drawing || erasing) return;
            if(e.which == 2) return; // Middle mouse
            if(segmentCount > 200) return; // Spam prevention
            if(e.which == 3) erasing = true; // Right mouse
            if(e.which != 3) drawing = true;
            highContext.lineWidth = erasing ? eraseWidth : lineWidth;
            highContext.beginPath();
            highContext.moveTo(cursor.x,cursor.y);
            currentSegment = [(drawing ? myColor : 'erase'),cursor.x+':'+cursor.y];
            drawTimer = setInterval(drawPoints,50);
        },
        onMouseUp: function(e) {
            if(e.which == 1 && erasing) return;
            if(e.which == 3 && drawing) return; // Right mouse
            if(e.which == 2) return; // Middle mouse
            highContext.clearRect(0,0,highCanvas.width,highCanvas.height);
            highUnderContext.clearRect(0,0,highUnderCanvas.width,highUnderCanvas.height);
            finishSegment();
        },
        onMouseOut: function() {
            cursor.x = cursor.y = '-';
            highContext.clearRect(0,0,highCanvas.width,highCanvas.height);
            highUnderContext.clearRect(0,0,highUnderCanvas.width,highUnderCanvas.height);
            finishSegment();
        },
        attachCanvases: function(mCan,mUCan,hCan,hUCan,mCon,mUCon,hCon,hUCon) {
            mainCanvas = mCan; mainUnderCanvas = mUCan; highCanvas = hCan; highUnderCanvas = hUCan;
            mainContext = mCon; mainUnderContext = mUCon;
            highContext = hCon; highUnderContext = hUCon;
            highContext.lineCap = 'round';
            highContext.strokeStyle = 'white';
            mainContext.lineCap = 'round';
            mainUnderContext.lineCap = 'round';
            mainUnderContext.strokeStyle = 'black';
        },
        clear: function() {
            mainContext.clearRect(0,0,mainCanvas.width,mainCanvas.height);
            mainUnderContext.clearRect(0,0,mainUnderCanvas.width,mainUnderCanvas.height);
        },
        attachFire: function(fire) {
            fireRef = fire;
        },
        init: function(options) {
            myColor = options.myColor;
            mainContext.clearRect(0,0,mainCanvas.width,mainCanvas.height);
            mainUnderContext.clearRect(0,0,mainUnderCanvas.width,mainUnderCanvas.height);
            fireRef.child('segments').on('child_added',segmentAdded);
        },
        disable: function() {
            fireRef.child('segments').off('child_added',segmentAdded);
        }
    };
});