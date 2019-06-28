
const calcOtr = len =>
  Math.min (4, Math.floor((len + 2) / 4));

function Word (str)
{
  this.value  = str;
  this.length = str.length;

  const parts = str.match(/([^\w]*)(.+)/);
  const otr   = calcOtr (parts[2].trimEnd().length);
  this.otr = otr + parts[1].length;


  this.wordStart = str.search(/\w/);
  this.wordEnd   = str.search(/[^\w]*$/);

  // ------ Determine when to progress to the next word

  this.skipAt = parts[1].length + 1;

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

function Display (elem)
{
  this.elem = elem;
  this.cont = elem.querySelector(".content")
  this.init = this.cont.querySelector(".init")
  this.tail = this.cont.querySelector(".tail")

  this.setInit   = str => this.init.innerText = str;
  this.setTail   = str => this.tail.innerText = str;

  this.setMistake = pos => {
    this.cont.style.setProperty('--mis', pos);
  };
  this.setCursor  = pos => {
    this.cont.style.setProperty('--cur', pos);
    this.cont.style.setProperty('--focus', Math.max(pos, this.word.otr));
    this.cont.style.setProperty('--anim', 1);
  };

  this.word = null;

  this.setWord = (w) => {
    this.word = w;
    const otr = w.otr;

    this.setInit    (w.value.substr(0, otr));
    this.setTail    (w.value.substr(otr));
    this.setMistake (w.length);
    this.setCursor  (-2);
    this.cont.style.setProperty('--anim', 0);
  }
}



const curr = new Display (document.querySelector('#current'));
const next = new Display (document.querySelector('#next'));

const inp  = document.querySelector("input")
    , wpm  = document.querySelector("#wpm")
    , disp = document.querySelector("#display")
    , rest = document.querySelector("#rest")
    , diff = document.querySelector("#difficulty")
    , mainMenu = document.querySelector('#main-menu')
    ;

let lastMenuFocus = mainMenu;
let isPlaying     = false;

let currentWord = null;
let currentText = undefined;

let isPeeking   = false;
let timeBegin   = undefined;
let textLength  = 0;
let wordCount   = 0;
let peekTimeout = -1;
let peekTime    = 400;
let cursor      = 0;
let mistake     = 0;
let wordMistake = false;

let isRanked       = true;
let isInstantDeath = false;
let isEndless      = false;
let wordsTyped     = 0;


const calcWpm = (dt, len) =>
  1000*60/(dt/(len/5));



// -------------------

let timeWordBegin, timeWordEnd, wordDone;

inp.oninput = ev => {
  if (!isPlaying) return;

  const txt = inp.value;
  let cur = Math.min(currentWord.length, txt.length);
  let mis = 0;

  // Mistakes?
  for (; mis < txt.length && txt[mis] === currentWord.value[mis]; mis++);

  // Global variables for gui and stuff
  cursor       = cur;
  mistake      = mis;
  wordMistake |= mis < cur && cur > currentWord.wordStart;

  // Write stats
  if (cur === mis && timeWordBegin === undefined && cur >= currentWord.wordStart && cur <= currentWord.wordEnd) {
    if (currentWord.wordStart === 0 && cur > 0)
      timeWordBegin = timeWordEnd;
    else
      timeWordBegin = ev.timeStamp;
    timeWordEnd = undefined;
  }
  if (cur === mis && cur >= currentWord.wordEnd) {
    timeWordEnd = ev.timeStamp;
    if (timeWordBegin !== undefined && !wordDone) {
      if (isRanked)
        putStat(currentWord.value, timeWordEnd - timeWordBegin, wordMistake);
      if (isEndless)
        diff.querySelector('.value').innerText = ++wordsTyped;
      wordDone = true;
    }
    timeWordBegin = undefined;
  }

  // Instant death
  if (isInstantDeath && cur > mis) {
    isPlaying = false;
    setTimeout(lose, 500);
  }

  // Are we done?
  if (cur === currentWord.length) {
    if (cur === mis) return nextWord ();
    inp.value = txt.substr(0, cur);
  }

  // User is typing!
  if (timeBegin === undefined) {
    timeBegin = new Date();
    if (!isEndless)
      diff.classList.add('hidden');
  }

  // If he stops he might have forgot the word
  clearTimeout(peekTimeout);
  peekTimeout = setTimeout(unpeek, peekTime);

  // Mistake?
  if (mis >= currentWord.skipAt && cur === mis && text.length > 0)
    return peek ();

  // Update gui
  curr.setCursor(cur);
  curr.setMistake(cur === mis ? txt.length+1 : mis);
  unpeek();
}

function peek ()
{
  if (isPeeking) return;
  if (text.length === 0) return;
  isPeeking = true;

  const w = text.pop();
  setNext()
  text.push(w);
  curr.setWord (w);
}

function unpeek ()
{
  if (!isPeeking) return;
  currentWord.skipAt = cursor + 4;
  isPeeking = false;
  curr.setWord(currentWord);
  curr.setCursor(cursor);
  curr.setMistake(cursor === mistake ? mistake+1 : mistake);
  setNext();
}

function setNext ()
{
  if (text.length === 0) {
    if (isEndless) {
      loadText(levels.next().value);
    } else {
      return next.elem.classList.add('hidden');
    }
  }
  else
    next.elem.classList.remove('hidden');

  const peek = text.pop();
  text.push(peek);
  next.setWord(peek);

  if (!isEndless) {
    rest.innerHTML = text.reverse().slice(1).map(w => w.value).join('');
    text.reverse();
  }
}

function loadText (pick)
{
  if (isEndless && pick[pick.length -1] !== ' ')
    pick += ' ';

  currentText = pick;
  textLength  = pick.length;

  text = pick
       . replace (/[\u2018\u2019]/g, "'")
       . replace (/[\u201C\u201D]/g, '"')
       . replace (/[\u2012\u2013\u2014\u2015]/g, '-')
       . replace (/[\u2026]/g, '...')
       . replace (/\s+/g, ' ')
       . trimStart()
       . split(/(?=[\.\?,!:;"()]\s+\w)|(?<=\w\s+)/)
       . reverse()
       . map (w => new Word(w));



  wordCount = text.length;

  if (isEndless) return

  if (window.levelCount === undefined) {
    // The texts in texts.js is sorted according to this, easiest first
    let score = text.reduce((acc, w) => acc + w.skipAt, 0)
    diff.querySelector('.value').innerText = Math.round(score / textLength * 100)
        + ', ' + Math.round(scoreText(hardLetters(), pick));
  } else {
    diff.querySelector('.value').innerText = String(Number(currentLevel) + 1) + '/' + levelCount;
  }
}

function lose ()
{
  endGame ();
}

function beginGame ()
{
  timeWordBegin = timeWordEnd = timeBegin = currentWord = undefined
  wordsTyped    = 0;
  inp.value = "";
  loadText(currentText || levels.next().value);
  nextWord();

  if (isEndless)
    diff.querySelector('.value').innerText = "Endless.."

  diff.classList.remove('hidden');
}

function endGame ()
{

  if (isEndless) {
    wpm.querySelector('.val').innerText = wordsTyped + ' words typed'
  } else {
    const now = new Date();
    const dt  = (now - timeBegin)
    const x   = calcWpm (dt, textLength);
    wpm.querySelector('.val').innerText = 'WPM ' + Math.round(x);
  }

  if (window.levelCount !== undefined)
    currentLevel = (currentLevel + 1) % levelCount;

  if (isRanked)
    saveStats ();

  isPlaying = false;
  disp.classList.add('hidden');
  setTimeout(() => {
    isPlaying = true;
    inp.value = "";
    inp.focus();
    disp.classList.remove('hidden');
  }, 2000);

  if (isInstantDeath)
    levels = instantDeath();

  currentText = undefined;
  beginGame();
}

function nextWord ()
{
  inp.value = "";

  if (currentWord !== undefined) {
    const now = new Date ();
    wordMistake = false;
  }

  if (text.length === 0) {
    endGame();
  } else {
    isPeeking   = wordDone = false;
    currentWord = text.pop();
    curr.setWord (currentWord);
    curr.setCursor(0);
    setNext();
  }
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
      case ('easy-words'):     return easyWords  ();
      case ('hard-words'):     return hardWords  ();
      case ('sentences'):      return commonSentence ();
      case ('long-sentences'): return longSentences ();
      case ('dijkstra'):       return shortestTree ();
      case ('accuracy'):       return instantDeath ();
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
  currentText = undefined;
  inp.focus();

  beginGame();
}


function * quotes (difficulty)
{
  yield texts[Math.round(Math.random() * texts.length * difficulty)];
  yield * quotes(difficulty);
}

function * linear (text)
{
  const xs = text.split(/\s*?\n+\s*/);
  levelCount   = xs.length;
  currentLevel = 0;
  while (true) {
    yield xs[currentLevel];
  }
}

function * easyQuotes ()
{
  const hards = hardLetters();
  const bt    = texts.maximum(x => -scoreText(hards, x), 20);

  for (const txt of bt.toSortedListRev())
    yield txt.data

  yield * easyQuotes();
}

function * hardQuotes ()
{
  const hards = hardLetters();
  const bt    = texts.maximum(x => scoreText(hards, x), 20);

  for (const txt of bt.toSortedListRev())
    yield txt.data

  yield * hardQuotes();
}


function returnToMenu ()
{
  if (!isPlaying) return;
  isPlaying = false;
  updateStats();
  mainMenu.classList.add('active');
  lastMenuFocus.focus();
}

window.onkeydown = ev =>
{
  if (!isPlaying) return true;

  if (ev.key === "Escape") {
    if (timeBegin === undefined)
      returnToMenu();
    else {
      beginGame ();
      inp.focus ();
    }
    return false;
  }

  if (ev.key === "Tab") {
    currentText = undefined;
    beginGame();
    return false;
  }
};

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

  const sums = Object.entries(stats).reduce(([xa, ya, za], [w, [xb, yb, zb]]) =>
    [xa+xb, ya+yb, za+zb, xa*w.length], [0,0,0,0]);

  document.querySelector`#stats-num-words`.innerText = sums[0];
  document.querySelector`#stats-num-keys` .innerText = sums[3];
  document.querySelector`#stats-num-time` .innerText = prettyTime(sums[2]);
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


// ----------------

class HalfZipper
{
  constructor (src) {
    this.right = (function*(){for(const x of src)yield x})();
    moveRight();
  }

  moveRight () {
    if (this.atEnd) return false;
    const nxt = this.right.next();
    this.atEnd = nxt.done;
    this.cursor = nxt.value;
    return true;
  }
}

// TODO: Reset level on timeout
