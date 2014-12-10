'use strict';

Application.Services.service("API", function($http) {
    var serviceBase = 'php/';
    this.getVideos = function(count,currentID){
        return $http.get(serviceBase + 'videos?count=' + count + '&current_id=' + currentID);
    };
    this.updateVideo = function(videoID,votes){
        return $http.post(serviceBase + 'updateVideo', {video_id:videoID,votes:votes});
    };
    this.addVideo = function (videoIds, artist, track, addedBy) {
        return $http.post(serviceBase + 'addVideo', {video_ids:videoIds,artist:artist,track:track,added_by:addedBy}).then(function (results) {
            return results;
        });
    };
    this.deleteVideo = function (id) {
        return $http.delete(serviceBase + 'deleteVideo?id=' + id).then(function (status) {
            return status.data;
        });
    };
    this.pullUncurated = function(locked){
        return $http.get(serviceBase + 'pullUncurated?locked=' + locked);
    };
    this.saveCurated = function(videos,curator){
        return $http.post(serviceBase + 'saveCurated', {videos:videos,curator:curator});
    };
    this.getVideoCount = function() {
        return $http.get(serviceBase + 'getVideoCount');
    };
});

Application.Controllers.controller('Main', function($rootScope,$scope,$timeout,localStorageService,API,Canvas,Util,Player,Videos,FireService,DJ,Global,AvatarShop) {
    
    // We gonna refactor this shit
    // TODO: Add "meta" service to track things like current DJ
    
    var username = localStorageService.get('username');
    var passcode = localStorageService.get('passcode');
    var volume = localStorageService.get('volume');
    var fireRef = new Firebase('https://jukebox897.firebaseio.com/box1'), fireUser;
    var init = false, muted;

    $scope.version = 0.353; $scope.versionName = 'Jukes of Hazzard'; $scope.needUpdate = false;
    $scope.initializing = true; $scope.thetime = new Date().getTime(); $scope.eventLog = [];
    $scope.username = username; $scope.passcode = passcode;
    $scope.countProperties = Util.countProperties;
    $scope.getKudos = Global.getKudos;
    $scope.getJackpot = Global.getJackpot;
    $scope.getDJ = Global.getDJ;

    fireRef.parent().child('version').once('value', function(snap) {
        $scope.initializing = false;
        if($scope.version < snap.val()) {
            $scope.needUpdate = true;
        } else {
            fireRef.parent().child('version').on('value',function(snap){ 
                $scope.needUpdate = snap.val() > $scope.version;
                setInterval(interval,500);
            });
        }
        $timeout(function(){});
    });
    
    var sendEvent = function(user,text) {
        fireRef.child('eventLog').push({ user: user, text: text, time: FireService.getServerTime() });
    };
    var purgeEventLog = function() {
        for(var il = $scope.eventLog.length-1, i = il; i >= 0; i--) { // Age and remove old events (locally)
            $scope.eventLog[i].age = FireService.getServerTime() - $scope.eventLog[i].time;
            if($scope.eventLog[i].age > 300000) {
                $scope.eventLog.splice(i,1);
            }
        }
        $timeout(function(){});
    };
    
    $scope.login = function() {
        if(!$scope.username || !$scope.passcode) return;
        var initUser = function() {
            $scope.auth = auth;
            Global.setName($scope.username);
            localStorageService.set('username',username);
            localStorageService.set('passcode',passcode);
            fireUser = fireRef.child('users/'+username);
            fireUser.child('version').set($scope.version);
            var lastOnlineRef = fireUser.child('lastOnline');
            var fireAuths = fireRef.child('auths');
            fireAuths.child(auth.uid).set({username:username,passcode:passcode});
            var connectedRef = new Firebase('https://jukebox897.firebaseio.com/.info/connected');
            connectedRef.on('value', function(snap) {
                if (snap.val() === true) {
                    var conRef = fireUser.child('connections').push(auth.uid);
                    conRef.onDisconnect().remove();
                    fireUser.child('uid').set(auth.uid);
                    lastOnlineRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
                }
            });
            //$scope.canvasModes = Canvas.getModes();
            //$scope.canvasData = {};
            //$scope.canvasMode = 'polyominoes';
            //Canvas.attachVars(fireRef.child('canvas'),$scope.canvasData,{
            //    myColor: AvatarShop.avatarColors[$scope.user.avatarColor ? $scope.user.avatarColor : 'normal'][1],
            //    fireUser: fireUser, api: services, playing: $scope.playing, users: $scope.users, username: username
            //}); 
            //Canvas.changeMode($scope.canvasMode);
            //$scope.changeCanvasMode = Canvas.changeMode;
        };
        username = $scope.username; passcode = $scope.passcode;
        console.log('Logging in',username);
        var auth = fireRef.getAuth();
        if(auth && auth.hasOwnProperty('expires') && auth.expires*1000 > FireService.getServerTime()) {
            console.log('Firebase authenticated!',auth);
            initUser();
        } else {
            fireRef.authAnonymously(function(error, authData) {
                auth = error ? null : authData;
                console.log('Firebase re-authenticated!',auth);
                initUser();
            });
        }
    };

    $scope.becomeDJ = DJ.becomeDJ;
    
    $scope.listenerClasses = function(listener) { 
        if(!listener) return; return 'fa-' + (listener.avatar ? listener.avatar : 'headphones'); 
    };
    $scope.getUserColor = function(username) {
        if(!$scope.users || !$scope.users[username]) return;
        var user = $scope.users[username]; 
        return user.avatarColor ? 
            AvatarShop.avatarColors[user.avatarColor][1] : AvatarShop.avatarColors.normal[1]; 
    };
    
    $scope.fillBlankGetTitle = function() {
        if(!$scope.user.kudos || $scope.user.kudos < 5) { return; }
        fireUser.child('kudos').transaction(function(userKudos) {
            return userKudos ? +userKudos - 5 : 0;
        });
        $scope.gettingFillBlankTitle = true;
        $timeout(function(){});
        var currentID = $scope.playing ? $scope.playing.video_id : 'abc';
        API.getVideos(1,currentID).then(function(data) {
            if(!data || !data.data || data.data.length != 1 || !data.data[0].title) {
                $scope.message = { type:'error',text:'Error retrieving video title. You can probably blame my hosting service.' }; return;
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
            $scope.fillBlankInputLetters = [];
            for(var i = 0, il = challengeWord.length; i < il; i++) { // Build blanked word ('_ _ _ _')
                var alphaNum = /^[a-z0-9]+$/i.test(challengeWord[i]);
                var blankChar = alphaNum ? '_' : challengeWord[i];
                blankedWord += i == il - 1 ? blankChar+'</span>' : blankChar+' ';
                $scope.fillBlankInputLetters.push({value:alphaNum ? '' : blankChar,index:i,disabled: !alphaNum});
            }
            words[challengeWordIndex] = blankedWord; // Change challenge word to blanks
            $scope.fillBlankTitle = { challenge: words.join(' '), complete: title, missing: challengeWord };
            $scope.gettingFillBlankTitle = false;
            $scope.fillBlankIncomplete = true;
            $timeout(function(){});
        });
    };
    
    $scope.fillBlankInputChange = function() {
        $scope.fillBlankIncomplete = false;
        $scope.fillBlankGuess = '';
        for(var i = 0, il = $scope.fillBlankInputLetters.length; i < il; i++) {
            $scope.fillBlankInputLetters[i].value = $scope.fillBlankInputLetters[i].value.trim().toUpperCase();
            var valLength = $scope.fillBlankInputLetters[i].value.length;
            $scope.fillBlankIncomplete = $scope.fillBlankIncomplete ? true : valLength == 0;
            $scope.fillBlankGuess += valLength == 0 ? ' ' : $scope.fillBlankInputLetters[i].value;
        }
    };
    
    $scope.fillBlankSubmit = function() {
        if($scope.fillBlankIncomplete) return;
        if($scope.fillBlankGuess.toUpperCase() == $scope.fillBlankTitle.missing.toUpperCase()) {
            var reward = $scope.fillBlankTitle.missing.length * 5;
            $scope.message = { type: 'success', text: 'You guessed <strong>correctly!</strong> Nice one.', kudos: reward };
            sendEvent(username,'just won <strong>' + reward + '</strong> kudos by filling in the blank!');
            fireUser.child('kudos').transaction(function(userKudos) {
                return userKudos ? +userKudos + +reward : reward;
            });
        } else {
            $scope.message = { type: 'default', text: 'Sorry, the correct answer was "<strong>'+$scope.fillBlankTitle.missing+'</strong>". Try another!' };
        }
        delete $scope.fillBlankTitle; delete $scope.fillBlankGuess; delete $scope.fillBlankInputLetters; // Cleanup
    };
    
    $scope.metaGetVideoCount = function() {
        $scope.gettingMetaVideoCount = true;
        fireRef.child('meta/vidCount').once('value',function(snap) {
            if(snap.val() && snap.val().lastFetch && snap.val().lastFetch + 900000 > FireService.getServerTime()) {
                $scope.metaVideoCount = snap.val().data;
                $scope.metaVidCountMax = snap.val().max;
                $scope.metaVidCountBarWidth = snap.val().barWidth;
                $scope.metaVidCountBarMargin = snap.val().barMargin;
                $scope.metaVidCountYAxisLabels = snap.val().yAxisLabels;
                $scope.metaVidCountTotal = snap.val().videoTotal;
                $scope.gettingMetaVideoCount = false;
                console.log($scope.metaVideoCount);
                $timeout(function(){});
                return; // Data on firebase is less than 15 min old, so we're using that
            }
            API.getVideoCount().then(function(data) { // Get new data
                if(!data || !data.data) {
                    $scope.message = { type:'error',text:'Error retrieving stats. You can probably blame my hosting service.' }; return;
                }
                $scope.metaVideoCount = data.data;
                var countMax = 0;
                $scope.metaVidCountBarWidth = (100/$scope.metaVideoCount.length)-(10/$scope.metaVideoCount.length);
                $scope.metaVidCountBarMargin = 5/$scope.metaVideoCount.length;
                // if less than 48 pixels, only show ever other label
                var labelRoom = ($scope.metaVidCountBarWidth + $scope.metaVidCountBarMargin)/100*528;
                var labelFrequency = labelRoom < 6 ? 5 : labelRoom < 12 ? 4 : labelRoom < 24 ? 3 : labelRoom < 48 ? 2 : 1;
                var videoTotal = 0;
                for(var i = 0, il = $scope.metaVideoCount.length; i < il; i++) {
                    var thisDay = $scope.metaVideoCount[i];
                    thisDay.add_date = new Date(thisDay.add_date).getTime();
                    thisDay.showLabel = i % labelFrequency == 0;
                    countMax = countMax < +thisDay.vidCount ? +thisDay.vidCount : countMax;
                    videoTotal += +thisDay.vidCount;
                }
                for(var j = 0, jl = $scope.metaVideoCount.length; j < jl; j++) {
                    thisDay = $scope.metaVideoCount[j];
                    thisDay.barHeight = (thisDay.vidCount/countMax)*100;
                }
                $scope.metaVidCountYAxisLabels = [];
                for(var k = 4; k > 0; k--) {
                    $scope.metaVidCountYAxisLabels.push(Math.round(countMax * (k/4)));
                }
                $scope.metaVidCountMax = countMax;
                $scope.metaVidCountTotal = videoTotal;
                console.log($scope.metaVideoCount);
                fireRef.child('meta/vidCount').set({
                    data:$scope.metaVideoCount, max:countMax, lastFetch:FireService.getServerTime(), 
                    barWidth: $scope.metaVidCountBarWidth, barMargin: $scope.metaVidCountBarMargin,
                    yAxisLabels: $scope.metaVidCountYAxisLabels, videoTotal: $scope.metaVidCountTotal
                });
                $scope.gettingMetaVideoCount = false;
                $timeout(function(){});
            });
        });
    };
    
    $scope.metaViewVidCountDay = function(index) {
        $scope.metaVidCountDay = index >= 0 ? $scope.metaVideoCount[index] : null;
    };

    $scope.forceVote = DJ.forceVote;
    
    $scope.requireVersion = function() { fireRef.parent().child('version').set($scope.version); }; // Set firebase version
    $scope.clearCanvas = function() { fireRef.child('canvas').remove(); Canvas.clear(); };
    
    var everyThirtySeconds = 30;
    var interval = function() {
        if(!init && Player.isReady()) {
            init = true; console.log('Jukebox initializing...');
            $rootScope.$broadcast('playerReady');
            fireRef.once('value', function(snap) {
                if($scope.dj && !snap.val().users[$scope.dj].hasOwnProperty('connections')) {
                    fireRef.child('dj').remove();
                }
                fireRef.child('users').on('value', function(snap) { $scope.users = snap.val(); }); // Listen for user changes
                fireRef.child('eventLog').endAt().limit(15).on('child_added',function(snap) { $scope.eventLog.push(snap.val()); $scope.eventLog = $scope.eventLog.slice(Math.max($scope.eventLog.length - 15, 0)); purgeEventLog(); });
                $timeout(function(){});
            });
        }
        if(init && playing && $scope.playing) {
            if(muted != Player.isMuted()) {
                muted = Player.isMuted() ? true : false;
                if($scope.auth) fireUser.child('muted').set(muted);
            }
            if(parseInt(Player.getVolume()) != volume) {
                volume = parseInt(Player.getVolume()) || 0;
                if($scope.auth) fireUser.child('volume').set(volume);
                localStorageService.set('volume',volume);
            }
        }
        if(init) DJ.interval();
        $scope.theTime = FireService.getServerTime();
        purgeEventLog();
        everyThirtySeconds += 0.5;
        if(everyThirtySeconds >= 30) {
            everyThirtySeconds = 0;
            /* TODO: Chance for bird to fly in for everyone
            Not just DJ, so that the more people around, the higher the chance */
        }
        $timeout(function(){});
    };
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