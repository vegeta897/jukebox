'use strict';

Application.Services.factory('Isketch', function($timeout, Util) {

    var mainCanvas, mainUnderCanvas, highCanvas, highUnderCanvas,
        mainContext, mainUnderContext, highContext, highUnderContext;
    var scope, fireRef, link, cursor = { x: '-', y: '-'}, cursorLast = {x: '-', y: '-'}, grid = 1, 
        drawing, erasing, drawTimer, currentSegment, segmentCount = 0, lineWidth = 2, eraseWidth = 12;

    setInterval(function(){ segmentCount = segmentCount < 10 ? 0 : segmentCount - 10; },500);
    
    var clear = function() {
        mainContext.clearRect(0,0,mainCanvas.width,mainCanvas.height);
        mainUnderContext.clearRect(0,0,mainUnderCanvas.width,mainUnderCanvas.height);
    };
    
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
        fireRef.child('segments').push(currentSegment.join('&'));
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
        mainContext.globalCompositeOperation = 'source-over';
        mainUnderContext.globalCompositeOperation = 'source-over';
    };
    
    var startGame = function() {
        console.log('starting isketch game!');
        fireRef.child('status').once('value',function(snap){ // Make sure nobody else is starting the game
            if(snap.val()) return;
            fireRef.child('status').set('loading');
            scope.startingGame = true;
            link.api.getVideos(1,link.playing.video_id).then(function(data) {
                if(!data || !data.data || data.data.length != 1 || !data.data[0].title) {
                    scope.message = { type:'error',text:'Error retrieving video title. You can probably blame my hosting service.' }; return;
                }
                var title = data.data[0].title.trim();
                //var title = 'guys it\'s ~cool~ to *play* isketch!';
                fireRef.child('segments').remove();
                fireRef.child('guesses').remove();
                fireRef.child('winner').remove();
                var words = title.split(' '); // Break title into array of words
                var challengeWordIndex;
                var challengeWord = '';
                var safety = 0;
                while(challengeWord.length < 4 && safety < 200) { // Minimum 4 characters long
                    challengeWordIndex = Util.randomIntRange(0,words.length-1); // Choose a word
                    challengeWord = words[challengeWordIndex]; // Get word from chosen index
                    safety++;
                }
                var startIndex = 0;
                for(var f = 0, fl = challengeWord.length; f < fl; f++) {
                    if(/^[a-z0-9]+$/i.test(challengeWord[f])) break;
                    console.log('moving start index forward');
                    startIndex++;
                }
                var endIndex = challengeWord.length;
                for(var l = challengeWord.length-1; l >= 0; l--) {
                    if(/^[a-z0-9]+$/i.test(challengeWord[l])) break;
                    console.log('moving end index back');
                    endIndex--;
                }
                challengeWord = challengeWord.substring(startIndex,endIndex);
                var blankedWord = '';
                for(var i = 0, il = challengeWord.length; i < il; i++) { // Build blanked word ('_ _ _ _')
                    var alphaNum = /^[a-z0-9]+$/i.test(challengeWord[i]);
                    var blankChar = alphaNum ? '_' : challengeWord[i];
                    blankedWord += i == il - 1 ? blankChar : blankChar+' ';
                }
                fireRef.child('host').set(link.username);
                fireRef.child('status').set('playing');
                scope.challenge = { word: challengeWord, hint: blankedWord };
                scope.startingGame = false;
                $timeout(function(){});
            });
        });
    };
    
    var statusChange = function(snap) { // When the game's status changes
        var toPlaying = scope.status != 'playing' && snap.val() == 'playing';
        var toWinner = scope.status != 'winner' && snap.val() == 'winner';
        scope.status = snap.val();

        if(toPlaying) {
            clear(); scope.guesses = [];
            fireRef.child('guesses').endAt().limit(10).on('child_added',onGuess);
        }
        if(toWinner) {
            fireRef.child('guesses').off();
            fireRef.child('winner').on('value',onWinner);
        }
        if(!scope.status) {
            delete scope.winner; delete scope.guesses;
        }
    };
    
    var onHost = function(snap) { scope.host = snap.val(); $timeout(function(){}); };
    
    var onWinner = function(snap) {
        scope.winner = snap.val();
        if(scope.winner) fireRef.child('winner').off();
        $timeout(function(){});
    };

    var onGuess = function(snap) {
        scope.guesses.push(snap.val());
        scope.guesses = scope.guesses.slice(Math.max(scope.guesses.length - 10, 0));
        $timeout(function(){});
        if(!scope.challenge) return; // Only the host evaluates correct guess
        var guess = snap.val().text.trim();
        if(guess.toUpperCase() != scope.challenge.word.trim().toUpperCase() && 
            guess.toUpperCase().indexOf(scope.challenge.word.trim().toUpperCase()) < 0) return;
        // If guess correct
        fireRef.child('status').set('winner');
        fireRef.child('winner').set({word:scope.challenge.word,user:snap.val().user});
        setTimeout(function(){
            fireRef.child('host').remove();
            fireRef.child('status').remove();
            fireRef.child('segments').remove();
            fireRef.child('guesses').remove();
            fireRef.child('winner').remove();
            delete scope.challenge;
        },10000)
    };
    
    var submitGuess = function() {
        console.log('guess submit');
        if(!scope.myGuess || scope.myGuess.trim() == '') return;
        scope.myGuess = scope.myGuess.trim();
        fireRef.child('guesses').push({ user: link.username, text: scope.myGuess });
        scope.myGuess = '';
        $timeout(function(){});
    };
    
    return {
        onMouseMove: function(e) {
            var offset = jQuery(highCanvas).offset();
            var newX = e.pageX - offset.left < 0 ? 0 : Math.floor((e.pageX - offset.left)/grid);
            var newY = e.pageY - offset.top < 0 ? 0 : Math.floor((e.pageY - offset.top)/grid);
            cursor.x = newX; cursor.y = newY;
            //var moved = cursor.x != newX || cursor.y != newY;
            //if(!moved) return;
        },
        onMouseDown: function(e) {
            if(scope.status == 'playing' && !scope.challenge) return; // If guessing
            if(drawing || erasing) return;
            if(e.which == 2) return; // Middle mouse
            if(segmentCount > 200) return; // Spam prevention
            if(e.which == 3) erasing = true; // Right mouse
            if(e.which != 3) drawing = true;
            highContext.lineWidth = erasing ? eraseWidth : lineWidth;
            highContext.beginPath();
            highContext.moveTo(cursor.x,cursor.y);
            currentSegment = [(drawing ? link.myColor : 'erase'),cursor.x+':'+cursor.y];
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
        clear: clear,
        attachVars: function(fire,s,l) {
            fireRef = fire; scope = s; link = l;
            scope.cursor = cursor;
            scope.startGame = startGame;
            scope.submitGuess = submitGuess;
        },
        init: function() {
            mainContext.clearRect(0,0,mainCanvas.width,mainCanvas.height);
            mainUnderContext.clearRect(0,0,mainUnderCanvas.width,mainUnderCanvas.height);
            fireRef.child('segments').on('child_added',segmentAdded);
            fireRef.child('host').on('value',onHost);
            fireRef.child('status').on('value',statusChange);
        },
        disable: function() {
            fireRef.child('segments').off();
            fireRef.child('host').off();
            fireRef.child('status').off();
        }
    };
});