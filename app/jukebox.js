'use strict';

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390', width: '640', events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange }
    });
}

function onPlayerReady(event) { }
var playing = false;
function onPlayerStateChange(event) {
    if(event.data == YT.PlayerState.PAUSED && playing) { player.playVideo(); }
    if (event.data == YT.PlayerState.PLAYING && !playing) { playing = true; player.setPlaybackQuality('large'); }
}
function stopVideo() { player.stopVideo(); }

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

var nouns = ['person','dude','bro','civilian','player','individual','guy','trooper','dancer','user','netizen','groupie','jammer','juker','jukester','jukeman','cyborg','savior','master','peon','knight','human','character','creature','spirit','soul','fellow','critter','friend','comrade','peer','client','fan','buddy','hero','pal','submitter','giver','contributor','philanthropist','giver','patron','guest','supporter'];
var adjectives = ['cool','awesome','super','excellent','great','good','wonderful','amazing','terrific','tremendous','extreme','formidable','thunderous','hip','jive','jazzing','jamming','rocking','grooving','immense','astonishing','beautiful','cute','impressive','magnificent','stunning','kawaii','pleasant','comforting','nice','friendly','lovely','charming','amiable','benevolent','helpful','constructive','cooperative','productive','supportive','valuable','useful','considerate','caring','serendipitous','neighborly','humble','lavish','elegant','glamorous'];
function buildSubject() {
    var adj = pickInArray(adjectives);
    return 'a' + (jQuery.inArray(adj[0],['a','e','i','o','u']) >= 0 ? 'n ' : ' ') + adj + ' ' + pickInArray(nouns);
}

function parseUTCtime(utc) { // Converts 'PT#M#S' to an object
    if(!utc || utc.hasOwnProperty('stamp')) return utc;
    var sec, min, stamp;
    if(utc.indexOf('S') >= 0 && utc.indexOf('M') >= 0) { // M and S
        sec = parseInt(utc.substring(utc.indexOf('M')+1,utc.indexOf('S')));
        min = parseInt(utc.substring(2,utc.indexOf('M')));
        stamp = utc.substring(2,utc.indexOf('S')).replace('M',':').split(':');
        stamp = stamp[0] + ':' + ( stamp[1].length > 1 ? stamp[1] : '0' + stamp[1] );
        return { totalSec: (min*60 + sec), min: min, sec: sec, stamp: stamp };
    } else if (utc.indexOf('S') >= 0 && utc.indexOf('M') < 0) { // Just S
        min = 0;
        sec = parseInt(utc.substring(utc.indexOf('T')+1,utc.indexOf('S')));
        stamp = '0:' + ((sec+'').length == 1 ? '0'+sec : sec);
        return { totalSec: (min*60 + sec), min: min, sec: sec, stamp: stamp };
    } else { // Just M
        min = parseInt(utc.substring(2,utc.indexOf('M')));
        sec = 0;
        stamp = min + ':00';
        return { totalSec: (min*60 + sec), min: min, sec: sec, stamp: stamp };
    }
}

