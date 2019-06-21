const init = document.querySelector("#init")
    , foca = document.querySelector("#focal")
    , tail = document.querySelector("#tail")
    , inde = document.querySelector("#indent")
    , cont = document.querySelector("#content")
    , inp  = document.querySelector("input")
    , wpm  = document.querySelector("#wpm")
    , disp = document.querySelector("#display")
    ;

let currentWord = '';
let currentOtr  = 4;
let isPeeking   = false;
let shouldPeek  = false;
let timeBegin   = undefined;
let textLength  = 0;

const calcOtr = len =>
  Math.min (4, Math.floor((len + 2) / 4));

const calcWpm = (dt, len) =>
  1000*60/(dt/(len/5));


function putWord (w, otr) {
  init.innerText = w.substr(0, otr);
  foca.innerText = w[otr];
  tail.innerText = w.substr(otr+1);
  inde.innerText = ' '.repeat(w.length - otr*2 - 1);
  cont.style.setProperty('--len', w.length);
  cont.style.setProperty('--mis', w.length+1);
  cont.style.setProperty('--cur', 0);
}



// -------------------

inp.oninput = ev => {
  const txt = inp.value;
  let cur = txt.length;
  let mis = 0;

  for (; mis < txt.length && txt[mis] === currentWord[mis]; mis++);

  if (cur === currentWord.length) {
    if (cur === mis) return nextWord ();
    inp.value = txt.substr(0, cur);
  }

  if (timeBegin === undefined)
    timeBegin = new Date();

  if (shouldPeek && cur === mis)
    return peek ();

  unPeek ()

  cont.style.setProperty('--cur', cur);
  cont.style.setProperty ('--mis',
    cur === mis ? txt.length+1 : mis
  );
}

function unPeek () {
  if (!isPeeking) return;
  isPeeking = shouldPeek = false;
  putWord(currentWord, currentOtr);
}

function peek () {
  if (isPeeking) return;
  if (text.length === 0) return;
  isPeeking = true;

  const w   = text.pop(); text.push(w);
  const otr = calcOtr (w.trimEnd().length);
  putWord (w, otr);
}

function loadText () {
  const pick = texts[Math.round(Math.random() * texts.length)];
  textLength = pick.length;

  text = pick
       . split(/(?=[\.\?,!:;]\s+\w)|(?<=\w\s+)/)
       . reverse()
  text[0]= text[0].trimEnd();
}

function beginGame () {
  inp.value = "";
  shouldPeek = true;
  loadText();
  nextWord();
}

function endGame () {
  const now = new Date();
  const dt  = (now - timeBegin)
  const x   = calcWpm (dt, textLength);
  wpm.querySelector('.val').innerText = Math.round(x);
  disp.classList.add('hidden');
  setTimeout(() => {
    disp.classList.remove('hidden');
    timeBegin = undefined;
    beginGame();
  }, 2000);
}

function nextWord ()
{
  inp.value = "";

  if (text.length === 0)
    endGame();
  else {
    currentWord = text.pop();
    currentOtr  = calcOtr (currentWord.trimEnd().length);
    putWord(currentWord, currentOtr);
    isPeeking   = false;
    shouldPeek  = currentWord.match(/[()_\-\+]/) === null;
  }
}

window.onload = beginGame;
