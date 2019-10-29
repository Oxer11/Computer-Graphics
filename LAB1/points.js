'use strict'

var VSHADER_SOURCE =
    `attribute vec4 a_Position;
    attribute float a_PointSize;

        void main() {
            gl_Position = a_Position;
            gl_PointSize = a_PointSize;
        }
    `;

var FSHADER_SOURCE =
    `precision mediump float;
        uniform vec4 u_FragColor;
        uniform float u_Cycle;

        void main() {
            if (u_Cycle < 0.5)
                gl_FragColor = u_FragColor;
            else {
              float d = distance(gl_PointCoord, vec2(0.5, 0.5));
              if (d < 0.5) {
                gl_FragColor = u_FragColor;
              }
              else { discard; }
            }
        }
    `;

function main() {
    var canvas = document.getElementById('webgl');

    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    if (a_PointSize < 0) {
        console.log('Failed to get the storage location of a_PointSize');
        return;
    }

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    var u_Cycle = gl.getUniformLocation(gl.program, 'u_Cycle');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_Cycle');
        return;
    }

    canvas.onmousedown = function(ev){ click(ev, gl, canvas, a_Position, a_PointSize, u_FragColor, u_Cycle) };

    gl.clearColor(0.0, 0.0, 0.0, 0.3);

    gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_points = [];
var g_type = [];
var leftClicks = [];
var rightClicks = [];

function click(ev, gl, canvas, a_Position, a_PointSize, u_FragColor, u_Cycle) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    g_points.push([x, y]);
    g_type.push(ev.button);

    if (ev.button == 0) {
        console.log("Left Mouse Click!");
        leftClicks.push([x, y]);
    }
    else if (ev.button == 2) {
        console.log("Right Mouse Click!");
        rightClicks.push([x, y]);
    }
    else return;

    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_points.length;
    for(var i = 0; i < len; i++) {
        var xy = g_points[i];
        var type = g_type[i];

        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        if (type == 0) {
            gl.vertexAttrib1f(a_PointSize, 20.0);
            gl.uniform4fv(u_FragColor, [1.0, 0.0, 0.0, 1.0]);
            gl.uniform1f(u_Cycle, 1.0);
        }
        else if (type == 2) {
            gl.vertexAttrib1f(a_PointSize, 10.0);
            gl.uniform4fv(u_FragColor, [0.0, 0.0, 1.0, 1.0]);
            gl.uniform1f(u_Cycle, 0.0);
        }

        gl.drawArrays(gl.POINTS, 0, 1);
    }
}
