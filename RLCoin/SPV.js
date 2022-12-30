const {
    Blockchain,
    Transaction
} = require('./Blockchain.js');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const SHA256 = require("./node_modules/crypto-js/sha256");

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
    wallet,
    me,
    peers
} = extractPeersAndMyPort()
const sockets = {}

log('---------------------')
log('Starting up WALLET NODE')
log('me - ', me)
log('peers - ', peers)
log('connecting to peers...')


const mykey =
    ec.keyFromPrivate(wallet);
console.log("Your wallet private address: ",wallet)
const myWalletAddress = mykey.getPublic('hex');


const myIp = toLocalIp(me)
const peerIps = getPeerIps(peers)
const headers = [];

//connect to peers
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp)
    log('connected to peer - ', peerPort)

    sockets[peerPort] = socket
    stdin.on('data', data => { //on user input
        const message = data.toString().trim()
        if (message === 'exit') { //on exit
            console.log("headers: ", headers)
            log('Bye bye')
            exit(0)
        }

        const receiverPeer = extractReceiverPeer(message)
        const splitMessage = message.split(' ')
        if (splitMessage[0] === 'send') { // user wants to send money
            sendTransaction(socket, splitMessage[1], splitMessage[2]);
        } else if (message === 'balance') { // user wants to see his balance
            console.log("requesting balance by sending: ", formatMessage("{\"balanceOfAddress\":" + myWalletAddress + "}"));
            socket.write(formatMessage("{\"balanceOfAddress\":\"" + myWalletAddress + "\"}"));
        } else if (splitMessage[0] === 'verify') { // user wants to verify a transaction
            const toSend = "{\"verify\":\"" + splitMessage[1] + "\"}"
            console.log("requesting verification of: ", toSend);
            socket.write(formatMessage(toSend));
        } else if (message == 'getHeaders') {
            const formattedMessage = formatMessage("{\"getHeaders\": \"thanks\"}");
            console.log("requesting blockchain headers by sending ", formattedMessage);
            socket.write(formattedMessage);
        } else if (message == 'getTotalCoins') {
            const formattedMessage = formatMessage("{\"getTotalCoins\": \"thanks\"}");
            console.log("requesting blockchain total coins by sending ", formattedMessage);
            socket.write(formattedMessage);
        } else if (message == 'getTotalMinedCoins') {
            const formattedMessage = formatMessage("{\"getTotalMinedCoins\": \"thanks\"}");
            console.log("requesting blockchain total coins by sending ", formattedMessage);
            socket.write(formattedMessage);
        } else if (message == 'getTotalBurnedCoins') {
            const formattedMessage = formatMessage("{\"getTotalBurnedCoins\": \"thanks\"}");
            console.log("requesting blockchain total coins by sending ", formattedMessage);
            socket.write(formattedMessage);
        } else if (sockets[receiverPeer]) { //message to specific peer
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

function receivedData(data, socket) {
    console.log("Received message: ", data.toString())
    try{
        const jsonObj = JSON.parse(extractMessage(data.toString()))

        // check if it's a transaction
        if (jsonObj.previousHash && jsonObj.timestamp && jsonObj.nonce && jsonObj.merkleRoot) {
            console.log('Adding header to array: ', jsonObj)
            headers.push(jsonObj)
        }
        else if(jsonObj.PartialMerkleTree){
            if(jsonObj.PartialMerkleTree == "TRANSACTION CANNOT BE VERIFIED"){
                console.log("TRANSACTION CANNOT BE VERIFIED by the full node");
            }
            else{
                //console.log("received PartialMerkleTree string: ", jsonObj.PartialMerkleTree);
                const trimmed = jsonObj.PartialMerkleTree.trim();
                const PartialMerkleTreeArr = trimmed.split(",");
                //console.log("received PartialMerkleTree arrayed: ", PartialMerkleTreeArr)
                const merkleRoot = recreateMerkleRoot(PartialMerkleTreeArr)
                //console.log("recreated merkle root: ", merkleRoot);
        
                const merkleExists = isMerkleRootInHeaders(merkleRoot);
                console.log("merkle root returned by full node has found in existing headers?: ", merkleExists);
            }
            
        }
        else if(jsonObj.balance){
            console.log("Your balance is: ", jsonObj.balance);
        }
    } catch (error) {
        console.log("received message that I don't know how to parse")
    }

}

function extractMessage(message) {
    return message.substring(message.indexOf(">") + 1, message.length);
}

function sendTransaction(socket, amount, toAddress) {
    const tx1 = new Transaction(myWalletAddress, toAddress, amount);
    tx1.signTransaction(mykey);
    console.log("sending transaction: ", JSON.stringify(tx1));
    socket.write(formatMessage(JSON.stringify(tx1)));
}


//extract ports from process arguments, {me: first_port, peers: rest... }
function extractPeersAndMyPort() {
    return {
        wallet: argv[2],
        me: argv[3],
        peers: argv.slice(4, argv.length)
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

function recreateMerkleRoot(partialMerkleTree){

    if (partialMerkleTree.length == 1)
    {
        //console.log("in returnarray length 1 if");
        //console.log("this should be equal to the hashroot above", returningarraylength1[0]);
        return partialMerkleTree[0];
    }
    else if (partialMerkleTree.length == 2)
    {
        
        let combineddoublehash = SHA256(partialMerkleTree[0] + partialMerkleTree[1]).toString();
        //console.log("the merkle root should equal to :", combineddoublehash);
        return combineddoublehash;
    }
    else if (partialMerkleTree.length == 3)
    {
        
        //console.log("calculating merkle root when length = 3", setMerkleRootTransaction(CheckRootArray));
        let hash01 = SHA256(partialMerkleTree[0] + partialMerkleTree[1]).toString();
        let hash2 = partialMerkleTree[2];
        let Temp0122hash = SHA256(hash01 + hash2).toString();

        //console.log("this should be equal to hash 01 hashing manually", hash01);
        //console.log("this should equal to 22", partialMerkleTree[2]);
        //console.log("manually hashing 01 and 22 together this should return the merkle root", Temp0122hash);

        return Temp0122hash;
    }
    return false;
}

function isMerkleRootInHeaders(root){
    for(const header in headers){
        if(headers[header].merkleRoot == root){
            return true;
        }
    }
    return false;
}