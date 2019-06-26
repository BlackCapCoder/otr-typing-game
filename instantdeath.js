function * instantDeath ()
{
  // const hards = hardLetters();
  // const bt    = texts.maximum(x => scoreText(hards, x), Infinity);
  //
  // let easy = false;
  // while (bt.size > 0) {
  //   yield (easy = !easy) ? bt._removeMin().data : bt._removeMax().data;
  // }

  for (const q of texts.slice(0).shuffle()) yield q;


  yield * instantDeath ();
}
