//The actual bloom filter

var BitView = require('./BitView');
var fnv_la = require('./fnv');
var one_at_a_time_hash = require('./Jenkins')

const BITS_IN_BYTE = 8;
const FALSE_POS_TOL = 0.000001;

//constants, false positive tolerance can be changed

//n number of words in the bloomfilter

var BloomFilter = function (n, fpl = FALSE_POS_TOL) {
    this.b = Math.ceil((-2) * n * Math.log(fpl)); //bits in the filter
    this.k = Math.ceil(0.7 * (this.b / n)); //number of hash functions
    this.size = (this.b > BITS_IN_BYTE) ? (Math.ceil(this.b / BITS_IN_BYTE)) : 1;	//default size is one
    this.bitview = new BitView(new ArrayBuffer(this.size));



}

BloomFilter.prototype.calculateHash = function(x,b,i){
	//Double hash technique.
	return ((fnv_la(x) + (i * one_at_a_time_hash(x))) % b);
}

BloomFilter.prototype.test = function (data) { //checks if it exists in filter
    var h = data;
    for (var i = 0; i < this.k; i++){
        h = this.calculateHash(h, this.b, i);
        if (!this.bitview.get(h)) {
            return false;
        }
    }
    return true;
}
//Adds data to filter.
BloomFilter.prototype.add = function(data){

	var h = data;
	for(var i=0; i<this.k; i++){
		h = this.calculateHash(h, this.b, i);
		this.bitview.set(h);
	}
}


BloomFilter.prototype.bytelength = function(){ //For visualization return bitview length
	return this.bitview.length();
}


BloomFilter.prototype.view = function(){ 
	return this.bitview.view();
}


BloomFilter.prototype.serialize = function(){ //serialized object
	return JSON.stringify(this);
}


BloomFilter.deserialize = function(serialized){//deserializing from json.
	var data = JSON.parse(serialized);
	var filter = new BloomFilter();
	filter.b = data.b;
	filter.k = data.k;
	filter.size = data.size;
	filter.bitview = new BitView();
	filter.bitview.buffer = data.bitview.buffer;
	filter.bitview.unit8 = data.bitview.unit8;
	return filter;
}

module.exports = BloomFilter;