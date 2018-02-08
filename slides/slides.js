const urlData = ParseHash(location.hash);
const loader = new FileLoader();
const totalSlideCount = 30;
const slideCount = 29;
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');
const slideTextures = [];
const transTextures = [];
const slideWidth = 960;
const slideHeight = 540;
let fullscreenOn = false;
let currentSlide = ('slide' in urlData ? Math.min(urlData.slide, slideCount-1) : 0);
let currentTrans = 0;
let nextSlide = currentSlide + 1;
let prevSlide = 0;
let loadedSlides = Math.min(currentSlide + 4, totalSlideCount);
let time = 0.0;
let swapSlide = false;
let scroll = 0.0;


gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

for (let index = 0; index < loadedSlides; ++index)
{
    loader.addImage(index, 'data/textures/Slide' + (index + 1) + '.JPG');
}

loader.addImage('t0', 'data/textures/transitions/t0.jpg');

loader.addText('default.vert', 'data/shaders/default.vert');
loader.addText('default.frag', 'data/shaders/default.frag');

function HandleSlide(id)
{
    location.hash = '#slide=' + currentSlide;
    switch (id)
    {
        case 0: break;
        case 1: break;
        case 2: break;
        case 3: break;
        case 4: break;
        case 5: break;
        case 6: break;
        case 7: break;
        case 8: break;
        case 9: break;
        case 10: break;
        case 11: break;
        case 12: break;
        case 13: break;
        case 14: break;
        case 15: break;
        case 16: break;
        case 17: break;
        case 18: break;
        case 20: break;
        case 21: break;
        case 22: break;
        case 23: break;
        case 24: break;
        case 25: break;
        case 26: break;
    }
}

function LoadTexture(key, filter, wrap)
{
    const image = loader.getImage(key);
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
}

function SwapDone()
{
    if (loadedSlides < totalSlideCount)
    {
        loader.addImage(loadedSlides, 'data/textures/Slide' + (loadedSlides + 1) + '.JPG');
        loader.process(function (loader) {
            slideTextures.push(LoadTexture(loadedSlides, gl.LINEAR, gl.CLAMP_TO_EDGE));
            loadedSlides += 1;
            //currentSlide = nextSlide;
            //prevSlide = Math.max(currentSlide - 1, 0);
            //nextSlide = Math.min(currentSlide + 1, slideCount - 1);
            //swapSlide = false;
            //time = 0;
            //HandleSlide(currentSlide);
        });
    }
//    else
    {
        setTimeout(function () {
            currentSlide = nextSlide;
            prevSlide = Math.max(currentSlide - 1, 0);
            nextSlide = Math.min(currentSlide + 1, slideCount - 1);
            swapSlide = false;
            time = 0;
            HandleSlide(currentSlide);
        }, 0.1);
    }

}

function SetSlide(id)
{
    id = Math.min(id, slideCount - 1);

    if (id > currentSlide)
    {
        if (id < loadedSlides)
        {
            swapSlide = true;
            nextSlide = Math.min(id, slideCount);
        }
        else
        {
            for (let index = loadedSlides; index < id; ++index)
            {
                loader.addImage(index, 'data/textures/Slide' + (index + 1) + '.JPG');
            }
            
            loader.process(function (loader) {
                for (let index = loadedSlides; index < id; ++index)
                {
                    slideTextures.push(LoadTexture(index, gl.LINEAR, gl.CLAMP_TO_EDGE));
                }
                loadedSlides += id - loadedSlides;
                nextSlide = id;
                swapSlide = true;
            });
        }
    }
    else
    {
        currentSlide = Math.max(id, 0);
        prevSlide = Math.max(currentSlide - 1, 0);
        nextSlide = Math.min(currentSlide + 1, slideCount);
        HandleSlide(currentSlide);
    }
}

window.PrevSlide = function ()
{
    currentSlide = Math.max(currentSlide - 1, 0);
    prevSlide = Math.max(currentSlide - 1, 0);
    nextSlide = Math.min(currentSlide + 1, slideCount);
    HandleSlide(currentSlide);
};

window.NextSlide = function ()
{
    if (!swapSlide)
    {
        swapSlide = true;
    }
};

window.onkeyup = function (evt)
{
    if (evt.code === 'ArrowLeft')
    {
        PrevSlide();
    }
    else if (evt.code === 'ArrowRight' || evt.code === 'Space')
    {
        NextSlide();
    }
};

canvas.onmousedown = canvas.onpointerdown = NextSlide;

loader.process(function (loader) {
    const program = gl.createProgram();
    const vbo = gl.createBuffer();
    {
        const vs = gl.createShader(gl.VERTEX_SHADER); 
        const fs = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vs, loader.getText('default.vert'));
        gl.shaderSource(fs, loader.getText('default.frag'));
        gl.compileShader(vs);
        gl.compileShader(fs);
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, +1, 0, 0,
            -1, -1, 0, 1,
            +1, -1, 1, 1,
            -1, +1, 0, 0,
            +1, -1, 1, 1,
            +1, +1, 1, 0
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, 'inPosition'));
        gl.enableVertexAttribArray(gl.getAttribLocation(program, 'inTexCoord'));
        gl.vertexAttribPointer(gl.getAttribLocation(program, 'inPosition'), 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(gl.getAttribLocation(program, 'inTexCoord'), 2, gl.FLOAT, false, 16, 8);
    
        gl.uniform1i(gl.getUniformLocation(program, 'uTex0'), 0);
        gl.uniform1i(gl.getUniformLocation(program, 'uTex1'), 1);
        gl.uniform1i(gl.getUniformLocation(program, 'uTex2'), 2);

        for (let index = 0; index < loadedSlides; ++index)
        {
            slideTextures.push(LoadTexture(index, gl.LINEAR, gl.CLAMP_TO_EDGE));
        }

        transTextures.push(LoadTexture('t0', gl.LINEAR, gl.REPEAT));
    }

    gl.clearColor(0, 0, 0, 1);

    requestAnimationFrame(function render() {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, slideTextures[currentSlide]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, slideTextures[nextSlide]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, transTextures[currentTrans]);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (swapSlide && time < 1)
        {
            time += 0.05;
            if (time > 1.0)
            {
                time = 1;
                SwapDone();
            } 
        }
        gl.uniform1f(gl.getUniformLocation(program, 'uTime'), time);
        gl.uniform1f(gl.getUniformLocation(program, 'uScroll'), scroll);
        gl.uniform1i(gl.getUniformLocation(program, 'uSlide'), currentSlide);
        gl.uniform2f(gl.getUniformLocation(program, 'uResolution'), canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
        scroll += 0.01;
        
        const hashData = ParseHash(location.hash);
        
        if (hashData.slide)
        {
            SetSlide(hashData.slide);
        }

    });
});

function OnFullscreenChange(evt)
{
    if (fullscreenOn)
    {
        canvas.width = 960;
        canvas.height = 540;
        fullscreenOn = false;
    }
    else
    {
        fullscreenOn = true;
    }
}

canvas.onfullscreenchange = OnFullscreenChange;
canvas.onwebkitfullscreenchange = OnFullscreenChange;
canvas.onmozfullscreenchange = OnFullscreenChange;

window.GoFullscreen = function ()
{
    if (canvas.requestFullscreen) canvas.requestFullscreen()
    else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen();
    else if (canvas.mozRequestFullscreen) canvas.mozRequestFullscreen();

    const sx = window.innerWidth / slideWidth;
    const sy = window.innerHeight / slideHeight;
    const ms = Math.max(sx, sy);

    canvas.width = slideWidth * ms;
    canvas.height = slideHeight * ms;

}