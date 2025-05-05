export const isElectron = () => typeof window.electron !== 'undefined' 

const electronInvokerWrapper = (cb) => async (...args) => {
  if (!isElectron()) {
    throw new Error('Not running in Electron environment');
  }
  return cb(window.electron.ipcRenderer.invoke, ...args);
}

export const selectDirectory = electronInvokerWrapper(async (invoke) => await invoke('select-directory', 'export'));

export const readFile = electronInvokerWrapper(async (invoke, filePath) => await invoke('read-file', filePath));

export const writeFile = electronInvokerWrapper(async (invoke, filePath, data) => await invoke('write-file', filePath, data));

export const getMusicPath = electronInvokerWrapper(async (invoke) => await invoke('get-music-path'));
