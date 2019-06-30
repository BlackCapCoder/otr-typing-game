const cleanWords = short => new RegExp (''
  + /(?<= |^)[^a-z ]+/.source             // leading  special characters
  + /|(?<=[a-z])[^a-z ]+(?= |$)/.source   // trailing special characters
  + '|( |^)('
  + /[^a-z ]*[a-z]+[^a-z ][^ ]+/.source   // drop entire word containing special characters
  + '|[^a-z ]*[a-z]{0,' + String(short) + '}[^a-z ]*'  // drop short words, only one space between words
  + ')(?= |$)'
, 'gi');

const abbrivs =
  { "n't":  ' not'
  , "'ll":  ' will'
  , "'ve":  ' have'
  , "'d":   ' would'
  , "'m":   ' am'
  , "'re":  ' are'
  , "it's": 'it is'
  };

const unquote = word => word
  . replace (/(?<=\w)(n't|'ll|'ve|'d|'m|'re|it's)(?=$|[\.\?!:;\- ])/gi, m => abbrivs[m]);


// Collect words from texts
{
  let wordsCache = null;


  // Returns actual cache object. Safe if we only read
  window.unsafeWords = function () {
    if (wordsCache) return wordsCache;

    const all = new Set (
      simplewords.filter(w => w.length > 2 && w.search(/[^a-z]/) === -1)
    );

    texts . join(' ')
          . replace(cleanWords(2), '')
          . split(' ')
          . forEach (x => all.add(x.toLowerCase()));

    return wordsCache = Array.from(all).sort();
  }

  // Make a copy
  window.words = function () {
    return unsafeWords().slice(0);
  }

  window.quoteWords = function () {
    return texts.flatMap(x => unquote(x).split(/(?<=\w)[\.\?!:;\-]+ +/));
  }
}


function wordUsage (s)
{
  const g = new Array(s.length);

  for (let i = 0; i < s.length; i++)
    g[i] = {};

  const rx    = cleanWords(0);
  const _txts = quoteWords();

  _txts.forEach(txt => {
    const ws = txt . replace (rx, '')
                   . toLowerCase()
                   . trim()
                   . split(' ')
                   . map (w => binarySearch(s, w));

    for (let i = 1; i < ws.length; i++) {
      const cur = ws[i], b = ws[i-1];
      if (cur === -1 || b === -1) continue;
      const n =  g[cur];
      if (!(b in n)) n[b] = 1; else n[b]++;
    }
  });

  return g;
}

function * commonSentence (minLen = 10) {
  const s  = unsafeWords();
  const ws = wordUsage (s);

  while (true) {
    let len = minLen;
    let sentence = "";

    while (len > 0) {
      const ret = [];
      let w;

      while (true) {
        w = Math.floor(Math.random() * ws.length);
        if (Object.keys(ws[w]).length > 0) break;
      }

      for (;; len--) {
        ret.unshift(w);

        const commons = Object.entries(ws[w]).sort((a, b) => b[1] - a[1]).map(x => x[0]);

        if (commons.length === 0) break;

        let choice = null;

        for (let k = 0; k < 10; k++) {
          choice = commons[Math.floor(Math.random() * commons.length * (k/10))]
          if (!ret.includes(choice) && Math.random() > 0.3) break;
        }
        if (choice === null) choice = commons[0];

        w = choice;
      }

      const str = ret.map(x => s[x]).join(' ');
      sentence += str[0].toUpperCase() + str.substr(1) + '.' + (len > 0? ' ': '');
    }

    yield sentence;
  }
}




// Produces a graph of words that appear after others
function wordGraph (s) {
  const graph = new Array(s.length);

  {
    for (let i = 0; i < s.length; i++)
      graph[i] = new Set();

    const rx = cleanWords(0);

    quoteWords ().forEach(txt => {
      const ws = txt . replace (rx, '')
                     . toLowerCase()
                     . trim()
                     . split(' ')
                     . map (w => binarySearch(s, w));

      for (let i = 1; i < ws.length; i++) {
        const cur = ws[i], b = ws[i-1];
        if (cur === -1 || b === -1) continue;
        graph[b].add(cur);
      }
    });
  }

  return graph;
}

// best start: 4416, length: 1072
function bfs (graph, start)
{
  const visited = new Int8Array(graph.length).fill(false);
  const q       = [];
  const root    = {val: start, verts: new Map ()};

  visited[start] = true;
  q.push(root);

  while (q.length > 0) {
    const el = q.pop();

    for (const neigh of graph[el.val]) {
      if (visited[neigh]) continue;
      visited[neigh] = true;

      const x = {val: neigh, verts: new Map ()};
      el.verts.set(x.val, x);
      q.push(x);
    }
  }

  return root;
}

// best start: 8430, length: 1249
function dfs (graph, start)
{
  const visited = new Int8Array(graph.length).fill(false);
  const root    = {val: start, verts: new Map ()};

  (function go (vert, d) {
    visited[vert.val] = true;
    let max = 0;
    for (const neigh of graph[vert.val]) {
      if (visited[neigh]) continue;
      const x = {val: neigh, verts: new Map ()};
      vert.verts.set(neigh, x);
      const _d = go (x, d+1);
      if (_d > max) max = _d;
    }
    vert.depth = max;
    return max + 1;
  }) (root, 0);

  return root;
}

function prospect (n) {
  let max = 0;
  for (const v of n.verts.values()) {
    let d = prospect (v);
    if (d > max) max = d;
  }
  return n.depth = max + 1;
}

function longest (n) {
  let pth  = [n.val];
  let rst  = n;
  let orph = [];

  while (rst.verts.size > 0) {
    let found = false;

    for (const nxt of rst.verts.values()) {
      if (found || nxt.depth !== rst.depth -1) {
        orph.push(nxt);
        continue;
      }
      rst.verts.delete(nxt.val);

      pth.push(nxt.val);
      rst = nxt;
      old = n.val;
      found = true;
    }

    if (!found) {
      console.error("not found! " + rst.depth);
      console.log(rst)
      break;
    }
  }

  return [pth, orph];
}

function longs (n)
{
  const [pth, orph] = longest (n);
  let ret = [pth]

  for (const o of orph) ret = ret.concat (longs(o));

  return ret;
}

// bruteforce longest path
function brute ()
{
  const s = unsafeWords();
  const g = wordGraph (s);

  let t = dfs (g, 0);
  let m = prospect (t);

  for (let i = 1; i < s.length; i++) {
    const q = dfs (g, i)
    const l = prospect (q);
    if (l > m) {
      m = l; t = q;
    }
  }
  return t.val;
}


function longSentence (start = 8430)
{
  const s = unsafeWords();
  const g = wordGraph (s);
  const t = dfs (g, start);

  const [pth, os] = longest (t);

  return pth.map(x => s[x]);
}

function parts ()
{
  const s  = unsafeWords();
  const ws = wordUsage(s)
  const singles = Array.from(ws.length);

  for (const [i, obj] of Object.entries(ws)) {
    const ks = Object.entries(obj);
    if (ks.length > 1) continue;
    if (singles[i] === undefined) singles[i] = {val: i, verts: []};

    for (const [k, o] of ks) {
      if (singles[k] === undefined) singles[k] = {val: k, verts: []};
      singles[i].verts.push(singles[k]);
    }
  }

  return singles;
}

function frequency () {
  const s  = unsafeWords();
  const ws = wordUsage(s)
  const es = ws.map((x,i) => { return {i, w: s[i], l: Object.keys(x).length, s: Object.values(x).reduce((acc,x) => acc + x, 0) }})
  const ls = es.slice(0).sort((a,b) => b.l - a.l);
  const ss = es.slice(0).sort((a,b) => b.s - a.s);
  return {ls, ss};
}


function * longSentences ()
{
  const s = unsafeWords();
  const g = wordGraph (s);

  while (true) {
    const t = dfs (g, Math.floor(Math.random() * s.length));
    const [pth, os] = longest (t);
    if (pth.length < 5) continue;
    yield pth.map(x => s[x]).join(' ');
  }
}


function dijkstra (h,s,g,scores, start = 0)
{
  const dist  = new Uint16Array(s.length).fill(-1);
  const prev  = new Uint16Array(s.length).fill(-1);
  const len   = new Uint16Array(s.length).fill(0);
  const vis   = new Uint8Array (s.length).fill(0);
  const queue = new BinaryTree ();

  queue.insert({val: 0, data: start})
  dist[start] = 0;

  while (queue.size > 0) {
    const u = queue._removeMin().data;
    if (vis[u]) continue;
    vis[u] = 1;

    for (const v of g[u]) {
      const alt = dist[u] + scores[v];
      if (alt >= dist[v]) continue;
      if (!vis[v]) queue.insert({val: alt, data: v});
      dist[v] = alt;
      prev[v] = u
      len [v] = len[u] + 1;
    }
  }

  return [dist, prev, len]
}

function test (start, end) {
  const h      = hardLetters();
  const s      = unsafeWords();
  const g      = wordGraph (s);
  const scores = new Uint16Array(s.length).map((_,i) => Math.round(scoreWord(h,s[i])));
  const q = dijkstra(h, s, g, scores);
  return q;
}

function * shortestTree ()
{
  const h      = hardLetters();
  const s      = unsafeWords();
  const g      = wordGraph (s);
  const scores = new Uint16Array(s.length).map((_,i) => Math.round(scoreWord(h,s[i])));

  const inits = Array.from(new Set(quoteWords().map(x => x.slice(0, x.indexOf(' ')).toLowerCase()))).map(w => binarySearch(s, w)).filter(x => x != -1).shuffle();

  let sentence = [];
  let start = inits.pop();

  while (true) {
    const [, prev, len] = dijkstra(h,s,g,scores,start);

    let max = 0, ix = 0;
    for (let i = 0; i < len.length; i++) {
      if (len[i] < max) continue;
      max = len[i];
      ix  = i;
    }

    if (max <= 1) {
      if (sentence.length == 0) {
        start = inits.pop();
        continue;
      }
      yield sentence.map(i => s[i]).join(' ');
      sentence = [];
      start = inits.pop();
      continue;
    }

    let path = [];
    let cur  = ix;

    while (cur !== 65535) {
      path.unshift(cur);
      cur = prev[cur];
    }

    sentence = sentence.concat(path);

    if (sentence.length >= 20) {
      yield sentence.map(i => s[i]).join(' ');
      sentence = [];
      start = inits.pop();
    } else {
      start = sentence.pop();
    }
  }
}

function * djikLevel (_h, _s, _g, _scores)
{
  const h      = _h      || hardLetters();
  const s      = _s      || unsafeWords();
  const g      = _g      || wordGraph (s);
  const scores = _scores || new Uint16Array(s.length).map((_,i) => Math.round(scoreWord(h,s[i])));

  const qt    = range(s.length) . maximum (i => scoreWord(h, s[i]));
  const tried = [];
  let   begin;

  while (begin = qt._removeMin())
  {
    const sentence = [s[begin.data]];
    let [,prev,] = dijkstra(h,s,g,scores,begin.data);

    for (let i = 0; i < 10; i++)
    {
      const level = [];
      let   end;

      while (qt.size > 0 && prev[(end = qt._removeMin()).data] === 65535)
        tried.push(end);

      if (end === undefined) {
        console.log('undef')
        return;
      }

      begin = end;

      while (end = tried.pop())
        qt.insert(end);

      prev = dijkstra(h,s,g,scores,begin.data)[1];

      for (let cur = begin.data; cur < 65535; cur = prev[cur])
        level.unshift(s[cur]);

      console.log(qt.size)
      sentence.push(level.join(' '));
    }

    yield sentence.join(' ');
  }
}

function * djikLevel2 ()
{
  const h      = hardLetters();
  const s      = unsafeWords();
  const g      = wordGraph (s);
  const scores = new Uint16Array(s.length).map((_,i) => Math.round(scoreWord(h,s[i])));

  const backlog = maximum
  ( x => { const [a,b] = x.split(',');
           return (scoreWord(h, x[0]) + scoreWord(h, x[1])) / 2 }
  , Infinity
    , new Set( quoteWords()
      . reduce((acc, l) => {
        const m = l.toLowerCase().match(/^(\w+).* (\w+)[\.\?!]*$/);
        if (m !== null && m[1] !== m[2]) acc.push(m[1] + ',' + m[2]);
        return acc;
      }, []))
    ) . toSortedListRev () ;

  const level = [];
  let   cnt   = 0;

  for (const p of backlog)
  {
    const [begin,end] = p.data.split(',').map(x => binarySearch(s, x));
    if (begin == -1 || end == -1) continue;

    const [,prev,] = dijkstra(h,s,g,scores,begin);
    const sentence = [];

    for (let cur = end; cur < 65535; cur = prev[cur], cnt++)
      sentence.unshift(s[cur]);

    if (sentence.length < 2) continue;

    level.push(sentence.join(' '));

    if (cnt >= 20) {
      cnt = 0;
      yield level.splice(0).join(', ');
    }
  }
}

// TODO Word classes: nouns, adjectives, adverbs ..
