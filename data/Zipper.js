class BufferedZipper
{
  constructor (length, stream)
  {
    this.streamDone = false;
    this.marks   = {};
    this.begin = this.end
      = new LazyCircularList
          ( stream.then(() => this.streamDone = true)
          , length );
  }

  moveLeft ()
  {
    for (const [k, v] of Object.entries(this.marks))
      if (v !== this.begin)
        this.marks[k] = v.left;
  }

  moveRight ()
  {
    for (const [k, v] of Object.entries(this.marks))
      if (v !== this.end)
        this.marks[k] = v.right;
  }

  step ()
  {
    if (this.streamDone) return false;

    if (this.begin.left === this.end) this.begin = this.begin.right;

    this.end = this.end.right;

    if (!this.streamDone) {
      for (const [k, v] of Object.entries(this.marks))
        this.marks[k] = v.right;
      return true;
    }

    this.begin = this.end;
    this.end   = this.end.left;

    return false;
  }

  get empty () { return this.begin.value === undefined }
}
