'use strict';

var avatars = { headphones: ['Headphones',0], wheelchair: ['Wheelchair',6000], 'plus-square': ['Medkit',5000], ambulance: ['Ambulance',8000], windows: ['Windows',3000], twitter: ['Twitter',6000], twitch: ['Twitch',6000], 'steam-square': ['Steam',10000], soundcloud: ['SoundCloud',8000], reddit: ['Reddit',8000], linux: ['Linux',10000], 'github-alt': ['GitHub Cat',15000], 'facebook-square': ['Facebook', 3000], apple: ['Apple',5000], android: ['Android',8000], backward: ['Rewind',8000], eject: ['Eject',12000], forward: ['Forward',8000], pause: ['Pause',15000], play: ['Play',20000], 'play-circle': ['Play Circle',20000], 'youtube-play': ['YouTube',10000], 'hand-o-right': ['Pointer',15000], 'chevron-right': ['Chevron',10000], 'chevron-circle-right': ['Chevron Circle',10000], arrows: ['Arrows',8000], 'arrow-right': ['Arrow',15000], undo: ['Undo',10000], repeat: ['Repeat',10000], th: ['Grid',8000], scissors: ['Scissors',8000], save: ['Floppy',15000], font: ['A',8000], jpy: ['Yen',15000], usd: ['Dollar',15000], gbp: ['Pounds',15000], 'circle-o': ['Circle',8000], 'dot-circle-o': ['Dot Circle',9000], cog: ['Gear',15000], refresh: ['Refresh',15000], 'volume-up': ['Speaker',20000], wrench: ['Wrench',4000], warning: ['Warning',10000], 'unlock-alt': ['Lock',5000], umbrella: ['Umbrella',6000], truck: ['Truck',10000], trophy: ['Trophy',8000], 'thumbs-o-up': ['Thumbs Up',10000], star: ['Star',18000], 'soccer-ball-o': ['Soccer Ball',8000], 'smile-o': ['Smile',18000], sliders: ['Sliders',18000], signal: ['Signal',12000], shield: ['Shield',8000], search: ['Magnifying',5000], rss: ['RSS',3000], rocket: ['Rocket',4000], 'power-off': ['Power',15000], paw: ['Paw',15000], music: ['Music',20000], 'moon-o': ['Moon',5000], 'meh-o': ['Meh',8000], heart: ['Heart',12000], 'frown-o': ['Frown',8000], flask: ['Flask',6000], bolt: ['Lightning',8000], eye: ['Eye',15000], cube: ['Cube',8000], child: ['Child',18000], check: ['Check',5000], camera: ['Camera',10000], bug: ['Bug',15000] };
var avatarColors = {
    normal: ['Normal','D8DBCD',0], jukeGreen: ['Juke Green','B5D053',7000], red: ['Red','D05353',5000],
    orange: ['Orange','D09553',6000], kudoGreen: ['Kudo Green','53D055',5000], teal: ['Teal','53D097',6000],
    babyBlue: ['Baby Blue','53D0D0',6000], justBlue: ['Just Blue','5389D0',5000], purple: ['Purple','7C53D0',5000],
    hotPink: ['Hot Pink','D053B7',6000], yellow: ['Yellow','E4E253',7000], cherryRed: ['Cherry Red','F23D3D',8000],
    limeGreen: ['Lime Green','86F23D',8000], icyBlue: ['Icy Blue','83F7F3',8000], 
    babyPink: ['Baby Pink','FC9EEC',8000], shadyGray: ['Shady Gray','A5A5A5',9000], 
    pureWhite: ['Pure White','FFFFFF',250000], zero: ['Zero Black','000000',500000]
};

Application.Directives.directive('avatarShop',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/avatarshop/avatarshop.html',
        replace: true,
        scope: {},
        controller: function($rootScope,$scope,AvatarShop,Global,ControlButtons) {
            $scope.control = ControlButtons.addControl('avatarShop','Avatar Shop',false,false);
            $scope.shop = AvatarShop.init();
            $scope.getKudos = Global.getKudos;
            $scope.getUser = Global.getUser;
            $scope.hasAvatar = Global.hasAvatar;
            $scope.hasAvatarColor = Global.hasAvatarColor;
            $scope.buyEquip = AvatarShop.buyEquip;
        },
        link: function(scope,element,attrs) {
            
        }
    }
});

Application.Services.factory('AvatarShop',function(Global,FireService) {
    var shop;
    return {
        buyEquip: function(type,item) {
            var defaultItem = type == 'avatar' ? 'headphones' : 'normal';
            if(item == defaultItem) { Global.setUserProperty('avatar',null); return; }
            if(item == defaultItem || Global[type == 'avatar' ? 'hasAvatar' : 'hasAvatarColor'](item)) {
                Global.setUserProperty(type,item); return;
            }
            var cost = shop[type+'s'][item][type == 'avatar' ? 1 : 2];
            if(!Global.getUser().kudos || Global.getUser().kudos < cost) { return; }
            Global.changeKudos(cost*-1);
            Global.setUserProperty(type+'s/'+item,true);
            Global.setUserProperty(type,item);
            FireService.sendEvent(Global.getName(),
                'just bought the <strong>'+shop[type+'s'][item][0]+
                '</strong> avatar'+(type == 'avatar' ? '' : ' color')+'!');
        },
        init: function() { shop = { avatars: avatars, avatarColors: avatarColors }; return shop; },
        avatars: avatars, avatarColors: avatarColors
    };
});