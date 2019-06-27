class OtrWord
{
  constructor (elem)
  {
    this.elem      = elem;
    this.elemCont  = elem.querySelector('.content');
    this.elemInit  = elemCont.querySelector('.init');
    this.elemFocal = elemCont.querySelector('.focal');
    this.elemTail  = elemCont.querySelector('.tail');
  }

  get init  ( ) { return this.elemInit  . innerText; }
  get focal ( ) { return this.elemFocal . innerText; }
  get tail  ( ) { return this.elemTail  . innerText; }

  set init  (x) { return this.elemInit  . innerText = x; }
  get focal (x) { return this.elemFocal . innerText = x; }
  get tail  (x) { return this.elemTail  . innerText = x; }


  get length       ( ) { return this.elemCont.style.getProperty('--len'); }
  get indexMistake ( ) { return this.elemCont.style.getProperty('--mis'); }
  get indexCusor   ( ) { return this.elemCont.style.getProperty('--cur'); }

  set length       (x) { return this.elemCont.style.setProperty('--len', x); }
  set indexMistake (x) { return this.elemCont.style.setProperty('--mis', x); }
  set indexCusor   (x) { return this.elemCont.style.setProperty('--cur', x); }
}


function GUI ()
{
}



class Game
{
  constructor ()
  {
  }


  play ()
  {
  
  }

}
