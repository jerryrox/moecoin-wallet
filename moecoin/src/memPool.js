const _ = require("lodash");
const Transactions = require("./transactions");

const { validateTransaction } = Transactions;

let memPool = [];

const getMemPool = () => {
    return _.cloneDeep(memPool);
};

const getInputsInPool = (pool) => {
    return _(pool).map(transaction => transaction.inputs).flatten().value();
};

const isTxValidForPool = (transaction, pool) => {
    const inputsInPool = getInputsInPool(pool);

    const isInputExists = (inputs, input) => {
        return _.find(inputs, item => {
            return input.outputIndex === item.outputIndex &&
                input.outputId === item.outputId
        });
    };

    for(const input of transaction.inputs) {
        if(isInputExists(inputsInPool, input)) {
            console.log("isTxValidForPool - A duplicate input was found!");
            return false;
        }
    }
    return true;
};

const hasTxInput = (input, unspentOutputs) => {
    const foundInput = unspentOutputs.find(output => {
        return output.outputId === input.outputId && output.outputIndex === input.outputIndex
    });
    return foundInput !== undefined;
};

const updateMemPool = (unspentOutputs) => {
    const invalidTransactions = [];

    for(const transaction of memPool) {
        for(const input of transaction.inputs) {
            if(!hasTxInput(input, unspentOutputs)) {
                invalidTransactions.push(transaction);
                break;
            }
        }
    }

    if(invalidTransactions.length > 0) {
        memPool = _.without(memPool, ...invalidTransactions);
    }
};

const addToMemPool = (transaction, unspentOutputs) => {
    if(!validateTransaction(transaction, unspentOutputs)) {
        console.log("addToMemPool - This transaction is invalid!");
        throw Error("This transaction is invalid!");
    }
    else if(!isTxValidForPool(transaction, memPool)) {
        console.log("addToMemPool - Transaction not valid for pool!");
        throw Error("Transaction not valid for pool!");
    }
    memPool.push(transaction);
};

module.exports = {
    addToMemPool,
    getMemPool,
    updateMemPool
};