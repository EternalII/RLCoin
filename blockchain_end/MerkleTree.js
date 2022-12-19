const crypto = require("crypto");

class MerkleTree {
  constructor(leaves) {
    this.leaves = leaves;
    this.nodes = [];
    this.levels = this._buildTree();
  }

  _buildTree() {
    let level = this.leaves;
    const levels = [level];

    while (level.length > 1) {
      level = this._getNextLevel(level);
      levels.push(level);
    }

    return levels;
  }

  _getNextLevel(level) {
    const nextLevel = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1];
      const data = left + right;
      const hash = crypto.createHash("sha256").update(data).digest("hex");
      this.nodes.push({ left, right, hash });
      nextLevel.push(hash);
    }
    if (level.length % 2 === 1) {
      nextLevel.push(level[level.length - 1]);
    }
    return nextLevel;
  }

  getRoot() {
    return this.levels[this.levels.length - 1][0];
  }

  getProof(leaf) {
    let proof = [];
    for (let i = 0; i < this.levels.length; i++) {
      const index = this.levels[i].indexOf(leaf);
      if (index === -1) {
        continue;
      }
      const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
      if (siblingIndex < this.levels[i].length) {
        proof.push(this.levels[i][siblingIndex]);
      }
      leaf = this._getParent(index, i);
    }
    return proof;
  }

  _getParent(index, level) {
    const node = this.nodes.find(
      (n) =>
        n.left === this.levels[level][index] ||
        n.right === this.levels[level][index]
    );
    return node.hash;
  }
}
module.exports.MerkleTree = MerkleTree;
