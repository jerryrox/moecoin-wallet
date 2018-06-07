const elliptic = require("elliptic").ec;
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const Transactions = require("./transactions");

const ec = new elliptic("secp256k1");
const privateKeyLocation = path.join(__dirname, "privateKey");
const { getPublicKey, getTransactionId, signInput, TxInput, Transaction, TxOutput } = Transactions;

const generatePrivateKey = () => {
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
};

const getPrivateFromWallet = () => {
    const buffer = fs.readFileSync(privateKeyLocation, "utf8");
    return buffer.toString();
};

const getPublicFromWallet = () => {
    const privateKey = getPrivateFromWallet();
    const key = ec.keyFromPrivate(privateKey, "hex");
    return key.getPublic().encode("hex");
};

const getBalance = (address, unspentOutputs) => {
    return _(unspentOutputs)
        .filter(output => output.address === address)
        .map(output => output.amount)
        .sum();
};

const initWallet = () => {
    if(fs.existsSync(privateKeyLocation))
        return;

    const newPrivateKey = generatePrivateKey();
    fs.writeFileSync(privateKeyLocation, newPrivateKey);
};

const findAmountFromOutputs = (amountNeed, myOutputs) => {
    let currentAmount = 0;
    const includedOutputs = [];

    for(const output of myOutputs) {
        includedOutputs.push(output);
        currentAmount += output.amount;

        if(currentAmount >= amountNeed) {
            const leftOver = currentAmount - amountNeed;
            return {
                includedOutputs, leftOver
            };
        }
    }
    console.log("findAmountFromOutputs - Insufficient funds!");
    throw Error("Insufficient funds!");
    return false;
};

const createOutput = (receiverAddress, myAddress, amount, leftOver) => {
    const receiverOutput = new TxOutput(receiverAddress, amount);
    if(leftOver === 0)
        return [receiverOutput];

    const leftOverOutput = new TxOutput(myAddress, leftOver);
    return [receiverOutput, leftOverOutput];
};

const filterUnspentOutputsFromMemPool = (unspentOutputs, memPool) => {
    const inputs = _(memPool).map(transaction => transaction.inputs).flatten().value();
    const removables = [];

    for(const transaction of unspentOutputs) {
        const targetInput = _.find(inputs, input => {
            return input.outputIndex === transaction.outputIndex &&
                input.outputId === transaction.outputId;
        });

        if(targetInput !== undefined) {
            removables.push(transaction);
        }
    }

    return _.without(unspentOutputs, ...removables);
};

const createTransaction = (receiverAddress, amount, privateKey, unspentOutputs, memPool) => {
    const myAddress = getPublicKey(privateKey);
    const myOutputs = unspentOutputs.filter(output => output.address === myAddress);

    const filteredOutputs = filterUnspentOutputsFromMemPool(
        myOutputs, memPool
    );

    const { includedOutputs, leftOver } = findAmountFromOutputs(amount, filteredOutputs);

    const toUnsignedInputs = (output) => {
        return new TxInput(output.outputId, output.outputIndex, '');
    };
    const unsignedInputs = includedOutputs.map(toUnsignedInputs);

    const transaction = new Transaction(
        '',
        unsignedInputs,
        createOutput(receiverAddress, myAddress, amount, leftOver)
    );
    transaction.id = getTransactionId(transaction);

    transaction.inputs = transaction.inputs.map((input, index) => {
        input.signature = signInput(transaction, index, privateKey, unspentOutputs);
        return input;
    });
    return transaction;
};

module.exports = {
    initWallet,
    getBalance,
    getPublicFromWallet,
    getPrivateFromWallet,
    createTransaction
};