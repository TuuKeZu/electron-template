const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {
    await Initialize();
});

const state = {
    version: ""
}

const Initialize = async () => {
    const data = await ipcRenderer.sendSync('main:initialize', null);

    if(data == null){ return; }

    state.version = data.version;
    console.log(state.version);

    let field = document.getElementById('version');
    field.textContent = state.version;
}

ipcRenderer.on('message', function(event, text) {

    const container = document.getElementById('messages');
    const message = document.createElement('div');

    message.textContent = text;
    container.appendChild(message);
})