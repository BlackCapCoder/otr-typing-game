const PriorityQueue = (() => {

const top    = 0;
const parent = i => ((i + 1) >>> 1) - 1;
const left   = i => (i << 1) + 1;
const right  = i => (i + 1) << 1;

return class PriorityQueue {

  constructor (comparator = (a, b) => a > b)
  {
    this._heap = [];
    this._comparator = comparator;
  }

  static fromSortedList (xs, comparator)
  {
    const pq = new PriorityQueue (comparator);
    pq._heap = xs;
    return pq;
  }

  static from (xs, ...as)
  {
    const pq = new PriorityQueue (...as);
    for (let x of xs) pq.push (x);
    return pq;
  }

  get size () {
    return this._heap.length;
  }

  isEmpty () { return this.size == 0; }
  peek    () { return this._heap[top]; }
  push (x) {
    this._heap.push(x);
    this._siftUp();
  }
  pop () {
    const poppedValue = this.peek();
    const bottom = this.size - 1;
    if (bottom > top) {
      this._swap(top, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace (value) {
    const replacedValue = this.peek();
    this._heap[top] = value;
    this._siftDown();
    return replacedValue;
  }

  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }

  _siftUp ()
  {
    for ( let node = this.size - 1
        ; node > top && this._greater(node, parent(node))
        ; node = parent(node) )
      this._swap (node, parent(node));
  }

  _siftDown ()
  {
    let node = top;
    while (
      (left (node) < this.size && this._greater(left (node), node)) ||
      (right(node) < this.size && this._greater(right(node), node))
    ) {
      let maxChild = (right(node) < this.size && this._greater(right(node), left(node))) ? right(node) : left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }

}

})();
