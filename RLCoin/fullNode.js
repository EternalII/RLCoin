const {
    Blockchain,
    Transaction
} = require('./blockChain.js');
const loadTransactionFileToList =  require('./blockChain.js').loadTransactionFileToList;
const saveListToFile =  require('./blockChain.js').saveListToFile;
const SHA256 = require("./node_modules/crypto-js/sha256");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const topology = require('fully-connected-topology')
const {
    stdin,
    exit,
    argv
} = process
const {
    log
} = console
const {
    me,
    peers
} = extractPeersAndMyPort()
const sockets = {}

log('---------------------')
log('Starting up FULL NODE')
log('me - ', me)
log('peers - ', peers)
log('connecting to peers...')

const myIp = toLocalIp(me)
const peerIps = getPeerIps(peers)
const RLCoin = new Blockchain();
const mykey =
    ec.keyFromPrivate('2f68d3422cee1623fcf9837a9d9884207061b44a900a9f0a5a86c680d77a84a8')
const myWalletAddress = mykey.getPublic('hex');


//connect to peers
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    setInterval(recurringTask, 10000, socket);
    const peerPort = extractPortFromIp(peerIp)
    log('connected to peer - ', peerPort)

    sockets[peerPort] = socket
    stdin.on('data', data => { //on user input
        const message = data.toString().trim()
        const receiverPeer = extractReceiverPeer(message)
        if (message === 'exit') { //on exit
            log('Bye bye')
            exit(0)
        }
        else if (message === 'saveHistory') {
            RLCoin
        .saveTransactionHistory();
        }
        else if (message === 'loadHistory') { 
            RLCoin
        .loadTransactionHistory();
        }
        else if (sockets[receiverPeer]) { //message to specific peer
            if (peerPort === receiverPeer) { //write only once
                sockets[receiverPeer].write(formatMessage(extractMessageToSpecificPeer(message)))
            }
        } else { //broadcast message to everyone
            socket.write(formatMessage(message))
        }
    })

    //print data when received
    socket.on('data', data => receivedData(data, socket))
})

function receivedData(data, socket){
    try {
        const jsonObj = JSON.parse(extractMessage(data.toString()))
      

        // check if it's a transaction
        if(jsonObj.fromAddress && jsonObj.toAddress && jsonObj.timestamp && jsonObj.signature){
            //console.log('in if!!')
            receivedTransaction(data, socket);
        }
        // check if it's a balance request
        else if(jsonObj.balanceOfAddress){
            const balance = RLCoin
        .getBalanceOfAddress(jsonObj.balanceOfAddress)
            console.log("responding with balance: ", balance);
            socket.write(formatMessage("{\"balance\":\""+balance+"\"}"));
        }
        else if(jsonObj.getTotalCoins){
            const response = RLCoin
        .getTotalCoins();
            console.log("responding with total coins: ", response);
            socket.write(formatMessage(response));
        }
        else if(jsonObj.getTotalMinedCoins){
            const response = RLCoin
        .getTotalMinedCoins();
            console.log("responding with total coins: ", response);
            socket.write(formatMessage(response));
        }
        else if(jsonObj.getTotalBurnedCoins){
            const response = RLCoin
        .getTotalBurnedCoins();
            console.log("responding with total coins: ", response);
            socket.write(formatMessage(response));
        }
        // check if it's a headers request
        else if(jsonObj.getHeaders){
            console.log("Got a request for headers history");
            if(RLCoin
            .chain.length){ // check if blockchain contains any blocks
                for(const block in RLCoin
                .chain){
                    var header = RLCoin
                .chain[block].getHeader();
                    socket.write(formatMessage(header));
                    sleep(500);
                }
            }
        }
        // check if it's a verification request
        else if(jsonObj.verify){
            console.log("Got a request to verify: ", jsonObj.verify);
            const foundTXAndBlock = RLCoin
        .findBlockContainingTX(jsonObj.verify);

            if(!foundTXAndBlock){
                socket.write(formatMessage("{\"PartialMerkleTree\":\"TRANSACTION CANNOT BE VERIFIED\"}"));
            }
            else { // transaction exists, return partial merkle tree
                const partialMerkle = ReturnMerkleTreeParts(foundTXAndBlock[1],foundTXAndBlock[0].transactions);
                console.log("Sending Partial Merkle Tree to SPV node: ", partialMerkle)
                socket.write(formatMessage("{\"PartialMerkleTree\":\" " + partialMerkle + "\"}"));
            }
        }
    } catch (error) {

        console.log("received message that I don't know how to parse, error: ", error)
    }


}

function receivedTransaction(data, socket){
    //console.log("received json: ",JSON.parse(extractMessage(data.toString())));
    receivedTX = Transaction.class(JSON.parse(extractMessage(data.toString())));
    RLCoin
.pendingTransactions = loadTransactionFileToList("..\\pending_transaction.json");
    // TODO validate
    console.log("received TX: ", receivedTX)
    RLCoin
.addTransaction(receivedTX);
    socket.write(formatMessage("{\"Hash of addded transaction\":\"" + receivedTX.calculateHash() + "\"}"));
    saveListToFile(RLCoin
    .pendingTransactions,"..\\pending_transaction.json");
}


