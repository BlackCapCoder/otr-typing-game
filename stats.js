let stats = JSON.parse(localStorage.stats || '{}');

function putStat (word, time, mistake)
{
  word = word.trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
  if (word.length > 1 && word.search(/[^a-z]/) !== -1) return;

  let old = stats[word];
  if (old === undefined)
    old = [0,0,0]; // count, mistakes, sumTime

  old[0]++;
  old[2] += time
  if (mistake) old[1]++;

  stats[word] = old;
}

function saveStats () {
  localStorage.stats = JSON.stringify(stats);
}


function scoreWord (matrix, str) {
  let tot = 0;
  for (let word of str.split(/\s+/)) {
    let sum = 0;
    for (let i in word) sum += matrix[word.charCodeAt(i)-97];
    sum /= word.length;
    if (word in stats) sum *= (1 / stats[word][0]) ** 0.3; // Make a word less likely to appear in the future
    tot += sum;
  }
  return tot;
}

function hardLetters () {
  let scores = new Int32Array(26);
  let count  = new Int32Array(26);

  for (const [w, st] of Object.entries(stats)) {
    let score = st[2] / (st[0] * w.length) + 500 * st[1];
    for (let i in w) {
      scores[w.charCodeAt(i)-97] += score;
      count[w.charCodeAt(i)-97]++;
    }
  }

  for (let i in count) scores[i] /= count[i];

  return scores
}


function * easyWords () {
  const ws = words ();
  while (true) {
    const level = [];
    const hards = hardLetters();

    ws.sort((a,b) => scoreWord(hards, a) - scoreWord(hards, b));
    yield ws.slice(0, 20).join(' ');
  }
}
function * hardWords () {
  const ws = words ();
  while (true) {
    const level = [];
    const hards = hardLetters();

    ws.sort((a,b) => scoreWord(hards, b) - scoreWord(hards, a));
    yield ws.slice(0, 20).join(' ');
  }
}

