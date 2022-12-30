
//one at a time hash function done by jenkins
//https://en.wikipedia.org/wiki/Jenkins_hash_function
function one_at_a_time_hash(key){
	
	var h = 0;
	for(var i=0;i<key.length;i++){
		h += key.charCodeAt(i);
		h += (h << 10);
		h = h ^ (h >> 6);
	}

	h += (h << 3);
	h = h ^ (h >> 11);
	h += (h << 15);
	return h;
}

module.exports = one_at_a_time_hash;