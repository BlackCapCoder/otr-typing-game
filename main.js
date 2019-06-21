const calcOtr = len =>
  Math.min (4, Math.floor((len + 2) / 4));

function Word (str) {
  this.value  = str;
  this.length = str.length;

  const parts = str.match(/([^\w]*)(.+)/);
  this.otr = calcOtr (parts[2].trimEnd().length) + parts[1].length;

  this.skipAt = str.match(/[()_\-\+]/) !== null
    ? str.length - 2
    : parts[1].length + 1
    ;
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
    this.setMistake (w.length+1);
    this.setCursor  (-1);
    this.cont.style.setProperty('--otr', otr);
  }
}

const curr = new Display (document.querySelector('#current'));
const next = new Display (document.querySelector('#next'));

const inp  = document.querySelector("input")
    , wpm  = document.querySelector("#wpm")
    , disp = document.querySelector("#display")
    ;

let currentWord = null;
let isPeeking   = false;
let timeBegin   = undefined;
let textLength  = 0;

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

  if (timeBegin === undefined)
    timeBegin = new Date();

  if (mis >= currentWord.skipAt && cur === mis && text.length > 0)
    return peek ();

  if (isPeeking) {
    currentWord.skipAt = cur + 4;
    isPeeking  = false;
    curr.setWord(currentWord);
    setNext();
  }

  curr.setCursor(cur);
  curr.setMistake(cur === mis ? txt.length+1 : mis);
}
// inp.onblur = () => beginGame();

function peek () {
  if (isPeeking) return;
  if (text.length === 0) return;
  isPeeking = true;

  const w = text.pop();
  setNext()
  text.push(w);
  curr.setWord (w);
}

function setNext () {
  if (text.length === 0)
    return next.elem.classList.add('hidden');

  const peek = text.pop();
  text.push(peek);
  next.setWord(peek);
}

function loadText () {
  const pick = texts[Math.round(Math.random() * texts.length)];
  textLength = pick.length;

  text = pick
       . trim()
       . split(/(?=[\.\?,!:;"()]\s+\w)|(?<=\w\s+)/)
       . reverse()
       . map (w => new Word(w));
}

function beginGame () {
  inp.value = "";
  next.elem.classList.remove('hidden');
  disp.classList.remove('hidden');
  timeBegin = undefined;
  loadText();
  nextWord();
}

function endGame () {
  const now = new Date();
  const dt  = (now - timeBegin)
  const x   = calcWpm (dt, textLength);
  wpm.querySelector('.val').innerText = Math.round(x);
  disp.classList.add('hidden');
  setTimeout(beginGame, 2000);
}

function nextWord ()
{
  inp.value = "";

  if (text.length === 0)
    endGame();
  else {
    currentWord = text.pop();
    isPeeking   = false;
    curr.setWord (currentWord);
    curr.setCursor(0);
    setNext();
  }
}

window.onload = beginGame;
