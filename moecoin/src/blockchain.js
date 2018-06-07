const CryptoJS = require("crypto-js");
const hexToBinary = require("hex-to-binary");
const Wallet = require("./wallet");
const Transactions = require("./transactions");
const MemPool = require("./memPool");
const _ = require("lodash");

const BLOCK_GEN_INTERVAL = 10;
const DIFF_ADJUST_INTERVAL = 10;

const { initWallet, getBalance, getPublicFromWallet, createTransaction, getPrivateFromWallet } = Wallet;
const { createRewardTransaction, processTransactions } = Transactions;
const { addToMemPool, getMemPool, updateMemPool } = MemPool;

class Block {

    constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
}

const genesisTransaction = {
    inputs: [{
        outputId: "",
        outputIndex: 0,
        signature: ""
    }],
    outputs: [{
        address: "04aaceddcefd4e1e8fab5d19df53901c46106c45a67a3606a8250e4c549947e036d3b965f602cfb9eb1809ef27dacd4ca5ad1a172e81f982f5eb54953f23d15d20",
        amount: 50
    }],
    id: "2c1ba92de2f3f26797d20541c5b79bd957b23717498978081c7fd961959ad40b"
};

const genesisBlock = new Block(
    0,
    "0f10ce0a17f15461360e9b4c0a892b0c3e339529dc2e496625a77c2cdef1defc",
    null,
    1527900734,
    [genesisTransaction],
    0,
    0
);

let blockChain = [genesisBlock];
let unspentOutputs = processTransactions(blockChain[0].data, [], 0);

const getLatestBlock = () => {
    return blockChain[blockChain.length-1];
};

const getTimestamp = () => {
    return Math.round(new Date().getTime() / 1000);
};

const getBlockChain = () => {
    return blockChain;
};

const createHash = (index, previousHash, timestamp, data, difficulty, nonce) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce).toString();
};

const createNewBlock = () => {
    const rewardTransaction = createRewardTransaction(
        getPublicFromWallet(),
        getLatestBlock().index + 1
    );
    const blockData = [rewardTransaction].concat(getMemPool());
    return createNewRawBlock(blockData);
};

const createNewRawBlock = (data) => {
    const previousBlock = getLatestBlock();
    const newBlockIndex = previousBlock.index + 1;
    const newTimestamp = getTimestamp();
    const difficulty = findDifficulty();

    const newBlock = findBlock(
        newBlockIndex,
        previousBlock.hash,
        newTimestamp,
        data,
        difficulty
    );
    addBlockToChain(newBlock);
    require("./p2p").broadcastNewBlock();
    return newBlock;
};

const findDifficulty = () => {
    const latestBlock = getLatestBlock();

    // Calculate new difficulty every interval.
    if(latestBlock.index % DIFF_ADJUST_INTERVAL === 0 &&
        latestBlock.index !== 0) {
        return calculateDifficulty(latestBlock, getBlockChain());
    }
    return latestBlock.difficulty;
};

const calculateDifficulty = (latestBlock, chain) => {
    const lastCalculatedBlock = chain[chain.length-DIFF_ADJUST_INTERVAL];
    const timeExpected = BLOCK_GEN_INTERVAL * DIFF_ADJUST_INTERVAL;
    const timeTaken = latestBlock.timestamp - lastCalculatedBlock.timestamp;

    if(timeTaken < timeExpected / 2)
        return lastCalculatedBlock.difficulty + 1;
    else if(timeTaken > timeExpected * 2)
        return lastCalculatedBlock.difficulty - 1;
    else
        return lastCalculatedBlock.difficulty;
};

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
    let nonce = 0;
    while(true) {
        const hash = createHash(
            index,
            previousHash,
            timestamp,
            data,
            difficulty,
            nonce
        );
        
        if(hashMatchesDifficulty(hash, difficulty))
            return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);

        nonce ++;
    }
};

const hashMatchesDifficulty = (hash, difficulty = 0) => {
    const hashInBinary = hexToBinary(hash);
    const requiredZeros = "0".repeat(difficulty);
    return hashInBinary.startsWith(requiredZeros);
};

const getBlockHash = (block) => {
    return createHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);
};

