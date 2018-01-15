require.config({ paths: { 'vs': 'lib/monaco-editor/dev/vs' }});

require(['vs/editor/editor.main'], function() {
    
    const vertTab = document.getElementById('vert-tab');
    const fragTab = document.getElementById('frag-tab');
    const vertModel = monaco.editor.createModel(localStorage.getItem('vs') || 'void main()\n{\n    gl_Position = vec4(0.0);\n}\n', 'cpp');
    const fragModel = monaco.editor.createModel(localStorage.getItem('fs') || 'void main()\n{\n    gl_FragColor = vec4(1.0);\n}\n', 'cpp');

    const editor = monaco.editor.create(document.getElementById('shader-editor'), { theme: 'vs-dark', model: vertModel });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, function (e) {
        localStorage.setItem('vs', vertModel.getValue());
        localStorage.setItem('fs', fragModel.getValue());
        compileShader();
    });

    vertTab.onclick = function () 
    { 
        editor.setModel(vertModel); 
        editor.focus(); 
        vertTab.className = 'tab active';
        fragTab.className = 'tab';
    };
    fragTab.onclick = function () 
    { 
        editor.setModel(fragModel); 
        editor.focus(); 
        fragTab.className = 'tab active';
        vertTab.className = 'tab';
    };

    startApp({ vert: vertModel, frag: fragModel });

});