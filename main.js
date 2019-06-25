
const calcOtr = len =>
  Math.min (4, Math.floor((len + 2) / 4));

function Word (str) {
  this.value  = str;
  this.length = str.length;

  const parts = str.match(/([^\w]*)(.+)/);
  const otr   = calcOtr (parts[2].trimEnd().length);
  this.otr = otr + parts[1].length;


  // ------ Determine when to progress to the next work

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

function Display (elem) {
  this.elem = elem;
  this.cont = elem.querySelector(".content")
  this.init = this.cont.querySelector(".init")
  this.foca = this.cont.querySelector(".focal")
  this.tail = this.cont.querySelector(".tail")

  this.setInit   = str => this.init.innerText = str;
  this.setFocal  = chr => this.foca.innerText = chr;
  this.setTail   = str => this.tail.innerText = str;

  this.setLength  = len => this.cont.style.setProperty('--len', len);
  this.setMistake = pos => this.cont.style.setProperty('--mis', pos);
  this.setCursor  = pos => this.cont.style.setProperty('--cur', pos);

  this.word = null;

  this.setWord = (w) => {
    this.word = w;
    const otr = w.otr;

    this.setInit    (w.value.substr(0, otr));
    this.setFocal   (w.value[otr]);
    this.setTail    (w.value.substr(otr+1));
    this.setLength  (w.length);
    this.setMistake (w.length+1); this.setCursor  (-1);
    this.cont.style.setProperty('--otr', otr);
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
let timeWord    = undefined;
let wordMistake = false;

const calcWpm = (dt, len) =>
  1000*60/(dt/(len/5));



// -------------------


inp.oninput = ev => {
  const txt = inp.value;
  let cur = Math.min(currentWord.length, txt.length);
  let mis = 0;

  for (; mis < txt.length && txt[mis] === currentWord.value[mis]; mis++);

  if (cur === currentWord.length) {
    if (cur === mis) return nextWord ();
    inp.value = txt.substr(0, cur);
  }

  cursor       = cur;
  mistake      = mis;
  wordMistake |= mis < cur;

  if (timeBegin === undefined) {
    timeBegin = new Date();
    diff.classList.add('hidden');
  }

  clearTimeout(peekTimeout);
  peekTimeout = setTimeout(unpeek, peekTime);

  if (mis >= currentWord.skipAt && cur === mis && text.length > 0)
    return peek ();

  curr.setCursor(cur);
  curr.setMistake(cur === mis ? txt.length+1 : mis);
  unpeek();
}

function peek () {
  if (isPeeking) return;
  if (text.length === 0) return;
  isPeeking = true;

  const w = text.pop();
  setNext()
  text.push(w);
  curr.setWord (w);
}

function unpeek () {
  if (!isPeeking) return;
  currentWord.skipAt = cursor + 4;
  isPeeking = false;
  curr.setWord(currentWord);
  curr.setCursor(cursor);
  curr.setMistake(cursor === mistake ? currentWord.length+1 : mistake);
  setNext();
}

function setNext () {
  if (text.length === 0)
    return next.elem.classList.add('hidden');
  else
    next.elem.classList.remove('hidden');

  const peek = text.pop();
  text.push(peek);
  next.setWord(peek);

  rest.innerText = text.reverse().slice(1).map(w => w.value).join('');
  text.reverse();
}

function loadText (pick) {
  currentText = pick;
  textLength  = pick.length;

  text = pick
       . replace (/[\u2018\u2019]/g, "'")
       . replace (/[\u201C\u201D]/g, '"')
       . replace (/[\u2012\u2013\u2014\u2015]/g, '-')
       . replace (/[\u2026]/g, '...')
       . replace (/\s+/g, ' ')
       . trim()
       . split(/(?=[\.\?,!:;"()]\s+\w)|(?<=\w\s+)/)
       . reverse()
       . map (w => new Word(w));

  wordCount = text.length;


  if (window.levelCount === undefined) {
    // The texts in texts.js is sorted according to this, easiest first
    let score = text.reduce((acc, w) => acc + w.skipAt, 0)
    diff.querySelector('.value').innerText = Math.round(score / textLength * 100)
        + ', ' + Math.round(scoreText(hardLetters(), pick));
  } else {
    diff.querySelector('.value').innerText = String(Number(currentLevel) + 1) + '/' + levelCount;
  }
}

function beginGame () {
  inp.value = "";
  timeBegin = undefined;
  currentWord = undefined;
  loadText(currentText || levels.next().value);
  nextWord();
  diff.classList.remove('hidden');
}

function endGame () {
  const now = new Date();
  const dt  = (now - timeBegin)
  const x   = calcWpm (dt, textLength);
  wpm.querySelector('.val').innerText = Math.round(x);

  if (window.levelCount !== undefined)
    currentLevel = (currentLevel + 1) % levelCount;

  saveStats ();

  disp.classList.add('hidden');
  setTimeout(() => {
    disp.classList.remove('hidden');
  }, 2000);

  currentText = undefined;
  beginGame();
}

function nextWord ()
{
  inp.value = "";

  if (currentWord !== undefined) {
    const now = new Date ();
    if (timeWord !== undefined)
      putStat(currentWord.value, now - timeWord, wordMistake);
    timeWord    = now;
    wordMistake = false;
  }

  if (text.length === 0) {
    endGame();
  } else {
    currentWord = text.pop();
    isPeeking   = false;
    curr.setWord (currentWord);
    curr.setCursor(0);
    setNext();
  }
}

inp.onblur = () => { if (isPlaying) beginGame(); }


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
    }})();

  isPlaying     = true;
  lastMenuFocus = document.activeElement;
  mainMenu.classList.remove('active');
  currentText = undefined;
  inp.focus();

  beginGame();
}


function * quotes (difficulty) {
  yield texts[Math.round(Math.random() * texts.length * difficulty)];
  yield * quotes(difficulty);
}

function * linear (text) {
  const xs = text.split(/\s*?\n+\s*/);
  levelCount   = xs.length;
  currentLevel = 0;
  while (true) {
    yield xs[currentLevel];
  }
}

function * easyQuotes () {
  const hards = hardLetters();
  const bt    = texts.maximum(x => -scoreText(hards, x), 20);

  for (const txt of bt.toSortedListRev())
    yield txt.data

  yield * easyQuotes();
}

function * hardQuotes () {
  const hards = hardLetters();
  const bt    = texts.maximum(x => scoreText(hards, x), 20);

  for (const txt of bt.toSortedListRev())
    yield txt.data

  yield * hardQuotes();
}


function returnToMenu () {
  if (!isPlaying) return;
  isPlaying = false;
  mainMenu.classList.add('active');
  lastMenuFocus.focus();
}

window.onkeydown = ev => {
  if (!isPlaying) return true;

  if (ev.key === "Escape") {
    if (timeBegin === undefined)
      returnToMenu();
    else
      beginGame ();
    return false;
  }

  if (ev.key === "Tab") {
    currentText = undefined;
    beginGame();
    return false;
  }
};



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