//extract ports from process arguments, {me: first_port, peers: rest... }
function extractPeersAndMyPort() {
    return {
        me: argv[2],
        peers: argv.slice(3, argv.length)
    }
}

//'4000' -> '127.0.0.1:4000'
function toLocalIp(port) {
    return `127.0.0.1:${port}`
}

//['4000', '4001'] -> ['127.0.0.1:4000', '127.0.0.1:4001']
function getPeerIps(peers) {
    return peers.map(peer => toLocalIp(peer))
}

//'hello' -> 'myPort:hello'
function formatMessage(message) {
    return `${me}>${message}`
}

//'127.0.0.1:4000' -> '4000'
function extractPortFromIp(peer) {
    return peer.toString().slice(peer.length - 4, peer.length);
}

//'4000>hello' -> '4000'
function extractReceiverPeer(message) {
    return message.slice(0, 4);
}

//'4000>hello' -> 'hello'
function extractMessageToSpecificPeer(message) {
    return message.slice(5, message.length);
}

function extractMessage(message){
    return message.substring(message.indexOf(">")+1,  message.length);
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

// mines pending transactions and then trnasmits the block header
function recurringTask(socket){
  //console.log("here");
  if(RLCoin
.minePendingTransaction(myWalletAddress)){ // if there's something to mine
      var header = RLCoin
    .getLatestBlock().getHeader();
      socket.write(formatMessage(header));
  }
}

function ReturnMerkleTreeParts(tx,txarray)
{
    //console.log("array length:",txarray.length);
    if (txarray.length==3)
    {
        if ((tx==txarray[0])||(tx==txarray[1])){
            //console.log("hello in if");
            let temparray=[];
            temparray.push(txarray[2]);
            temparray.push(txarray[2]);
            let combinedhash=setMerkleRootTransaction(temparray);
            let returnarray=[];
            returnarray[0]=txarray[0].calculateHash();
            returnarray[1]=txarray[1].calculateHash();
            returnarray[2]=combinedhash;
            return returnarray;



        }
        if (tx==txarray[2]){
            //console.log("hello in if tx==2");
            let temparray1=[];
            temparray1.push(txarray[0]);
            temparray1.push(txarray[1]);
            let combinedhash1=setMerkleRootTransaction(temparray1);

            let temparray2=[];
            temparray2.push(txarray[2]);
            temparray2.push(txarray[2]);
            let combinedhash2=setMerkleRootTransaction(temparray2);
            let returnarray=[];
            returnarray[0]=combinedhash1;
            returnarray[1]=combinedhash2;
            return returnarray;


        }


    }
    if (txarray.length==2)
    {
        //console.log("hello in txarraylength==2");
        let combinedhash=setMerkleRootTransaction(txarray);
        let returnarray=[];
        returnarray.push(combinedhash);
        return returnarray;
    }
    if (txarray.length == 1)
    {
        //console.log("hello in return merkle tree parts array length 1");
        let temparray = [];
        //console.log("printing txarray[0] in setmerkle tree parts", txarray[0].calculateHash());
        let temp00hash = txarray[0].calculateHash() + txarray[0].calculateHash();
        let combinedhash = SHA256(temp00hash).toString();
        //console.log("printing combinedhash in setmerkle tree parts", combinedhash);
        let returnarray = []
        returnarray.push(combinedhash);
        return returnarray;
    }
    if (txarray.length == 4)
    {
        let temp01hash = txarray[0].calculateHash() + txarray[1].calculateHash();
        let hash01 = SHA256(temp01hash).toString();
        let temphash23 = txarray[2].calculateHash() + txarray[3].calculateHash();
        let hash23 = SHA256(temphash23).toString();
        let returnarray = [];
        returnarray.push(hash01);
        returnarray.push(hash23);
        return returnarray;

        
        }
}

function setMerkleRootTransaction(transactions) {

    // deal with empty block
    if (transactions.length == 0) {
        return "0";
    }

    // create array of hashes of the block transactions
    let hashes = [];
    for (const tx of transactions) {
        hashes.push(tx.calculateHash());
    }

    // calculate next level of hashes until we get a single hash, aka the root
    while (hashes.length > 1) {
        // deal with odd number of hashes by duplicating one of them
        if (hashes.length & 1 ) {
            hashes.push(hashes[hashes.length-1]);
        }
        let nextLevel = [];
        // calculate next level of hashes
        for (let i = 0; i < hashes.length; i += 2) {
            let TempString = (hashes[i] + hashes[i + 1]).toString();
            nextLevel.push(SHA256(TempString).toString());
        }
        // replace curr level of hashes with next level of hashes for next while iteration
        hashes = nextLevel;
    }
    // return single hash, aka the root


    return hashes[0];
}