class BloomFilter {
  constructor(size, hashFunctions) {
    this.size = size;
    this.hashFunctions = hashFunctions;
    this.storage = new Array(size).fill(0);
  }

  insert(item) {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this._hash(item, i);
      this.storage[index] = 1;
    }
  }

  contains(item) {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this._hash(item, i);
      if (this.storage[index] === 0) {
        return false;
      }
    }
    return true;
  }

  _hash(item, seed) {
    let hash = 0;
    for (let i = 0; i < item.length; i++) {
      hash = (hash + item.charCodeAt(i) * seed) % this.size;
    }
    return hash;
  }
}
module.exports.BloomFilter = BloomFilter;
