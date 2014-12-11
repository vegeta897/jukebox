'use strict';
Application.Services.factory("API", function($http) {
    var serviceBase = 'php/';
    return {
        getVideos: function (count, currentID) {
            return $http.get(serviceBase + 'videos?count=' + count + '&current_id=' + currentID);
        },
        updateVideo: function (videoID, votes) {
            return $http.post(serviceBase + 'updateVideo', {video_id: videoID, votes: votes});
        },
        addVideo: function (videoIds, artist, track, addedBy) {
            return $http.post(serviceBase + 'addVideo', {
                video_ids: videoIds,
                artist: artist,
                track: track,
                added_by: addedBy
            }).then(function (results) {
                return results;
            });
        },
        deleteVideo: function (id) {
            return $http.delete(serviceBase + 'deleteVideo?id=' + id).then(function (status) {
                return status.data;
            });
        },
        pullUncurated: function (locked) {
            return $http.get(serviceBase + 'pullUncurated?locked=' + locked);
        },
        saveCurated: function (videos, curator) {
            return $http.post(serviceBase + 'saveCurated', {videos: videos, curator: curator});
        },
        getVideoCount: function () {
            return $http.get(serviceBase + 'getVideoCount');
        }
    };
});