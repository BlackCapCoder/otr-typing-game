
// Collect words from texts
function words ()
{
  const rx = new RegExp (''
    + /(?<= |^)[^a-z ]+/.source             // leading  special characters
    + /|(?<=[a-z])[^a-z ]+(?= |$)/.source   // trailing special characters
    + '|( |^)('
    + /[^a-z ]*[a-z]+[^a-z ][^ ]+/.source   // drop entire word containing special characters
    + /|[^a-z ]*[a-z]{0,2}[^a-z ]*/.source  // drop short words, only one space between words
    + ')(?= |$)'
  , 'gi');

  const all = new Set (
    simplewords.filter(w => w.length > 2 && w.search(/[^a-z]/) === -1)
  );

  texts . join(' ')
        . replace(rx, '')
        . toLowerCase()
        . split(' ')
        . forEach (x => all.add(x));

  return Array.from(all);
}
