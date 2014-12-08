'use strict';
Application.Services.factory('FireService',function() {
    var fireRef = new Firebase('https://jukebox897.firebaseio.com/box1');
    var localTimeOffset = 0;
    var localTimeRef = new Date().getTime();
    var timeStampID = 'stamp'+parseInt(Math.random()*10000);
    fireRef.child('timeStampTests/'+timeStampID).set(Firebase.ServerValue.TIMESTAMP,function(){
        fireRef.child('timeStampTests/'+timeStampID).once('value',function(snap){
            localTimeOffset = snap.val() - localTimeRef;
            console.log('local time offset:',localTimeOffset);
            fireRef.child('timeStampTests/'+timeStampID).remove();
            //setInterval(interval,500);
        })
    });
    var getServerTime = function() {
        return localTimeOffset ? new Date().getTime() + localTimeOffset : new Date().getTime();
    };
    
    return {
        set: function(path, value) {
            fireRef.child(path).set(value);
        },
        remove: function(path) {
            fireRef.child(path).remove();
        },
        update: function(path, properties) {
            fireRef.child(path).update(properties);
        },
        transact: function(path, amount) {
            fireRef.child(path).transaction(function(orig) {
                return !orig || +orig + +amount == 0 ? null : +orig + +amount
            });
        },
        syncVariable: function(path, variable) {
            fireRef.child(path).on('value',function(snap) { variable = snap.val(); })
        },
        once: function(path, callback) {
            fireRef.child(path).once('value', function(snap) { callback(snap.val()); });
        },
        onValue: function(path, handler) {
            fireRef.child(path).on('value',function(snap) { handler(snap.val()); });
        },
        sendEvent: function(user,text) {
            if(!user || !text) return;
            fireRef.child('eventLog').push({ user: user, text: text, time: getServerTime() });
        },
        removeOnQuit: function(path) {
            fireRef.child(path).onDisconnect().remove();
        },
        getServerTime: getServerTime
    };
});