const isTimestampValid = (newBlock, oldBlock) => {
    return (
        oldBlock.timestamp - 60 < newBlock.timestamp &&
        newBlock.timestamp - 60 < getTimestamp()
    );
};

const isBlockValid = (newBlock, latestBlock) => {
    if(!isBlockStructureValid(newBlock)) {
        console.log("isBlockValid - Invalid newBlock structure!");
        return false;
    }
    else if(latestBlock.index + 1 !== newBlock.index) {
        console.log("isBlockValid - Invalid index!");
        return false;
    }
    else if(latestBlock.hash !== newBlock.previousHash) {
        console.log("isBlockValid - Invalid previousHash!");
        return false;
    }
    else if(getBlockHash(newBlock) !== newBlock.hash) {
        console.log("isBlockValid - Invalid newBlock hash!");
        return false;
    }
    else if(!isTimestampValid(newBlock, latestBlock)) {
        console.log("isBlockValid - Invalid timestamp!");
        return false;
    }
    return true;
};

const isBlockStructureValid = (block) => {
    return (
        typeof block.index === "number" &&
        typeof block.hash === "string" &&
        typeof block.previousHash === "string" &&
        typeof block.timestamp === "number" &&
        typeof block.data === "object"
    );
};

const isChainValid = (targetChain) => {
    const isGenesisValid = block => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };

    if(!isGenesisValid(targetChain[0])) {
        console.log("isChainValid - Invalid genesis block mismatch!");
        return null;
    }

    let foreignOutputs = [];
    for(let i=0; i<targetChain.length; i++) {
        const currentBlock = targetChain[i];
        if(i !== 0 && !isBlockValid(currentBlock, targetChain[i-1])) {
            console.log(`isChainValid - Block at index ${i} is invalid!`)
            return null;
        }

        foreignOutputs = processTransactions(
            currentBlock.data,
            foreignOutputs,
            currentBlock.index
        );

        if(foreignOutputs === null) {
            console.log("isChainValid - Transactions could not be processed!");
            return null;
        }
    }
    return foreignOutputs;
};

const getDifficultySum = (chain) => {
    return chain.map(block => block.difficulty)
        .map(diff => Math.pow(2, diff))
        .reduce((a, b) => a + b);
};

const replaceChain = (newChain) => {
    const foreignOutputs = isChainValid(newChain);
    const isValid = foreignOutputs !== null;
    
    if(isValid && getDifficultySum(newChain) > getDifficultySum(getBlockChain())) {
        blockChain = newChain;
        unspentOutputs = foreignOutputs;
        updateMemPool(unspentOutputs);
        require("./p2p").broadcastNewBlock();
        return true;
    }
    console.log("replaceChain - newChain not eligible for replacement.");
    return false;
};

const addBlockToChain = (newBlock) => {
    if(isBlockValid(newBlock, getLatestBlock())) {
        const processedTransactions = processTransactions(newBlock.data, unspentOutputs, newBlock.index);
        if(processedTransactions === null) {
            console.log("addBlockToChain - Couldn't process transactions.");
            return false;
        }

        getBlockChain().push(newBlock);
        unspentOutputs = processedTransactions;
        updateMemPool(unspentOutputs);
        return true;
    }
    console.log("addBlockToChain - newBlock is not valid!");
    return false;
};

const getUnspentOutputList = () => {
    return _.cloneDeep(unspentOutputs);
};

const getAccountBalance = () => {
    return getBalance(getPublicFromWallet(), unspentOutputs);
};

const sendTransaction = (address, amount) => {
    const transaction = createTransaction(
        address, amount, getPrivateFromWallet(), getUnspentOutputList(), getMemPool()
    );
    addToMemPool(transaction, getUnspentOutputList());
    require("./p2p").broadcastMemPool();
    return transaction;
};

const handleIncomingTransaction = (transaction) => {
    addToMemPool(transaction, getUnspentOutputList());
};

module.exports = {
    getLatestBlock,
    getBlockChain,
    createNewBlock,
    isBlockStructureValid,
    addBlockToChain,
    replaceChain,
    getAccountBalance,
    sendTransaction,
    handleIncomingTransaction,
    getUnspentOutputList,
    getBalance
};