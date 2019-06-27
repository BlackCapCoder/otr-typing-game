let stats = {};

const letterStats =
  { score: new Int32Array (26)
  , count: new Int32Array (26)
  };


// Initialize
setTimeout ( () => {

  { // Load statistics
    try {
      if ('stats' in localStorage)
        stats = JSON.parse(localStorage.stats);
    } catch (ex) {
      return;
    }
  }

  { // Rank letters
    for (const [w, st] of Object.entries(stats)) {
      const score = st[2] / (st[0] * w.length);
      for (let i = 0; i < w.length; i++) {
        letterStats.count[w.charCodeAt(i)-97]++;
        letterStats.score[w.charCodeAt(i)-97]+=score;
      }
    }
  }

  updateStats();

}, 0 );


function putStat (word, time, mistake)
{
  word = word.trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');

  // Ignore bad words
  if (word.length > 1 && word.search(/[^a-z]/) !== -1) return;

  // Upperbound on 7 seconds
  if (time >= 7000) return;

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

function saveStats () {
  localStorage.stats = JSON.stringify(stats);
}

function statsWpm () {
  let   lc = 0;
  return (60 * 1000) / (Object.entries(stats).reduce((acc, x) => { lc += x[0].length * x[1][0]; return acc + x[1][2]; }, 0) / lc * 5);
}

function statsAcc () {
  let   lc = 0;
  return Object.entries(stats).reduce((acc, x) => { lc += x[0].length * x[1][0]; return acc + x[1][1] * x[0].length; }, 0) / lc * 5;
}

// Words with strangely bad stats
function badStats (lim = 1.15) {
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


function scoreWord (matrix, word) {
  let sum = 0;
  for (let i = 0; i < word.length; i++) sum += matrix[word.charCodeAt(i)-97];
  if (word in stats) {
    const [c, m, t] = stats[word]
    sum = ((c + m)*(c*sum + t))/(2*c*c);
    // sum = (sum + (stats[word][2] / stats[word][0])) / (2 - (stats[word][1] / stats[word][0]));
  } else sum *= 1.1;
  sum /= word.length;
  sum -= wordComfort(word) * (sum / (5*7));
  sum *= 1 + Math.max(0, word.length - 8)/26
  return sum;
}

function scoreText (matrix, str) {
  const ws = str.toLowerCase().replace(/[^a-z ]/g, '').split(/ +/);
  return ws.reduce((acc, w) => acc + scoreWord(matrix, w), 0) / ws.length;
}

function hardLetters () {
  let ret = new Int32Array(26);
  for (let i = 0; i < ret.length; i++)
    ret[i] = letterStats.score[i] / letterStats.count[i];
  return ret;
}


function doubles () {
  const tim = new Int32Array(26 * 26).fill(0);
  const cnt = new Int32Array(26 * 26).fill(0);

  for (const [w, [c, m, t]] of Object.entries(stats)) {
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
          = tim[i*26+j] / cnt[i*26+j];
    }
  }

  return final;
}


// --------------------

function * easyWords () {
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
function * hardWords (cnt = 20) {
  const ws = unsafeWords();

  while (true) {
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