function randomIntRange(min,max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function countProperties(obj,exception) { // Return number of properties an object has
    if(!obj) return 0; var count = 0; for(var key in obj) { if(!obj.hasOwnProperty(key) || key == exception) { continue; } count++; } return count; 
}
// Return a random element from input array
function pickInArray(array) { return array[Math.floor(Math.random()*array.length)]; }
function pickInObject(object) { // Return a random property from input object (attach name)
    var array = [];
    for(var key in object) { if(object.hasOwnProperty(key)) {
        var property = object[key]; array.push(property); } }
    return pickInArray(array);
}

function flip() { return Math.random() > 0.5; } // Flip a coin
function isInt(input) { return parseInt(input) === input; }

Application.Services.factory("services", ['$http', function($http) {
    var serviceBase = 'php/', obj = {};
    obj.getVideos = function(currentID){
        return $http.get(serviceBase + 'videos?current_id=' + currentID);
    };
    obj.updateVideo = function(videoID,votes){
        return $http.post(serviceBase + 'updateVideo', {video_id:videoID,votes:votes});
    };
    obj.addVideo = function (videoIds, artist, track, addedBy) {
        return $http.post(serviceBase + 'addVideo', {video_ids:videoIds,artist:artist,track:track,added_by:addedBy}).then(function (results) {
            return results;
        });
    };
    obj.deleteVideo = function (id) {
        return $http.delete(serviceBase + 'deleteVideo?id=' + id).then(function (status) {
            return status.data;
        });
    };
    obj.pullUncurated = function(){
        return $http.get(serviceBase + 'pullUncurated');
    };
    obj.saveCurated = function(videos,curator){
        return $http.post(serviceBase + 'saveCurated', {videos:videos,curator:curator});
    };
    return obj;
}]);

Application.Controllers.controller('Main', function($scope, $timeout, services, localStorageService) {
    console.log('Main controller initialized');
    
    var username = localStorageService.get('username');
    var passcode = localStorageService.get('passcode');
    var volume = localStorageService.get('volume');
    var fireRef = new Firebase('https://jukebox897.firebaseio.com/box1'), fireUser;
    var djRef = fireRef.child('dj');
    var init = false, localTimeOffset;
    var gettingVideos = false, voting, voteEnd, muted, myVote, videoTimeout;

    $scope.version = 0.31; $scope.versionName = 'Jukes of Hazzard'; $scope.needUpdate = false;
    $scope.initializing = true; $scope.thetime = new Date().getTime(); $scope.eventLog = [];
    $scope.username = username; $scope.passcode = passcode;
    $scope.controlList = [{name:'controlAddVideo',title:'Add Videos'},{name:'controlCurator',title:'Curator'},
        {name:'controlAddBounty',title:'Add Bounty'},{name:'controlTitleGamble',title:'Title Gamble'},
        {name:'controlAvatarShop',title:'Avatar Shop'},{name:'controlMumble',title:'Mumble'},{name:'controlChangelog',title:'Changelog'},
        {name:'controlAdmin',title:'Admin'}];
    $scope.bountyIndex = 0; $scope.titleGambleAmount = 1; $scope.bountyAmount = 1; $scope.avatars = avatars;
    $scope.countProperties = countProperties;

    function getServerTime() { return localTimeOffset ? new Date().getTime() + localTimeOffset : new Date().getTime(); }

    fireRef.parent().child('version').once('value', function(snap) {
        $scope.initializing = false;
        if($scope.version < snap.val()) {
            $scope.needUpdate = true;
        } else {
            fireRef.parent().child('version').on('value',function(snap){ $scope.needUpdate = snap.val() > $scope.version; });
            var localTimeRef = new Date().getTime();
            var timeStampID = 'stamp'+parseInt(Math.random()*10000);
            fireRef.child('timeStampTests/'+timeStampID).set(Firebase.ServerValue.TIMESTAMP,function(){
                fireRef.child('timeStampTests/'+timeStampID).once('value',function(snap){
                    localTimeOffset = snap.val() - localTimeRef;
                    console.log('local time offset:',localTimeOffset);
                    setInterval(interval,500);
                })
            });
        }
        $timeout(function(){});
    });
    
    var onVideoChange = function(snap) {
        if(snap.val() == null) { delete $scope.playing; return; }
        console.log('playing update',snap.val());
        if(!$scope.playing || snap.val().video_id != $scope.playing.video_id) { // If video changed, load it
            console.log('video changed');
            player.loadVideoById(snap.val().video_id);
            player.setPlaybackQuality('large');
        }
        $scope.playing = snap.val();
        if(!$scope.auth) return;
        var refundAmount = 0;
        if(parseInt($scope.playing.index) === myVote) {
            if(!$scope.playing.bounty || (+$scope.bountyIndex === +$scope.playing.index && $scope.bountySet)) {
                refundAmount = countProperties($scope.playing.votes,false) == 1 && $scope.bountySet ? $scope.bountyAmount : 0;
                fireUser.child('kudos').transaction(function(userKudos) {
                    return userKudos ? +userKudos + 2 + +refundAmount : 2 + +refundAmount;
                });
            } else {
                fireUser.child('kudos').transaction(function(userKudos) {
                    var reward = parseInt($scope.playing.bounty / Math.max(1,countProperties($scope.playing.votes,username)) + 2);
                    $scope.message = { type: 'success', text: 'The bounty was awarded to you!', kudos: reward };
                    return userKudos ? +userKudos + +reward : +reward ;
                });
            }
        } else if(myVote) {
            fireUser.child('kudos').transaction(function(userKudos) {
                return userKudos ? +userKudos + 1 : 1;
            });
        }
        if(+$scope.playing.index != +$scope.bountyIndex && $scope.bountySet) {
            refundAmount = $scope.bountySet ? $scope.bountyAmount : 0;
            fireUser.child('kudos').transaction(function(userKudos) {
                return userKudos ? +userKudos + +refundAmount : +refundAmount;
            });
        }
        $scope.message = refundAmount > 0 ? { type: 'default', text: 'Your bounty has been refunded.' } : $scope.message;
        $scope.bountyAmount = 1; $scope.bountyIndex = 0; delete $scope.bountySet;
        myVote = null;
    };
    
    var onSelectionChange = function(snap) {
        if(snap.val() == null) { delete $scope.videoSelection; $timeout(function(){}); return; }
        // If first video selection, or new video selection (not a vote or bounty change)
        if(!$scope.videoSelection || $scope.videoSelection[0].video_id != snap.val()[0].video_id) { 
            console.log('new video list');
            $scope.videoSelection = snap.val();
            if(!$scope.titleGambleSet || !$scope.titleGambleString) return;
            var won = false;
            var gambleString = $scope.titleGambleString+''; // Cast as string
            var gambleWinnings = Math.floor(+$scope.titleGambleAmount + ($scope.titleGambleAmount * $scope.titleGambleMulti));
            for(var i = 0, il = $scope.videoSelection.length; i < il; i++) {
                var theIndex = $scope.videoSelection[i].title.toUpperCase().indexOf(gambleString.toUpperCase());
                if(theIndex >= 0) {
                    $scope.videoSelection[i].title = $scope.videoSelection[i].title.substring(0,theIndex) + '<strong>' + 
                    $scope.videoSelection[i].title.substring(theIndex,theIndex+gambleString.length) + '</strong>' +
                    $scope.videoSelection[i].title.substring(theIndex+gambleString.length,$scope.videoSelection[i].title.length);
                    $scope.message = { type: 'success', text: 'String "<strong>'+gambleString+'</strong>" found in title "<strong>'+$scope.videoSelection[i].title+'</strong>"!',
                        kudos: gambleWinnings };
                    won = true;
                    sendEvent('<strong>'+username+'</strong> won <strong>'+(gambleWinnings-$scope.titleGambleAmount)+'</strong> kudos by betting '+$scope.titleGambleAmount+' on "'+gambleString+'"!');
                    fireUser.child('kudos').transaction(function(userKudos) {
                        return userKudos ? +userKudos + +gambleWinnings : +gambleWinnings;
                    });
                    fireRef.child('titleGamble/wins/'+gambleString).transaction(function(winCount) {
                        return winCount ? +winCount + 1 : 1;
                    });
                    break;
                }
            }
            if(!won) { 
                $scope.message = { type: 'default', text: 'Sorry, no titles contained "'+gambleString+'".' };
                sendEvent('<strong>'+username+'</strong> lost <strong>'+$scope.titleGambleAmount+'</strong> kudos by betting on "'+gambleString+'"!');
                fireRef.child('jackpot').transaction(function(jack) {
                    return jack ? +jack + +$scope.titleGambleAmount : +$scope.titleGambleAmount;
                });
            }
            $scope.bountyIndex = 0;
        } else { // Vote or bounty change
            for(var j = 0, jl = $scope.videoSelection.length; j < jl; j++) {
                if(snap.val()[j].bounty) { $scope.videoSelection[j].bounty = snap.val()[j].bounty; } else {
                    delete $scope.videoSelection[j].bounty;
                }
                if(snap.val()[j].votes) { $scope.videoSelection[j].votes = snap.val()[j].votes; } else {
                    delete $scope.videoSelection[j].votes;
                }
            }
        }
        $timeout(function(){});
        delete $scope.titleGambleSet; delete $scope.titleGambleString; $scope.titleGambleAmount = 1; $scope.controlTitleGamble = false;
    };
    
    var sendEvent = function(text) {
        fireRef.child('eventLog').push({ text: text, time: getServerTime() });
    };
    var purgeEventLog = function() {
        for(var il = $scope.eventLog.length-1, i = il; i >= 0; i--) { // Age and remove old events (locally)
            $scope.eventLog[i].age = getServerTime() - $scope.eventLog[i].time;
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
            localStorageService.set('username',username);
            localStorageService.set('passcode',passcode);
            fireUser = fireRef.child('users/'+username);
            fireUser.child('version').set($scope.version);
            fireUser.once('value',function(snap){ $scope.user = snap.val(); });
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
            jQuery.ajax({ // Get last 8 commits from github
                url: 'https://api.github.com/repos/vegeta897/jukebox/commits',
                dataType: 'jsonp',
                success: function(results) {
                    $scope.commits = [];
                    if(!results.data) { return; }
                    for(var i = 0; i < results.data.length; i++) {
                        $scope.commits.push({
                            message:results.data[i].commit.message,date:Date.parse(results.data[i].commit.committer.date)
                        });
                        if($scope.commits.length > 9) { break; }
                    }
                }
            });
        };
        username = $scope.username; passcode = $scope.passcode;
        console.log('Logging in',username);
        var auth = fireRef.getAuth();
        if(auth && auth.hasOwnProperty('expires') && auth.expires*1000 > getServerTime()) {
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

    $scope.vote = function(index) {
        if(!$scope.auth || !$scope.videoSelection) return;
        if(player.isMuted()) {
            $scope.message = { type: 'error', text: 'You can\'t vote while muted!' };
            return;
        }
        myVote = parseInt(index);
        fireRef.child('votes/'+username).set(index);
        for(var i = 0, il = $scope.videoSelection.length; i < il; i++) {
            fireRef.child('selection/'+i+'/votes/'+username).set(i == index ? true : null);
        }
    };

    $scope.becomeDJ = function() {
        $scope.dj = username;
        djRef.set(username);
        djRef.onDisconnect().remove();
        fireRef.child('timeStampTests').remove(); // Cleanup
        fireRef.child('eventLog').once('value',function(snap) { 
            if(!snap.val()) return;
            var purged = snap.val();
            console.log(purged);
            for(var key in purged) { if(!purged.hasOwnProperty(key)) continue;
                if(purged[key].time < getServerTime() - 3600000) fireRef.child('eventLog/'+key).remove();
            }
        });
    };
    
    $scope.listenerClasses = function(listener) { return 'fa fa-' + (listener.avatar ? listener.avatar : 'headphones') + (listener.muted ? ' muted' : ''); };
    
    $scope.closeMessage = function() { delete $scope.message; };
    
    $scope.showControl = function(control) {
        if($scope[control]) { $scope[control] = false; return; }
        for(var i = 0, il = $scope.controlList.length; i < il; i++) {
            $scope[$scope.controlList[i].name] = control == $scope.controlList[i].name;
        }
        $timeout(function(){ window.scrollTo(0,document.body.scrollHeight); }); // Scroll to bottom
        
        if(control == "controlTitleGamble" && !$scope.titleGambleSet) {
            fireRef.child('titleGamble/wins').once('value',function(snap) {
                $scope.titleGambleWins = snap.val() ? snap.val() : {};
            });
        }
    };
    $scope.controlEnabled = function(control) { return $scope[control]; };
    
    $scope.titleGamble = function() {
        $scope.titleGambleAmount = parseInt($scope.titleGambleAmount);
        if(!$scope.titleGambleAmount || $scope.titleGambleAmount < 0) { $scope.message = { type:'error',text:'That ain\'t no valid amount yo' }; return; }
        if(!$scope.user.kudos || $scope.titleGambleAmount > $scope.user.kudos) { $scope.message = { type:'error',text:'You only have <strong>'+$scope.user.kudos+'</strong> kudos!' }; return; }
        console.log('betting',$scope.titleGambleAmount,'kudos on title to include string "'+$scope.titleGambleString+'"');
        fireUser.child('kudos').transaction(function(userKudos) {
            return !userKudos ? 0 : userKudos-$scope.titleGambleAmount == 0 ? null : userKudos-$scope.titleGambleAmount;
        });
        $scope.controlTitleGamble = false;
        $scope.titleGambleSet = true;
        sendEvent('<strong>'+username+'</strong> made a <strong>'+$scope.titleGambleAmount+'</strong> kudo title bet!');
    };
    
    $scope.titleGambleCalcMulti = function() {
        if(!$scope.titleGambleString) return;
        $scope.titleGambleString = $scope.titleGambleString.trim(); // Remove leading and trailing spaces
        if($scope.titleGambleString.length < 2) { $scope.titleGambleMulti = null; return; }
        var multi = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 8, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000, 2500];
        var gambleReduction = $scope.titleGambleWins.hasOwnProperty($scope.titleGambleString) ? 1/($scope.titleGambleWins[$scope.titleGambleString]+1) : 1;
        $scope.titleGambleMulti = multi[$scope.titleGambleString.length-2] * gambleReduction;
        $timeout(function(){});
    };
    
    $scope.addBounty = function() {
        $scope.bountyAmount = parseInt($scope.bountyAmount);
        if(!$scope.bountyAmount || $scope.bountyAmount < 0) { $scope.message = { type:'error',text:'That ain\'t no valid amount yo' }; return; }
        if(!$scope.user.kudos || $scope.bountyAmount > $scope.user.kudos) { $scope.message = { type:'error',text:'You only have <strong>'+$scope.user.kudos+'</strong> kudos!' }; return; }
        console.log('adding',$scope.bountyAmount,'kudos to video #',$scope.videoSelection[+$scope.bountyIndex]);
        fireUser.child('kudos').transaction(function(userKudos) {
            return !userKudos ? 0 : userKudos-$scope.bountyAmount == 0 ? null : userKudos-$scope.bountyAmount; 
        });
        fireRef.child('selection/'+(+$scope.bountyIndex)+'/bounty').transaction(function(bounty) {
            return bounty ? parseInt(bounty) + $scope.bountyAmount : $scope.bountyAmount;
        });
        sendEvent('<strong>'+username+'</strong> placed a <strong>'+$scope.bountyAmount+'</strong> kudo bounty on "'+$scope.videoSelection[+$scope.bountyIndex].title+'"!');
        $scope.controlAddBounty = false; $scope.bountySet = true;
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
        $scope.add_artist = $scope.add_artist.trim(); $scope.add_track = $scope.add_track.trim();
        services.addVideo($scope.parsedIds, $scope.add_artist, $scope.add_track, username).then(function(results) {
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
                sendEvent('<strong>'+username+'</strong> just added ' + addQuantity + '! What ' + buildSubject() + '!');
                fireUser.child('kudos').transaction(function(userKudos) {
                    return userKudos ? +userKudos + +reward : reward;
                });
            }
        });
    };
    
    $scope.hasAvatar = function(avatar) { 
        return avatar == 'headphones' ? true : $scope.user && $scope.user.avatars ? $scope.user.avatars.hasOwnProperty(avatar) : false; 
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
        sendEvent('<strong>'+username+'</strong> just bought the <strong>'+$scope.avatars[avatar][0]+'</strong> avatar!');
    };
    
    $scope.beginCurator = function() {
        $scope.gettingUncurated = true;
        services.pullUncurated().then(function(data) {
            console.log('Videos retrieved to be curated',data.data);
            if(!data || !data.data || data.data.length != 10) {
                $scope.message = { type:'error',text:'Error retrieving videos. You can probably blame my hosting service.' }; return;
            }
            for(var d = 0, dl = data.data.length; d < dl; d++) {
                data.data[d].duration = parseUTCtime(data.data[d].duration);
                data.data[d].index = d;
            }
            $scope.gettingUncurated = false;
            $scope.curateList = data.data;
            $timeout(function(){});
        });
    };

    $scope.saveCurated = function() {
        $scope.savingCurated = true;
        services.saveCurated($scope.curateList, username).then(function(results) {
            console.log(results);
            $scope.savingCurated = false;
            if(!results.data || !results.data.data) {
                $scope.message = { type: 'error', text: 'Sorry, there was a server error. Tell Vegeta about it.' }; return;
            }
            $scope.message = { type: 'success', text: '<strong>Thank you</strong> for your help curating the database!' };
            var addQuantity = results.data.length == 1 ? 'a video' : results.data.length + ' videos';
            sendEvent('<strong>'+username+'</strong> just curated ' + addQuantity + '! What ' + buildSubject() + '!');
            delete $scope.curateList;
        });
    };

    $scope.forceVote = function() {
        getVideos();
        videoTimeout = setTimeout(playVideo, 15000); // Voting for 15 seconds
        fireRef.child('voting').set(getServerTime() + 15000);
    };
    
    $scope.requireVersion = function() { fireRef.parent().child('version').set($scope.version); }; // Set firebase version

    var playVideo = function() { // Tally votes and pick the video with the most
        if(!$scope.auth || $scope.dj != username || !$scope.videoSelection) return;
        var winner = 0;
        fireRef.child('votes').once('value', function(snap) {
            var snapped = angular.copy(snap.val());
            winner = snapped ? pickInObject(snapped) : randomIntRange(0,$scope.videoSelection.length-1);
            console.log('winner chosen:',winner);
            var play = $scope.videoSelection[winner];
            play.startTime = getServerTime();
            fireRef.child('playing').set(angular.copy(play));
            fireRef.child('users/'+play.added_by+'/kudos').transaction(function(userKudos) { // Give submitter 5 kudos
                return userKudos ? +userKudos + 5 : 5;
            });
            fireRef.child('selection').remove();
            voting = false;
            fireRef.child('votes').remove();
            services.updateVideo(play.video_id,countProperties(play.votes,false));
        });
    };

    var getVideos = function() {
        fireRef.child('votes').remove();
        voting = true;
        gettingVideos = true;
        // 30 seconds til end of video, get a new video list
        var currentID = $scope.playing ? $scope.playing.video_id : '';
        console.log('retrieving videos');
        services.getVideos(currentID).then(function(data) {
            console.log('Videos retrieved',data.data);
            if(!data || !data.data || data.data.length != 6) { 
                $scope.message = { type:'error',text:'Error retrieving videos. You can probably blame my hosting service.' }; return; 
            }
            for(var d = 0, dl = data.data.length; d < dl; d++) {
                data.data[d].duration = parseUTCtime(data.data[d].duration);
                data.data[d].index = d;
            }
            fireRef.child('selection').set(angular.copy(data.data));
            gettingVideos = false;
            $timeout(function(){});
        });
    };
    
    var everyThirtySeconds = 30;
    var interval = function() {
        if(!init && player && player.hasOwnProperty('loadVideoById')) {
            init = true; console.log('Jukebox initializing...');
            fireRef.once('value', function(snap) {
                $scope.playing = snap.val().playing;
                if($scope.playing) {
                    var startTime = parseInt((getServerTime()-$scope.playing.startTime)/1000);
                    console.log('starting video',startTime,'seconds in');
                    startTime = Math.max(0,startTime > $scope.playing.duration.totalSec ? 0 : startTime);
                    player.loadVideoById($scope.playing.video_id,startTime+2,'large'); // 2 sec head-start
                }
                if($scope.dj && !snap.val().users[$scope.dj].hasOwnProperty('connections')) {
                    $scope.dj = ''; fireRef.child('dj').remove();
                }
                fireRef.child('playing').on('value', onVideoChange); // Listen for video changes
                fireRef.child('selection').on('value', onSelectionChange); // Listen for selection changes
                fireRef.child('voting').on('value', function(snap) { voteEnd = snap.val() || 0; }); // Listen for vote changes
                fireRef.child('users').on('value', function(snap) { $scope.users = snap.val(); $scope.user = snap.val()[username]; }); // Listen for user changes
                fireRef.child('dj').on('value', function(snap) { $scope.dj = snap.val(); }); // Listen for DJ changes
                fireRef.child('jackpot').on('value', function(snap) { $scope.jackpot = snap.val(); }); // Listen for jackpot changes
                fireRef.child('eventLog').endAt().limit(15).on('child_added',function(snap) { $scope.eventLog.push(snap.val()); $scope.eventLog = $scope.eventLog.slice(Math.max($scope.eventLog.length - 15, 0)); purgeEventLog(); });
                $timeout(function(){});
            });
        }
        if($scope.videoSelection) {
            $scope.voteTimeLeft = Math.max(0,parseInt((voteEnd - getServerTime())/1000));
        }
        if(init && playing && $scope.playing) {
            if(muted != player.isMuted()) {
                muted = player.isMuted() ? true : false;
                if($scope.auth) fireUser.child('muted').set(muted);
            }
            if(parseInt(player.getVolume()) != volume) {
                volume = parseInt(player.getVolume()) || 0;
                if($scope.auth) fireUser.child('volume').set(volume);
                localStorageService.set('volume',volume);
            }
            if(!gettingVideos && $scope.dj && $scope.dj == username) { // If already getting videos, don't try again
                // DJ responsibilities
                var elapsed = parseInt((getServerTime() - $scope.playing.startTime) / 1000);
                if (elapsed + 90 > $scope.playing.duration.totalSec && !voting) {
                    console.log('video close to ending or ended');
                    getVideos();
                    videoTimeout = setTimeout(playVideo, Math.min($scope.playing.duration.totalSec*1000,90000)-1000); // Voting for 89 seconds
                    fireRef.child('voting').set(getServerTime() + Math.min($scope.playing.duration.totalSec*1000,90000));
                } else if (!voting) { // Video not expired or close to being over, remove selection list
                    fireRef.child('selection').remove();
                }
                if (elapsed > $scope.playing.duration.totalSec && !voting) { // Video expired
                    console.log('video expired');
                    fireRef.child('playing').remove();
                    getVideos();
                    videoTimeout = setTimeout(playVideo, 15000); // Voting for 15 seconds
                    fireRef.child('voting').set(getServerTime() + 15000);
                }
            }
        }
        if($scope.dj && $scope.dj == username && !$scope.playing && !$scope.videoSelection && !voting) {
            console.log('nothing playing, get list');
            getVideos(); // Get video list have none and nothing playing
        }
        if($scope.dj && $scope.dj == username && !$scope.playing && $scope.videoSelection && !voting) {
            console.log('nothing playing, have list, voting ends in 10 seconds');
            videoTimeout = setTimeout(playVideo, 10000); // Voting for 10 seconds
            fireRef.child('voting').set(getServerTime() + 10000);
            voting = true;
        }
        $scope.theTime = getServerTime();
        purgeEventLog();
        everyThirtySeconds += 0.5;
        if(everyThirtySeconds >= 30) {
            everyThirtySeconds = 0;
            jQuery.ajax({ 
                url: 'http://api.commandchannel.com/cvp.json?email=vegeta897@gmail.com&apiKey=4BC693B4-11FD-4E9E-8BA5-E3B39D5A04B9&callback=?',
                dataType: 'jsonp',
                success: function(results) {
                    if(results.name) {
                        $scope.mumble = { empty: true };
                        for(var i = 0, il = results.root.channels.length; i < il; i++) {
                            var channel = results.root.channels[i];
                            if(channel.users.length == 0) { continue; }
                            $scope.mumble.empty = false;
                            $scope.mumble[channel.name] = channel.users;
                        }
                    }
                }
            });
            
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
});