'use strict';

function randomIntRange(min,max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pickInArray(array) { return array[Math.floor(Math.random()*array.length)]; }

var pieces = [
    ''+ // Plus
        '     '+
        '  #  '+
        ' ### '+
        '  #'
    ,''+ // U short
        '     '+
        ' # # '+
        ' ###'
    ,''+ // Z
        '     '+
        ' #   '+
        ' ### '+
        '   #'
    ,''+ // Z flipped
        '     '+
        '   # '+
        ' ### '+
        ' #'
    ,''+ // Angle long
        '  #  '+
        '  #  '+
        '###'
    ,''+ // Angle short
        '     '+
        '  #  '+
        ' ##'
    ,''+ // Line long
        '     '+
        '     '+
        '#####'
    ,''+ // Line short
        '     '+
        '     '+
        ' ###'
    ,''+ // L
        '  #  '+
        '  #  '+
        ' ##'
    ,''+ // L flipped
        '  #  '+
        '  #  '+
        '  ##'
    ,''+ // T long
        '  #  '+
        '  #  '+
        ' ###'
    ,''+ // T short
        '     '+
        '  #  '+
        ' ###'
    ,''+ // 2x2 block
    '     '+
    ' ##  '+
    ' ##'
    ,''+ // Domino
        '     '+
        '     '+
        ' ##'
    ,''+ // Dot
        '     '+
        '     '+
        '  #'
];

Application.Services.service('Canvas', function() {
    console.log('Canvas controller initialized');
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

    var cursor = { x: '-', y: '-'}, grid = 8, nextPiece = randomIntRange(0,pieces.length-1), rotation = randomIntRange(0,3),
        blockGrid = {};
    
    var rotatePiece = function(piece,rot) {
        if(rot == 0) return piece;
        var newPiece = '';
        for(var i = 0, il = 25; i < il; i++) {
            var row = Math.floor(i/5), col = i % 5;
            var newIndex;
            if(rot == 1) newIndex = col*5+(4-row); // 90 deg
            if(rot == 2) newIndex = (4-row)*5+(4-col); // 180 deg
            if(rot == 3) newIndex = (4-col)*5+row; // 270 deg
            newPiece += (piece[newIndex] && piece[newIndex] == '#') ? '#' : ' ';
        }
        return newPiece;
    };
    
    var placePiece = function(piece,x,y,rotation,owner) {
        var thePiece = rotatePiece(pieces[piece],rotation);
        for(var i = 0, il = thePiece.length; i < il; i++) {
            if(thePiece[i] == ' ') continue;
            var row = Math.floor(i/5) - 2, col = i % 5 - 2;
            blockGrid[(+x+row)+':'+(+y+col)] = owner;
        }
    };
    
    var checkCollision = function(piece,x,y,rotation) {
        var thePiece = rotatePiece(pieces[piece],rotation);
        for(var i = 0, il = thePiece.length; i < il; i++) {
            if(thePiece[i] == ' ') continue;
            var row = Math.floor(i/5) - 2, col = i % 5 - 2;
            if(blockGrid[(+x+row)+':'+(+y+col)]) return true;
        }
        return false;
    };
    
    var drawPiece = function(piece,x,y,rotation,color) {
        var high = color == 'high' || color == 'collision';
        var context = high ? highContext : mainContext;
        var underContext = high ? highUnderContext : mainUnderContext;
        var mainColor, underColor = 'black';
        if(color == 'high') mainColor = 'rgba(255,255,255,0.5)';
        if(color == 'collision') mainColor = 'rgba(255,0,0,0.5)';
        if(color != 'high' && color != 'collision') {
            var r = randomIntRange(200,255), g = randomIntRange(200,255), b = randomIntRange(200,255);
            mainColor = 'rgba('+r+','+g+','+b+',0.7)';
        }
        underContext.fillStyle = underColor;
        context.fillStyle = mainColor;
        var thePiece = rotatePiece(pieces[piece],rotation);
        for(var i = 0, il = thePiece.length; i < il; i++) {
            if(thePiece[i] == ' ') continue;
            var row = Math.floor(i/5) - 2, col = i % 5 - 2;
            underContext.fillRect((+x+row)*grid-1,(+y+col)*grid-1,grid+2,grid+2);
            context.fillRect((+x+row)*grid,(+y+col)*grid,grid,grid);
            context.clearRect((+x+row)*grid+1,(+y+col)*grid+1,grid-2,grid-2);
            context.fillRect((+x+row)*grid+2,(+y+col)*grid+2,grid-4,grid-4);
        }
    };
    
    var drawHigh = function() {
        highContext.clearRect(0,0,highCanvas.width,highCanvas.height);
        highUnderContext.clearRect(0,0,highUnderCanvas.width,highUnderCanvas.height);
        drawPiece(nextPiece,cursor.x,cursor.y,rotation,checkCollision(nextPiece,cursor.x,cursor.y,rotation) ? 'collision' : 'high');
    };

    var onMouseMove = function(e) {
        var offset = jQuery(highCanvas).offset();
        var newX = e.pageX - offset.left < 0 ? 0 : Math.floor((e.pageX - offset.left)/grid);
        var newY = e.pageY - offset.top < 0 ? 0 : Math.floor((e.pageY - offset.top)/grid);
        var moved = cursor.x != newX || cursor.y != newY;
        cursor.x = newX; cursor.y = newY;
        if(moved) drawHigh();
    };
    var onMouseDown = function(e) {
        if(e.which == 3) { rotation = rotation == 3 ? 0 : rotation + 1; drawHigh(); return; } // Right mouse
        if(e.which == 2) return; // Middle mouse
        if(checkCollision(nextPiece,cursor.x,cursor.y,rotation)) return;
        placePiece(nextPiece,cursor.x,cursor.y,rotation,'me');
        drawPiece(nextPiece,cursor.x,cursor.y,rotation,'gray');
        nextPiece = randomIntRange(0,pieces.length-1);
        rotation = randomIntRange(0,3);
        drawHigh();
    };
    var onMouseOut = function() { 
        cursor.x = cursor.y = '-'; highContext.clearRect(0,0,highCanvas.width,highCanvas.height); 
    };
    highCanvas.addEventListener('mousemove',onMouseMove,false);
    highCanvas.addEventListener('mouseleave',onMouseOut,false);
    highCanvas.addEventListener('mousedown',onMouseDown,false);
    
    return {
        clear: function() { 
            blockGrid = {}; 
            mainContext.clearRect(0,0,mainCanvas.width,mainCanvas.height);
            mainUnderContext.clearRect(0,0,mainUnderCanvas.width,mainUnderCanvas.height);
        }
    };
});