const cleanWords = short => new RegExp (''
  + /(?<= |^)[^a-z ]+/.source             // leading  special characters
  + /|(?<=[a-z])[^a-z ]+(?= |$)/.source   // trailing special characters
  + '|( |^)('
  + /[^a-z ]*[a-z]+[^a-z ][^ ]+/.source   // drop entire word containing special characters
  + '|[^a-z ]*[a-z]{0,' + String(short) + '}[^a-z ]*'  // drop short words, only one space between words
  + ')(?= |$)'
, 'gi');

const abbrivs = Object.freeze({
  "n't" : ' not',
  "'ll" : ' will',
  "'ve" : ' have',
  "'d" : ' would',
  "'m" : ' am',
  "'re" : ' are',
  "it's" : 'it is'
});

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

function * commonSentence (minLen = 10)
{
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

function * newWords (hard = false)
{
  const h      = hardLetters();
  const s      = words;
  const scores = new Uint16Array(s.length).map (
    (_,i) => Math.round(scoreWord(h,s[i]))
  );

  const used = new Set(Object.keys(stats));
  const pq   = new PriorityQueue (
    hard ? (a,b) => scores[a] > scores[b]
         : (a,b) => scores[a] < scores[b]
  );

  for (let i = 0; i < s.length; i++)
    if (!used.has(s[i]))
      pq.push(i);

  const sentence = [];
  while (!pq.isEmpty())
  {
    sentence.push(s[pq.pop()]);
    if (sentence.length >= 20)
      yield sentence.shuffle().splice(0).join(' ');
  }
}

function * commonWords (maxlen = 10)
{
  const freq = letterFreq(maxlen);

  while (true) {
    let o   = freq;
    let str = "";
    let n = Math.round(Math.random() * o.cnt);

    for (let i = 0; i < maxlen; i++) {
      if (n - (o.$ || 0) < 0) break;
      for (const k of Object.keys(o)) {
        if (k === '$' || k === 'cnt') continue;
        if (n - o[k].cnt <= 0) {
          str += k;
          o = o[k]; break;
        }
        n -= o[k].cnt;
      }
    }

    yield str;
  }
}

function distinctWords ()
{
  const ws = words, res = [];
  let prev = ws[0];

  for (let i = 1; i < ws.length; i++) {
    if (ws[i].startsWith(prev)) continue;
    res.push(prev);
    prev = ws[i];
  }
  res.push(prev);
  return res;
}
