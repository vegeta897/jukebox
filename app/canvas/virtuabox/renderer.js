'use strict';
Application.Services.factory('Renderer', function() {
    var c;
    
    var drawPoint = function(point,index) {
        if(point.x < 0 || point.y < 0 || point.x >= c.mainCanvas.width || point.y >= c.mainCanvas.height) return;
        c.main.fillStyle = 'rgba(100,255,50,1)';
        c.main.beginPath();
        c.main.arc(point.x, point.y, 2, 0, 2 * Math.PI, false);
        c.main.fill();
        c.main.fillStyle = 'rgba(255,255,255,1)';
        c.main.fillText(index,+point.x+6,point.y-10);
    };
    
    var drawFace = function(face) {
        var inFrame = false;
        for(var v = 0; v < face.length; v++) {
            var vt = face[v];
            if(vt.x >= 0 && vt.y >= 0 && vt.x < c.mainCanvas.width && vt.y < c.mainCanvas.height) {
                inFrame = true; break;
            }
        }
        if(!inFrame) return;
        c.main.lineWidth = 2; c.main.strokeStyle = 'rgba(50,255,25,1)'; c.main.miterLimit = 1;
        c.main.beginPath();
        c.main.moveTo(face[0].x, face[0].y);
        for(var dv = 1; dv < face.length; dv++) {
            c.main.lineTo(face[dv].x, face[dv].y);
        }
        c.main.closePath();
        c.main.stroke();
    };
    
    var project = function(coord, transMat) {
        var point = BABYLON.Vector3.TransformCoordinates(coord, transMat);
        var x = point.x * c.mainCanvas.width + c.mainCanvas.width / 2.0 >> 0;
        var y = -point.y * c.mainCanvas.height + c.mainCanvas.height / 2.0 >> 0;
        return (new BABYLON.Vector2(x, y));
    };
    
    var projectFace = function(face, verts, transMat) {
        var projected = [];
        for(var v = 0; v < face.length; v++) {
            projected.push(project(verts[face[v]],transMat));
        }
        return projected;
    };
    
    return {
        setCanvas: function(canvas) { c = canvas; },
        render: function(camera, meshes) {
            var viewMatrix = BABYLON.Matrix.LookAtLH(camera.position, camera.target, BABYLON.Vector3.Up());
            var projectionMatrix = 
                BABYLON.Matrix.PerspectiveFovLH(0.78, c.mainCanvas.width / c.mainCanvas.height, 0.01, 8.0);
            for(var i = 0; i < meshes.length; i++) {
                var mesh = meshes[i];
                var worldMatrix = 
                    BABYLON.Matrix.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z)
                        .multiply(BABYLON.Matrix.Translation(mesh.position.x, mesh.position.y, mesh.position.z));
                var transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);
                for(var f = 0; f < mesh.faces.length; f++) {
                    var projectedFace = projectFace(mesh.faces[f], mesh.vertices, transformMatrix);
                    drawFace(projectedFace);
                }
                //for(var v = 0; v < mesh.vertices.length; v++) {
                //    var projectedPoint = project(mesh.vertices[v], transformMatrix);
                //    drawPoint(projectedPoint,v);
                //}
            }
        }
    }
});