
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




// xs.sort((a,b) => f(b) - f(a)).slice(0, n)
function maximum (f, n, xs)
{
  let bt = new BinaryTree ();
  let smallest = Infinity;

  for (const x of xs) {
    const o = f === undefined? {val: x} : {val: f(x), data: x};
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

function bench (f)
{
  performance.mark('start');
  f();
  performance.mark('end');
  performance.measure('m', 'start', 'end');
  const [m] = performance.getEntriesByName('m');
  performance.clearMarks();
  performance.clearMeasures();
  return m.duration;
}


// single biggest element
function max (xs, f=(x => x)) {
  let m = -Infinity;
  let q;
  for (let x of xs) {
    const v = f(x)
    if (v > m) { m = v; q = x }
  }
  return q;
}

// In-place shuffle
function shuffle (arr, start = 0, end = -1) {
  const len = arr.length;

  if (end >= len) end  = len - 1;
  if (start < 0) start = len + (start % len);
  if (end   < 0) end   = len + (end   % len);
  if (start >= end) return arr;

  let j, tmp;
  for (let i = end; i > start; i--) {
    j      = Math.round(Math.random() * i);
    tmp    = arr[j];
    arr[j] = arr[i];
    arr[i] = tmp;
  }

  return arr;
}

const sum = xs => xs.reduce((acc, x) => acc + x, 0);

function * range (...as)
{
  const [from, to, step]
    = as.length === 3 ? as
    : as.length === 2 ? [...as, 1]
    : as.length === 1 ? [0, ...as, 1]
    : [];

  for (let i = from; i < to; i += step) yield i;
}

function * chunksOf (n, xs)
{
  if (n <= 0) return;
  if (n == 1) { yield * xs; return; }

  let buf = new Array (n);
  let i   = 0;

  for (const x of xs) {
    buf[i++] = x;
    if (i<n) continue;
    yield buf;
    i = 0;
  }

  if (i === 0) return;
  return buf.slice(0, i);
}

function * map (f, xs) { for (const x of xs) yield f (x); }

function * stream (xs) { for (const x of xs) yield x; }

function take (n, xs) {
  const ret = [];
  for (; n > 0; n--) {
    const x = xs.next();
    if (x.done) break;
    ret.push(x.value);
  }
  return ret;
}

function * append (a, b) {
  yield * a;
  yield * b;
}


function mapG (f, g) {
  const next = g.next.bind(g);
  g.next = (...as) => {
    const x = next (...as);
    if (!x.done) x.value = f (x.value);
    return x;
  }
  return g;
}

function thenG (g, f) {
  const next = g.next.bind(g);
  g.next = (...as) => {
    const x = next (...as);
    if (x.done) f (x.value);
    return x;
  }
  return g;
}


// -------------


const TypedArray     = Object.getPrototypeOf(Int8Array);
const Generator      = Object.getPrototypeOf(function*(){});

Generator.prototype.collect = function (...xs) { return Array.from(this, ...xs); };
Generator.prototype.map     = function (f)     { return mapG(f, this); };
Generator.prototype.tail    = function ()      { this.next(); return this; };
Generator.prototype.then    = function (f)     { return thenG(this, f); };


for (const Arr of [Array, TypedArray])
{
  Arr.prototype.shuffle = function (s,e) { return shuffle(this,s,e); };
}

for (const Arr of [Array, TypedArray, Generator])
{
  Arr.prototype.maximum = function (f=undefined, n=Infinity) { return maximum (f, n, this); };
  Arr.prototype.sum = function () { return sum(this); };
  Arr.prototype.max = function (...as) { return max(this,...as); };
  Arr.prototype.chunksOf = function (n) { return chunksOf(n, this); };
}



// -------------


const AsyncGenerator = Object.getPrototypeOf(async function*(){});

AsyncGenerator.prototype.map = async function * (f) {
  for await (const x of this) yield await f (x);
};

AsyncGenerator.prototype.then = async function * (f) {
  let x;
  while (!(x = await this.next()).done)
    yield x.value;

  await f (x.value);
  return x.value;
};

async function forEach (xs, f)
{
  let x;
  while (!(x = await xs.next()).done) await f (x.value);
  return x.value;
}

function cache (f) {
  let res;
  return () => res || (res = f ());
}

// Duplicate a steam
function * duplicate (s)
{
  const q = (function step () { return cache (() => [s.next(), step()]) })();
  while (true)
    yield (function * (step) {
      for (let [x, next] = step(); !x.done; [x, next] = next())
        yield x.value;
    })(q);
}

const dup = (n, s) => take(n, duplicate(s));

function * memo (n, s)
{
  const buf = [];

  while (buf.length < n) buf.push(s.next().value);

  for (const c of s) {
    yield buf;
    buf.shift(); buf.push(c);
  }
  yield buf;
}


async function dupA (n, xs)
{
  const ret = new Array (n);

  const q = (async function step () {
    let cache;
    return [cache || await xs.next(), step ()]
  })();

  for (let i = 0; i < n; i++)
    ret[i] = (async function * (p) {
      for (let [cur, next] = await p; !cur.done; [cur, next] = await next)
        yield cur.value;
    })(q);

  return ret;
}

