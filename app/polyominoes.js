'use strict';

var pieces=[""+"     "+"  #  "+" ### "+"  #",""+"     "+" # # "+" ###",""+"     "+"  ## "+" ##",""+"     "+" ##  "+"  ##",""+"     "+" #   "+" ### "+"   #",""+"     "+"   # "+" ### "+" #",""+"     "+"  ## "+"###",""+"     "+" ##  "+"  ###",""+"     "+" #   "+" ##  "+"  ##",""+"  #  "+"  #  "+"###",""+"     "+"  #  "+"####",""+"     "+"  #  "+" ####",""+"     "+"  #  "+" ##",""+"  #  "+"  #  "+" ##",""+"  #  "+"  #  "+"  ##",""+"  #  "+"  #  "+" ###",""+"     "+"  #  "+" ###",""+"     "+"  #  "+" ### "+"   #",""+"     "+"  #  "+" ### "+" #",""+"     "+" ##  "+" ##",""+"  #  "+" ##  "+" ##",""+" #   "+" ##  "+" ##",""+"     "+"     "+"#####",""+"     "+"     "+"####",""+"     "+"     "+" ###",""+"     "+"     "+" ##",""+"     "+"     "+"  #"];

Application.Services.service('Polyominoes', function(Util) {

    var mainCanvas, mainUnderCanvas, highCanvas, highUnderCanvas,
        mainContext, mainUnderContext, highContext, highUnderContext;
    var scope, fireRef, link, cursor = { x: '-', y: '-'}, grid = 10, 
        nextPiece = Util.randomIntRange(0,pieces.length-1), rotation = Util.randomIntRange(0,3),
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
            var rCol = Util.randomColor('vibrant').rgb; // TODO: Seed random color by piece, grid, and rotation
            mainColor = 'rgba('+rCol.r+','+rCol.g+','+rCol.b+',0.7)';
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
    
    var pieceAdded = function(snap) {
        var p = snap.val().split(':'), x = +snap.name().split(':')[0], y = +snap.name().split(':')[1];
        placePiece(+p[0],x,y,+p[1],p[2]);
        drawPiece(p[0],x,y,p[1],'random');
    };
    
    return {
        onMouseMove: function(e) {
            var offset = jQuery(highCanvas).offset();
            var newX = e.pageX - offset.left < 0 ? 0 : Math.floor((e.pageX - offset.left)/grid);
            var newY = e.pageY - offset.top < 0 ? 0 : Math.floor((e.pageY - offset.top)/grid);
            var moved = cursor.x != newX || cursor.y != newY;
            cursor.x = newX; cursor.y = newY;
            if(moved) drawHigh();
        },
        onMouseDown: function(e) {
            if(e.which == 3) { rotation = rotation == 3 ? 0 : rotation + 1; drawHigh(); return; } // Right mouse
            if(e.which == 2) return; // Middle mouse
            if(checkCollision(nextPiece,cursor.x,cursor.y,rotation)) return;
            fireRef.child('pieces/'+cursor.x+':'+cursor.y).set([nextPiece,rotation,link.username].join(':'));
            nextPiece = Util.randomIntRange(0,pieces.length-1);
            rotation = Util.randomIntRange(0,3);
            drawHigh();
        },
        onMouseUp: function(e) {  },
        onMouseOut: function() {
            cursor.x = cursor.y = '-';
            highContext.clearRect(0,0,highCanvas.width,highCanvas.height);
            highUnderContext.clearRect(0,0,highUnderCanvas.width,highUnderCanvas.height);
        },
        attachCanvases: function(mCan,mUCan,hCan,hUCan,mCon,mUCon,hCon,hUCon) {
            mainCanvas = mCan; mainUnderCanvas = mUCan; highCanvas = hCan; highUnderCanvas = hUCan;
            mainContext = mCon; mainUnderContext = mUCon;
            highContext = hCon; highUnderContext = hUCon;
        },
        clear: function() {
            blockGrid = {};
            mainContext.clearRect(0,0,mainCanvas.width,mainCanvas.height);
            mainUnderContext.clearRect(0,0,mainUnderCanvas.width,mainUnderCanvas.height);
        },
        attachVars: function(fire,s,l) {
            fireRef = fire; scope = s; link = l;
        },
        init: function() {
            blockGrid = {};
            mainContext.clearRect(0,0,mainCanvas.width,mainCanvas.height);
            mainUnderContext.clearRect(0,0,mainUnderCanvas.width,mainUnderCanvas.height);
            fireRef.child('pieces').on('child_added',pieceAdded);
        },
        disable: function() {
            fireRef.child('pieces').off('child_added',pieceAdded);
        }
    };
});