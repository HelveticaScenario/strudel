export const isElectron = () => typeof window.electron !== 'undefined'
console.log(window.electron)
const electronInvokerWrapper = (cb) => async (...args) => {
  if (!isElectron()) {
    throw new Error('Not running in Electron environment');
  }
  return cb(window.electron.ipcRenderer.invoke, ...args);
}

export const exists = electronInvokerWrapper(async (invoke, dirPath, baseDirectory) => await invoke('exists', dirPath, baseDirectory));
export const selectDirectory = electronInvokerWrapper(async (invoke) => await invoke('select-directory', 'export'));
export const readDir = electronInvokerWrapper(async (invoke, dirPath, baseDirectory, recursive) => await invoke('read-directory', dirPath, baseDirectory, recursive));

export const readTextFile = electronInvokerWrapper(async (invoke, filePath, baseDirectory) => await invoke('read-file', filePath, baseDirectory, 'utf-8'));
export const readBinaryFile = electronInvokerWrapper(async (invoke, filePath, baseDirectory) => await invoke('read-file', filePath, baseDirectory, null));

export const writeTextFile = electronInvokerWrapper(async (invoke, filePath, data, baseDirectory) => await invoke('write-file', filePath, data, baseDirectory, 'utf-8'));

export const getMusicPath = electronInvokerWrapper(async (invoke) => await invoke('get-music-path'));
