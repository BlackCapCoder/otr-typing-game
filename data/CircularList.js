class CircularList
{
  constructor (xs)
  {
    function Node (x) {
      return Object.setPrototypeOf (x, CircularList.prototype);
    }

    let last = this;

    if (xs === undefined) {}
    else
    if (typeof xs === 'number')
      for (let i = 1; i < xs; i++)
        last = last.right = new Node ({left: last, tag: i});
    else
    if (Symbol.iterator in xs)
    {
      for (const x of xs) {
        last.value = x;
        last = last.right = new Node ({left: last});
      }
      last = last.left;
    }

    last.right = this;
    this.left     = last;
  }


  * [Symbol.iterator] () {
    let c = this;
    do {
      if ('value' in c) yield c.value
      c = c.right;
    }
    while (c !== this && c !== undefined);
  }

  * valsL () {
    let c = this;
    do {
      if ('value' in c) yield c.value
      c = c.left;
    }
    while (c !== this && c !== undefined);
  }


  * lefts () {
    for (let c = this.left; c !== this; c = c.left) yield c
  }
  * rights () {
    for (let c = this.right; c !== this; c = c.right) yield c;
  }

  * cycleL () {
    for (let c = this.left;; c = c.left) yield c;
  }

  * cycleR () {
    for (let c = this.right;; c = c.right) yield c;
  }

  popL () {
    if (!'left' in this) return;
    const x = this.left;
    if (x === this) return;

    this.left       = x.left;
    this.left.right = this;
    return x.value;
  }
  popR () {
    if (!'right' in this) return;
    const x = this.right;
    if (x === this) return;

    this.right      = x.right;
    this.right.left = this;
    return x.value;
  }

  get until () {
    return Object.freeze
      ({ left: (function * (x) {
          for (let c = this; c !== x; c = c.left)
            if ('value' in c) yield c.value;
          if ('value' in x) yield x.value;
        }).bind(this)
      , right: (function * (x) {
          for (let c = this; c !== x; c = c.right)
            if ('value' in c) yield c.value;
          if ('value' in x) yield x.value;
        }).bind(this)
      });
  }

}


function LazyCircularList (s, len=-1)
{
  const {value, done} = s.next ();
  if (done) return;

  const first = Object.setPrototypeOf
    ({ value
     , get right () { return build (this) }
     , get left  () {
         let x = this;
         for (; len != 1 && x.right !== this; x = x.right);
         delete this.left;
         return this.left = x;
       }
     }, CircularList.prototype);

  // Lazily build the list, left to right
  function build (that)
  {
    delete that.right;

    const {value, done} = s.next();
    if (done) {
      delete first.left;
      first.left   = that;
      return that.right = first;
    }
    if (--len == 0) {
      first.value = value;

      delete first.left;
      first.left = that;

      const r = first.right
      delete first.right;
      return that.right = Object.defineProperty
        ( first, 'right'
        , { get: function () { return extend (r) }
          , configurable: true }
        );
    }

    return that.right = Object.setPrototypeOf
      ({ value
       , left: that
       , get right () { return build (this) }
       }, CircularList.prototype );
  }

  function extend (that)
  {
    delete that.left.right;
    that.left.right = that;

    const {value, done} = s.next();
    if (!done) {
      that.value = value;

      const r = that.right;
      delete that.right;
      Object.defineProperty
        ( that, 'right'
        , { get: function () { return extend (r) }
          , configurable: true }
        );
    }

    return that;
  }

  return first;
}

