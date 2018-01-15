window.compileShader = function _stub (evt) {};

function startApp(models)
{
    const fileLoader = new FileLoader();
    const errorOutput = document.getElementById('error-output');
    const renderer = new NGL.Renderer({ canvas: document.getElementById('canvas'), depth: true });
    const testVertexBuffer = new NGL.VertexBuffer({
        renderer: renderer,
        data: new Float32Array(1000)
    });
    let pipeline = new NGL.Pipeline({
        renderer: renderer,
        vertexSize: Float32Array.BYTES_PER_ELEMENT * 11,
        vertShader: models.vert.getValue(),
        fragShader: models.frag.getValue(),
        attributes:  {
            'inPosition': {
                size: 3,
                type: NGL.AttribType.FLOAT,
                offset: Float32Array.BYTES_PER_ELEMENT * 0
            },
            'inNormal': {
                size: 3,
                type: NGL.AttribType.FLOAT,
                offset: Float32Array.BYTES_PER_ELEMENT * 3
            },
            'inTexCoord': {
                size: 2,
                type: NGL.AttribType.FLOAT,
                offset: Float32Array.BYTES_PER_ELEMENT * 6
            },
            'inTangent': {
                size: 3,
                type: NGL.AttribType.FLOAT,
                offset: Float32Array.BYTES_PER_ELEMENT * 8
            },
        }
    });
    const modelBuffers = [];
    const textures = [];
    const model = mat4.create();
    const view = mat4.create();
    const projection = mat4.create();
    const camera = new OrbitalCameraControl(view, 5, renderer.canvas);
    let currentModel = 0;
    let currentBaseTexture = 0;
    let currentNormalTexture = 0;
    let lastTime = 0;

    mat4.perspective(projection, Math.PI / 3, renderer.getAspectRatio(), 0.01, 1000.0);

    renderer.enableOutputState(NGL.OutputState.DEPTH_STATE);

    fileLoader.addText('cube', 'data/meshes/cube.obj');
    fileLoader.addText('sphere', 'data/meshes/sphere.obj');
    fileLoader.addText('suzanne', 'data/meshes/suzanne.obj');
    fileLoader.addText('teapot', 'data/meshes/teapot.obj');
    fileLoader.addText('torus', 'data/meshes/torus.obj');

    fileLoader.addImage('basic', 'data/textures/texture.png');
    fileLoader.addImage('rock0-diffuse', 'data/textures/165.jpg');
    fileLoader.addImage('rock0-normal', 'data/textures/165_norm.jpg');
    fileLoader.addImage('grass-diffuse', 'data/textures/grass.jpg');
    fileLoader.addImage('grass-normal', 'data/textures/grass-normal.png');
    fileLoader.addImage('rock1-diffuse', 'data/textures/rocks_01_dif.jpg');
    fileLoader.addImage('rock1-normal', 'data/textures/rocks_01_nm.jpg');

    fileLoader.process(function run () {

        const cubeObj = ParseOBJ(fileLoader.getText('cube'));
        const sphereObj = ParseOBJ(fileLoader.getText('sphere'));
        const suzanneObj = ParseOBJ(fileLoader.getText('suzanne'));
        const teapotObj = ParseOBJ(fileLoader.getText('teapot'));
        const torusObj = ParseOBJ(fileLoader.getText('torus'));

        modelBuffers[0] = {
            vertexBuffer: new NGL.VertexBuffer({
                renderer: renderer,
                data: cubeObj.vertices
            }),
            vertexCount: cubeObj.vertex_count
        };

        modelBuffers[1] = {
            vertexBuffer: new NGL.VertexBuffer({
                renderer: renderer,
                data: sphereObj.vertices
            }),
            vertexCount: sphereObj.vertex_count
        };

        modelBuffers[2] = {
            vertexBuffer: new NGL.VertexBuffer({
                renderer: renderer,
                data: suzanneObj.vertices
            }),
            vertexCount: suzanneObj.vertex_count
        };

        modelBuffers[3] = {
            vertexBuffer: new NGL.VertexBuffer({
                renderer: renderer,
                data: teapotObj.vertices
            }),
            vertexCount: teapotObj.vertex_count
        };

        modelBuffers[4] = {
            vertexBuffer: new NGL.VertexBuffer({
                renderer: renderer,
                data: torusObj.vertices
            }),
            vertexCount: torusObj.vertex_count
        };

        textures[0] = new NGL.Texture2D({
            renderer: renderer,
            source: fileLoader.getImage('basic')
        });

        textures[1] = new NGL.Texture2D({
            renderer: renderer,
            source: fileLoader.getImage('rock0-diffuse')
        });

        textures[2] = new NGL.Texture2D({
            renderer: renderer,
            source: fileLoader.getImage('rock0-normal')
        });

        textures[3] = new NGL.Texture2D({
            renderer: renderer,
            source: fileLoader.getImage('grass-diffuse')
        });

        textures[4] = new NGL.Texture2D({
            renderer: renderer,
            source: fileLoader.getImage('grass-normal')
        });
        
        textures[5] = new NGL.Texture2D({
            renderer: renderer,
            source: fileLoader.getImage('rock1-diffuse')
        });
    
        textures[6] = new NGL.Texture2D({
            renderer: renderer,
            source: fileLoader.getImage('rock1-normal')
        });

        requestAnimationFrame(renderScene);
    });

    function renderScene(frameTime)
    {
        const deltaTime = frameTime - lastTime;
        lastTime = frameTime;

        if (pipeline.isValid)
        {
            pipeline.setUniform('uModel', NGL.UniformType.MATRIX_4, false, model);
            pipeline.setUniform('uView', NGL.UniformType.MATRIX_4, false, view);
            pipeline.setUniform('uProjection', NGL.UniformType.MATRIX_4, false, projection);
            pipeline.setUniform('uTime', NGL.UniformType.FLOAT_1, frameTime);
            pipeline.setUniform('uDeltaTime', NGL.UniformType.FLOAT_1, deltaTime);
            pipeline.setUniform('uSampler0', NGL.UniformType.INT_1, 0);
            pipeline.setUniform('uSampler1', NGL.UniformType.INT_1, 1);
            pipeline.setUniform('uResolution', NGL.UniformType.FLOAT_2, renderer.canvas.width, renderer.canvas.height);

            renderer.setTexture2D(textures[currentBaseTexture], 0);
            renderer.setTexture2D(textures[currentNormalTexture], 1);


            renderer.beginPass(modelBuffers[currentModel].vertexBuffer, pipeline);
            renderer.clearTarget(NGL.ClearTarget.ALL);
            renderer.draw(0, modelBuffers[currentModel].vertexCount);
            renderer.endPass();
        }

        camera.update();
        requestAnimationFrame(renderScene);
    }


    window.compileShader = function (evt)
    {
        errorOutput.innerHTML = 'no error';

        const start = performance.now();
        pipeline.recompile({
            vertexSize: Float32Array.BYTES_PER_ELEMENT * 11,
            vertShader: models.vert.getValue(),
            fragShader: models.frag.getValue(),
            attributes:  {
                'inPosition': {
                    size: 3,
                    type: NGL.AttribType.FLOAT,
                    offset: Float32Array.BYTES_PER_ELEMENT * 0
                },
                'inNormal': {
                    size: 3,
                    type: NGL.AttribType.FLOAT,
                    offset: Float32Array.BYTES_PER_ELEMENT * 3
                },
                'inTexCoord': {
                    size: 2,
                    type: NGL.AttribType.FLOAT,
                    offset: Float32Array.BYTES_PER_ELEMENT * 6
                },
                'inTangent': {
                    size: 3,
                    type: NGL.AttribType.FLOAT,
                    offset: Float32Array.BYTES_PER_ELEMENT * 8
                },
            }
        });


        if (pipeline.errorLog.length > 0)
        {
            errorOutput.innerHTML = pipeline.errorLog.join('\n');
        }
        else
        {
            //pipeline.bind();
            //testVertexBuffer.bind();
            //renderer.gl.drawArrays(renderer.gl.TRIANGLES, 0, 3);
            const end = performance.now();
            const total = end - start;

            errorOutput.innerHTML = 'Compilation Time: ' + total.toFixed(2) + 'ms';
        }
    };

    window.onModelSelection = function (evt)
    {
        currentModel = evt.selectedIndex;
    };

    window.onTexture0Selection = function (evt)
    {
        currentBaseTexture = evt.selectedIndex;
        renderer.setTexture2D(textures[currentBaseTexture], 0);
        renderer.textureDirty = true;
    };

    window.onTexture1Selection = function (evt)
    {
        currentNormalTexture = evt.selectedIndex;
        renderer.setTexture2D(textures[currentNormalTexture], 1);
        renderer.textureDirty = true;
    };

    window.onkeydown = function (evt)
    {
        if ((evt.ctrlKey && evt.code === 'KeyS'))
        {
            compileShader();
            return false;
        }
        return true;
    };
}

function ParseOBJ(text)
{
    function AppendUV(d)
    {
        var a = Array.prototype.slice.call(d);
        var b = [];
        var data = [];
        var str = '';
        for (var i = 0; i < a.length; i += 6)
        {
            var n = a.slice(i, i + 6);
            n.push(0, 0, 0, 0, 0);

            Array.prototype.push.apply(data, n);
        }
        return data;
    }

    var obj = objpar(text);
    var meshData = objpar_to_mesh(obj);

    if (meshData.texcoord)
        meshData.vertices = new Float32Array(meshData.vertices);
    else
        meshData.vertices = new Float32Array(AppendUV(meshData.vertices));

    return meshData;
}