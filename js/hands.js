
function wordComfort (w)
{
  const finger  = new Uint8Array(w.length).map((_, i) => `qaz wsx edc rfvtgb yhnujm ik ol p`.split(' ').findIndex(ks => ks.includes(w[i])));
  let   comfort = 0

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

