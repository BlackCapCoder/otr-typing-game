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

  // Non-volatile
  this.asc = function * () {
    let bigger = [];
    let cur    = this.root, tmp, x;

    do {
      while (cur.left) { bigger.push(cur); cur = cur.left; }
      x = cur;

      if (tmp = cur.right) {
        delete cur.right;
        cur = tmp
        if (tmp = bigger.pop()) {
          tmp.left = cur;
          bigger.push(tmp);
        }
      } else if (cur = bigger.pop()) {
        delete cur.left;
      } else {
        yield x;
        return;
      }

      yield x;
    } while (true);
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
      if (x.right) {
        r.left = x.right;
        delete x.right;
      } else
        delete r.left;
    }
    this.size--;
    return x;
  }

  this._removeMax = function () {
    let x = this.root, r;
    while (x.right) {  r= x; x = x.right };
    if (r === undefined) {
      if (x.left === undefined) {
        this.root = undefined;
        this.size--;
        return x;
      };
      r = this.root = x.left;
    } else {
      if (x.left) r.right = x.left; else delete r.right;
    }
    this.size--;
    return x;
  }

  this.check = function ()
  {
    return (function go (n) {
      if (n.left  && (n.val < n.left.val  || !go(n.left ))) return false;
      if (n.right && (n.val > n.right.val || !go(n.right))) return false;
      return true;
    })(this.root);
  }
}

