
// O(log n) lookup in sorted array
function binarySearch(array, target){
  let startIndex = 0;
  let endIndex = array.length - 1;
  while(startIndex <= endIndex) {
    let middleIndex = Math.floor((startIndex + endIndex) / 2);
    if( target === array[middleIndex]) {
      return middleIndex;
    }
    if(target > array[middleIndex]) {
      startIndex = middleIndex + 1;
    }
    if(target < array[middleIndex]) {
      endIndex = middleIndex - 1;
    }
  }

  return -1;
}


function BinaryTree ()
{
  this.size = 0;

  // Smallest element greater than or equal
  this.lookupGE = function (x) {
    let n = this.root, r;

    while (n !== undefined) {
      r = n;
      if (n.val >= x.val)
        n = n.left;
      else
        n = n.right;
    }

    return r;
  };

  this.insert = function (x) {
    if (this.size === 0) {
      this.root = x;
      this.size++;
      return x;
    }

    const q = this.lookupGE(x);

    if (q.val < x.val) {
      if (q.right) x.right = q.right;
      q.right = x;
      this.size++;
    }
    if (q.val > x.val) {
      if (q.left) x.left = q.left;
      q.left = x;
      this.size++;
    }
    return q;
  };

  // Volatile
  this.toSortedList = function * () {
    const buf = [this.root];

    while (buf.length > 0) {
      const x = buf.pop();
      if (x.left) {
        buf.push(x);
        buf.push(x.left);
        delete x.left;
      } else {
        if (x.right) {
          buf.push(x.right);
          delete x.right;
        }
        yield x;
      }
    }
  }
  this.toSortedListRev = function * () {
    const buf = [this.root];

    while (buf.length > 0) {
      const x = buf.pop();
      if (x.right) {
        buf.push(x);
        buf.push(x.right);
        delete x.right;
      } else {
        if (x.left) {
          buf.push(x.left);
          delete x.left;
        }
        yield x;
      }
    }
  }

  this.min = function () {
    let x = this.root;
    while (x.left) x = x.left;
    return x;
  }

  this.removeMin = function () {
    let x = this.root, r;
    while (x.left) { r = x; x = x.left };
    if (r === undefined) {
      if (x.right === undefined) {
        this.root = undefined;
        this.size--;
        return x;
      }
      r = this.root = x.right;
    } else {
      if (x.right) r.left = x.right; else delete r.left;
    }
    this.size--;
    return r;
  }

  this._removeMin = function () {
    let x = this.root, r;
    while (x.left) { r = x; x = x.left };
    if (r === undefined) {
      if (x.right === undefined) {
        this.root = undefined;
        this.size--;
        return x;
      };
      r = this.root = x.right;
    } else {
      if (x.right) r.left = x.right; else delete r.left;
    }
    this.size--;
    return x;
  }

}


// xs.sort((a,b) => f(b) - f(a)).slice(0, n)
function maximum (f, n, xs)
{
  let bt = new BinaryTree ();
  let smallest = Infinity;

  for (const x of xs) {
    const o = {val: f(x), data: x};
    if (bt.size < n) {
      bt.insert(o);
      if (o.val < smallest) smallest = o.val;
      continue;
    }
    if (o.val < smallest) continue;
    const s = bt.removeMin();
    if (o.val < smallest.val) {
      smallest = o.val;
      s.left = o;
      bt.size++;
    } else {
      smallest = s.val;
      bt.insert(o);
    }
  }

  return bt;
}

// single biggest element
function max (xs) {
  let m = -Infinity;
  for (let x of xs) if (x > m) m = x;
  return m;
}

// In-place shuffle
function shuffle (arr) {
  let j, tmp;

  for (let i = arr.length-1; i > 0; i--) {
    j      = Math.round(Math.random() * i);
    tmp    = arr[j];
    arr[j] = arr[i];
    arr[i] = tmp;
  }

  return arr;
}

const sum = xs => xs.reduce((acc, x) => acc + x, 0);


// -------------


const TypedArray = Object.getPrototypeOf(Int8Array);
const Generator  = Object.getPrototypeOf(function*(){});

Generator.prototype.collect = function () { return Array.from(this); };

for (const Arr of [Array, TypedArray])
{
  Arr.prototype.shuffle = function () { return shuffle(this); };
}

for (const Arr of [Array, TypedArray, Generator])
{
  Arr.prototype.maximum = function (f, n) { return maximum (f, n, this); };
  Arr.prototype.sum = function () { return sum(this); };
  Arr.prototype.max = function () { return max(this); };
}

