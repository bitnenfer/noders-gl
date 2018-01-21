window.run = function _stub (evt) {};

window.FPS = {
    startTime : 0,
    frameNumber : 0,
    getFPS : function()
    {
        var d = Date.now();
        var currentTime = (d - this.startTime) / 1000;
        var result = Math.floor(++this.frameNumber / currentTime);
        if(currentTime > 1)
        {
            this.startTime = new Date.now();
            this.frameNumber = 0;
        }
        return result;
    }
};

function startApp(models)
{
    if (location.hash === '#clear') localStorage.clear();

    const msView = document.getElementById('ms-view');
    const msViewAvg = document.getElementById('ms-view-avg');
    const audio = new Audio('data/media/skr.mp3');
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaElementSource(audio);
    const audioAnalyser = audioContext.createAnalyser();
    const gui = new dat.GUI({closed: true, closeOnTop: true});
    const shaderFolder = gui.addFolder('Shader');
    const modelFolder = gui.addFolder('Model');
    const lightFolder = gui.addFolder('Material');
    const lightDir = gui.addFolder('Light Direction');
    const textureFolder = gui.addFolder('Texture');
    const bgFolder = gui.addFolder('Background');
    const fileLoader = new FileLoader();
    const errorOutput = document.getElementById('error-output');
    const renderer = new NGL.Renderer({ canvas: document.getElementById('canvas'), depth: true, antialias: true });
    const testVertexBuffer = new NGL.VertexBuffer({
        renderer: renderer,
        data: new Float32Array(1000)
    });
    const postVertexBuffer = new NGL.VertexBuffer({
        renderer: renderer,
        data: new Float32Array([
            -1, 1, -1, -7, 7, 1
        ])
    });
    const postProcessTarget = new  NGL.RenderTarget({
        renderer: renderer,
        width: 512,
        height: 512,
        useDepthStencil: true
    });
    let fftTexture = null;
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
    let postProcessPipeline = null;
    let noiseTexture = null;
    const modelBuffers = [];
    const textures = [];
    const modelQuat = quat.create();
    const modelRotMat = mat4.create();
    const model = mat4.create();
    const view = mat4.create();
    const invModel = mat4.create();
    const viewPos = vec3.create();
    const invView = mat4.create();
    const invModelView = mat4.create();
    const projection = mat4.create();
    const camera = new OrbitalCameraControl(view, 5, renderer.canvas);
    const guiDataJSON = localStorage.getItem('guiData');
    const guiData = /*guiDataJSON ? JSON.parse(guiDataJSON) :*/ {
        color: [49,59,78],
        diffuse: [128, 128, 128],
        ambient: [51, 51, 51],
        specular: [255, 255, 255],
        shininess: 256,
        direction: {x: 0.5, y: 0.5, z: 0.5},
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
                'Serapis': 4
            }
        },
        texture: {
            texture: 0,
            texture1: 0,
            list: {
                'Checker': 0,
                'Marble': 1,
                'Rock Diff.': 2,
                'Rock Norm.': 3
            }
        },
        fontSize: 15,
        theme: 'vs-dark',
        shaders: {
            postprocess: false,
            shader: 0,
            currentShader: 0,
            list: [ 
                { vert: null, frag: null },
                { vert: null, frag: null },
                { vert: null, frag: null },
                { vert: null, frag: null },
                { vert: null, frag: null },
                { vert: null, frag: null },
                { vert: null, frag: null },
                { vert: null, frag: null },
                { vert: null, frag: null },
                { vert: null, frag: null }
            ],
            names: {
                'Simple': 0,
                '3D Projection': 1,
                'Texture': 2,
                'Diffuse Shading': 3,
                'Blinn-Phong Shading': 4,
                'Blinn-Phong + Texture Shading': 5
            }
        },
        media: {
            play: false
        }
    };
    let lastTime = 0;

    guiData.media.play = false;
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

    window.goFullScreen = function ()
    {

    };


    bgFolder.addColor(guiData, 'color');
    lightFolder.addColor(guiData, 'diffuse');
    lightFolder.addColor(guiData, 'ambient');
    lightFolder.addColor(guiData, 'specular');
    lightFolder.add(guiData, 'shininess').min(16).max(1024);
    lightDir.add(guiData.direction, 'x').step(0.01);
    lightDir.add(guiData.direction, 'y').step(0.01);
    lightDir.add(guiData.direction, 'z').step(0.01);


    shaderFolder.add(guiData.shaders, 'shader', guiData.shaders.names).onFinishChange(function (value) { window.run(); });
    shaderFolder.add(guiData.shaders, 'postprocess').onFinishChange(function (value) { 
        if(!value) 
        {
            document.getElementById('post-tab').style.visibility = 'hidden';
            if (models.editor.getModel() === models.post)
            {
                models.editor.setModel(models.frag); 
                models.editor.focus(); 
                document.getElementById('frag-tab').className = 'tab active';
                document.getElementById('vert-tab').className = 'tab';
                document.getElementById('post-tab').className = 'tab';
            }
        } 
        else document.getElementById('post-tab').style.visibility = 'visible';
        window.run(); 
    });

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

    textureFolder.add(guiData.texture, 'texture', guiData.texture.list).onFinishChange(function () {localStorage.setItem('guiData', JSON.stringify(guiData));});

    models.editor.updateOptions({fontSize: guiData.fontSize});
    models.monaco.editor.setTheme(guiData.theme);

    mat4.perspective(projection, Math.PI / 3, renderer.getAspectRatio(), 0.01, 1000.0);

    renderer.enableOutputState(NGL.OutputState.DEPTH_STATE);

    fileLoader.addText('cube', 'data/meshes/cube.obj');
    fileLoader.addText('sphere', 'data/meshes/sphere.obj');
    fileLoader.addText('suzanne', 'data/meshes/suzanne.obj');
    fileLoader.addText('teapot', 'data/meshes/teapot.obj');
    fileLoader.addText('torus', 'data/meshes/serapis.obj');

    fileLoader.addImage('basic', 'data/textures/texture.png');
    fileLoader.addImage('marble', 'data/textures/marble.jpg');
    fileLoader.addImage('rock-diffuse', 'data/textures/rocks_01_dif.jpg');
    fileLoader.addImage('rock-normal', 'data/textures/rocks_01_nm.jpg');
    fileLoader.addImage('noise', 'data/textures/noise.jpg');

    // shaders
    fileLoader.addText('simple_shader.frag', 'data/shaders/simple_shader.frag');
    fileLoader.addText('simple_shader.vert', 'data/shaders/simple_shader.vert');
    fileLoader.addText('mvp_shader.frag', 'data/shaders/mvp_shader.frag');
    fileLoader.addText('mvp_shader.vert', 'data/shaders/mvp_shader.vert');
    fileLoader.addText('texture_shader.frag', 'data/shaders/texture_shader.frag');
    fileLoader.addText('texture_shader.vert', 'data/shaders/texture_shader.vert');
    fileLoader.addText('diffuse_shader.frag', 'data/shaders/diffuse_shader.frag');
    fileLoader.addText('diffuse_shader.vert', 'data/shaders/diffuse_shader.vert');
    fileLoader.addText('blinn_phong_shader.frag', 'data/shaders/blinn_phong_shader.frag');
    fileLoader.addText('blinn_phong_shader.vert', 'data/shaders/blinn_phong_shader.vert');
    fileLoader.addText('blinn_phong_texture_shader.frag', 'data/shaders/blinn_phong_texture_shader.frag');
    fileLoader.addText('blinn_phong_texture_shader.vert', 'data/shaders/blinn_phong_texture_shader.vert');
    fileLoader.addText('nodemo.frag', 'data/shaders/nodemo.frag');
    fileLoader.addText('nodemo.vert', 'data/shaders/nodemo.vert');
    fileLoader.addText('postprocess_shader.frag', 'data/shaders/postprocess_shader.frag');
    fileLoader.addText('postprocess_shader.vert', 'data/shaders/postprocess_shader.vert');

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
            source: fileLoader.getImage('marble')
        });

        textures[2] = new NGL.Texture2D({
            renderer: renderer,
            source: fileLoader.getImage('rock-diffuse')
        });
    
        textures[3] = new NGL.Texture2D({
            renderer: renderer,
            source: fileLoader.getImage('rock-normal')
        });

        fftTexture = new NGL.Texture2D({
            renderer: renderer,
            width: 32,
            height: 1,
            source: null
        });

        noiseTexture = new NGL.Texture2D({
            renderer: renderer,
            source: fileLoader.getImage('noise')
        });

        guiData.shaders.list[0].vert = guiData.shaders.list[0].vert ? guiData.shaders.list[0].vert : fileLoader.getText('simple_shader.vert');
        guiData.shaders.list[0].frag = guiData.shaders.list[0].frag ? guiData.shaders.list[0].frag : fileLoader.getText('simple_shader.frag');
        guiData.shaders.list[1].vert = guiData.shaders.list[1].vert ? guiData.shaders.list[1].vert : fileLoader.getText('mvp_shader.vert');
        guiData.shaders.list[1].frag = guiData.shaders.list[1].frag ? guiData.shaders.list[1].frag : fileLoader.getText('mvp_shader.frag');
        guiData.shaders.list[2].vert = guiData.shaders.list[2].vert ? guiData.shaders.list[2].vert : fileLoader.getText('texture_shader.vert');
        guiData.shaders.list[2].frag = guiData.shaders.list[2].frag ? guiData.shaders.list[2].frag : fileLoader.getText('texture_shader.frag');
        guiData.shaders.list[3].vert = guiData.shaders.list[3].vert ? guiData.shaders.list[3].vert : fileLoader.getText('diffuse_shader.vert');
        guiData.shaders.list[3].frag = guiData.shaders.list[3].frag ? guiData.shaders.list[3].frag : fileLoader.getText('diffuse_shader.frag');
        guiData.shaders.list[4].vert = guiData.shaders.list[4].vert ? guiData.shaders.list[4].vert : fileLoader.getText('blinn_phong_shader.vert');
        guiData.shaders.list[4].frag = guiData.shaders.list[4].frag ? guiData.shaders.list[4].frag : fileLoader.getText('blinn_phong_shader.frag');
        guiData.shaders.list[5].vert = guiData.shaders.list[5].vert ? guiData.shaders.list[5].vert : fileLoader.getText('blinn_phong_texture_shader.vert');
        guiData.shaders.list[5].frag = guiData.shaders.list[5].frag ? guiData.shaders.list[5].frag : fileLoader.getText('blinn_phong_texture_shader.frag');
        guiData.shaders.list[6].vert = guiData.shaders.list[6].vert ? guiData.shaders.list[6].vert : fileLoader.getText('postprocess_shader.vert');
        guiData.shaders.list[6].frag = guiData.shaders.list[6].frag ? guiData.shaders.list[6].frag : fileLoader.getText('postprocess_shader.frag');

        models.vert.setValue(guiData.shaders.list[guiData.shaders.shader].vert);
        models.frag.setValue(guiData.shaders.list[guiData.shaders.shader].frag);
        models.post.setValue(guiData.shaders.list[6].frag);

        window.run();

        requestAnimationFrame(renderScene);
    });

    // Setup Audio Analyser
    audioSource.connect(audioContext.destination);
    // Set the size of the fast fourier transform 
    audioAnalyser.fftSize = 256;
    audioSource.connect(audioAnalyser);
    audio.loop = true;

    const mediaFolder = gui.addFolder('Media');

    mediaFolder.add(guiData.media, 'play').onFinishChange(function (value) { value ? audio.play() : audio.pause(); });

    let avgTime = 0.0;
    let frameCount = 0;

    function renderScene(frameTime)
    {
        const deltaTime = frameTime - lastTime;
        lastTime = frameTime;

        frameCount += 1;
        avgTime += deltaTime;

        if (pipeline.isValid)
        {
            if (guiData.media.play)
            {
                const audioData = new Uint8Array(audioAnalyser.frequencyBinCount);
                audioAnalyser.getByteFrequencyData(audioData);
                fftTexture.updateSubData(audioData, 0, 0, 32, 1);
            }

            quat.identity(modelQuat);
            quat.rotateX(modelQuat, modelQuat, guiData.model.rotation.x);
            quat.rotateY(modelQuat, modelQuat, guiData.model.rotation.y);
            quat.rotateZ(modelQuat, modelQuat, guiData.model.rotation.z);
            mat4.fromQuat(modelRotMat, modelQuat);
            mat4.identity(model);
            mat4.mul(model, model, modelRotMat);
            mat4.scale(model, model, [guiData.model.scale.x, guiData.model.scale.y, guiData.model.scale.z]);
            mat4.translate(model, model, [guiData.model.translate.x, guiData.model.translate.y, guiData.model.translate.z]);

            mat4.mul(invModelView, view, model);
            mat4.invert(invModelView, invModelView);
            mat4.transpose(invModelView, invModelView);

            mat4.getTranslation(viewPos, invModelView);

            mat4.invert(invModel, model);
            mat4.invert(invView, view);
            mat4.transpose(invView, invView);
            mat4.transpose(invModel, invModel);

            pipeline.setUniform('uModel', NGL.UniformType.MATRIX_4, false, model);
            pipeline.setUniform('uInvModel', NGL.UniformType.MATRIX_4, false, invModel);
            pipeline.setUniform('uInvModelView', NGL.UniformType.MATRIX_4, false, invModelView);
            pipeline.setUniform('uView', NGL.UniformType.MATRIX_4, false, view);
            pipeline.setUniform('uInvView', NGL.UniformType.MATRIX_4, false, invView);
            pipeline.setUniform('uProjection', NGL.UniformType.MATRIX_4, false, projection);
            pipeline.setUniform('uTime', NGL.UniformType.FLOAT_1, frameTime * 0.001);
            pipeline.setUniform('uSampler', NGL.UniformType.INT_1, 0);
            pipeline.setUniform('uFFT', NGL.UniformType.INT_1, 1);
            pipeline.setUniform('uDiffuse', NGL.UniformType.FLOAT_3, guiData.diffuse[0] / 255, guiData.diffuse[1] / 255, guiData.diffuse[2] / 255);
            pipeline.setUniform('uAmbient', NGL.UniformType.FLOAT_3, guiData.ambient[0] / 255, guiData.ambient[1] / 255, guiData.ambient[2] / 255);
            pipeline.setUniform('uSpecular', NGL.UniformType.FLOAT_3, guiData.specular[0] / 255, guiData.specular[1] / 255, guiData.specular[2] / 255);
            pipeline.setUniform('uShininess', NGL.UniformType.FLOAT_1, guiData.shininess);
            pipeline.setUniform('uResolution', NGL.UniformType.FLOAT_2, renderer.canvas.width, renderer.canvas.height);
            pipeline.setUniform('uLightDir', NGL.UniformType.FLOAT_3, guiData.direction.x, guiData.direction.y, guiData.direction.z);
            pipeline.setUniform('uCameraPos', NGL.UniformType.FLOAT_VECTOR_3, viewPos);
            pipeline.setUniform('uNoise', NGL.UniformType.INT_1, 2);

            renderer.setTexture2D(textures[guiData.texture.texture], 0);
            renderer.setTexture2D(fftTexture, 1);
            renderer.setTexture2D(noiseTexture, 2);

            if (!guiData.shaders.postprocess || (postProcessPipeline !== null && !postProcessPipeline.isValid))
            {
                renderer.beginPass(modelBuffers[guiData.model.model].vertexBuffer, pipeline);
                renderer.setClearColor(guiData.color[0] / 255.0, guiData.color[1] / 255.0, guiData.color[2] / 255.0, 1.0);
                renderer.clearTarget(NGL.ClearTarget.ALL);
                renderer.draw(0, modelBuffers[guiData.model.model].vertexCount);
                renderer.endPass();
            }
            else
            {
                renderer.beginPass(modelBuffers[guiData.model.model].vertexBuffer, pipeline, postProcessTarget);
                renderer.setClearColor(guiData.color[0] / 255.0, guiData.color[1] / 255.0, guiData.color[2] / 255.0, 1.0);
                renderer.clearTarget(NGL.ClearTarget.ALL);
                renderer.draw(0, modelBuffers[guiData.model.model].vertexCount);
                renderer.endPass();

                postProcessPipeline.setUniform('uTime', NGL.UniformType.FLOAT_1, frameTime * 0.001);
                postProcessPipeline.setUniform('uResolution', NGL.UniformType.FLOAT_2, renderer.canvas.width, renderer.canvas.height);
                postProcessPipeline.setUniform('uSampler', NGL.UniformType.INT_1, 0);
                postProcessPipeline.setUniform('uFFT', NGL.UniformType.INT_1, 1);
                postProcessPipeline.setUniform('uNoise', NGL.UniformType.INT_1, 2);
                postProcessPipeline.setUniform('uRT', NGL.UniformType.INT_1, 3);

                renderer.setTexture2D(postProcessTarget.texture, 3);

                renderer.beginPass(postVertexBuffer, postProcessPipeline);
                renderer.setClearColor(guiData.color[0] / 255.0, guiData.color[1] / 255.0, guiData.color[2] / 255.0, 1.0);
                renderer.clearTarget(NGL.ClearTarget.ALL);
                renderer.draw(0, 3);
                renderer.endPass();
            }

        }

        camera.update();
        requestAnimationFrame(renderScene);
        msView.innerHTML = 'frame time: ' + deltaTime.toFixed(2) + 'ms';
        if (frameCount > 100)
        {
            msViewAvg.innerHTML = 'avg.: ' + (avgTime / frameCount).toFixed(2) + 'ms';
            frameCount = 0;
            avgTime = 0;
        }

    }

    window.reset = function()
    {
        localStorage.clear();
        location.reload();
    };

    window.run = function (evt)
    {
        errorOutput.innerHTML = 'no error';
        
        renderer.gl.activeTexture(renderer.gl.TEXTURE0);
        renderer.gl.bindTexture(renderer.gl.TEXTURE_2D, textures[0].texture);

        guiData.shaders.list[guiData.shaders.currentShader].vert = models.vert.getValue();
        guiData.shaders.list[guiData.shaders.currentShader].frag = models.frag.getValue();
        guiData.shaders.list[6].frag = models.post.getValue();

        if (guiData.shaders.currentShader !== guiData.shaders.shader)
        {
            models.vert.setValue(guiData.shaders.list[guiData.shaders.shader].vert);
            models.frag.setValue(guiData.shaders.list[guiData.shaders.shader].frag);
            guiData.shaders.currentShader = guiData.shaders.shader;
        }

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
            testVertexBuffer.bind();
            pipeline.bind();
            renderer.gl.drawArrays(renderer.gl.TRIANGLES, 0, 3);
            const end = performance.now();
            const total = end - start;

            errorOutput.innerHTML = 'Compilation Time: ' + total.toFixed(2) + 'ms';
            errorOutput.className = 'noerror';

            renderer.lastPipeline = null;
        }

        if (guiData.shaders.postprocess)
        {
            if (postProcessPipeline === null)
            {
                postProcessPipeline = new NGL.Pipeline({
                    renderer: renderer,
                    vertexSize: Float32Array.BYTES_PER_ELEMENT * 2,
                    vertShader: fileLoader.getText('postprocess_shader.vert'),
                    fragShader: models.post.getValue(),
                    attributes:  {
                        'inPosition': {
                            size: 2,
                            type: NGL.AttribType.FLOAT,
                            offset: Float32Array.BYTES_PER_ELEMENT * 0
                        }
                    }
                });
            }
            else
            {
                postProcessPipeline.recompile({
                    renderer: renderer,
                    vertexSize: Float32Array.BYTES_PER_ELEMENT * 2,
                    vertShader: fileLoader.getText('postprocess_shader.vert'),
                    fragShader: models.post.getValue(),
                    attributes:  {
                        'inPosition': {
                            size: 2,
                            type: NGL.AttribType.FLOAT,
                            offset: Float32Array.BYTES_PER_ELEMENT * 0
                        }
                    }
                });
            }

            if (postProcessPipeline.errorLog.length > 0)
            {
                if (errorOutput.className !== 'goterror')
                {
                    errorOutput.innerHTML = 'Post-Process Shader Error:\n' + postProcessPipeline.errorLog.join('\n');
                    errorOutput.className = 'goterror';
                }
                else
                {
                    errorOutput.innerHTML += '\nPost-Process Shader Error:\n' + postProcessPipeline.errorLog.join('\n');
                }
            }
        }

        localStorage.setItem('guiData', JSON.stringify(guiData));

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
    editorGUI.add(guiData, 'fontSize').onChange(function (value) {
        models.editor.updateOptions({fontSize: value});
        localStorage.setItem('guiData', JSON.stringify(guiData));
    });
    editorGUI.add(guiData, 'theme', ['vs-dark', 'vs']).onChange(function (value) {
        models.monaco.editor.setTheme(value);
        localStorage.setItem('guiData', JSON.stringify(guiData));
    });

    const fullscreen = {
        fullscreen: function ()
        {
            console.log('fullscreen!');
            if (renderer.canvas.requestFullscreen) renderer.canvas.requestFullscreen()
            else if (renderer.canvas.webkitRequestFullscreen) renderer.canvas.webkitRequestFullscreen();
            else if (renderer.canvas.mozRequestFullscreen) renderer.canvas.mozRequestFullscreen();
        }
    };

    editorGUI.add(fullscreen, 'fullscreen');
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

