const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const Blockchain = require('./blockchain');
const P2P = require("./p2p");
const Wallet = require("./wallet");
const MemPool = require("./memPool");

const {getBlockChain, createNewBlock, getAccountBalance, sendTransaction, getBalance, getUnspentOutputList} = Blockchain;
const {startP2PServer, connectToPeers} = P2P;
const {initWallet, getPublicFromWallet} = Wallet;
const {getMemPool} = MemPool;

const PORT = process.env.HTTP_PORT || 3000;
const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(cors());
app.use(morgan("combined"));

// Routes
app.route("/blocks")
    .get((req, res) => {
        res.send(getBlockChain());
    })
    .post((req, res) => {
        const newBlock = createNewBlock();
        res.send(newBlock);
    });

app.get("/me/balance", (req, res) => {
    const balance = getAccountBalance();
    res.send({
        balance
    });
});

app.post("/peers", (req, res) => {
    const peer = req.body.peer;
    connectToPeers(peer);
    res.send();
});

app.get("/me/address", (req, res) => {
    res.send(getPublicFromWallet());
});

app.get("/blocks/:hash", (req, res) => {
    const { hash } = req.params;
    const block = _.find(getBlockChain(), {
        hash
    });

    if(block === undefined) {
        res.status(400).send("Block not found");
    }
    else {
        res.send(block);
    }
});

app.get("/transactions/:id", (req, res) => {
    const transaction = _(getBlockChain())
        .map(blocks => blocks.data)
        .flatten()
        .find({ id: req.params.id });

    if(transaction === undefined)
        res.status(400).send("Transaction not found");
    else
        res.send(transaction);
});

app.route("/transactions")
    .get((req, res) => {
        res.send(getMemPool());
    })
    .post((req, res) => {
        try {
            const { address, amount } = req.body;
            if(address === undefined || amount === undefined)
                throw Error("Please specify an address and an amount.");

            const resp = sendTransaction(address, amount);
            res.send(resp);
        }
        catch(e) {
            console.log(e);
            res.status(400).send(e.message);
        }
    });

app.get("/:address/balance", (req, res) => {
    const { address } = req.params;
    const balance = getBalance(address, getUnspentOutputList());
    
    if(balance === null || balance === undefined) {
        res.status(400).send("Address not found.");
    }
    else {
        res.send({ balance });
    }
});
    

initWallet();

module.exports = {
    startP2PServer,
    app
};