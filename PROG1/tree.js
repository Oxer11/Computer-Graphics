// LookAtRotatedTriangles.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    `attribute vec4 a_Position;
    uniform mat4 u_mvxMatrix;
    void main() {
      gl_Position = u_mvxMatrix * a_Position;
    }`;

// Fragment shader program
var FSHADER_SOURCE =
    `#ifdef GL_ES
    precision mediump float;
    #endif
    uniform vec4 u_FragColor;
    void main() {
      gl_FragColor = u_FragColor;
    }`;

var is_top_view = 1;
var left_Clicks = [];
var right_Clicks = [];
var verticesl = new Float32Array(tree(4, [0.0, 0.0, 0.0], new Matrix4(), 0.4 / (1 << 4)));
var verticesr = new Float32Array(tree(6, [0.0, 0.0, 0.0], new Matrix4(), 0.5 / (1 << 6)));

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

    gl.clearColor(0.0, 0.0, 0.0, 0.3);

    gl.clear(gl.COLOR_BUFFER_BIT);

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    var u_mvxMatrix = gl.getUniformLocation(gl.program, 'u_mvxMatrix');
    if(!u_mvxMatrix) {
        console.log('Failed to get the storage location of u_mvxMatrix');
        return;
    }

    canvas.onmousedown = function(ev){ click(ev, gl, canvas, u_mvxMatrix, u_FragColor) };

    var checkbox = document.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function () {
        is_top_view ^= 1;
        draw(gl, u_mvxMatrix, u_FragColor);
    });
}

function initVertexBuffers(gl, is_right) {
    var vertices = is_right ? new Float32Array(verticesr) : new Float32Array(verticesl);
    var n = vertices.length / 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(a_Position);

    return n;
}

function click(ev, gl, canvas, u_mvxMatrix, u_FragColor) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    if (ev.button == 0) {
        console.log('Left Click at ' + [x, y]);
        left_Clicks.push([x, y]);
    }
    else {
        right_Clicks.push([x, y]);
    }

    draw(gl, u_mvxMatrix, u_FragColor);
}

function draw(gl, u_mvxMatrix, u_FragColor) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let i = 0; i < left_Clicks.length; i++) {
        var n = initVertexBuffers(gl, false);
        if (n < 0) {
            console.log('Fail to initialize vertex buffer!');
            return -1;
        }

        var mvxMatrix = new Matrix4();
        mvxMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, -2.0, 2.0);
        mvxMatrix.translate(left_Clicks[i][0], left_Clicks[i][1], 0.0);
        if (is_top_view) mvxMatrix.lookAt(0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        else mvxMatrix.lookAt(0.0, -1.0, 0.75, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);
        gl.uniformMatrix4fv(u_mvxMatrix, false, mvxMatrix.elements);

        gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);

        gl.drawArrays(gl.LINES, 0, n);
    }

    for (let i = 0; i < right_Clicks.length; i++) {
        var n = initVertexBuffers(gl, true);
        if (n < 0) {
            console.log('Fail to initialize vertex buffer!');
            return -1;
        }

        var mvxMatrix = new Matrix4();
        mvxMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, -2.0, 2.0);
        mvxMatrix.translate(right_Clicks[i][0], right_Clicks[i][1], 0.0);
        if (is_top_view) mvxMatrix.lookAt(0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        else mvxMatrix.lookAt(0.0, -1.0, 0.75, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);
        gl.uniformMatrix4fv(u_mvxMatrix, false, mvxMatrix.elements);

        gl.uniform4f(u_FragColor, 0.0, 0.0, 1.0, 1.0);

        gl.drawArrays(gl.LINES, 0, n);
    }
}

function tree(iter, p, mat, len) {
    var vertices = [];
    vertices.push(p[0], p[1], p[2]);
    var t = mat.multiplyVector3(new Vector3([0.0, 0.0, 1.0])).elements;
    p[0] += len * t[0] * (1<<iter);
    p[1] += len * t[1] * (1<<iter);
    p[2] += len * t[2] * (1<<iter);
    vertices.push(p[0], p[1], p[2]);
    if (iter == 0) return vertices;

    var mat1 = new Matrix4(mat);
    var cur_p = [p[0], p[1], p[2]];
    vertices = vertices.concat(tree(iter-1, cur_p, mat1.rotate(45, 0.0, 1.0, 0.0), len));
    mat1 = new Matrix4(mat);
    cur_p = [p[0], p[1], p[2]];
    mat1.rotate(120, 0.0, 0.0, 1.0);
    vertices = vertices.concat(tree(iter-1, cur_p, mat1.rotate(45, 0.0, 1.0, 0.0), len));
    mat1 = new Matrix4(mat);
    cur_p = [p[0], p[1], p[2]];
    mat1.rotate(240, 0.0, 0.0, 1.0);
    vertices = vertices.concat(tree(iter-1, cur_p, mat1.rotate(45, 0.0, 1.0, 0.0), len));
    return vertices;
}
