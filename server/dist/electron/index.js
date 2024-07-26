// import { app, BrowserWindow, Notification } from 'electron';
// function createWindow() {
//   const win = new BrowserWindow({
//     width: 1000,
//     height: 700,
//   });
//   const { url } = require('../../data/electron.json');
//   // Load a remote URL
//   win.loadURL(url);
//   //win.loadFile('../../views/electron.html');
// }
// //app.whenReady().then(createWindow).then(showNotification);
// app.whenReady().then(createWindow);
// app.on('window-all-closed', () => {
//   console.log(process.platform);
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });
// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });
