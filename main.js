
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

let currentWord = null;
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

function loadText () {
  const pick = levels.next().value;

  textLength = pick.length;

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
    diff.querySelector('.value').innerText = Math.round(score / textLength * 100);
  } else {
    diff.querySelector('.value').innerText = String(Number(currentLevel) + 1) + '/' + levelCount;
  }
}

function beginGame () {
  inp.value = "";
  disp.classList.remove('hidden');
  timeBegin = undefined;
  currentWord = undefined;
  loadText();
  nextWord();
  diff.classList.remove('hidden');
}

function endGame () {
  const now = new Date();
  const dt  = (now - timeBegin)
  const x   = calcWpm (dt, textLength);
  wpm.querySelector('.val').innerText = Math.round(x);
  disp.classList.add('hidden');

  if (window.levelCount !== undefined)
    currentLevel = (currentLevel + 1) % levelCount;

  saveStats ();

  setTimeout(() => {
    beginGame();
  }, 2000);
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

inp.onblur = () => beginGame();


function onButtonClicked (which)
{
  window.levelCount = undefined;

  window.levels
    = which === 'custom'
    ? linear (document.querySelector('#custom-text').value)
    : which === 'easy-words'
    ? easyWords ()
    : which === 'hard-words'
    ? hardWords ()
    : which === 'easy-stats'
    ? easyQuotes (0.05)
    : which === 'hard-stats'
    ? hardQuotes (0.05)
    : quotes (which === 'easy' ? 0.05 : 1.0)
    ;

  beginGame();
  mainMenu.classList.remove('active');
  inp.focus();
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

function * easyQuotes (difficulty) {
  const hards = hardLetters();
  const xs = texts.slice(0);
  xs.sort((a, b) => scoreText(hards, a) - scoreText(hards, b));
  for (let i = 0; i < 10; i++)
    yield xs[Math.round(Math.random() * xs.length * difficulty)];
  yield * easyQuotes(difficulty);
}

function * hardQuotes (difficulty) {
  const hards = hardLetters();
  const xs = texts.slice(0);
  xs.sort((a, b) => scoreText(hards, b) - scoreText(hards, a));
  for (let i = 0; i < 10; i++)
    yield xs[Math.round(Math.random() * xs.length * difficulty)];
  yield * hardQuotes(difficulty);
}
