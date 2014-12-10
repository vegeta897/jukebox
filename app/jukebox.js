'use strict';

var avatars = {
    headphones: ['Headphones',0], wheelchair: ['Wheelchair',6000], 'plus-square': ['Medkit',5000], ambulance: ['Ambulance',8000], 
    windows: ['Windows',3000], twitter: ['Twitter',6000], twitch: ['Twitch',6000], 'steam-square': ['Steam',10000], 
    soundcloud: ['SoundCloud',8000], reddit: ['Reddit',8000], linux: ['Linux',10000], 'github-alt': ['GitHub Cat',15000], 
    'facebook-square': ['Facebook', 3000], apple: ['Apple',5000], android: ['Android',8000], backward: ['Rewind',8000], 
    eject: ['Eject',12000], forward: ['Forward',8000], pause: ['Pause',15000], play: ['Play',20000], 
    'play-circle': ['Play Circle',20000], 'youtube-play': ['YouTube',10000], 'hand-o-right': ['Pointer',15000], 
    'chevron-right': ['Chevron',10000], 'chevron-circle-right': ['Chevron Circle',10000], arrows: ['Arrows',8000], 
    'arrow-right': ['Arrow',15000], undo: ['Undo',10000], repeat: ['Repeat',10000], th: ['Grid',8000],
    scissors: ['Scissors',8000], save: ['Floppy',15000], font: ['A',8000], jpy: ['Yen',15000], usd: ['Dollar',15000],
    gbp: ['Pounds',15000], 'circle-o': ['Circle',8000], 'dot-circle-o': ['Dot Circle',9000], cog: ['Gear',15000], 
    refresh: ['Refresh',15000], 'volume-up': ['Speaker',20000], wrench: ['Wrench',4000], warning: ['Warning',10000],
    'unlock-alt': ['Lock',5000], umbrella: ['Umbrella',6000], truck: ['Truck',10000], trophy: ['Trophy',8000], 
    'thumbs-o-up': ['Thumbs Up',10000], star: ['Star',18000], 'soccer-ball-o': ['Soccer Ball',8000], 'smile-o': ['Smile',18000],
    sliders: ['Sliders',18000], signal: ['Signal',12000], shield: ['Shield',8000], search: ['Magnifying',5000], 
    rss: ['RSS',3000], rocket: ['Rocket',4000], 'power-off': ['Power',15000], paw: ['Paw',15000], music: ['Music',20000],
    'moon-o': ['Moon',5000], 'meh-o': ['Meh',8000], heart: ['Heart',12000], 'frown-o': ['Frown',8000], flask: ['Flask',6000],
    bolt: ['Lightning',8000], eye: ['Eye',15000], cube: ['Cube',8000], child: ['Child',18000], check: ['Check',5000],
    camera: ['Camera',10000], bug: ['Bug',15000]
};

var avatarColors = {
    normal: ['Normal','D8DBCD',0], jukeGreen: ['Juke Green','B5D053',7000], red: ['Red','D05353',5000], 
    orange: ['Orange','D09553',6000], kudoGreen: ['Kudo Green','53D055',5000], teal: ['Teal','53D097',6000],
    babyBlue: ['Baby Blue','53D0D0',6000], justBlue: ['Just Blue','5389D0',5000], purple: ['Purple','7C53D0',5000],
    hotPink: ['Hot Pink','D053B7',6000], yellow: ['Yellow','E4E253',7000], cherryRed: ['Cherry Red','F23D3D',8000],
    limeGreen: ['Lime Green','86F23D',8000], icyBlue: ['Icy Blue','83F7F3',8000], babyPink: ['Baby Pink','FC9EEC',8000],
    shadyGray: ['Shady Gray','A5A5A5',9000], pureWhite: ['Pure White','FFFFFF',250000], zero: ['Zero Black','000000',500000]
};


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

