'use strict';
Application.Services.factory('MeshBuilder', function() {

    var makeCube = function(x,y,z,w,h,d) { // Defunct
        w = w/2; h = h/2; d = d/2;
        var axes = { x1: +x - w, x2: +x + w, y1: +y - h, y2: +y + h, z1: +z - d, z2: +z + d };
        var xyz = ['x','y','z'];
        var polygons = [];
        for(var s = 1; s < 3; s++) {
            var o = s == 1 ? 2 : 1;
            for(var p = 0; p < 6; p++) {
                var poly = [[axes['x'+s], axes['y'+s], axes['z'+s]]];
                var alt = p/2 == Math.floor(p/2) ? s : o;
                for(var v = 0; v < 2; v++) {
                    var vert = [];
                    for(var ax = 0; ax < 3; ax++) {
                        var key = o;
                        if(ax == Math.floor(p/2)) { key = s; } else if(v == 1) {
                            key = alt; alt = alt == s ? o : s;
                        }
                        vert.push(axes[xyz[ax]+key]);
                    }
                    poly.push(vert);
                }
                polygons.push(poly);
            }
        }
        return polygons;
    };
    
    return {
        makeBox: function(x,y,z,w,h,d) {
            w = w/2; h = h/2; d = d/2;
            return {
                vertices: [
                    new BABYLON.Vector3(w,h,d), new BABYLON.Vector3(w,h,-d), new BABYLON.Vector3(w,-h,d),
                    new BABYLON.Vector3(w,-h,-d), new BABYLON.Vector3(-w,h,d), new BABYLON.Vector3(-w,h,-d),
                    new BABYLON.Vector3(-w,-h,d), new BABYLON.Vector3(-w,-h,-d)
                ],
                position: new BABYLON.Vector3(x,y,z),
                rotation: BABYLON.Vector3.Zero()
            }
        }
    }
});