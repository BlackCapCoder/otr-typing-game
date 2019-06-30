

async function joinRoom (name)
{
  const ref = database.ref(`rooms/${name}`);
  const n   = await ref.once('value');
  if (!(n.node_.value_)) return false;
  await ref.remove();
  ref.off();

  const refText  = database.ref(`games/${name}/text`);
  const refHost  = database.ref(`games/${name}/host`);
  const refSlave = database.ref(`games/${name}/slave`);

  const txts = dbTexts(refText);

  const _inp = userInput(inp).map(async (xs) => {
    refSlave.set(xs[0]);
    return xs;
  });

  const dbinp = dbInput(refHost);

  const [a, b] = await dupA (2, txts);
  await playMulti (inp, _inp, dbinp, a, b);
  return true;
}

async function hostRoom (name, texts, inp)
{
  const ref  = database.ref(`rooms/${name}`);
  const ref2 = database.ref(`games/${name}`);
  const succ = await new Promise (async resolve => {
    let stage = 0;
    await ref.on('value', n => {
      if (stage === 0) {
        if (n.node_.value_) resolve(false);
        stage++;
        ref2.remove();
        ref.set(1);
      } else if (stage === 1) {
        if (!(n.node_.value_)) resolve(false);
        stage++;
      } else if (stage === 2) {
        if (n.node_.value_) resolve(false);
        resolve(true);
      }
    }
  )});

  ref.off();
  if (!succ) return false;

  console.log(`https://blackcapcoder.github.io/otr-typing-game/index.html#${name}`);

  const refHost  = database.ref(`games/${name}/host`);
  const refSlave = database.ref(`games/${name}/slave`);

  const _txts = texts.map(async (txt) => {
    await ref2.set({text: txt, host: '', slave: ''});
    return txt;
  });

  const _inp = inp.map(async (xs) => {
    refHost.set(xs[0]);
    return xs;
  });

  const dbinp = dbInput(refSlave);

  const [a, b] = await dup (2, _txts);
  await playMulti (document.querySelector('input'), _inp, dbinp, a, b);
  return true;
}


function dbInput (ref) {
  const elem = { oninput: () => {}, value: '' };
  ref.on('value', n => {
    elem.value = n.node_.value_;
    elem.oninput({ timeStamp: new Date().getTime() });
  });
  return userInput (elem);
}

async function * dbTexts (ref) {
  const elem = { gotText: () => {} };
  ref.on('value', n => {
    if (n.node_.value_ && n.node_.value_ !== '')
      elem.gotText(n.node_.value_);
  });
  while (true)
    yield await new Promise (res => elem.gotText = txt => res(txt));
}

async function playMulti (inpElem, inp, dbinp, a, b)
{
  mainMenu.classList.remove('active');
  p1.classList.remove('done');
  p2.classList.remove('done');
  p1.classList.remove('hidden');
  p2.classList.remove('hidden');

  let ctrl1 = new PlayerControl (document.querySelector('#p1'));
  let ctrl2 = new PlayerControl (document.querySelector('#p2'));

  const s1 = inputElement (ctrl1, inp, inpElem, false, false);
  const s2 = inputElement (ctrl2, dbinp, {focus: () => {}}, false, false);
  const v1 = masterInput  (window);
  const v2 = undefined;

  play (a, s1, v1, false) . then (returnToMenu);
  play (b, s2, v2, false);
}

async function tst () {
  const res = await hostRoom('main', easyQuotes(), userInput(inp));
}


window.addEventListener('load', async () => {
  const ms = window.location.hash.match(/^#(\w+)$/);
  if (ms === null) return;
  await joinRoom(ms[1]);
});