Application.Controllers.controller('Main', function($rootScope, $scope, $timeout, localStorageService, API, Canvas, Util, User, Player, Videos, FireService, DJ) {
    // We gonna refactor this shit
    var username = localStorageService.get('username');
    var passcode = localStorageService.get('passcode');
    var volume = localStorageService.get('volume');
    var fireRef = new Firebase('https://jukebox897.firebaseio.com/box1'), fireUser;
    var init = false, muted;

    $scope.version = 0.351; $scope.versionName = 'Jukes of Hazzard'; $scope.needUpdate = false;
    $scope.initializing = true; $scope.thetime = new Date().getTime(); $scope.eventLog = [];
    $scope.username = username; $scope.passcode = passcode;
    $scope.avatars = avatars; $scope.avatarColors = avatarColors;
    $scope.countProperties = Util.countProperties;

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
            User.setName($scope.username);
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
            //    myColor: $scope.avatarColors[$scope.user.avatarColor ? $scope.user.avatarColor : 'normal'][1],
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
        return user.avatarColor ? $scope.avatarColors[user.avatarColor][1] : $scope.avatarColors.normal[1]; 
    };

    $scope.restrictNumber = function(input,min,max) { 
        input = input.replace(/[^\d.-]/g, '').replace('..','.').replace('..','.').replace('-',''); 
        return input > max ? max : input < min ? min : input; 
    };
    
    $scope.parseURL = function() {
        if(!$scope.add_url && !$scope.batchList) { return; }
        var urls = $scope.enableBatch ? $scope.batchList.split('\n') : [$scope.add_url];
        $scope.parsedIds = '';
        for(var i = 0, il = urls.length; i < il; i++) {
            var re = /(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
            var parsed = urls[i].replace(re,'$1').replace('http://','').replace('https://','').substr(0,11);
            if(parsed.length == 11) {
                $scope.parsedIds += parsed+',';
                $scope.add_valid = true;
            } else {
                $scope.add_valid = false;
                break;
            }
        }
        $scope.parsedIds = $scope.parsedIds.substring(0,$scope.parsedIds.length-1);
    };
    
    $scope.addVideo = function() {
        if($scope.parsedIds.length < 11 || !$scope.add_valid) { return; }
        console.log('adding',$scope.parsedIds);
        $scope.addingVideo = true;
        if($scope.add_artist) $scope.add_artist = $scope.add_artist.trim();
        if($scope.add_track) $scope.add_track = $scope.add_track.trim();
        if($scope.add_artist == '') delete $scope.add_artist;
        if($scope.add_track == '') delete $scope.add_track;
        API.addVideo($scope.parsedIds, $scope.add_artist, $scope.add_track, username).then(function(results) {
            console.log(results);
            $scope.parsedIds = '';
            delete $scope.add_url;
            delete $scope.batchList;
            $scope.addingVideo = false;
            if(typeof results.data == 'string' && results.data.substr(0,9) == 'Duplicate') {
                console.log('video id already exists!');
                $scope.message = { type: 'error', text: 'That video has already been added.' };
            } else {
                if(!results.data || !results.data.data) {
                    $scope.message = { type: 'error', text: 'Sorry, there was a server error. Tell Vegeta about it.' }; return;
                }
                var justAdded = results.data.data.items.length == 1 ? results.data.data.items[0].snippet.title : 'Videos';
                var reward = parseInt(results.data.data.items.length * 25);
                $scope.message = { type: 'success', text: '<strong>'+justAdded + '</strong> added successfully!', kudos: reward };
                var addQuantity = results.data.data.items.length == 1 ? 'a video' : results.data.data.items.length + ' videos';
                sendEvent(username,'just added ' + addQuantity + '! What ' + Util.buildSubject() + '!');
                fireUser.child('kudos').transaction(function(userKudos) {
                    return userKudos ? +userKudos + +reward : reward;
                });
            }
        });
    };
    
    $scope.hasAvatar = function(avatar) { 
        return avatar == 'headphones' ? true : $scope.user && $scope.user.avatars ? $scope.user.avatars.hasOwnProperty(avatar) : false; 
    };
    $scope.hasAvatarColor = function(color) {
        return color == 'normal' ? true : $scope.user && $scope.user.avatarColors ? $scope.user.avatarColors.hasOwnProperty(color) : false;
    };
    
    $scope.buyEquipAvatar = function(avatar) {
        if(avatar == 'headphones' && !$scope.user.avatar) { return; }
        if(avatar == 'headphones' && $scope.user.avatar) { fireUser.child('avatar').remove(); return; }
        if((avatar == 'headphones' && $scope.user.avatar) || ($scope.user.avatars && $scope.user.avatars[avatar] && avatar != $scope.user.avatar)) {
            fireUser.child('avatar').set(avatar); return;
        }
        var cost = $scope.avatars[avatar][1];
        if(!$scope.user.kudos || $scope.user.kudos < cost) { return; }
        fireUser.child('kudos').transaction(function(userKudos) {
            return userKudos ? parseInt(userKudos) - cost : -cost;
        });
        fireUser.child('avatars/'+avatar).set(true);
        fireUser.child('avatar').set(avatar);
        sendEvent(username,'just bought the <strong>'+$scope.avatars[avatar][0]+'</strong> avatar!');
    };

    $scope.buyEquipAvatarColor = function(color) {
        if(color == 'normal' && !$scope.user.avatarColor) { return; }
        if(color == 'normal' && $scope.user.avatarColor) { fireUser.child('avatar').remove(); return; }
        if((color == 'normal' && $scope.user.avatarColor) || ($scope.user.avatarColors && $scope.user.avatarColors[color] && color != $scope.user.avatarColor)) {
            fireUser.child('avatarColor').set(color); return;
        }
        var cost = $scope.avatarColors[color][2];
        if(!$scope.user.kudos || $scope.user.kudos < cost) { return; }
        fireUser.child('kudos').transaction(function(userKudos) {
            return userKudos ? parseInt(userKudos) - cost : -cost;
        });
        fireUser.child('avatarColors/'+color).set(true);
        fireUser.child('avatarColor').set(color);
        sendEvent(username,'just bought the <strong>'+$scope.avatarColors[color][0]+'</strong> avatar color!');
    };
    
    $scope.beginCurator = function() {
        $scope.gettingUncurated = true;
        fireRef.child('curating').once('value',function(snap) {
            var locked = [];
            for(var videoID in snap.val()) { if(!snap.val().hasOwnProperty(videoID)) continue;
                locked.push("'"+videoID+"'");
            }
            locked = locked.length == 0 ? "''" : locked.join(',');
            console.log(locked);
            API.pullUncurated(locked).then(function(data) {
                console.log('Videos retrieved to be curated',data.data);
                if(!data || !data.data || data.data.length != 5) {
                    $scope.message = { type:'error',text:'Error retrieving videos. You can probably blame my hosting service.' }; return;
                }
                var curating = {}; // Object of video IDs 
                for(var d = 0, dl = data.data.length; d < dl; d++) {
                    curating[data.data[d].video_id] = username;
                    data.data[d].duration = Util.parseUTCtime(data.data[d].duration);
                    data.data[d].index = d;
                }
                fireRef.child('curating').update(curating);
                $scope.gettingUncurated = false;
                $scope.curateList = data.data;
                $timeout(function(){});
            });
        });
    };
    
    $scope.removeFromCurator = function(index) {
        fireRef.child('curating/'+$scope.curateList[index].video_id).remove();
        $scope.curateList.splice(index,1);
    };

    $scope.saveCurated = function() {
        $scope.savingCurated = true;
        API.saveCurated($scope.curateList, username).then(function(results) {
            console.log(results);
            $scope.savingCurated = false;
            if(!results.data || !results.data.data) {
                $scope.message = { type: 'error', text: 'Sorry, there was a server error. Tell Vegeta about it.' }; return;
            }
            $scope.message = { type: 'success', text: '<strong>Thank you</strong> for your help curating the database!' };
            var addQuantity = results.data.data.videos.length == 1 ? 'a video' : results.data.data.videos.length + ' videos';
            sendEvent(username,'just curated ' + addQuantity + '! What ' + Util.buildSubject() + '!');
            for(var i = 0, il = $scope.curateList.length; i < il; i++) {
                fireRef.child('curating/'+$scope.curateList[i].video_id).remove();
            }
            delete $scope.curateList;
            $timeout(function(){});
        });
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
                    $scope.dj = ''; fireRef.child('dj').remove();
                }
                fireRef.child('users').on('value', function(snap) { $scope.users = snap.val(); $scope.user = snap.val()[username]; }); // Listen for user changes TODO: Move self update stuff to User service
                fireRef.child('dj').on('value', function(snap) { $scope.dj = snap.val(); }); // Listen for DJ changes
                fireRef.child('jackpot').on('value', function(snap) { $scope.jackpot = snap.val(); }); // Listen for jackpot changes
                fireRef.child('eventLog').endAt().limit(15).on('child_added',function(snap) { $scope.eventLog.push(snap.val()); $scope.eventLog = $scope.eventLog.slice(Math.max($scope.eventLog.length - 15, 0)); purgeEventLog(); });
                $timeout(function(){});
            });
        }
        if($scope.videoSelection) {
            $scope.voteTimeLeft = Math.max(0,parseInt((Videos.getVoteEnd() - FireService.getServerTime())/1000));
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

Application.Filters.filter('capitalize', function() {
    return function(input) {
        if(!input) { return ''; }
        var words = input.split(' '), result = '';
        for(var i = 0; i < words.length; i++) {
            result += words[i].substring(0,1).toUpperCase()+words[i].substring(1);
            result += i == words.length - 1 ? '' : ' ';
        }
        return result;
    }
})
    .filter('timeUnits', function() {
    return function(input,exact) {
        if(!input) { return 0; }
        var now = new Date().getTime();
        var seconds = Math.floor((now-input)/1000);
        if(seconds < 60 && exact) { return seconds; } // seconds
        if(seconds < 60) { return 0; } // less than a min
        if(seconds < 3600) { return Math.floor(seconds/60); } // minutes
        if(seconds < 86400) { return Math.floor(seconds/3600); } // hours
        else { return Math.floor(seconds/86400); } // days
    }
})
    .filter('timeUnitsLabel', function() {
    return function(input,exact) {
        if(!input) { return ''; }
        var now = new Date().getTime();
        var seconds = Math.floor((now-input)/1000);
        if(seconds < 60 && exact) { return seconds > 1 ? 'seconds' : 'second'; } // seconds
        if(seconds < 60) { return 'minutes'; } // less than a min
        if(seconds < 3600) { return seconds > 119 ? 'minutes' : 'minute'; } // minutes
        if(seconds < 86400) { return seconds > 7199 ? 'hours' : 'hour'; } // hours
        else { return seconds > 172799 ? 'days' : 'day'; } // days
    }
}).filter('reverse', function() {
    return function(items) {
        if(!items) return items;
        return items.slice().reverse();
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