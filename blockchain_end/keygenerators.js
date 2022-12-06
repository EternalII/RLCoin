const EC=require('elliptic').ec

const ec=new EC('secp256k1')

const key=ec.genKeyPair()

const publicKey=key.getPublic('hex')
const privateKey=key.getPrivate('hex')

console.log('\n Your public key (also your wallet address,freely shareabel \n ',publicKey)

console.log('\Your private key(keep this secret ! To sign the transaction)\n',privateKey)