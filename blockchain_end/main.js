const {Blockchain,Block,Transaction}=require('./blockchain.js')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

const myKey = ec.keyFromPrivate('4a8c9b48ffb71cae5f8663074b4a7d32a1ed50b4f16b9e12520f96ce4f4b7d22')
const myWalletAddress=myKey.getPublic('hex')

let RLCoin=new Blockchain()
const tx1=new Transaction(myWalletAddress,'address1',10)
tx1.signTransaction(myKey)
RLCoin.addTransaction(tx1)

RLCoin.minePendingTransactions(myWalletAddress)
 
 
 

console.log('\ Balance of Bob ', RLCoin.getBalanceOfAddress(myWalletAddress))

console.log(JSON.stringify(RLCoin, null, 4))