# RLCoin
First homework for blockchain course

Dependencies:
npm install elliptic express secp256k1 fully-connected-topology

How to connect peer to peer:

First of all, make sure you're in the right folder by typing
cd blockchain_end in the terminal. Open three terminals, for 3 peers.

On the first one, type:
node p2p 5001 5002 5003
Second one:
node p2p 5002 5001 5003
Third one:
node p2p 5003 5001 5002

