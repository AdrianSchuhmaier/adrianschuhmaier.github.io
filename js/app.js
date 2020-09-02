var gl;
var background = {};
var itemShader = {};
var items = [];

var timer = { lastTime: 0.0, minTime: 50.0, paused: false, pause: function(){ this.paused = !this.paused; } };

var vs = 
    `precision mediump float;

    attribute vec2 position;

    void main()
    {
        gl_Position = vec4(position, 0.0, 1.0);
    }`;

var fsitem = 
    `precision mediump float;
    
    uniform vec2 bottomLeft;
    uniform vec2 topRight;

    uniform sampler2D image;

    vec2 localCoords(vec2 coord)
    {
        coord -= bottomLeft;
        coord /= topRight - bottomLeft;
        return coord;
    }
    
    void main()
    {
        vec2 uv = localCoords(gl_FragCoord.xy);
        vec2 st = vec2(uv.x, 1. - uv.y);

        vec2 qr = vec2(atan(uv.x, uv.y), length(uv));

        vec3 col = texture2D(image, st).rgb;
        float fac = smoothstep(0., .5, .5 - length(uv - vec2(.5)));
        gl_FragColor = vec4(col, fac);
    }`;

var fsbackground = 
    `precision mediump float;

    uniform float t;
    uniform vec2 dimensions;
    uniform vec3 lineProps; // left.x, left.y, length
    
    vec2 coordToUV(vec2 coord)
    {
        coord *= 2.0 / dimensions;
        coord -= 1.0;
        coord.y *= dimensions.y / dimensions.x;
        return coord;
    }

    float lenToUV(float length)
    {
        return length * 2.0 / dimensions.x;
    }

    vec3 hsv2rgb(vec3 c)
    {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main()
    {
        vec3 background = vec3(.1);
        vec2 uv = coordToUV(gl_FragCoord.xy);
        vec2 left = coordToUV(lineProps.xy);

        vec2 reflectedUV = vec2(abs(uv.x) -.5, uv.y + left.y);
        vec2 st = vec2(atan(reflectedUV.y, reflectedUV.x-.15), length(uv));

        vec3 up = vec3(0.89, 0.92, 1.0);
        vec3 down = vec3(0., 0.13, 0.4)*.3;

        background += vec3(0.01 / length(uv));
        gl_FragColor = vec4(mix(down, up, st.x/6.2831 +.5 - .2*st.y), 1.);
        //gl_FragColor = vec4(uv, .0, 1.);
    }
    `;


