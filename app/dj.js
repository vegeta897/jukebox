'use strict';
Application.Services.factory('DJ',function($rootScope,FireService,Videos,Util,API,User,Message) {
    var selfDJ, videoTimeout, voting, gettingVideos;
    
    $rootScope.$on('interval',function() {
        if(!selfDJ || gettingVideos) return;
        var playing = Videos.getPlaying();
        var selection = Videos.getSelection();
        if(!playing && !voting) { console.log('nothing playing, get list');
            if(!selection) { getVideos(); return; }
            console.log('nothing playing, have list, voting ends in 10 seconds');
            videoTimeout = setTimeout(playVideo, 10000); // Voting for 10 seconds
            FireService.set('voting',FireService.getServerTime() + 10000);
            voting = true;
        }
        var elapsed = parseInt((FireService.getServerTime() - playing.startTime) / 1000);
        if (elapsed > playing.duration.totalSec && !voting) { // Video expired
            console.log('video expired');
            if(!selection) getVideos();
            voting = true;
            videoTimeout = setTimeout(playVideo, 15000); // Voting for 15 seconds
            FireService.set('voting',FireService.getServerTime() + 15000);
        }
        if (elapsed + 90 > playing.duration.totalSec && !voting) {
            console.log('video close to ending or ended');
            if(!selection) getVideos();
            // Voting for 89 seconds
            videoTimeout = setTimeout(playVideo, Math.min(playing.duration.totalSec*1000,90000)-1000); 
            FireService.set('voting',
                FireService.getServerTime() + Math.min(playing.duration.totalSec*1000,90000));
            voting = true;
        } else if (!voting) { // Video not expired or close to being over, remove selection list
            FireService.remove('selection');
        }
    });
    
    var getVideos = function() {
        FireService.remove('votes');
        gettingVideos = true;
        var currentID = Videos.getPlaying() ? Videos.getPlaying().video_id : 'abc';
        console.log('retrieving videos');
        API.getVideos(6,currentID).then(function(data) {
            console.log('Videos retrieved',data.data);
            if(!data || !data.data || data.data.length != 6) {
                Message.set({ type:'error',
                    text:'Error retrieving videos. You can probably blame my hosting service.' }); 
                return;
            }
            for(var d = 0, dl = data.data.length; d < dl; d++) {
                data.data[d].duration = Util.parseUTCtime(data.data[d].duration);
                data.data[d].index = d;
            }
            FireService.set('selection',angular.copy(data.data));
            gettingVideos = false;
        });
    };

    var playVideo = function() { // Tally votes and pick the video with the most
        var selection = Videos.getSelection();
        if(!selection) return;
        var winner = Util.randomIntRange(0,selection.length-1);
        FireService.once('votes', function(votes) {
            winner = votes ? Util.pickInObject(votes) : winner;
            console.log('winner chosen:',winner);
            var play = selection[winner];
            play.startTime = FireService.getServerTime();
            FireService.set('playing',angular.copy(play));
            FireService.transact('users/'+play.added_by+'/kudos',5);
            FireService.remove('selection');
            FireService.remove('votes');
            FireService.remove('canvas');
            voting = false;
            API.updateVideo(play.video_id,Util.countProperties(play.votes,false));
        });
    };
    
    return {
        becomeDJ: function() {
            if(!User.getName()) return;
            selfDJ = true;
            FireService.set('dj',User.getName());
            FireService.removeOnQuit('dj');
            FireService.remove('timeStampTests'); // Cleanup
            FireService.once('eventLog',function(purged) {
                if(!purged) return;
                for(var key in purged) { if(!purged.hasOwnProperty(key)) continue;
                    if(purged[key].time > FireService.getServerTime() - 3600000) continue;
                    FireService.remove('eventLog/'+key);
                }
            });
        },
        forceVote: function() {
            if(!Videos.getSelection()) getVideos();
            voting = true;
            videoTimeout = setTimeout(playVideo, 15000); // Voting for 15 seconds
            FireService.set('voting',FireService.getServerTime() + 15000);
        }
    };
});