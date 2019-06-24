const cleanWords = short => new RegExp (''
  + /(?<= |^)[^a-z ]+/.source             // leading  special characters
  + /|(?<=[a-z])[^a-z ]+(?= |$)/.source   // trailing special characters
  + '|( |^)('
  + /[^a-z ]*[a-z]+[^a-z ][^ ]+/.source   // drop entire word containing special characters
  + '|[^a-z ]*[a-z]{0,' + String(short) + '}[^a-z ]*'  // drop short words, only one space between words
  + ')(?= |$)'
, 'gi');


// Collect words from texts
function words ()
{
  const all = new Set (
    simplewords.filter(w => w.length > 2 && w.search(/[^a-z]/) === -1)
  );

  texts . join(' ')
        . replace(cleanWords(2), '')
        . toLowerCase()
        . split(' ')
        . forEach (x => all.add(x));

  return all;
}


function wordUsage (s, texts)
{
  const after = new Array(s.length);

  for (let i = 0; i < s.length; i++)
    after[i] = {};

  const rx = cleanWords(0);

  texts.forEach(txt => {
    const ws = txt . replace (rx, '')
                   . toLowerCase()
                   . trim()
                   . split(' ')
                   . map (w => binarySearch(s, w));

    for (let i = 0; i < ws.length - 1; i++) {
      const cur = ws[i], b = ws[i+1];
      if (cur === -1 || b === -1) break;
      if (!(b in after[cur])) after[cur][b] = 1; else after[cur][b]++;
    }
  });

  return after;
}

function * commonSentence (minLen = 10) {
  const s  = Array.from(words()).sort();
  const ws = wordUsage (s, texts);

  while (true) {
    let len = minLen;
    let sentence = "";

    while (len > 0) {
      const ret = [];
      let w;

      while (true) {
        w = Math.floor(Math.random() * ws.length);
        if (Object.keys(ws[w]).length > 0) break;
      }

      for (;; len--) {
        ret.push(w);

        const commons = Object.entries(ws[w]).sort((a, b) => b[1] - a[1]).map(x => x[0]);

        if (commons.length === 0) break;

        let choice = null;

        for (let k = 0; k < 10; k++) {
          choice = commons[Math.floor(Math.random() * commons.length * (k/10))]
          if (!ret.includes(choice) && Math.random() > 0.3) break;
        }
        if (choice === null) choice = commons[0];

        w = choice;
      }

      const str = ret.map(x => s[x]).join(' ');
      sentence += str[0].toUpperCase() + str.substr(1) + '.' + (len > 0? ' ': '');
    }

    yield sentence;
  }
}

function binarySearch(array, target){
  let startIndex = 0;
  let endIndex = array.length - 1;
  while(startIndex <= endIndex) {
    let middleIndex = Math.floor((startIndex + endIndex) / 2);
    if( target === array[middleIndex]) {
      return middleIndex;
    }
    if(target > array[middleIndex]) {
      startIndex = middleIndex + 1;
    }
    if(target < array[middleIndex]) {
      endIndex = middleIndex - 1;
    }
  }

  return -1;
}
