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

const { app, BrowserWindow, Menu } = electron;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        title: "Moecoin Wallet"
    });

    const ENV = process.env.ENV;
    const template = [
        {
            label: "Moecoin Wallet",
            submenu: [
                {
                    label: "About Moecoin Wallet",
                    role: "about"
                },
                {
                    type: "separator"
                },
                {
                    label: "Services",
                    role: "services",
                    submenu: []
                },
                {
                    type: "separator"
                },
                {
                    label: "Hide Moecoin Wallet",
                    accelerator: "Command+H",
                    role: "hide"
                },
                {
                    label: "Hide Others",
                    accelerator: "Command+Shift+H",
                    role: "hideothers"
                },
                {
                    label: "Show All",
                    role: "unhide"
                },
                {
                    type: "separator"
                },
                {
                    label: "Quit",
                    accelerator: "Command+Q",
                    click: function() {
                    app.quit();
                    }
                }
            ]
        },
        {
            label: "Edit",
            submenu: [
                {
                    label: "Undo",
                    accelerator: "CmdOrCtrl+Z",
                    role: "undo"
                },
                {
                    label: "Redo",
                    accelerator: "Shift+CmdOrCtrl+Z",
                    role: "redo"
                },
                {
                    type: "separator"
                },
                {
                    label: "Cut",
                    accelerator: "CmdOrCtrl+X",
                    role: "cut"
                },
                {
                    label: "Copy",
                    accelerator: "CmdOrCtrl+C",
                    role: "copy"
                },
                {
                    label: "Paste",
                    accelerator: "CmdOrCtrl+V",
                    role: "paste"
                },
                {
                    label: "Select All",
                    accelerator: "CmdOrCtrl+A",
                    role: "selectall"
                }
            ]
        }
    ];

    if(ENV === "dev") {
        mainWindow.loadURL("http://localhost:3000");
        mainWindow.webContents.openDevTools();
    }
    else {
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, "build/index.html"),
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
