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


### Difficulty

The number displayed at the bottom (not in the gif above) is the text's
approximate difficulty. It is based on how early words can be skipped;
lower is easier.


If you open the console you can change the `difficulty` variable. It
should have a number between 0 and 1, where lower means that easier
texts will be chosen.
