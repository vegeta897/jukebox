'use strict';
Application.Services.factory('Renderer', function() {
    var c;
    
    var drawPoint = function(point) {
        if(point.x < 0 || point.y < 0 || point.x >= c.mainCanvas.width || point.y >= c.mainCanvas.height) return;
        c.main.fillStyle = 'rgba(50,255,25,1)';
        c.main.beginPath();
        c.main.arc(point.x, point.y, 2, 0, 2 * Math.PI, false);
        c.main.fill();
    };
    
    var project = function(coord,transMat) {
        var point = BABYLON.Vector3.TransformCoordinates(coord, transMat);
        var x = point.x * c.mainCanvas.width + c.mainCanvas.width / 2.0 >> 0;
        var y = -point.y * c.mainCanvas.height + c.mainCanvas.height / 2.0 >> 0;
        return (new BABYLON.Vector2(x, y));
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
                for(var v = 0; v < mesh.vertices.length; v++) {
                    var projectedPoint = project(mesh.vertices[v], transformMatrix);
                    drawPoint(projectedPoint);
                }
            }
        }
    }
});