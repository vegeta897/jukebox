'use strict';
Application.Directives.directive('videos',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/videos/videos.html',
        replace: true,
        controller: function($rootScope,$scope,Videos,FireService,Player,User) {
            $rootScope.$on('playerReady',function() {
                FireService.onValue('selection',function(newSelection) {
                    $scope.videoSelection = Videos.changeSelection(newSelection);
                });
                FireService.onValue('playing',function(newVideo) {
                    $scope.playing = Videos.changeVideo(newVideo);
                });
                FireService.onValue('voting',Videos.setVoteEnd);
            });
            $scope.vote = Videos.vote;
            $scope.getUsername = function() { return User.getName(); }
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('Videos',function($rootScope,FireService,User,Player) {
    var videoList, playing, voteEnd;
    
    return {
        changeSelection: function(newList) {
            if(newList == null) { videoList = null; return null; }
            // If first video selection, or new video selection (not a vote or bounty change)
            if(!videoList || videoList[0].video_id != newList[0].video_id) {
                console.log('new video list');
                videoList = newList;
                $rootScope.$broadcast('newSelection');
                //if(!$scope.titleGambleSet || !$scope.titleGambleString) return;
                //var won = false;
                //var gambleString = ($scope.titleGambleString+'').toLowerCase(); // Cast as string, lowercase
                //var gambleWinnings = Math.floor(+$scope.titleGambleAmount + ($scope.titleGambleAmount * $scope.titleGambleMulti));
                //for(var i = 0, il = videoList.length; i < il; i++) {
                //    var theIndex = videoList[i].title.toUpperCase().indexOf(gambleString.toUpperCase());
                //    if(theIndex >= 0) {
                //        videoList[i].title = videoList[i].title.substring(0,theIndex) + '<strong>' +
                //        videoList[i].title.substring(theIndex,theIndex+gambleString.length) + '</strong>' +
                //        videoList[i].title.substring(theIndex+gambleString.length,videoList[i].title.length);
                //        $scope.message = { type: 'success', text: 'String "<strong>'+gambleString+'</strong>" found in title "<strong>'+videoList[i].title+'</strong>"!',
                //            kudos: gambleWinnings };
                //        won = true;
                //        sendEvent(username,'won <strong>'+(gambleWinnings-$scope.titleGambleAmount)+'</strong> kudos by betting '+$scope.titleGambleAmount+' on "'+gambleString+'"!');
                //        fireUser.child('kudos').transaction(function(userKudos) {
                //            return userKudos ? +userKudos + +gambleWinnings : +gambleWinnings;
                //        });
                //        fireRef.child('titleGamble/wins/'+gambleString).transaction(function(winCount) {
                //            return winCount ? +winCount + 1 : 1;
                //        });
                //        break;
                //    }
                //}
                //if(!won) {
                //    $scope.message = { type: 'default', text: 'Sorry, no titles contained "'+gambleString+'".' };
                //    sendEvent(username,'lost <strong>'+$scope.titleGambleAmount+'</strong> kudos by betting on "'+gambleString+'"!');
                //    fireRef.child('jackpot').transaction(function(jack) {
                //        return jack ? +jack + +$scope.titleGambleAmount : +$scope.titleGambleAmount;
                //    });
                //}
            } else { // Vote or bounty change
                for(var j = 0, jl = videoList.length; j < jl; j++) {
                    if(newList[j].bounty) { videoList[j].bounty = newList[j].bounty; } else {
                        delete videoList[j].bounty;
                    }
                    if(newList[j].votes) { videoList[j].votes = newList[j].votes; } else {
                        delete videoList[j].votes;
                    }
                }
            }
            return videoList;
            //delete $scope.titleGambleSet; delete $scope.titleGambleString; $scope.titleGambleAmount = 1; $scope.controlTitleGamble = false;
        },
        changeVideo: function(newVideo) {
            if(newVideo == null) { playing = null; return null; }
            console.log('playing update',newVideo);
            if(!playing || newVideo.video_id != playing.video_id) { // If video changed, load it
                $rootScope.$broadcast('newVideo');
                var startTime = playing ?  0 : parseInt((FireService.getServerTime()-newVideo.startTime)/1000);
                console.log('starting video',startTime,'seconds in');
                startTime = Math.max(0,startTime > newVideo.duration.totalSec ? 0 : startTime+2);
                Player.loadVideo(newVideo.video_id,startTime,'large');
                //Canvas.clear();
                if(User.getName()) {
                    User.changeKudos(newVideo.votes && newVideo.votes[User.getName()] ? 2 : User.getVote() >= 0 ? 1 : 0);
                }
            }
            playing = newVideo;
            return playing;
        },
        vote: function(index) {
            if(!User.getName() || !videoList) return;
            if(Player.isMuted()) { // Can't vote while muted
                return;
            }
            FireService.set('votes/'+User.getName(),index);
            FireService.set('users/'+User.getName()+'/vote',index);
            for(var i = 0, il = videoList.length; i < il; i++) {
                FireService.set('selection/'+i+'/votes/'+User.getName(),i == index ? true : null);
            }
        },
        modifyVideo: function(index,properties) { // Modify properties of a video in the list
            FireService.update('selection/'+index,videoList[index],properties);
        },
        getSelection: function() { return videoList ? videoList : false },
        getVideo: function(index) { return videoList ? videoList[index] : false; },
        getPlaying: function() { return playing ? playing : false },
        setVoteEnd: function(time) { voteEnd = time || 0; },
        getVoteEnd: function() { return voteEnd ? voteEnd : false }
    };
});