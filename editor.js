require.config({ paths: { 'vs': 'lib/monaco-editor/dev/vs' }});

require(['vs/editor/editor.main'], function() {
    
    const vertTab = document.getElementById('vert-tab');
    const fragTab = document.getElementById('frag-tab');
    const vertModel = monaco.editor.createModel('', 'cpp');
    const fragModel = monaco.editor.createModel('', 'cpp');

    const editor = monaco.editor.create(document.getElementById('shader-editor'), { theme: 'vs-dark', model: vertModel });

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

    startApp({ monaco: monaco, editor: editor, vert: vertModel, frag: fragModel });

});