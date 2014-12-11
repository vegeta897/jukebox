'use strict';
Application.Directives.directive('videos',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/videos/videos.html',
        replace: true,
        scope: {},
        controller: function($timeout,$rootScope,$scope,Videos,FireService,Global,User) {
            $rootScope.$on('playerReady',function() {
                FireService.onValue('selection',function(newSelection) {
                    $scope.videoSelection = Videos.changeSelection(newSelection);
                });
                FireService.onValue('playing',function(newVideo) {
                    $scope.playing = Videos.changeVideo(newVideo);
                    $timeout(function(){});
                });
                FireService.onValue('voting',Videos.setVoteEnd);
            });
            $scope.vote = Videos.vote;
            $scope.getPlaying = Videos.getPlaying;
            $scope.getUsername = User.getName;
            $scope.isAuthed = User.isAuthed;
            $scope.getDJ = Global.getDJ;
            $scope.getVoteTimeLeft = function() {
                return Math.max(0,parseInt((Videos.getVoteEnd() - FireService.getServerTime())/1000));
            };
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
                    User.changeKudos(newVideo.votes && newVideo.votes[User.getName()] ? 
                        2 : User.getVote() >= 0 ? 1 : 0);
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