/*

length:   number, endless
mistakes: one, infinite
source:   quotes, words, custom
order:    random, easy, hard

max  int
min  int
take int
shuffle


score:
  comfort
  common  (list)
  letters (stats)
  words stats (occ, mis, time)
  length





*/



const Type = Object.freeze (
  { Text:     0
  , Sentence: 1
  , Word:     2
  , Letter:   3
  , Graph:    4
  });

const NativeSources = Object.freeze (
  { quotes: {type: Type.Text, data: texts }
  , simple: {type: Type.Word, data: simplewords }
  });


const sentences
  = x => x . replace(/^[\.\?! ]+|[\.\?! ]+$/, '')
           . split(/(?<=[a-z])[\.\?!][\.\?! ]* /gi);

const unsentences
  = x => x.reduce((acc, s) =>
      (acc.length === 0? '': acc + '. ') + s.slice(0,1).toUpperCase() + s.slice(1)
    , '');

const words     = x => unquote(x).replace(cleanWords(0), '').split(' ');
const letters   = x => x.trim().split(/(?<=\w)[^\w]*/g);
const unwords   = x => x.join(' ');
const unletters = x => x.join('');


function graph (edges, verts) {
  const dist  = Array.from (new Set (edges)).sort();
  const graph = new Array  (dist.length);

  for (let i = 0; i < dist.length; i++)
    graph[i] = new Set();

  verts . forEach (xs => {
    const [from, to] = xs.map (x => binarySearch (dist, x));
    if (from === -1 || to === -1) return;
    graph[from].add(to);
  });

  return graph;
}
