'use strict';
Application.Directives.directive('isketch',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/canvas/isketch/isketch.html',
        replace: true,
        scope: {},
        controller: function($scope,User,Isketch,AvatarShop) {
            $scope.isketch = Isketch.init();
            $scope.startGame = Isketch.startGame;
            $scope.submitGuess = Isketch.submitGuess;
            $scope.getKudos = User.getKudos;
            $scope.getUserColor = AvatarShop.getUserColor;
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('Isketch', function(Canvas,Util,API,User,Videos,AvatarShop) {

    var c = Canvas.getCanvases();
    var fire = Canvas.getFireService('isketch');
    var isketch, cursor = { x: '-', y: '-'}, cursorLast = {x: '-', y: '-'}, grid = 1, spamTimer,
        drawing, erasing, drawTimer, currentSegment, segmentCount = 0, lineWidth = 2, eraseWidth = 12;
    
    var controller = {
        name: 'iSketch',
        onMouseMove: function(e) {
            var offset = jQuery(c.highCanvas).offset();
            var newX = e.pageX - offset.left < 0 ? 0 : Math.floor((e.pageX - offset.left)/grid);
            var newY = e.pageY - offset.top < 0 ? 0 : Math.floor((e.pageY - offset.top)/grid);
            cursor.x = newX; cursor.y = newY;
            //var moved = cursor.x != newX || cursor.y != newY;
            //if(!moved) return;
        },
        onMouseDown: function(e) {
            if(isketch.status == 'playing' && !isketch.challenge) return; // If guessing
            if(drawing || erasing) return;
            if(e.which == 2) return; // Middle mouse
            if(segmentCount > 200) return; // Spam prevention
            if(e.which == 3) erasing = true; // Right mouse
            if(e.which != 3) drawing = true;
            c.high.lineWidth = erasing ? eraseWidth : lineWidth;
            c.high.beginPath();
            c.high.moveTo(cursor.x,cursor.y);
            currentSegment = [(drawing ? AvatarShop.getUserColor(User.getName()) : 'erase'),cursor.x+':'+cursor.y];
            drawTimer = setInterval(drawPoints,50);
        },
        onMouseUp: function(e) {
            if(e.which == 1 && erasing) return;
            if(e.which == 3 && drawing) return; // Right mouse
            if(e.which == 2) return; // Middle mouse
            c.high.clearRect(0,0, c.highCanvas.width, c.highCanvas.height);
            c.highUnder.clearRect(0,0, c.highUnderCanvas.width, c.highUnderCanvas.height);
            finishSegment();
        },
        onMouseOut: function() {
            cursor.x = cursor.y = '-';
            c.high.clearRect(0,0, c.highCanvas.width, c.highCanvas.height);
            c.highUnder.clearRect(0,0, c.highUnderCanvas.width, c.highUnderCanvas.height);
            finishSegment();
        },
        activate: function() {
            isketch.active = true;
            c.main.clearRect(0,0, c.mainCanvas.width, c.mainCanvas.height);
            c.mainUnder.clearRect(0,0, c.mainUnderCanvas.width, c.mainUnderCanvas.height);
            fire.onAddChild('segments',segmentAdded);
            fire.onValue('host',onHost);
            fire.onValue('status',statusChange);
            spamTimer = setInterval(function(){ segmentCount = segmentCount < 10 ? 0 : segmentCount - 10; },500);
        },
        disable: function() {
            fire.off(['segments','host','status']);
            isketch.active = false;
            clearInterval(spamTimer);
        },
        isActive: function() { return isketch ? isketch.active : false; },
        clear: function() {
            c.main.clearRect(0,0, c.mainCanvas.width, c.mainCanvas.height);
            c.mainUnder.clearRect(0,0, c.mainUnderCanvas.width, c.mainUnderCanvas.height);
        }
    };
    Canvas.addMode('isketch',controller);
    
    var drawPoints = function() {
        if(!drawing && !erasing) return;
        if(cursor.x == '-' || cursor.y == '-') return;
        if(Math.abs(cursorLast.x - cursor.x) < 3 && Math.abs(cursorLast.y - cursor.y) < 3) return;
        c.high.lineTo(cursor.x,cursor.y);
        c.high.stroke();
        c.high.beginPath();
        c.high.moveTo(cursor.x,cursor.y);
        currentSegment.push(cursor.x+':'+cursor.y);
        cursorLast.x = cursor.x; cursorLast.y = cursor.y;
        if(currentSegment.length > 100) finishSegment(); // TODO: Auto-start a new segment
    };
    
    var finishSegment = function() {
        drawing = erasing = false;
        if(!currentSegment) return;
        if(cursor.x != '-' && cursor.y != '-') currentSegment.push(cursor.x+':'+cursor.y);
        if(!currentSegment || currentSegment.length < 3) return;
        segmentCount += currentSegment.length-1;
        fire.push('segments',currentSegment.join('&')); // TODO: Limit number of segments stored on firebase (FIFO)
        currentSegment = null;
    };
    
    var segmentAdded = function(data,key) {
        var segment = data.split('&');
        c.main.strokeStyle = '#'+segment[0];
        c.main.lineWidth = segment[0] == 'erase' ? eraseWidth : lineWidth;
        c.mainUnder.lineWidth = segment[0] == 'erase' ? eraseWidth - 2 : lineWidth + 2;
        c.main.globalCompositeOperation = segment[0] == 'erase' ? 'destination-out' : 'source-over';
        c.mainUnder.globalCompositeOperation = segment[0] == 'erase' ? 'destination-out' : 'source-over';
        c.main.beginPath();
        c.mainUnder.beginPath();
        var x = +segment[1].split(':')[0], y = +segment[1].split(':')[1];
        c.main.moveTo(x,y);
        c.mainUnder.moveTo(x,y);
        for(var i = 2, il = segment.length; i < il; i++) {
            x = +segment[i].split(':')[0]; y = +segment[i].split(':')[1];
            c.main.lineTo(x,y);
            c.mainUnder.lineTo(x,y);
        }
        c.main.stroke();
        c.mainUnder.stroke();
        c.main.globalCompositeOperation = 'source-over';
        c.mainUnder.globalCompositeOperation = 'source-over';
    };
    
    var statusChange = function(s) { // When the game's status changes
        var toPlaying = isketch.status != 'playing' && s == 'playing';
        var toWinner = isketch.status != 'winner' && s == 'winner';
        isketch.status = s;

        if(toPlaying) {
            controller.clear(); isketch.guesses = [];
            fire.ref.child('guesses').endAt().limit(10).on('child_added',onGuess);
        }
        if(toWinner) {
            fire.off('guesses');
            fire.onValue('winner',onWinner);
        }
        if(!isketch.status) {
            delete isketch.winner; delete isketch.guesses;
        }
    };
    
    var onHost = function(h) { isketch.host = h; };
    
    var onWinner = function(w) {
        isketch.winner = w;
        if(isketch.winner) fire.off('winner');
    };

    var onGuess = function(snap) {
        isketch.guesses.push(snap.val());
        isketch.guesses = isketch.guesses.slice(Math.max(isketch.guesses.length - 10, 0));
        if(!isketch.challenge) return; // Only the host evaluates correct guess
        var guess = snap.val().text.trim();
        if(guess.toUpperCase() != isketch.challenge.word.trim().toUpperCase() && 
            guess.toUpperCase().indexOf(isketch.challenge.word.trim().toUpperCase()) < 0) return;
        // If guess correct
        fire.set('status','winner');
        fire.set('winner',{word:isketch.challenge.word,user:snap.val().user});
        setTimeout(function(){
            fire.remove(['host','status','segments','guesses','winner']);
            delete isketch.challenge; delete isketch.winner;
        },10000)
    };
    
    return {
        init: function() {
            c.high.lineCap = 'round';
            c.high.strokeStyle = 'white';
            c.main.lineCap = 'round';
            c.mainUnder.lineCap = 'round';
            c.mainUnder.strokeStyle = 'black';
            isketch = { cursor: cursor, active: false }; 
            return isketch; 
        },
        startGame: function() {
            console.log('starting isketch game!');
            fire.once('status',function(stat) { // Make sure nobody else is starting the game
                if(stat) return;
                fire.set('status','loading');
                isketch.startingGame = true;
                API.getVideos(1,Videos.getPlaying().video_id).then(function(data) {
                    if(!data || !data.data || data.data.length != 1 || !data.data[0].title) {
                        isketch.message = { type:'error',text:'Error retrieving video title. You can probably blame my hosting service.' }; return;
                    }
                    var title = data.data[0].title.trim();
                    //var title = 'guys it\'s ~cool~ to *play* isketch!';
                    fire.remove(['segments','guesses','winner']);
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
                    fire.set('host',User.getName());
                    fire.set('status','playing');
                    isketch.challenge = { word: challengeWord, hint: blankedWord };
                    isketch.startingGame = false;
                });
            });
        },
        submitGuess: function() {
            console.log('guess submit');
            if(!isketch.myGuess || isketch.myGuess.trim() == '') return;
            isketch.myGuess = isketch.myGuess.trim();
            fire.push('guesses',{ user: User.getName(), text: isketch.myGuess });
            isketch.myGuess = '';
        }
    };
});