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
let shouldPeek  = 0;
let timeBegin   = undefined;
let textLength  = 0;

const calcOtr = len =>
  Math.min (4, Math.floor((len + 2) / 4));

const calcWpm = (dt, len) =>
  1000*60/(dt/(len/5));


function putWord (w, otr, cur = 0) {
  init.innerText = w.substr(0, otr);
  foca.innerText = w[otr];
  tail.innerText = w.substr(otr+1);
  inde.innerText = ' '.repeat(Math.max(0,w.length - otr*2 - 1));
  cont.style.setProperty('--len', w.length);
  cont.style.setProperty('--mis', w.length+1);
  cont.style.setProperty('--cur', cur);
}



// -------------------

inp.oninput = ev => {
  const txt = inp.value;
  let cur = Math.min(currentWord.length, txt.length);
  let mis = 0;

  for (; mis < txt.length && txt[mis] === currentWord[mis]; mis++);

  if (cur === currentWord.length) {
    if (cur === mis) return nextWord ();
    inp.value = txt.substr(0, cur);
  }

  if (timeBegin === undefined)
    timeBegin = new Date();

  if (mis >= shouldPeek && cur === mis && text.length > 0)
    return peek ();

  if (isPeeking) {
    shouldPeek = cur + 4;
    isPeeking = false;
    putWord(currentWord, currentOtr);
  }

  cont.style.setProperty ('--cur', cur);
  cont.style.setProperty ('--mis',
    cur === mis ? txt.length+1 : mis
  );
}
inp.onblur = () => beginGame();

function peek () {
  if (isPeeking) return;
  if (text.length === 0) return;
  isPeeking = true;

  const w     = text.pop(); text.push(w);
  const parts = w.match(/([^\w]*)(.+)/);
  const otr   = calcOtr (parts[2].trimEnd().length) + parts[1].length;
  putWord (w, otr, -1);
}

function loadText () {
  const pick = texts[Math.round(Math.random() * texts.length)];
  textLength = pick.length;

  text = pick
       . trim()
       . split(/(?=[\.\?,!:;"()]\s+\w)|(?<=\w\s+)/)
       . reverse();
}

function beginGame () {
  inp.value = "";
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
    const parts = currentWord.match(/([^\w]*)(.+)/);
    currentOtr  = calcOtr (parts[2].trimEnd().length) + parts[1].length;
    putWord(currentWord, currentOtr);
    isPeeking   = false;
    shouldPeek  = currentWord.match(/[()_\-\+]/) !== null
      ? currentWord.length - 2
      : parts[1].length + 1
      ;
  }
}

window.onload = beginGame;
