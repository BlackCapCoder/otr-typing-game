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
      const score = st[2] / (st[0] * w.length) + 500 * st[1];
      for (let i in w) {
        letterStats.count[w.charCodeAt(i)-97]++;
        letterStats.score[w.charCodeAt(i)-97]+=score;
      }
    }
  }

}, 0 );


function putStat (word, time, mistake)
{
  word = word.trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
  if (word.length > 1 && word.search(/[^a-z]/) !== -1) return;

  let   old      = stats[word] || [0, 0, 0]; // count, mistakes, sumTime
  const oldScore = (old[2] / (old[0] * word.length) + 500 * old[1]) || 0;

  old[0]++;
  old[2]+=time
  if (mistake) old[1]++;

  stats[word] = old;
  const dtScore = (old[2] / (old[0] * word.length) + 500 * old[1]) - oldScore;

  for (let i in word) {
    letterStats.count[word.charCodeAt(i)-97]++;
    letterStats.score[word.charCodeAt(i)-97]+=dtScore;
  }
}

function saveStats () {
  localStorage.stats = JSON.stringify(stats);
}


function scoreWord (matrix, word) {
  let sum = 0;
  for (let i in word) sum += matrix[word.charCodeAt(i)-97];
  sum /= word.length;
  if (word in stats) sum *= (1 / stats[word][0]) ** 0.3; // Make a word less likely to appear in the future
  return sum;
}

function scoreText (matrix, str) {
  const ws = str.toLowerCase().replace(/[^a-z ]/g, '').split(/ +/);
  return ws.reduce((acc, w) => acc + scoreWord(matrix, w), 0) / ws.length;
}

function hardLetters () {
  let ret = new Int32Array(26);
  for (let i in ret) ret[i] = letterStats.score[i] / letterStats.count[i];
  return ret;
}


function * easyWords () {
  const ws = unsafeWords();
  while (true) {
    const level = [];
    const hards = hardLetters();
    const bt    = maximum (w => -scoreWord(hards, w), 20, ws);
    yield Array.from(bt.toSortedList()).map(w => w.data).join(' ');
  }
}
function * hardWords () {
  const ws = unsafeWords();
  while (true) {
    const level = [];
    const hards = hardLetters();
    const bt    = maximum (w => scoreWord(hards, w), 20, ws);
    yield Array.from(bt.toSortedList()).map(w => w.data).join(' ');
  }
}


