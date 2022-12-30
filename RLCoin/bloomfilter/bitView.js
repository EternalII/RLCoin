var BitView = function (buffer) {
    this.buffer = buffer;
    this.unit8 = new Uint8Array(this.buffer);
}
// creating an array of 8bit unsigned ints

BitView.prototype.get = function (I) {
    var value = this.unit8[I >> 3];
    var offset = I & 0x7;
    return ((value >> (7 - offset)) & 1);
}

//returns bit value at I

BitView.prototype.set = function (I) {
    var offset = I & 0x7
    this.unit8[I >> 3] |= (0x80 >> offset);

}

//sets bit value at I

BitView.prototype.clear = function (I) {
    var offset = I & 0x7;
    this.unit8[I >> 3] &= ~(0x80 >> offset);
    
}

BitView.prototype.view = function () {
    return this.unit8;
}

module.exports = BitView;