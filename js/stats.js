let stats = {};

const letterStats =
  { score: new Int32Array (26)
  , count: new Int32Array (26)
  };


// Initialize
window.addEventListener ('load', () => {

  { // Load statistics
    try {

      if ('stats2' in localStorage)
        stats = decompressStats(localStorage.stats2);
      else if ('stats' in localStorage) {
        stats = JSON.parse(localStorage.stats);
        for (const [k, [,,s]] of Object.entries(stats)) stats[k][2] = Math.floor(s);
        localStorage.stats2 = compressStats(stats);
        // delete localStorage.stats
      } else
        stats = {};
    } catch (ex) {
      return;
    }
  }

  { // Rank letters
    for (const [w, [cnt,mis,time]] of Object.entries(stats)) {
      const score = time / (cnt * w.length);
      for (let i = 0; i < w.length; i++) {
        letterStats.count[w.charCodeAt(i)-97]++;
        letterStats.score[w.charCodeAt(i)-97]+=score;
      }
    }
  }

  updateStats();

}, 0 );

newStatCount = 0;
function putStat (word, time, mistake)
{
  time = Math.floor (time);

  // Upperbound on 7 seconds
  if (time >= 7000) return;

  word = word.trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');

  // Ignore bad words
  if (word.length < 1 || word.search(/[^a-z]/) !== -1) return;

  newStatCount++;

  let   old      = stats[word] || [0, 0, 0]; // count, mistakes, sumTime
  const oldScore = (old[2] / (old[0] * word.length)) || 0;

  old[0]++;
  old[2]+=time
  if (mistake) old[1]++;

  stats[word] = old;
  const dtScore = (old[2] / (old[0] * word.length)) - oldScore;

  for (let i = 0; i < word.length; i++) {
    letterStats.count[word.charCodeAt(i)-97]++;
    letterStats.score[word.charCodeAt(i)-97]+=dtScore;
  }
}

function saveStats ()
{
  if (newStatCount <= 0) return;
  // return console.log('save avoided!');
  localStorage.stats2 = compressStats(stats);
}

function compressStats (stats)
{
  const st   = Object.entries(stats);
  const buf  = new ArrayBuffer(st.length * 8 + st.length * 12);
  const view = new DataView(buf);

  let off = 0;
  for (const [k, [n, m, s]] of st) {
    for (let i = 0; i < k.length; i++)
      view.setUint8 (off++, k.charCodeAt(i));

    off++; // Zero terminate
    view.setUint16(off + 0, n);
    view.setUint16(off + 2, m);
    view.setUint32(off + 4, s);
    off+=8;
  }

  return String.fromCharCode.apply(null, new Uint8Array(buf, 0, off));
}

function decompressStats (st)
{
  const buf  = new ArrayBuffer(st.length);
  const view = new DataView(buf);

  for (var i=0; i < buf.byteLength; i++)
    view.setUint8(i, st.charCodeAt(i));

  const obj = {};
  let off   = 0, key, char, n, m, s;
  while (off < buf.byteLength) {
    key = "";
    while (char = view.getUint8(off++)) key += String.fromCharCode(char);
    obj[key] =
      [ view.getUint16(off + 0)
      , view.getUint16(off + 2)
      , view.getUint32(off + 4)
      ];
    off += 8;
  }

  return obj;
}


// --------------------

lastWpm = 40;
function statsWpm ()
{
  let   lc  = 0;
  return lastWpm = (60 * 1000) / (Object.entries(stats).reduce((acc, x) => { lc += x[0].length * x[1][0]; return acc + x[1][2]; }, 0) / lc * 5);
}

function statsAcc ()
{
  let   lc = 0;
  return Object.entries(stats).reduce((acc, x) => { lc += x[0].length * x[1][0]; return acc + x[1][1] * x[0].length; }, 0) / lc * 5;
}

function statsSum ()
{
  let [words, keys, mis, time] = [0,0,0,0];
  Object.entries(stats).forEach(([w,[c,m,t]]) => {
    words += c; keys += w.length * c; mis += m; time += t;
  });
  return {words, keys, mis, time};
}



// Words with strangely bad stats
function badStats (lim = 1.15)
{
  const hardest = Object.entries(stats).maximum(x => x[1][2] / (x[1][0] * x[0].length), 50).toSortedList().collect();
  let x = hardest.shift();

  while (hardest.length > 0 && x.val * lim > hardest[0].val)
    x = hardest.shift();

  return hardest;
}

function rankedStats ()
{
  return Object.entries(stats).maximum(x => x[1][2] / (x[1][0] * x[0].length), Infinity).toSortedList().collect();
}

function extendedStats ()
{
  const ret = {};
  let [words, keys, mis, time] = [0,0,0,0];

  for (const [w, [c,m,t]] of Object.entries(stats)) {
    words += c; keys += w.length * c; mis += m; time += t;
    ret[w] =
      { count:     c
      , mistakes:  m
      , totalTime: t
      , wpm:       (12000 * w.length * c) / t
      }
  }

  for (const w of Object.keys(ret)) {
    ret[w].pWords = ret[w].count / words;
    ret[w].pKeys  = (ret[w].count * w.length) / keys;
    ret[w].pMis   = ret[w].mistakes / mis;
    ret[w].pTime  = ret[w].totalTime / time;
  }

  return ret;
}



// --------------------



function scoreWord (_matrix, word)
{
  const matrix = _matrix || hardLetters();
  let sum = 0;
  for (let i = 0; i < word.length; i++) sum += matrix[word.charCodeAt(i)-97];
  if (word in stats) {
    const [c, m, t] = stats[word]
    sum = ((c + m)*(c*sum + t))/(2*c*c);
  } else sum *= 1.1;
  sum /= word.length;
  sum -= wordComfort(word) * (sum / (5*7));
  sum *= 1 + Math.max(0, word.length - 8)/26
  return sum;
}

function scoreText (matrix, str)
{
  const ws  = str.toLowerCase().replace(/[^a-z ]/g, '').split(/ +/);
  let score = ws.reduce((acc, w) => acc + scoreWord(matrix, w), 0) / ws.length;
  return score;
}

// Predicted average time per character
function scoreText2 (str)
{
  const ws  = str.toLowerCase().replace(/[^a-z ]/g, '').split(/ +/);
  const def = lastWpm * 3.333333;

  let score = ws.reduce((acc, w) =>
    acc + (w in stats ? stats[w][2] / (stats[w][0] * w.length) : def)
    , 0) / ws.length;

  score *= 1.0
         - comfort(str) * 0.25
         + Math.pow(specialCharacterPenalty(str), 1.3) * 0.5;

  return score;
}


// --------------------


function * easyWords ()
{
  const ws = unsafeWords();
  while (true) {
    const hards = hardLetters();
    yield ws . maximum (w => -scoreWord(hards, w), 20)
             . toSortedListRev ()
             . collect ()
             . map (w => w.data)
             . shuffle ()
             . join ` `;
  }
}

function * hardWords (cnt = 20)
{
  const ws = unsafeWords();

  while (true)
  {
    const letterScore = hardLetters();
    let   level       = [];

    // Words based on bad keys
    if (level.length < cnt)
      ws . maximum (w => +scoreWord(letterScore, w), cnt)
         . toSortedListRev ()
         . collect ()
         . forEach (w => level.push(w.data));

    yield level.shuffle().join` `;
  }
}
