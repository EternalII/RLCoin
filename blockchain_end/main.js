const { Blockchain, Block, Transaction } = require("./blockchain.js");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const { BloomFilter } = require("./BloomFilter.js");

const myKey = ec.keyFromPrivate(
  "4a8c9b48ffb71cae5f8663074b4a7d32a1ed50b4f16b9e12520f96ce4f4b7d22"
);
const myWalletAddress = myKey.getPublic("hex");

let RLCoin = new Blockchain();
const tx1 = new Transaction(myWalletAddress, "address1", 10);
tx1.signTransaction(myKey);
RLCoin.addTransaction(tx1);

RLCoin.minePendingTransactions(myWalletAddress);

//console.log('\ Balance of Bob ', RLCoin.getBalanceOfAddress(myWalletAddress))

//console.log(JSON.stringify(RLCoin, null, 4))

//===============================================================================
// This demo creates a Bloom filter with a size of 100 and 3 hash functions,
// inserts three strings into the filter,
//and then checks if the filter contains those strings and a string that was not inserted.
// The output should be true for the strings that were inserted and false for the string
// that was not inserted.

const bloomFilter = new BloomFilter(100, 3);

bloomFilter.insert("apple");
bloomFilter.insert("banana");
bloomFilter.insert("orange");

console.log(bloomFilter.contains("apple")); // true
console.log(bloomFilter.contains("pear")); // false
