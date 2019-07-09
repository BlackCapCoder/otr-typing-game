const calcOtr = len =>
  Math.min (4, Math.floor((len + 2) / 4));

const calcWpm = (dt, len) =>
  1000*60/(dt/(len/5));


function Word (str)
{
  this.value  = str;
  this.length = str.length;

  const parts = str.match(/([^\w]*)(.+)/);
  const otr   = calcOtr (parts[2].trimEnd().length);
  this.otr = otr + parts[1].length;


  // ------ Determine when to progress to the next word

  this.skipAt = parts[1].length + 1;

  if (parts[2].trim().length === 1)
    this.skipAt = 0;

  // As soon as possible for simple words
  if (simplewords.includes(parts[2].trim().toLowerCase()))
    return;

  const hard = str.trim().match(/[^a-z'][a-z']*$/);

  if (hard !== null && hard.index > 0) {
    this.skipAt = hard.index + 1;
  }

  if (parts[2].length >= 8)
    this.skipAt = Math.max(str.length - otr, this.skipAt);

}

const p1 = document.querySelector('.player#p1');
const p2 = document.querySelector('.player#p2');

let lastMenuFocus  = mainMenu;
let isPlaying      = false;
let isRanked       = true;
let isInstantDeath = false;
let isEndless      = false;
let wordsTyped     = 0;


function textToWords (text)
{
  const ws
    = text
    . replace (/[\u2018\u2019]/g, "'")
    . replace (/[\u201C\u201D]/g, '"')
    . replace (/[\u2012\u2013\u2014\u2015]/g, '-')
    . replace (/[\u2026]/g, '...')
    . replace (/\s+/g, ' ')
    . trimStart()
    . split(/(?=[\.\?,!:;"()]\s+\w)|(?<=\w\s+)/)

  return ws;
}

function beginGame ()
{
  _play (levels)
}

// inp.onblur = () => { if (isPlaying && !isInstantDeath) beginGame(); }


function onButtonClicked (which)
{
  window.levelCount = undefined;

  window.levels = (() => { switch (which) {
      case ('random'):         return quotes (1.0);
      case ('easy'):           return quotes (0.5);
      case ('custom'):         return linear (document.querySelector('#custom-text').value);
      case ('easy-stats'):     return easyQuotes ();
      case ('hard-stats'):     return hardQuotes ();
      case ('common-words'):   return commonWords () . chunksOf (20) . map (x => x.join(' '));
      case ('easy-words'):     return easyWords  ();
      case ('hard-words'):     return hardWords  ();
      case ('sentences'):      return commonSentence ();
      case ('long-sentences'): return longSentences ();
      case ('dijkstra'):       return djikLevel ();
      case ('accuracy'):       return instantDeath ();
      case ('new-words'):      return newWords ();
      case ('hard-letters'):   return worstLetters ();
    }})();

  isRanked       = true;
  isInstantDeath = false;
  isEndless      = false;

  if (which === 'accuracy') {
    isRanked       = false;
    isInstantDeath = true;
    isEndless      = true;
  }

  isPlaying     = true;
  lastMenuFocus = document.activeElement;
  mainMenu.classList.remove('active');
  p1.classList.remove('done');
  p2.classList.remove('done');
  p1.classList.remove('hidden');
  p2.classList.add('hidden');

  window.ctrl = new PlayerControl (document.querySelector('#p1'));
  beginGame();
}

function _play (xs)
{
  const s = inputElement (ctrl, inp, isEndless, isInstantDeath);
  const v = masterInput  (window);
  play (xs, s, v, isRanked) . then (returnToMenu);
}

function returnToMenu ()
{
  if (!isPlaying) return;
  isPlaying = false;
  saveStats();
  updateStats();
  mainMenu.classList.add('active');
  lastMenuFocus.focus();
  window.onkeydown = inp.oninput = undefined;
}


function * quotes (difficulty)
{
  yield texts[Math.round(Math.random() * texts.length * difficulty)];
  yield * quotes(difficulty);
}

function * linear (text)
{
  const xs = text.split(/\s*?\n+\s*/);
  for (const x of xs) yield x;
}

function * easyQuotes (hard=false)
{
  const hards  = hardLetters();
  const quotes = texts.concat(keyhero);
  // const scores = quotes.map(x => scoreText(hards, x));
  const scores = quotes.map(x => scoreText2(x));
  const pq     = new PriorityQueue (
    hard ? (a,b) => scores[a] > scores[b]
         : (a,b) => scores[a] < scores[b] );

  for (let i = 0; i < scores.length; i++)
    pq.push(i);

  while (true)
    yield quotes[pq.pop()];
}

function * hardQuotes () { yield * easyQuotes(true); }



function updateStats ()
{
  document.querySelector("#stats-wpm").innerText = Math.round(statsWpm()*10)/10;
  document.querySelector("#stats-acc").innerText = Math.round(statsAcc()*1000)/10 + '%';

  const keys = Array.from(hardLetters()).map((x, i) => [x, String.fromCharCode(97 + i)]).sort().map(x => x[1]);
  document.querySelector`#stats-good-keys`.innerText = keys.slice(0, 5).join` `;
  document.querySelector`#stats-bad-keys` .innerText = keys.reverse().slice(0,5).join` `;

  const words = Object.entries(stats).maximum(x => x[1][2] / (x[1][0] * x[0].length), Infinity).toSortedList().collect().map(x=>x.data[0]);
  document.querySelector`#stats-good-words`.innerText = words.slice(0, 5).join` `;
  document.querySelector`#stats-bad-words` .innerText = words.reverse().slice(0,5).join` `;

  const sums = statsSum();

  document.querySelector`#stats-num-words`.innerText = sums.words;
  document.querySelector`#stats-num-keys` .innerText = sums.keys;
  document.querySelector`#stats-num-time` .innerText = prettyTime(sums.time);
}

function prettyTime (t)
{
  const s = 1000;
  const m = 60 * s;
  const h = 60 * m;
  const d = 24 * h;

  const parts = [];
  let   x;

  if (t >= d) {
    parts.push(`${x = Math.floor(t / d)} days`);
    t -= x*d;
  }

  if (t >= h) {
    parts.push(`${x = Math.floor(t / h)} hours`);
    t -= x*h;
  }

  if (t >= m) {
    parts.push(`${x = Math.floor(t / m)} minutes`);
    t -= x*m;
  }

  if (t >= s) {
    parts.push(`${x = Math.floor(t / s)} seconds`);
    t -= x*s;
  }

  return parts.join`,`;
}


// TODO: Reset level on timeout
