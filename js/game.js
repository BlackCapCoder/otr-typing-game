class WordControl
{
  constructor (elem)
  {
    this.elem     = elem;
    this.elemInit = elem.querySelector('.init');
    this.elemTail = elem.querySelector('.tail');
  }

  get init ( ) { return this.elemInit . innerText     }
  get tail ( ) { return this.elemTail . innerText     }

  set init (x) { return this.elemInit . innerText = x }
  set tail (x) { return this.elemTail . innerText = x }

  get indexMistake ( ) { return this.elem.style.getProperty('--mis')   }
  get indexCursor  ( ) { return this.elem.style.getProperty('--cur')   }
  get indexFocus   ( ) { return this.elem.style.getProperty('--focus') }
  get animate      ( ) { return this.elem.style.getProperty('--anim')  }

  set indexMistake (x) { return this.elem.style.setProperty('--mis',   x) }
  set indexCursor  (x) { return this.elem.style.setProperty('--cur',   x) }
  set indexFocus   (x) { return this.elem.style.setProperty('--focus', x) }
  set animate      (x) { return this.elem.style.setProperty('--anim',  x) }

  get isHidden ( ) { return this.elem.classList.contains('hidden'); }
  set isHidden (x) {
    if (x)
      this.elem.classList.add('hidden');
    else
      this.elem.classList.remove('hidden');
  }

  loadWord (w, meta = true)
  {
    this.init         = w.value.substr(0, w.otr);
    this.tail         = w.value.substr(w.otr);
    this.indexFocus   = w.otr;
    this.animate      = 0;
    if (!meta) return;
    this.indexCursor  = -2;
    this.indexMistake = w.value.length;
  }
}

class WordControls
{
  constructor (rest, ...ctrls) {
    this.rest      = rest;
    this.ctrls     = ctrls;
    this.buffer    = [];
    this.offset    = 0;
    this.skipTimer = -1;
  }

  set cursor (x) {
    this._cursor = x;

    if (this.offset === 0) {
      this.ctrls[0].animate     = Number(x > 0);
      this.ctrls[0].indexCursor = x;
      if (this.buffer.length > 0)
        this.ctrls[0].indexFocus = Math.max(x, this.buffer[0].otr);
    }

    return x;
  }

  set mistake (x) {
    this._mistake = x;
    if (this.offset === 0) this.ctrls[0].indexMistake = x;
    return x;
  }

  update (cur, mis, lim = 1, timeout = 500)
  {
    this.cursor  = cur;
    this.mistake = mis;

    clearTimeout(this.skipTimer);

    if (cur > mis) {
      this.onMistake();
    } else if (cur > this.skipAt) {
      this.peek(lim);
      this.skipTimer = setTimeout(() => this.onMistake(), timeout);
    }
  }

  onMistake () {
    this.skipAt = Math.max(this._mistake + 4, this.skipAt);
    this.resetPeek ();
  }


  initialize (s, trimRest = true)
  {
    clearTimeout(this.skipTimer);

    this.offset  = 0;
    this.stream  = s;
    this.buffer  = take (this.ctrls.length, s);

    let i = 0, len = 0;

    for (; i < Math.min(this.ctrls.length, this.buffer.length); i++) {
      this.ctrls[i].loadWord(this.buffer[i]);
      this.ctrls[i].isHidden = false;
      len += this.buffer[i].length;
    }

    for (; i < this.ctrls.length; i++)
      this.ctrls[i].isHidden = true;

    if (this.buffer.length === 0) return;

    if (trimRest)
      this.rest.innerText = this.rest.innerText.substr(len);

    this.cursor = 0;
    this.skipAt = this.buffer[0].skipAt;
  }

  step ()
  {
    clearTimeout(this.skipTimer);

    if (this.offset === 1) {
      this.buffer.shift ();
      this.offset  = 0;
      this.cursor  = 0;
      this.mistake = this.buffer[0].value.length;
      this.skipAt  = this.buffer[0].skipAt;
      return;
    }

    this.peek();
    this.buffer.shift ();
    this.offset = 0;
    this.cursor = 0;

    if (this.buffer.length > 0)
      this.skipAt = this.buffer[0].skipAt;
  }

  peek (lim = -1)
  {
    if (lim > -1 && this.offset >= lim) return;

    let n = this.buffer.length - (++this.offset);
    for (; n < this.ctrls.length; n++) {
      const x = this.stream.next();
      if (x.done) break;
      this.buffer.push(x.value);
    }

    if (n <= 0) {
      this.offset--;
      return;
    }

    let len = this.buffer[n].length;
    let i   = 0;
    for (; i < n; i++)
      this.ctrls[i].loadWord(this.buffer[this.offset + i], false);

    for (; i < this.ctrls.length; i++) {
      this.ctrls[i].isHidden = true;
    }

    this.ctrls[0].indexCursor = -2;
    this.rest.innerText = this.rest.innerText.substr(len);
  }

  resetPeek ()
  {
    if (this.offset === 0) return;

    for (let i = this.buffer.length - this.offset; i < this.buffer.length; i++)
      this.rest.innerText
        = this.buffer[this.buffer.length - this.offset].value
        + this.rest.innerText;

    for (let i = 0; i < Math.min(this.ctrls.length, this.buffer.length); i++) {
      this.ctrls[i].loadWord(this.buffer[i], false);
      this.ctrls[i].isHidden = false;
    }

    this.offset  = 0;
    this.cursor  = this._cursor;
    this.mistake = this._mistake;
  }
}

