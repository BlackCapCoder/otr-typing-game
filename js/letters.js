function specialCharacterPenalty (str)
{
  const ms = str.match(/[\.\?\-!] +[A-Z]|[A-Z]+|[^a-z; ]/g);
  if (ms === null) return 0;
  const ss = str.match(/ +/g);
  let   wc = 1;
  if (ss !== null) wc += ss.length;

  return Math.min(1, ms.length / wc);
}

function hardLetters ()
{
  let ret = new Int32Array(26);
  for (let i = 0; i < ret.length; i++)
    ret[i] = letterStats.score[i] / letterStats.count[i];
  return ret;
}

function doubles ()
{
  const tim = new Int32Array(26 * 26).fill(0);
  const cnt = new Int32Array(26 * 26).fill(0);

  for (const [w, [c,, t]] of Object.entries(stats)) {
    const s = t / (c * w.length);
    for (let i = 0; i < w.length - 1; i++) {
      const ix = (w.charCodeAt(i)-97) * 26 + (w.charCodeAt(i+1)-97);
      tim[ix]+=s;
      cnt[ix]++
    }
  }

  const final = {};

  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      if (cnt[i*26+j])
        final[String.fromCharCode(97+i) + String.fromCharCode(97+j)]
          = [Math.floor(tim[i*26+j] / cnt[i*26+j]), cnt[i*26+j]];
    }
  }

  return final;
}

function scoreLettersN (n=1)
{
  const final = {};

  for (const [w, [c,,t]] of Object.entries(stats)) {
    if (w.length < n) continue;

    const s = t / (c * w.length);
    let ix = 0, pow = 1;

    for (let i = 0; i < n; i++, pow *= 26)
      ix += (w.charCodeAt(i) - 97) * pow;

    if (!(ix in final))
      final[ix] = [s, 1];
    else
      final[ix] = [final[ix][0] + s, final[ix][1] + 1];

    for (let i = n; i < w.length; i++) {
      ix = (ix - w.charCodeAt(i-n) + 97 + (w.charCodeAt(i) - 97) * pow) / 26;

      if (!(ix in final))
        final[ix] = [s, 1];
      else
        final[ix] = [final[ix][0] + s, final[ix][1] + 1];
    }
  }

  return final;
}

function letterFreq (n=1)
{
  const final = {};
  const rx    = cleanWords(0);
  const txts  = quoteWords();

  txts.forEach (txt => {
    txt . replace (rx, '')
        . toLowerCase()
        . trim()
        . split(' ')
        . forEach (w => {
    if (w.length === 0 || w.length > n) return;

    let o = final;

    for (let i = 0; i < w.length; i++) {
      if (w[i] in o)
        o = o[w[i]];
      else
        o = o[w[i]] = {cnt: 0};

      o.cnt++;
    }

    if ('$' in o)
      o.$++;
    else
      o.$ = 1;
    });
  });

  let cnt = 0;
  for (const k of Object.keys(final))
    cnt += final[k].cnt;
  final.cnt = cnt;

  return final;
}

function decodeLettersN (n, x)
{
  let ret = "";
  for (let i = 0; i < n; i++, x /= 26)
    ret += String.fromCharCode((x % 26) + 97);
  return ret;
}


function letterScore (from=1, to=3, hard=true)
{
  const mss = [];
  // let   size = 0;

  for (let n = from; n <= to; n++)
  {
    const ls  = scoreLettersN (n);
    const pqw = new PriorityQueue (
      hard ? (a,b) => ls[a] > ls[b]
           : (a,b) => ls[a] < ls[b]
    );
    const ms  = {};
    const s   = n + n>>1;

    for (const [k, [s, c]] of Object.entries(ls)) {
      ls[k] = s / c;
      pqw.push(k);
    }

    for (let i = 0; i < Math.pow(4, n) && !pqw.isEmpty(); i++) {
      const x = decodeLettersN(n, pqw.pop());
      let m = ms;
      for (let i = 0; i < n-1; i++)
        m = x[i] in m ? m[x[i]] : m[x[i]] = {};
      if (x[i] in m)
        m[x[n-1]] += s;
      else {
        m[x[n-1]] = s;
        // size++;
      }
    }

    mss.push(ms);
  }

  return mss;
}

function letterScoreWord (ls, w)
{
  let score = 0;
  const m   = [];

  for (let j = 0; j < w.length; j++) {
    for (let r = 0; r < ls.length; r++)
      m.push(ls[r]);

    for (let k = 0, len = m.length; k < len; k++) {
      let o = m.shift();
      if (!(w[j] in o)) continue;
      o = o[w[j]];
      if (isFinite(o))
        score += o;
      else
        m.push(o);
    }
  }

  return score;
}


function * worstLetters (hard=true, trim=0.25)
{
  const ls     = letterScore(1, 6, hard);
  const ws     = words;
  const scores = new Int32Array (ws.length) . map ((_, i) => letterScoreWord(ls, ws[i]));

  // Hardest words
  const hs = new PriorityQueue ((a,b) => scores[a] > scores[b]);
  for (let i = 0; i < ws.length; i++) {
    if (scores[i] < 2) continue;
    hs.push(i)
  }

  const hl = hardLetters();
  const ss = new Uint16Array(ws.length).map((_, i) => scoreWord(hl, ws[i]));
  const pq = new PriorityQueue (
    trim >= 0 ? (a,b) => ss[a] < ss[b]
              : (a,b) => ss[a] > ss[b]
  );

  // Easiest of the 10% hardest
  for (let i = 0; i < hs.size / 10; i++)
    pq.push(hs.pop());

  // Remove 25% easiest
  for (let i = 0; i < pq.size * Math.abs(trim); i++)
    pq.pop()

  while (pq.size > 0) {
    console.log(`${Math.ceil(pq.size / 20)} levels left`);

    const sentence = [];
    for (let i = 0; i < 20 && !pq.isEmpty(); i++)
      sentence.push(ws[pq.pop()])

    yield sentence.join(' ');
  }
}

