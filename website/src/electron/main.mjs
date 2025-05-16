import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { watch } from 'node:fs'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Electron app starting...');
console.log(__filename, __dirname);

console.log(app.getPath('music'))

// console.log(`baz ${MAIN_WINDOW_VITE_NAME}`)

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,

    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
    },

  });



  // You can use `process.env.VITE_DEV_SERVER_URL` when the vite command is called `serve`
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    // Load your file
    mainWindow.loadFile('dist/index.html');
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools({ mode: 'detach' });
};

async function doesFileExist(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.handle('select-directory', async (event, operation) => {
    const properties = operation === 'export' ? ['openDirectory', 'createDirectory'] : ['openDirectory'];
    const result = await dialog.showOpenDialog({
      properties: properties
    });
    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  });

  ipcMain.handle('read-directory', async (event, dirPath, baseDirectory, recursive) => {
    try {
      const dir = await readdir(join(baseDirectory ?? '', dirPath), { withFileTypes: true, recursive });
      return dir
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  });


  ipcMain.handle('read-file', async (event, filePath, baseDirectory, encoding) => {
    try {
      const data = await readFile(join(baseDirectory ?? '', filePath), { encoding });
      return data;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  ipcMain.handle('write-file', async (event, filePath, data, baseDirectory, encoding) => {
    try {
      await writeFile(join(baseDirectory ?? '', filePath), data, { encoding });
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  });

  ipcMain.handle('exists', async (event, filePath, baseDirectory) => {
    try {
      await access(join(baseDirectory ?? '', filePath));
      return true;
    } catch (_e) {
      return false;
    }
  });

  ipcMain.handle('get-music-path', () => {
    return app.getPath('music');
  });

  ipcMain.handle('watch-directory', (event, directory, port) => {
    const watcher = watch(directory, { recursive: true }, (eventType, filename) => {

      if (eventType === 'rename') {
        if (doesFileExist(filename)) {
          console.log(`File ${filename} added`);
        } else {
          console.log(`File ${filename} removed`);
        }
      } else if (eventType === 'change') {
        console.log(`File ${filename} was changed`);
      }
      if (!filename) {

        console.log('filename not provided');
      }
      event.sender.send('directory-changed', { eventType, filename });
    });

    port.onClose(() => {
      console.log('Port closed, stopping watcher');
      watcher.abort();
    });
  })
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
