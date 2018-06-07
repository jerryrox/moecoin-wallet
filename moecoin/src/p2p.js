const WebSockets = require("ws");
const Blockchain = require("./blockchain");
const MemPool = require("./memPool");

const { getLatestBlock, isBlockStructureValid, addBlockToChain, replaceChain, getBlockChain, handleIncomingTransaction } = Blockchain;
const {getMemPool} = MemPool;
const sockets = [];

// Message types
const GET_LATEST = "GET_LATEST";
const GET_ALL = "GET_ALL";
const BLOCKCHAIN_RESPONSE = "BLOCKCHAIN_RESPONSE";
const REQUEST_MEMPOOL = "REQUEST_MEMPOOL";
const MEMPOOL_RESPONSE = "MEMPOOL_RESPONSE";

// Message creators
const getLatest = () => {
    return {
        type: GET_LATEST,
        data: null
    };
};
const getAll = () => {
    return {
        type: GET_ALL,
        data: null
    };
};
const blockchainResponse = (data) => {
    return {
        type: BLOCKCHAIN_RESPONSE,
        data
    };
};
const getAllMemPool = () => {
    return {
        type: REQUEST_MEMPOOL,
        data: null
    }
};
const memPoolResponse = (data) => {
    return {
        type: MEMPOOL_RESPONSE,
        data: data
    };
};

const getSockets = () => {
    return sockets;
};

const startP2PServer = (server) => {
    const wsServer = new WebSockets.Server({ server });

    wsServer.on("connection", ws => {
        initSocketConnection(ws);
    });
    wsServer.on("error", () => {
        console.log("startP2PServer - error");
    });
    console.log("startP2PServer - P2P server opened");
};

const initSocketConnection = (socket) => {
    sockets.push(socket);
    setupSocketMessages(socket);
    setupSocketError(socket);
    sendMessage(socket, getLatest());

    setTimeout(() => {
        broadcastMessage(getAllMemPool());
    }, 1000);
    setInterval(() => {
        if(sockets.includes(socket)) {
            sendMessage(socket, '');
        }
    }, 1000);
};

const parseData = (data) => {
    try {
        return JSON.parse(data);
    }
    catch(e) {
        console.log(`parseData - ${e}`);
        return null;
    }
};

const setupSocketMessages = (socket) => {
    socket.on("message", (data) => {
        const message = parseData(data);
        if(message === null)
            return;

        switch(message.type) {
        case GET_LATEST:
            sendMessage(socket, responseLatest());
            break;
        case GET_ALL:
            sendMessage(socket, responseAll());
            break;
        case BLOCKCHAIN_RESPONSE:
            const receivedBlocks = message.data;
            if(receivedBlocks === null)
                break;
            handleBlockchainResponse(receivedBlocks);
            break;
        case REQUEST_MEMPOOL:
            sendMessage(socket, returnMemPool());
            break;
        case MEMPOOL_RESPONSE:
            const receivedTransactions = message.data;
            if(receivedTransactions === null)
                break;
            receivedTransactions.forEach(transaction => {
                try {
                    handleIncomingTransaction(transaction);
                }
                catch(e) {
                    console.log(`setupSocketMessages - MEMPOOL_RESPONSE : ${JSON.stringify(e)}`);
                }
            });
            break;
        }
    });
};

const handleBlockchainResponse = (receivedBlocks) => {
    if(receivedBlocks.length === 0) {
        console.log("handleBlockchainResponse - receivedBlocks array's length is 0!");
        return;
    }
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    if(!isBlockStructureValid(latestBlockReceived)) {
        console.log("handleBlockchainResponse - latestBlockReceived's structure is invalid!");
        return;
    }
    const latestBlock = getLatestBlock();
    if(latestBlockReceived.index > latestBlock.index) {
        if(latestBlockReceived.previousHash === latestBlock.hash) {
            if(addBlockToChain(latestBlockReceived)) {
                broadcastNewBlock();
            }
        }
        else if(receivedBlocks.length === 1) {
            broadcastMessage(getAll());
        }
        else {
            replaceChain(receivedBlocks);
        }
    }
};

const returnMemPool = () => {
    return memPoolResponse(getMemPool());
};

const sendMessage = (socket, message) => {
    socket.send(JSON.stringify(message));
};

const broadcastMessage = (message) => {
    sockets.forEach((socket) => {
        sendMessage(socket, message);
    });
};

const responseLatest = () => {
    return blockchainResponse([getLatestBlock()]);
};

const responseAll = () => {
    return blockchainResponse(getBlockChain());
};

const broadcastNewBlock = () => {
    broadcastMessage(responseLatest());
};

const broadcastMemPool = () => {
    broadcastMessage(returnMemPool());
};

const setupSocketError = (socket) => {
    const closeSocketConnection = (ws) => {
        ws.close();
        sockets.splice(sockets.indexOf(ws), 1);
    };

    socket.on("close", () => {
        closeSocketConnection(socket);
    });
    socket.on("error", () => {
        closeSocketConnection(socket);
    });
};

const connectToPeers = (newPeer) => {
    const ws = new WebSockets(newPeer);
    ws.on("open", () => {
        initSocketConnection(ws);
    });
    ws.on("close", (error) => console.log("connectToPeers - Closed: " + JSON.stringify(error)));
    ws.on("error", (error) => console.log("connectToPeers - Error: " + JSON.stringify(error)));
};

module.exports = {
    startP2PServer,
    connectToPeers,
    broadcastNewBlock,
    broadcastMemPool
};