var InitWebGL = function() {
    var canvas = document.getElementById("background");
    gl = canvas.getContext("webgl");
    if (!gl) gl = canvas.getContext("experimental-webgl");

    ResizeWebGL();

    gl.clearColor(0.3, 0.3, 0.3, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    InitBackgroundShader();
    InitItemShader();

    InitItems();

    requestAnimationFrame(Render);
}


var Render = function(time) {
    requestAnimationFrame(Render);
    gl.canvas.style.transform = `translateX(${window.scrollX}px) translateY(${window.scrollY}px)`;

    var delta = time - timer.lastTime;
    if (timer.paused || timer.minTime > delta) return;
    timer.lastTime = time;


    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    RenderBackground(time * 0.001);
    
    gl.useProgram(itemShader.shaderProgram); 
    for (let item of items) {
        const rect = item.dom.getBoundingClientRect();
        const width  = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        const left   = rect.left;
        const bottom = gl.canvas.clientHeight - rect.bottom - 1;


        //console.log({width: width, height: height, left: left, bottom: bottom});
        
        gl.uniform2fv(itemShader.bottomLeftLocation, new Float32Array([left, bottom]));
        gl.uniform2fv(itemShader.topRightLocation, new Float32Array([left + width, bottom + height]));
        gl.viewport(left, bottom, width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

var RenderBackground = function(t) {
    gl.useProgram(background.shaderProgram);
    gl.uniform1f(background.timeLocation, t);
    gl.uniform2fv(background.dimensionsLocation, new Float32Array(background.dimensions));

    var rect = document.getElementById("divide").querySelector("h1").getBoundingClientRect();
    gl.uniform3fv(background.linePropsLocation, new Float32Array(
        [rect.left, rect.bottom/2 + rect.top/2, rect.left - rect.right]));

    gl.viewport(0, 0, background.dimensions[0], background.dimensions[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}





var InitItems = function() {
    var doms = document.getElementsByClassName("fancyimg");
    for (let dom of doms) {
        var item = {dom: dom};
        item.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, item.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
            dom.querySelector("img"));

        //gl.bindTexture(gl.TEXTURE_2D, null);
        items.push(item);
    }
}

var ResizeWebGL = function() {
    if (!gl) return;
    var canvas = document.getElementById("background");

    canvas.width = document.body.clientWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, document.body.clientWidth, window.innerHeight);
    
    background.dimensions = new Float32Array([document.body.clientWidth, window.innerHeight]);
}

var InitItemShader = function () {
    var itemVertexShader = gl.createShader(gl.VERTEX_SHADER);
    var itemFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(itemVertexShader, vs);
    gl.shaderSource(itemFragmentShader, fsitem);

    gl.compileShader(itemVertexShader);
    if (!gl.getShaderParameter(itemVertexShader, gl.COMPILE_STATUS)){
        console.log("error compiling vertex shader: " + gl.getShaderInfoLog(itemVertexShader));
        return;
    }

    gl.compileShader(itemFragmentShader);
    if (!gl.getShaderParameter(itemFragmentShader, gl.COMPILE_STATUS)){
        console.log("error compiling fragment shader: " + gl.getShaderInfoLog(itemFragmentShader));
        return;
    }

    itemShader.shaderProgram = gl.createProgram();
    gl.attachShader(itemShader.shaderProgram, itemVertexShader);
    gl.attachShader(itemShader.shaderProgram, itemFragmentShader);
    gl.linkProgram(itemShader.shaderProgram);
    
    var positionAttribLocation = gl.getAttribLocation(background.shaderProgram, "position");
    gl.vertexAttribPointer(positionAttribLocation,
        2, gl.FLOAT, gl.false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
        
    gl.enableVertexAttribArray(positionAttribLocation);

    // background quad
    var fullscreenVertices = [
        -1, -1,  1, -1,  -1, 1,
        -1, 1,  1, -1,  1, 1
    ];

    var fullscreenVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fullscreenVertices), gl.STATIC_DRAW);
        
    itemShader.bottomLeftLocation = gl.getUniformLocation(itemShader.shaderProgram, "bottomLeft");
    itemShader.topRightLocation = gl.getUniformLocation(itemShader.shaderProgram, "topRight");
}

var InitBackgroundShader = function() {
    // create Shaders
    var backgroundVertexShader = gl.createShader(gl.VERTEX_SHADER);
    var backgroundFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(backgroundVertexShader, vs);
    gl.shaderSource(backgroundFragmentShader, fsbackground);

    gl.compileShader(backgroundVertexShader);
    if (!gl.getShaderParameter(backgroundVertexShader, gl.COMPILE_STATUS)){
        console.log("error compiling vertex shader: " + gl.getShaderInfoLog(backgroundVertexShader));
        return;
    }

    gl.compileShader(backgroundFragmentShader);
    if (!gl.getShaderParameter(backgroundFragmentShader, gl.COMPILE_STATUS)){
        console.log("error compiling fragment shader: " + gl.getShaderInfoLog(backgroundFragmentShader));
        return;
    }

    background.shaderProgram = gl.createProgram();
    gl.attachShader(background.shaderProgram, backgroundVertexShader);
    gl.attachShader(background.shaderProgram, backgroundFragmentShader);
    gl.linkProgram(background.shaderProgram);

    var positionAttribLocation = gl.getAttribLocation(background.shaderProgram, "position");
    gl.vertexAttribPointer(positionAttribLocation,
        2, gl.FLOAT, gl.false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.enableVertexAttribArray(positionAttribLocation);

    var fullscreenVertices = [
        -1, -1,  1, -1,  -1, 1,
        -1, 1,  1, -1,  1, 1
    ];

    var fullscreenVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fullscreenVertices), gl.STATIC_DRAW);

    background.timeLocation = gl.getUniformLocation(background.shaderProgram, "t");
    background.dimensionsLocation = gl.getUniformLocation(background.shaderProgram, "dimensions");
    background.linePropsLocation = gl.getUniformLocation(background.shaderProgram, "lineProps");
}