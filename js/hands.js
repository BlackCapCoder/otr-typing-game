const fingerKeys = Object.freeze(`qaz wsx edc rfvtgb yhnujm ik ol p`.split(' '));

function wordComfort (w)
{
  let   comfort = 0
  const finger = new Uint8Array(w.length).map(
    (_, i) => fingerKeys.findIndex(ks => ks.includes(w[i]))
  );

  // many fingers used are good
  comfort += new Set(finger.filter(x => x < 11)).size;

  for (let i = 1; i < w.length; i++) {
    if (finger[i] == 255) { i++; continue; }

    // Same finger usage is bad, unless it's the same key
    if (finger[i] === finger[i-1])
      comfort += w[i] === w[i-1] ? 1 : -3;

    // Hand alternation is good
    if ((finger[i]<4) !== (finger[i-1]<4))
      comfort += 1;

    // I have to stretch for these
    if ("zbn".includes(finger[i]))
      confort -= 1;
  }

  return comfort - w.length;
}


const fingerKeysAll = (() =>
{
  const template =
    [ "qaz", "wsx", "edc"
    , "rfvtgb", "ujmyhn"
    , "ik,", "ol.", "p;'"
    , " " ];

  const size = 8;
  const res  = new Uint8Array(size * template.length) . fill (0);

  let f = 0;
  for (const x of template) {
    for (let i = 0; i < x.length; i++)
      res[f * size + i] = x.charCodeAt(i);
    f++;
  }

  return res;
})();

function comfort (str)
{
  const len = str.length;

  let prevC = str.charCodeAt(0);
  let prevF = fingerKeysAll.indexOf (prevC | 32);
  let score = Number (prevF !== -1);

  for (let i = 1; i < str.length; i++) {
    const c = str.charCodeAt(i);
    const f = fingerKeysAll.indexOf (c | 32);

    score += f            !== -1       // not special character
          && (prevC & 32) === (c & 32) // same casing
          && (  prevF     === f        // same letter or..
            || (prevF>>3) !== (f>>3)   // different finger
             );

    prevC = c, prevF = f;
  }

  return score / len;
}
