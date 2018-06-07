const electron = require("electron");
const path = require("path");
const url = require("url");
const getPort = require("get-port");
const moecoin = require("./moecoin/src/server");

getPort().then(port => {
    // Start server
    const server = moecoin.app.listen(port, () => {
        console.log("Blockchain node started on port " + port);
    });
    moecoin.startP2PServer(server);

    global.sharedPort = port;
});

const { app, BrowserWindow } = electron;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        title: "Moecoin Wallet"
    });

    const ENV = process.env.ENV;
    if(ENV === "dev") {
        mainWindow.loadURL("http://localhost:3000");
    }
    else {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, "uidev/build/index.html"),
            protocol: "file",
            slashes: true
        }));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on("window-all-closed", function() {
    if(process.platform !== 'darwin')
        app.quit();
});

app.on("activate", function() {
    if(mainWindow === null)
        createWindow();
});

app.on("ready", createWindow);
