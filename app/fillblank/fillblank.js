'use strict';
Application.Directives.directive('fillBlank',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/fillblank/fillblank.html',
        replace: true,
        scope: {},
        controller: function($scope,FillBlank,User,ControlButtons) {
            $scope.control = ControlButtons.addControl('fillBlank','Fill the B_ank',false,false);
            $scope.fillBlank = FillBlank.init();
            $scope.fillBlankGetTitle = FillBlank.getTitle;
            $scope.fillBlankInputChange = FillBlank.inputChange;
            $scope.fillBlankSubmit = FillBlank.submit;
            $scope.getKudos = User.getKudos;
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Directives.directive('letterInput', function() {
    return {
        restrict: 'C',
        link: function(scope, element) {
            console.log('letter input ready',scope,element);
            setTimeout(function(){window.scrollTo(0,document.body.scrollHeight);},500);
            element.bind('click',function() {
                jQuery(element).select();
            });
            element.bind('keyup',function() {
                console.log('letter input change',element[0].value,element);
                if(element[0].value.length == 0) return;
                console.log('there\'s a value!');
                jQuery(element).next().focus().select();
            })
        }
    };
});

Application.Services.factory('FillBlank',function(User,Videos,FireService,Util,API,Message) {
    var fillBlank;
    return {
        getTitle: function() {
            if(!User.getKudos() || User.getKudos() < 5) return;
            User.changeKudos(-5);
            fillBlank.loading = true;
            var currentID = Videos.getPlaying() ? Videos.getPlaying().video_id : 'abc';
            API.getVideos(1,currentID).then(function(data) {
                if(!data || !data.data || data.data.length != 1 || !data.data[0].title) {
                    Message.set({ type:'error',
                        text:'Error retrieving video title. You can probably blame my hosting service.' }); 
                    return;
                }
                var title = data.data[0].title.trim();
                //var title = '6uy\'s 1t\'s c00l!';
                var words = title.split(' '); // Break title into array of words
                var challengeWordIndex;
                var challengeWord = '';
                var safety = 0;
                while(challengeWord.length < 2 && safety < 200) { // Minimum 2 characters long
                    challengeWordIndex = Util.randomIntRange(0,words.length-1); // Choose a word
                    challengeWord = words[challengeWordIndex]; // Get word from chosen index
                    safety++;
                }
                var blankedWord = '<span>';
                fillBlank.inputLetters = [];
                for(var i = 0, il = challengeWord.length; i < il; i++) { // Build blanked word ('_ _ _ _')
                    var alphaNum = /^[a-z0-9]+$/i.test(challengeWord[i]);
                    var blankChar = alphaNum ? '_' : challengeWord[i];
                    blankedWord += i == il - 1 ? blankChar+'</span>' : blankChar+' ';
                    fillBlank.inputLetters.push({value:alphaNum ? '' : blankChar,index:i,disabled: !alphaNum});
                }
                words[challengeWordIndex] = blankedWord; // Change challenge word to blanks
                fillBlank.title = { challenge: words.join(' '), complete: title, missing: challengeWord };
                fillBlank.loading = false;
                fillBlank.incomplete = true;
            });
        },
        inputChange: function() {
            fillBlank.incomplete = false;
            fillBlank.guess = '';
            for(var i = 0, il = fillBlank.inputLetters.length; i < il; i++) {
                fillBlank.inputLetters[i].value = fillBlank.inputLetters[i].value.trim().toUpperCase();
                var valLength = fillBlank.inputLetters[i].value.length;
                fillBlank.incomplete = fillBlank.incomplete ? true : valLength == 0;
                fillBlank.guess += valLength == 0 ? ' ' : fillBlank.inputLetters[i].value;
            }
        },
        submit: function() {
            if(fillBlank.incomplete) return;
            if(fillBlank.guess.toUpperCase() == fillBlank.title.missing.toUpperCase()) {
                var reward = fillBlank.title.missing.length * 5;
                Message.set({ type: 'success', 
                    text: 'You guessed <strong>correctly!</strong> Nice one.', kudos: reward });
                FireService.sendEvent(User.getName(),
                    'just won <strong>' + reward + '</strong> kudos by filling in the blank!');
                User.changeKudos(reward);
            } else {
                Message.set({ text: 'Sorry, the correct answer was "<strong>'+
                    fillBlank.title.missing+'</strong>". Try another!' });
            }
            fillBlank = { }; // Cleanup
        },
        init: function() {
            fillBlank = { }; 
            return fillBlank; 
        }
    };
});