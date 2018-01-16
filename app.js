window.run = function _stub (evt) {};

function startApp(models)
{
    const gui = new dat.GUI({closed: true, closeOnTop: true});
    const modelFolder = gui.addFolder('Model');
    const lightFolder = gui.addFolder('Light');
    const textureFolder = gui.addFolder('Texture');
    const bgFolder = gui.addFolder('Background');
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
    const modelQuat = quat.create();
    const modelRotMat = mat4.create();
    const model = mat4.create();
    const view = mat4.create();
    const invModel = mat4.create();
    const invView = mat4.create();
    const projection = mat4.create();
    const camera = new OrbitalCameraControl(view, 5, renderer.canvas);
    const guiDataJSON = localStorage.getItem('guiData');
    const guiData = guiDataJSON ? JSON.parse(guiDataJSON) : {
        color: [138,227,255],
        diffuse: [128, 128, 128],
        ambient: [51, 51, 51],
        direction: {x: 0, y: 1.0, z: 0},
        model: {
            model: 0,
            translate: {x: 0, y: 0, z: 0},
            scale: {x: 1, y: 1, z: 1},
            rotation: {x: 0, y: 0, z: 0},
            list: {
                'Cube': 0,
                'Sphere': 1,
                'Blender Suzanne': 2,
                'Utha Teapot': 3,
                'Torus': 4
            }
        },
        texture: {
            texture0: 0,
            texture1: 0,
            list: {
                'Checker': 0,
                'Rock0 Diff.': 1,
                'Rock0 Norm.': 2,
                'Grass Diff.': 3,
                'Grass Norm.': 4,
                'Rock1 Diff.': 5,
                'Rock1 Norm.': 6
            }
        },
        fontSize: 15
    };
    let lastTime = 0;

    guiData.model.translate.x = 0;
    guiData.model.translate.y = 0;
    guiData.model.translate.z = 0;
    guiData.model.scale.x = 1;
    guiData.model.scale.y = 1;
    guiData.model.scale.z = 1;
    guiData.model.rotation.x = 0;
    guiData.model.rotation.y = 0;
    guiData.model.rotation.z = 0;

    window.resetTransform = function ()
    {
        guiData.model.translate.x = 0;
        guiData.model.translate.y = 0;
        guiData.model.translate.z = 0;
        guiData.model.scale.x = 1;
        guiData.model.scale.y = 1;
        guiData.model.scale.z = 1;
        guiData.model.rotation.x = 0;
        guiData.model.rotation.y = 0;
        guiData.model.rotation.z = 0;
    };


    bgFolder.addColor(guiData, 'color');
    lightFolder.addColor(guiData, 'diffuse');
    lightFolder.addColor(guiData, 'ambient');
    const lightDir = lightFolder.addFolder('Direction');
    lightDir.add(guiData.direction, 'x').step(0.01);
    lightDir.add(guiData.direction, 'y').step(0.01);
    lightDir.add(guiData.direction, 'z').step(0.01);

    modelFolder.add(guiData.model, 'model', guiData.model.list).onFinishChange(function () {localStorage.setItem('guiData', JSON.stringify(guiData));});
    modelFolder.add(window, 'resetTransform');
    const modelTranslateFolder = modelFolder.addFolder('Translate');
    const modelScaleFolder = modelFolder.addFolder('Scale');
    const modelRotateFolder = modelFolder.addFolder('Rotate');

    modelTranslateFolder.add(guiData.model.translate, 'x').step(0.1).listen();
    modelTranslateFolder.add(guiData.model.translate, 'y').step(0.1).listen();
    modelTranslateFolder.add(guiData.model.translate, 'z').step(0.1).listen();

    modelScaleFolder.add(guiData.model.scale, 'x').step(0.1).listen();
    modelScaleFolder.add(guiData.model.scale, 'y').step(0.1).listen();
    modelScaleFolder.add(guiData.model.scale, 'z').step(0.1).listen();

    modelRotateFolder.add(guiData.model.rotation, 'x').step(0.01).listen();
    modelRotateFolder.add(guiData.model.rotation, 'y').step(0.01).listen();
    modelRotateFolder.add(guiData.model.rotation, 'z').step(0.01).listen();

    textureFolder.add(guiData.texture, 'texture0', guiData.texture.list).onFinishChange(function () {localStorage.setItem('guiData', JSON.stringify(guiData));});
    textureFolder.add(guiData.texture, 'texture1', guiData.texture.list).onFinishChange(function () {localStorage.setItem('guiData', JSON.stringify(guiData));});

    models.editor.updateOptions({fontSize: guiData.fontSize});

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
            quat.identity(modelQuat);
            quat.rotateX(modelQuat, modelQuat, guiData.model.rotation.x);
            quat.rotateY(modelQuat, modelQuat, guiData.model.rotation.y);
            quat.rotateZ(modelQuat, modelQuat, guiData.model.rotation.z);
            mat4.fromQuat(modelRotMat, modelQuat);
            mat4.identity(model);
            mat4.mul(model, model, modelRotMat);
            mat4.scale(model, model, [guiData.model.scale.x, guiData.model.scale.y, guiData.model.scale.z]);
            mat4.translate(model, model, [guiData.model.translate.x, guiData.model.translate.y, guiData.model.translate.z]);

            mat4.invert(invModel, model);
            mat4.invert(invView, view);
            mat4.transpose(invView, invView);
            mat4.transpose(invModel, invModel);

            pipeline.setUniform('uModel', NGL.UniformType.MATRIX_4, false, model);
            pipeline.setUniform('uInvModel', NGL.UniformType.MATRIX_4, false, invModel);
            pipeline.setUniform('uView', NGL.UniformType.MATRIX_4, false, view);
            pipeline.setUniform('uInvView', NGL.UniformType.MATRIX_4, false, invView);
            pipeline.setUniform('uProjection', NGL.UniformType.MATRIX_4, false, projection);
            pipeline.setUniform('uTime', NGL.UniformType.FLOAT_1, frameTime * 0.001);
            pipeline.setUniform('uSampler0', NGL.UniformType.INT_1, 0);
            pipeline.setUniform('uSampler1', NGL.UniformType.INT_1, 1);
            pipeline.setUniform('uDiffuse', NGL.UniformType.FLOAT_3, guiData.diffuse[0] / 255, guiData.diffuse[1] / 255, guiData.diffuse[2] / 255);
            pipeline.setUniform('uAmbient', NGL.UniformType.FLOAT_3, guiData.ambient[0] / 255, guiData.ambient[1] / 255, guiData.ambient[2] / 255);
            pipeline.setUniform('uResolution', NGL.UniformType.FLOAT_2, renderer.canvas.width, renderer.canvas.height);
            pipeline.setUniform('uLightDir', NGL.UniformType.FLOAT_3, guiData.direction.x, guiData.direction.y, guiData.direction.z);

            renderer.setTexture2D(textures[guiData.texture.texture0], 0);
            renderer.setTexture2D(textures[guiData.texture.texture1], 1);

            renderer.beginPass(modelBuffers[guiData.model.model].vertexBuffer, pipeline);
            renderer.setClearColor(guiData.color[0] / 255.0, guiData.color[1] / 255.0, guiData.color[2] / 255.0, 1.0);
            renderer.clearTarget(NGL.ClearTarget.ALL);
            renderer.draw(0, modelBuffers[guiData.model.model].vertexCount);
            renderer.endPass();
        }

        camera.update();
        requestAnimationFrame(renderScene);
    }

    window.reset = function()
    {
        localStorage.clear();
        location.reload();
    };

    window.run = function (evt)
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
            errorOutput.className = 'goterror';
        }
        else
        {
            pipeline.bind();
            testVertexBuffer.bind();
            renderer.gl.drawArrays(renderer.gl.TRIANGLES, 0, 3);
            const end = performance.now();
            const total = end - start;

            errorOutput.innerHTML = 'Compilation Time: ' + total.toFixed(2) + 'ms';
            errorOutput.className = 'noerror';

            renderer.lastPipeline = null;
        }

        localStorage.setItem('guiData', JSON.stringify(guiData));

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
            run();
            return false;
        }
        return true;
    };

    const editorGUI = gui.addFolder('Editor');

    editorGUI.add(window, 'run');
    editorGUI.add(guiData, 'fontSize').onFinishChange(function (value) {
        models.editor.updateOptions({fontSize: value});
    });
    editorGUI.addFolder('Reset').add(window, 'reset');
    gui.closed = true;

    document.getElementById('shader-editor').onclick = function () {gui.closed = true;};
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

