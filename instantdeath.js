function * instantDeath ()
{
  const hards = hardLetters();
  const bt    = texts.maximum(x => scoreText(hards, x), Infinity);

  let easy = false;
  while (bt.size > 0) {
    yield (easy = !easy) ? bt._removeMin().data : bt._removeMax().data;
  }

  yield * instantDeath ();
}
