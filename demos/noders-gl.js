(function (scope) {

    'use strict';
    const NGL = {
        ClearTarget: {
            ALL:            WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT | WebGLRenderingContext.STENCIL_BUFFER_BIT,
            COLOR:          WebGLRenderingContext.COLOR_BUFFER_BIT,
            DEPTH:          WebGLRenderingContext.DEPTH_BUFFER_BIT,
            STENCIL:        WebGLRenderingContext.STENCIL_BUFFER_BIT
        },
        AttribType: {
            BYTE:           WebGLRenderingContext.BYTE,
            SHORT:          WebGLRenderingContext.SHORT,
            UNSIGNED_BYTE:  WebGLRenderingContext.UNSIGNED_BYTE,
            UNSIGNED_SHORT: WebGLRenderingContext.UNSIGNED_SHORT,
            FLOAT:          WebGLRenderingContext.FLOAT
        },
        UniformType: {
            FLOAT_1:        0,
            FLOAT_2:        1,
            FLOAT_3:        2,
            FLOAT_4:        3,
            INT_1:          4,
            INT_2:          5,
            INT_3:          6,
            INT_4:          7,
            FLOAT_VECTOR_2: 8,
            FLOAT_VECTOR_3: 9,
            FLOAT_VECTOR_4: 10,
            INT_VECTOR_2:   11,
            INT_VECTOR_3:   12,
            INT_VECTOR_4:   13,
            MATRIX_2:       14,
            MATRIX_3:       15,
            MATRIX_4:       16
        },
        BlendMode: {
            NORMAL:         0,
            ADD:            1,
            MULTIPLY:       2,
            SCREEN:         3
        },
        Primitive: {
            POINTS:         WebGLRenderingContext.POINTS,
            LINE_STRIP:     WebGLRenderingContext.LINE_STRIP,
            LINE_LOOP:      WebGLRenderingContext.LINE_LOOP,
            LINES:          WebGLRenderingContext.LINES,
            TRIANGLE_STRIP: WebGLRenderingContext.TRIANGLE_STRIP,
            TRIANGLE_FAN:   WebGLRenderingContext.TRIANGLE_FAN,
            TRIANGLES:      WebGLRenderingContext.TRIANGLES
        },
        OutputState: {
            BLEND_STATE:    0,
            DEPTH_STATE:    1,
            STENCIL_STATE:  2
        },
        ReserizerState: {
            SCISSOR_STATE:  0
        },
        BufferUsage: {
            STATIC:         WebGLRenderingContext.STATIC_DRAW,
            DYNAMIC:        WebGLRenderingContext.STREAM_DRAW,
        },
        TextureFilter: {
            LINEAR:         WebGLRenderingContext.LINEAR,
            NEAREST:        WebGLRenderingContext.NEAREST,
        },
        TextureWrapping: {
            CLAMP_TO_EDGE:  WebGLRenderingContext.CLAMP_TO_EDGE, 
            REPEAT:         WebGLRenderingContext.REPEAT 
        },
        Renderer: null,
        Pipeline: null,
        VertexBuffer: null,
        Texture2D: null
    };

    const UniformFunctions = [
        WebGLRenderingContext.prototype.uniform1f,
        WebGLRenderingContext.prototype.uniform2f,
        WebGLRenderingContext.prototype.uniform3f,
        WebGLRenderingContext.prototype.uniform4f,
        WebGLRenderingContext.prototype.uniform1i,
        WebGLRenderingContext.prototype.uniform2i,
        WebGLRenderingContext.prototype.uniform3i,
        WebGLRenderingContext.prototype.uniform4i,
        WebGLRenderingContext.prototype.uniform2fv,
        WebGLRenderingContext.prototype.uniform3fv,
        WebGLRenderingContext.prototype.uniform4fv,
        WebGLRenderingContext.prototype.uniform2iv,
        WebGLRenderingContext.prototype.uniform3iv,
        WebGLRenderingContext.prototype.uniform4iv,
        WebGLRenderingContext.prototype.uniformMatrix2fv,
        WebGLRenderingContext.prototype.uniformMatrix3fv,
        WebGLRenderingContext.prototype.uniformMatrix4fv
    ];

    const BlendModes = [
        [ WebGLRenderingContext.SRC_ALPHA, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA, WebGLRenderingContext.ONE, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA ],
        [ WebGLRenderingContext.SRC_ALPHA, WebGLRenderingContext.DST_ALPHA ],
        [ WebGLRenderingContext.DST_COLOR, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA ],
        [ WebGLRenderingContext.SRC_ALPHA, WebGLRenderingContext.ONE ]
    ];

    class Pipeline
    {
        constructor(config)
        {
            this.renderer = config.renderer;
            this.gl = config.renderer.gl;
            this.vertexSize = 0;
            this.program = null;
            this.attributes = [];
            this.errorLog = [];

            this.recompile(config);
        }

        bind(vertexBuffer)
        {
            const gl = this.renderer.gl;
            const attributes = this.attributes;
            const vertexSize = this.vertexSize;
            const program = this.program;

            gl.useProgram(program);

            for (let index = 0; index < attributes.length; ++index)
            {
                const attrib = attributes[index];

                gl.enableVertexAttribArray(index);
                gl.vertexAttribPointer(index, attrib[0], attrib[1], attrib[2], vertexSize, attrib[3]);
            }

        }

        recompile(config)
        {
            const gl = this.gl;
            const errorLog = this.errorLog;
            const attributes = this.attributes;
            const vertexSize = this.vertexSize;

            this.vertexSize = config.vertexSize;

            if (this.program !== null)
            {
                gl.deleteProgram(this.program);
            }

            attributes.length = 0;
            errorLog.length = 0;

            let index = 0;
            const program = gl.createProgram();
            const vShader = gl.createShader(gl.VERTEX_SHADER);
            const fShader = gl.createShader(gl.FRAGMENT_SHADER);

            gl.shaderSource(vShader, config.vertShader);
            gl.shaderSource(fShader, config.fragShader);
            gl.compileShader(vShader);
            gl.compileShader(fShader);

            if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS))
            {
                errorLog.push('Vertex Shader Error\n' + gl.getShaderInfoLog(vShader));
                console.error('Vertex Shader Error\n', gl.getShaderInfoLog(vShader));
            }

            if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS))
            {
                errorLog.push('Fragment Shader Error\n' + gl.getShaderInfoLog(fShader));
                console.error('Fragment Shader Error\n', gl.getShaderInfoLog(fShader));
            }

            gl.attachShader(program, vShader);
            gl.attachShader(program, fShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            {
                errorLog.push('Program Link Error\n' + gl.getProgramInfoLog(program));
                console.error('Program Link Error\n', gl.getProgramInfoLog(program));
            }

            for (let key in config.attributes)
            {
                const attrib = config.attributes[key];
                gl.bindAttribLocation(program, index, key);
                attributes.push([attrib.size, attrib.type, !!attrib.normalized, attrib.offset]);
                index += 1;
            }

            this.program = program;

            return this;
        }

        setUniform()
        {
            const gl = this.gl;
            const program = this.program;
            const name = arguments[0];
            const type = arguments[1];
            const location = gl.getUniformLocation(program, name);
            const args = Array.prototype.slice.apply(arguments).splice(2); // hack :D
            const func = UniformFunctions[type];

            args.unshift(location);
            gl.useProgram(program);
            func.apply(gl, args);

            return this;
        }

        discard()
        {
            const gl = this.gl;

            gl.deleteProgram(this.program);

            this.program = null;
            this.attributes.length = 0;
            this.vertexSize = 0;

            return this;
        }
    }

    class Renderer
    {
        constructor(config)
        {
            this.canvas = config.canvas;
            this.gl = canvas.getContext('webgl', { alpha: !!config.alpha, depth: !!config.depth, stencil: !!config.stencil, antialias: !!config.antialias });
            this.currentTopology = WebGLRenderingContext.TRIANGLES;
            this.texture2DList = [];
            this.lastPipeline = null;
            this.lastVertexBuffer = null;
            this.lockedPass = false;
        }

        enableRaserizerState (state)
        {
            const gl = this.gl;

            switch (state)
            {
                case NGL.ReserizerState.SCISSOR_STATE:
                    gl.enable(gl.SCISSOR_TEST);
                    break;
            }

            return this;
        }

        disableRaserizerState (state)
        {
            const gl = this.gl;

            switch (state)
            {
                case NGL.ReserizerState.SCISSOR_STATE:
                    gl.disable(gl.SCISSOR_TEST);
                    break;
            }
            
            return this;
        }

        enableOutputState (state)
        {
            const gl = this.gl;

            switch (state)
            {
                case NGL.OutputState.BLEND_STATE:
                    gl.enable(gl.BLEND);
                    break;
                
                case NGL.OutputState.DEPTH_STATE:
                    gl.enable(gl.DEPTH_TEST);
                    break;
                
                case NGL.OutputState.STENCIL_STATE:
                    gl.enable(gl.STENCIL_TEST);
                    break;
            }

            return this;
        }

        disableOutputState (state)
        {
            const gl = this.gl;

            switch (state)
            {
                case NGL.OutputState.BLEND_STATE:
                    gl.disable(gl.BLEND);
                    break;
                
                case NGL.OutputState.DEPTH_STATE:
                    gl.disable(gl.DEPTH_TEST);
                    break;
                
                case NGL.OutputState.STENCIL_STATE:
                    gl.disable(gl.STENCIL_TEST);
                    break;
            }

            return this;
        }

        setScissor (x, y, width, height)
        {
            gl.scissor(x, y, width, height);
            return this;
        }

        setBlendMode(blendMode)
        {
            const gl = this.gl;
            const blendModeParams = BlendModes[blendMode];
            if (blendModeParams.length < 3) WebGLRenderingContext.prototype.blendFunc.apply(gl, blendModeParams);
            else WebGLRenderingContext.prototype.blendFuncSeparate.apply(gl, blendModeParams);
            return this;
        }

        setTexture2D(texture2D, textureUnit)
        {
            this.texture2DList[textureUnit ? textureUnit : 0] = texture2D;
            return this;
        }

        setPrimitiveTopology(topology)
        {
            this.currentTopology = topology;
            return this;
        }

        setClearColor(r, g, b, a)
        {
            this.gl.clearColor(r, g, b, a);
            return this;
        }

        setClearDepth(depth)
        {
            this.gl.clearDepth(depth);
            return this;
        }

        setClearStencil(stencil)
        {
            this.gl.clearStencil(stencil);
            return this;
        }

        clearTarget(clearBits)
        {
            this.gl.clear(clearBits);
            return this;
        }

        beginPass(vertexBuffer, pipeline, renderTarget)
        {
            const gl = this.gl;

            if (this.lockedPass) return;
            this.lockedPass = true;

            if (pipeline && vertexBuffer)
            {   
                if (this.lastPipeline !== pipeline || this.lastVertexBuffer !== vertexBuffer)
                {
                    vertexBuffer.bind();
                    pipeline.bind();
                    this.lastPipeline = pipeline;
                    this.lastVertexBuffer = vertexBuffer;
                }
            }
            else
            {
                if (!pipeline) console.warn('Pipeline not defined. Use Renderer.setPipeline');
                if (!vertexBuffer) console.warn('Vertex buffer not defined. Use Renderer.setVertexBuffer');
                return this;
            }

            // Framebuffer Setup
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget ? renderTarget : null);

            return this;
        }

        endPass()
        {
            if (!this.lockedPass) return;
            
            const gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this.lockedPass = false;

            return this;
        }

        draw(first, vertexCount)
        {
            const gl = this.gl;
            const topology = this.currentTopology;
            const texture2DList = this.texture2DList;

            for (let index = 0; index < texture2DList.length; ++index)
            {
                if (texture2DList[index])
                {
                    const texture = texture2DList[index];
                    gl.activeTexture(gl.TEXTURE0 + index);
                    gl.bindTexture(gl.TEXTURE_2D, texture.texture);
                }
            }

            gl.drawArrays(topology, first, vertexCount);

            return this;
        }
    }

    class VertexBuffer
    {
        constructor(config)
        {
            this.gl = config.renderer.gl;
            this.buffer = this.gl.createBuffer();
            this.updateData(config.data ? config.data : config.size, config.usage ? config.usage : NGL.BufferUsage.STATIC);
        }

        updateData(dataOrSize, usage)
        {
            const gl = this.gl;
            const buffer = this.buffer;
            
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, dataOrSize, usage);

            return this;
        }

        updateSubData(offset, data)
        {
            const gl = this.gl;
            const buffer = this.buffer;
            
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, offset, data);

            return this;
        }

        bind()
        {
            const gl = this.gl;
            const buffer = this.buffer;
            
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

            return this;
        }
    }

    class Texture2D
    {
        constructor(config)
        {
            const source = config.source;
            const isArrayBuffer = !(source instanceof Image || source instanceof HTMLCanvasElement) && (source instanceof ArrayBuffer || ArrayBuffer.isView(source));

            this.gl = config.renderer.gl;
            this.texture = this.gl.createTexture();
            this.source = config.source;
            this.width = !isArrayBuffer ? source.width : config.width;
            this.height = !isArrayBuffer ? source.height : config.height;
            this.isRenderTexture = false;

            const gl = this.gl;
            const texture = this.texture;

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            if (!isArrayBuffer)
            {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            }
            else
            {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
            }
            
            if (config.mipmap)
            {
                if ((this.width & (this.width - 1)) == 0 && (this.height & (this.height - 1)) == 0)
                {
                    gl.generateMipmap(gl.TEXTURE_2D);
                }
                else
                {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, config.filter ? config.filter : gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, config.filter ? config.filter : gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, config.wrapping ? config.wrapping : gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, config.wrapping ? config.wrapping : gl.CLAMP_TO_EDGE);
                }
            }
            else
            {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, config.filter ? config.filter : gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, config.filter ? config.filter : gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, config.wrapping ? config.wrapping : gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, config.wrapping ? config.wrapping : gl.CLAMP_TO_EDGE);
            }

            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        setFilter(filter)
        {
            const gl = this.gl;
            const texture = this.texture;

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
            gl.bindTexture(gl.TEXTURE_2D, null);
            
            return this;
        }

        setWrapping(wrapping)
        {
            const gl = this.gl;
            const texture = this.texture;

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapping);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapping);
            gl.bindTexture(gl.TEXTURE_2D, null);

            return this;
        }

        updateData(source, width, height)
        {
            const gl = this.gl;
            const texture = this.texture;
            const isArrayBuffer = (source instanceof Image || source instanceof HTMLCanvasElement) && (source instanceof ArrayBuffer || ArrayBuffer.isView(source));
            const width = !isArrayBuffer ? source.width : width;
            const height = !isArrayBuffer ? source.height : height;
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            if (!isArrayBuffer)
            {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            }
            else
            {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
            }

            gl.bindTexture(gl.TEXTURE_2D, null);

            this.width = width;
            this.height = height;
            this.source = source;

            return this;
        }

        updateSubData(source, xoffset, yoffset, width, height)
        {
            const gl = this.gl;
            const texture = this.texture;
            const isArrayBuffer = (source instanceof Image || source instanceof HTMLCanvasElement) && (source instanceof ArrayBuffer || ArrayBuffer.isView(source));

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            if (!isArrayBuffer)
            {
                gl.texSubImage2D(gl.TEXTURE_2D, 0, xoffset, yoffset, gl.RGBA, gl.UNSIGNED_BYTE, source);
            }
            else
            {
                gl.texSubImage2D(gl.TEXTURE_2D, 0, xoffset, yoffset, width, height, gl.RGBA, gl.UNSIGNED_BYTE, source);
            }

            gl.bindTexture(gl.TEXTURE_2D, null);

            this.source = source;

            return this;
        }
    }

    NGL.Renderer = Renderer;
    NGL.Pipeline = Pipeline;
    NGL.VertexBuffer = VertexBuffer;
    NGL.Texture2D = Texture2D;

    scope.NGL = scope.NGL || NGL;

}(window));