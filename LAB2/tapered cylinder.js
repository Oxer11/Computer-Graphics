// LookAtRotatedTriangles.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    `attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform vec3 u_LightColor;
    uniform vec3 u_LightDirection;
    uniform vec3 u_AmbientLight;
    varying vec4 v_Color;
    void main() {
      gl_Position = u_MvpMatrix * a_Position;
      vec3 normal = normalize(vec3(a_Normal));
      float nDotL = max(dot(u_LightDirection, normal), 0.0);
      vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;
      vec3 ambient = u_AmbientLight * a_Color.rgb;
      v_Color = vec4(diffuse + ambient, a_Color.a);
    }`;

// Fragment shader program
var FSHADER_SOURCE =
    `#ifdef GL_ES
    precision mediump float;
    #endif
    varying vec4 v_Color;
    void main() {
      gl_FragColor = v_Color;
    }`;

var is_top_view = 1;

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

    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    if (!u_MvpMatrix || !u_LightColor || !u_LightDirection　|| !u_AmbientLight) {
        console.log('Failed to get the storage location');
        return;
    }

    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    gl.uniform3f(u_LightDirection, 1.0, 1.0, 1.0);
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

    initArray();

    draw(gl, u_MvpMatrix);

    var checkbox = document.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function () {
        is_top_view ^= 1;
        draw(gl, u_MvpMatrix);
    });
}

function CrossProduct(x, y) {
    return [x[1]*y[2]-x[2]*y[1],
            x[2]*y[0]-x[0]*y[2],
            x[0]*y[1]-x[1]*y[0]];
}

var vertices = new Array(), colors = new Array(), normals = new Array();
var indices = new Array();

function initArray() {
    var v1 = [], v2 = new Array();
    for (let theta = 0; theta < 2 * Math.PI; theta += Math.PI/6) {
        v1.push([0.5 * Math.cos(theta), 0.5 * Math.sin(theta), 0]);
        v2.push([0.25 * Math.cos(theta), 0.25 * Math.sin(theta), 1]);
    }

    for (let i = 0; i < 24; i++) {
        let x, y, z;
        if (i&1) {
            y = v2[(i-1)/2];
            x = v2[(i+1)/2%12];
            z = v1[(i+1)/2%12];
        }
        else {
            x = v1[i/2];
            y = v1[(i/2+1)%12];
            z = v2[i/2];
        }
        vertices.push(x[0], x[1], x[2]);
        vertices.push(y[0], y[1], y[2]);
        vertices.push(z[0], z[1], z[2]);
        colors.push(1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
        let n = CrossProduct([y[0] - x[0], y[1] - x[1], y[2] - x[2]], [z[0] - x[0], z[1] - x[1], z[2] - x[2]]);
        console.log(n);
        normals.push(n[0], n[1], n[2], n[0], n[1], n[2], n[0], n[1], n[2]);
        indices.push(3*i, 3*i+1, 3*i+2);
    }
}

function initVertexBuffers(gl) {
    if (!initArrayBuffer(gl, 'a_Position', new Float32Array(vertices), 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', new Float32Array(colors), 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(normals), 3, gl.FLOAT)) return -1;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);

    gl.enableVertexAttribArray(a_attribute);

    return true;
}

function draw(gl, u_mvxMatrix) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    var mvxMatrix = new Matrix4();
    mvxMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, -2.0, 2.0);
    if (is_top_view) mvxMatrix.lookAt(0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    else mvxMatrix.lookAt(0.0, -1.0, 0.75, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);

    gl.uniformMatrix4fv(u_mvxMatrix, false, mvxMatrix.elements);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}
