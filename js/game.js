let skipTimeout = 300
  , maxPeek     = 1;


class WordControl
{
  constructor (elem)
  {
    this.elem     = elem;
    this.cont     = elem.querySelector('.content')
    this.elemInit = elem.querySelector('.init');
    this.elemTail = elem.querySelector('.tail');
  }

  get init ( ) { return this.elemInit . innerText     }
  get tail ( ) { return this.elemTail . innerText     }

  set init (x) { return this.elemInit . innerText = x }
  set tail (x) { return this.elemTail . innerText = x }

  get indexMistake ( ) { return this.cont.style.getProperty('--mis')   }
  get indexCursor  ( ) { return this.cont.style.getProperty('--cur')   }
  get indexFocus   ( ) { return this.cont.style.getProperty('--focus') }
  get animate      ( ) { return this.cont.style.getProperty('--anim')  }

  set indexMistake (x) { return this.cont.style.setProperty('--mis',   x) }
  set indexCursor  (x) { return this.cont.style.setProperty('--cur',   x) }
  set indexFocus   (x) { return this.cont.style.setProperty('--focus', x) }
  set animate      (x) { return this.cont.style.setProperty('--anim',  x) }

  get isHidden ( ) { return this.elem.classList.contains('hidden'); }
  set isHidden (x) {
    if (x)
      this.elem.classList.add('hidden');
    else
      this.elem.classList.remove('hidden');
  }

  get peek ( ) { return this.elem.classList.contains('peek'); }
  set peek (x) {
    if (x)
      this.elem.classList.add('peek');
    else
      this.elem.classList.remove('peek');
  }

  get isMain ( ) { return this.elem.classList.contains('focus'); }

  loadWord (w)
  {
    this.init         = w.value.substr(0, w.otr);
    this.tail         = w.value.substr(w.otr);
    this.indexFocus   = w.otr;
    this.animate      = 0;
  }
}

class WordControls
{
  constructor (rest, ...ctrls)
  {
    this.rest      = rest;
    this.length    = ctrls.length;
    this.skipTimer = -1;

    this.first = this.cur = new CircularList (ctrls);
    for (; !this.cur.value.isMain; this.cur = this.cur.right);
  }

  get isPeeking ()
  {
    return this.peekWord !== undefined;
  }
  get canPeek ()
  {
    if (this.z.marks.cur === this.z.end) return false;
    return this.peekWord !== this.z.end;
  }

  get focus ()
  {
    return this.cur.value;
  }

  set cursor (x)
  {
    const otr = this.z.marks.focus.value.otr;
    this.focus.animate     = Number(x > 0);
    this.focus.indexFocus  = Math.max(x, otr);
    this.focus.indexCursor = x;
  }

  set mistake (x)
  {
    this.focus.indexMistake = x;
  }

  update (cur, mis)
  {
    clearTimeout(this.skipTimer);

    this._cursor  = cur;
    this._mistake = mis;

    if (cur > mis)
      return this.onMistake();

    if (this.isPeeking || (cur > this.skipAt && this.peek()))
      return this.skipTimer = setTimeout(() => this.onMistake(), skipTimeout);

    this.cursor  = cur;
    this.mistake = mis;
  }

  onMistake ()
  {
    this.skipAt  = Math.max(this._mistake + 4, this.skipAt);
    this.resetPeek ();
    this.cursor  = this._cursor;
    this.mistake = this._mistake;
  }


  initialize (s)
  {
    delete this.peekWord;
    this.last = this.first.left;
    this.z    = new BufferedZipper (this.length + maxPeek, stream(s));

    let len = 0, c = this.cur;

    do {
      const w = this.z.end.value;
      c.value.loadWord (w);
      c.value.isHidden = false;
      len += w.length;
      c = c.right;
    } while (c !== this.first && this.z.step());

    for (; c != this.cur; c = c.right)
      c.value.isHidden = true;

    if (this.z.empty)
      return;

    const focusZ = this.z.begin
        , curZ   = this.z.end;

    for (let i = 0; i < maxPeek && this.z.step(); i++);

    this.z.marks.cur    = curZ;
    this.z.marks.focus  = focusZ;
    this.skipAt         = curZ.value.skipAt;
    this.rest.innerText = this.rest.innerText.substr(len);
    this.focus.peek     = false;
    this.update(0, 0);
  }

  step ()
  {
    if (this.z.streamDone) {
      this.last.value.isHidden = true;
      this.last = this.last.left;
    }
    if (!this.z.step ())
    {
      this.z.end.right = this.z.begin = this.z.begin.right;
      this.z.moveRight();
    }

    if (!(this.isPeeking && this.peekWord === this.z.marks.cur))
    {
      let c = this.last;
      for (const w of this.z.marks.cur.until.left(this.z.begin)) {
        c.value.loadWord (w);
        c.value.isHidden = false;
        c = c.left;
      }

      if (!this.isPeeking)
        this.rest.innerText = this.rest.innerText.substr(this.z.marks.cur.value.length);
      else
        for (; this.peekWord !== this.z.marks.cur; this.peekWord = this.peekWord.left)
          this.rest.innerText = this.peekWord.value.value + this.rest.innerText;
    }

    delete this.peekWord;
    this.skipAt     = this.z.marks.focus.value.skipAt;
    this.focus.peek = false;
    this.update(0, 0);
  }

  peek ()
  {
    if (!this.canPeek)
      return false;

    this.peekWord = this.z.marks.cur.right;

    let c = this.last;
    for (const w of this.peekWord.until.left(this.z.begin)) {
      c.value.loadWord (w);
      c.value.isHidden = false;
      c = c.left;
      if (c === this.last) break;
    }

    this.focus.indexCursor = -2;
    this.focus.peek = true;
    this.rest.innerText = this.rest.innerText.substr(this.peekWord.value.length);

    return true;
  }

  resetPeek ()
  {
    if (!this.isPeeking) return false;

    let c = this.last;
    for (const w of this.z.marks.cur.until.left(this.z.begin)) {
      c.value.loadWord (w);
      c.value.isHidden = false;
      c = c.left;
    }

    for (; c !== this.last; c = c.left)
      c.value.isHidden = true;

    for (; this.peekWord !== this.z.marks.cur; this.peekWord = this.peekWord.left)
      this.rest.innerText = this.peekWord.value.value + this.rest.innerText;

    delete this.peekWord;
    this.focus.peek = false;
    return true;
  }
}

class PlayerControl
{
  constructor (elem)
  {
    this.elem        = elem
    this.elemRest    = elem.querySelector('.rest');
    this.elemWpm     = elem.querySelector('.wpm');
    this.words = new WordControls
      ( this.elemRest
        , ... Array.from (
            elem.querySelectorAll('.word')
          ) . map(x => new WordControl(x))
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
  const [a, b] = dup (2, stream(textToWords(l)));
  const ui = userInput(inpElem);

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


  const prediction = (60*200)/scoreText2(l);

  const res
    = results(inp, instantDeath)
    . then (async (r) => {
        if (endless) return r;
        const wpm    = calcWpm(r[1], r[0]);
        const actual = (60*200)/scoreText2(l);
        const res    =  100 - (prediction/actual) * 100;
        ctrl.wpm     = `${Math.round(wpm*10)/10} wpm\n${res > 0 ? '+' : ''}${Math.round((res)*10)/10}%`;
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


async function * interleave (as, bs)
{
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
      for await (const [which, val] of (minp !== undefined ? interleave(inp(l), minp) : inp(l))) {
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


