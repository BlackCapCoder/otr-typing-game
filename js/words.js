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


  window.unsafeWords = function () {
    if (wordsCache) return wordsCache;

    const all = new Set (
      simplewords.filter(w => w.length > 2 && w.search(/[^a-z]/) === -1)
    );

    quoteWords ()
      . join(' ')
      . replace(cleanWords(1), '')
      . split(' ')
      . forEach (x => all.add(x.toLowerCase()));

    return Object.freeze(wordsCache = Array.from(all).sort());
  }

  Object.defineProperty(window, 'words',
    { get: window.unsafeWords
    }
  );

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

    quoteWords () . forEach (txt => {
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


function dijkstra (h,s,g,scores, start = 0, hard = false)
{
  const dist  = new Uint16Array(s.length).fill(-1);
  const prev  = new Uint16Array(s.length).fill(-1);
  const vis   = new Uint8Array (s.length).fill(0);
  const queue = new PriorityQueue (
    hard ? (a,b) => dist[a] > dist[b]
         : (a,b) => dist[a] < dist[b]
  );

  queue.push(start)
  dist[start] = 0;

  // const len   = new Uint16Array(s.length).fill(0);
  // let best  = start;
  // let score = 65535;

  for (let u = start; queue.size > 0; u = queue.pop()) {
    if (vis[u]) continue;
    vis[u] = 1;

    for (const v of g[u]) {
      const alt = dist[u] + scores[v];
      if (alt >= dist[v]) continue;
      if (!vis[v]) queue.push(v);
      dist[v] = alt;
      prev[v] = u
      // len[v]  = len[u] + 1;
      // if (alt / len[v] > score) continue;
      // score = alt / len[v];
      // best  = v;
    }
  }

  return [dist, prev
    // , len
    // , best
    ];
}

function * djikLevel (_h, _s, _g, _scores, hard = false)
{
  const h      = _h      || hardLetters();
  const s      = _s      || unsafeWords();
  const g      = _g      || wordGraph (s);
  const scores = _scores || new Uint16Array(s.length).map (
    (_,i) => Math.round(scoreWord(h,s[i]))
  );

  // A linked list, but flat
  const llvs = new Uint16Array(s.length).map((_,i) => i).sort(
    hard ? (a,b) => scores[b] - scores[a]
         : (a,b) => scores[a] - scores[b]
  ).shuffle(0,15);
  const llks = new Uint16Array(s.length-1).map((_,i) => i+1);

  for (let i = 0, end = s.length; i < end; i = llks[i] = llks[i]) {
    const sentence = [s[llvs[i]]];
    let k = i, n = 0;

    for (; n < 20; n++) {
      let begin     = llvs[k];
      scores[begin] *= 1.1;
      let [,prev]   = dijkstra(h,s,g,scores,begin,hard);

      let j = k, cur = llks[k];
      for (; prev[llvs[cur]] === 65535; j = cur, cur = llks[cur]);

      if (cur === undefined) break;

      llks[j] = llks[k = cur];
      const level = [];

      for (cur = llvs[cur]; prev[cur] < 65535; cur = prev[cur])
        level.unshift(s[cur]);

      sentence.push(level.join(' '));
    }

    if (n < 3) continue;

    yield sentence.join(' ');
  }
}


function components ()
{
  const s = words;
  const g = wordGraph (s);

  let   from = 0;
  const set  = g[from];
  let     q  = new Set();

  function addMany (v, set, q) {
    if (g[v] === set) return set;
    set.add(v);
    for (const x of g[v])
      if (q.delete(x))
        g[v] = addMany(x, set, q);
      else
        g[v] = set.add(x);
    return set;
  }

  for (let i = 1; i < g.length; i++)
    if (set.has(i))
      g[i] = addMany(i, set, q);
    else if (g[i].has(from))
      g[i] = addMany(from = i, set, q);
    else
      q.add(i);

  return {[from]: set, rest: q};
}


function easiest ()
{
  const h      = hardLetters();
  const s      = words;
  const g      = wordGraph (s);
  const scores = new Uint16Array(s.length).map (
    (_,i) => Math.round(scoreWord(h,s[i]))
  );
}
