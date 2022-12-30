//FNV hash function https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function


const PRIME = 16777619;
const OFFSET = 2166136261;

//big prime and offset constant


function fnv_xor(hash, byte) {
    return (hash ^ byte);
}

//hash XOR byte

function fnv_multiply(hash) {
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    return hash;
}


// hash = hash * PRIME

function fnv_la(v) {
    var hash = OFFSET;
    for (var i = 0; i < v.length; ++i){
        var c = v.charCodeAt(i);
        hash = fnv_xor(hash, c);
        hash = fnv_multiply(hash);
    }
    return hash >>> 0;
}

module.exports = fnv_la;