class PlayerControl
{
  constructor (elem)
  {
    this.elem        = elem
    this.elemRest    = elem.querySelector('.next .rest');
    this.elemWpm     = elem.querySelector('.wpm');
    this.words = new WordControls
      ( this.elemRest
      , new WordControl(elem.querySelector ('.current .content'))
      , new WordControl(elem.querySelector ('.next    .content'))
      );
  }

  get rest ( ) { return this.elemRest . innerText     }
  set rest (x) { return this.elemRest . innerText = x }

  get wpm ( ) { return this.elemWpm . innerText     }
  set wpm (x) { return this.elemWpm . innerText = x }

  get isDone ( ) { return this.elem.classList.contains('done'); }
  set isDone (x) {
    if (x)
      this.elem.classList.add('done');
    else
      this.elem.classList.remove('done');
  }

  get isHidden ( ) { return this.elem.classList.contains('hidden'); }
  set isHidden (x) {
    if (x)
      this.elem.classList.add('hidden');
    else
      this.elem.classList.remove('hidden');
  }
}


async function waitIO (elem, f)
{
  return await new Promise (r => elem.oninput = x => r(f(x)));
}

async function * userInput (elem)
{
  while (true)
    yield await waitIO (elem, ev => ([elem.value, ev.timeStamp]));
}


const inputElement = (ctrl, inpElem, endless = false, instantDeath = false) => l =>
{
  const ui     = userInput(inpElem);
  const [a, b] = dup    (2, stream(textToWords(l)));

  const inp = a.map (w => {
    inpElem.value     = '';
    inpElem.maxLength = w.length;

    return [w, typeString (w, ui).map(xs => {
        ctrl.words.update(xs[0], xs[1]);
        return xs;
      }).then(() => {
        ctrl.words.step ();
      })];
  });

  ctrl.rest = endless ? '' : l;
  ctrl.words.initialize
    (b.map (w => new Word(w)));

  const res
    = results(inp, instantDeath)
    . then (async (r) => {
        if (endless) return r;
        const wpm   = calcWpm(r[1], r[0]);
        ctrl.wpm    = `${Math.round(wpm*10)/10} wpm`;
        ctrl.isDone = true;
        await sleep(2000);
        ctrl.isDone = false;
        return r;
      });

  inpElem.focus();

  return res;
}

async function * typeString (str, is)
{
  for (let x; !(x = await is.next()).done;) {
    const [inp, time] = x.value;

    let cur = Math.min (str.length, inp.length);
    let mis = 0;

    for (; mis < inp.length && inp[mis] === str[mis]; mis++);
    yield [cur, mis, time];
    if (cur === mis && cur === str.length) return;
  }
}


async function * interleave (as, bs) {
  let a = new Promise (async (r) => r ([0, (await as.next())]));
  let b = new Promise (async (r) => r ([1, (await bs.next())]));

  while (true) {
    let r = await Promise.race ([a, b]);

    if (r[1].done) return [r[0], r[1].value];
    yield [r[0], r[1].value];

    if (r[0] === 0) {
      a = new Promise (async (r) => r ([0, (await as.next())]));
    }
    else {
      b = new Promise (async (r) => r ([1, (await bs.next())]));
    }
  }
}

async function * masterInput (inp)
{
  while (true)
    yield await new Promise (r => inp.onkeydown = ev => {
      switch (ev.key) {
        case ('break'): return r();
        case ('Escape'):
        case ('Tab'):
          r (ev.key);
          return false;
        default:
          return true;
      }
    });
}

async function play (lvls, inp, minp, ranked = true)
{
  for await (const l of lvls) {
    let didType = false;

    reset:
    while (true) {
      for await (const [which, val] of interleave(inp(l), minp)) {
        if (which === 0) {
          if (ranked) putStat(val[0], val[2], val[1]);
          didType = true;
          continue;
        }

        if (val === "Tab") break;
        if (val === "Escape") {
          if (!didType) return;
          didType = false;
          continue reset;
        }
      }
      window.onkeydown({key: 'break'});
      break;
    }
  }
}

async function * results (inp, instantDeath = false)
{
  let firstTime, lastTime, len = 0, didBegin = false;

  bail:
  for await (const [w, is] of inp) {
    const wordBegin = w.search(/\w/)
        , wordEnd   = w.search(/[^\w]*$/);

    let timeBegin = lastTime
      , mistake   = false;

    len += w.length;

    for await (const [cur, mis, time] of is) {
      if (!firstTime && cur === mis && cur > 0)
        firstTime = time;

      lastTime  = time;
      mistake  |= mis < cur && cur > wordBegin && cur <= wordEnd;

      if (didBegin && cur === mis && cur >= wordEnd) {
        didBegin = false
        yield [ w.substr(wordBegin, wordEnd - wordBegin)
              , mistake
              , time - timeBegin ];
      }

      if (cur === mis && cur <= wordBegin) {
        timeBegin = time;
        didBegin  = true;
        mistake   = false
      }

      if (instantDeath && cur > mis) {
        await sleep (500);
        break bail;
      }
    }

    didBegin = true;
  }

  return [len, lastTime - firstTime]
}

async function sleep (ms)
{
  await new Promise (r => setTimeout(r, ms));
}


