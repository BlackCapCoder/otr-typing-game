[Open game](https://blackcapcoder.github.io/otr-typing-game/index.html)

![](demo.gif)

This is a typing game that displays one* word at a time, centered- and
highlighted at the character that is optimal to look at for quick
recognition.


The game will sometimes skip to the next word before you have finished
typing the previous one. This is done to give you time to process the
next word before having to type it.


The game tries to be intelligent about this skipping behavior: for common
words it always skips after the first letter. If the word contains special
characters or uppercase letters it will only skip after those. If a mistake
is made or you type slowly, the game will switch back to the current word.
