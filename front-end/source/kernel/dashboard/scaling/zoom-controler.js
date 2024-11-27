const PARENT_CLASS = 'dashboard-parent-container';
const PAGE_CLASS = 'dashboard-page-container';
const CONTENT_CLASS = 'dashboard-content-container';

const NOOP = () => {};

export class ZoomControler {
  #ratio = 1;
  #autoFit = false;
  #fitHeight = false;

  #width = 42;
  #height = 42;

  #parent;
  #page;
  #content;
  #ratioChangeListener;

  constructor(parentElement, ratioChangeListener) {
    this.#parent = $(parentElement).find('.' + PARENT_CLASS)[0];
    this.#page = $(parentElement).find('.' + PAGE_CLASS)[0];
    this.#content = $(parentElement).find('.' + CONTENT_CLASS)[0];

    this.#ratioChangeListener = ratioChangeListener ?? NOOP;

    const resizeObserver = new ResizeObserver((entries) => {
      if (this.#autoFit && entries.length === 1) {
        this.#onResize(entries[0]);
      }
    });
    resizeObserver.observe(this.#parent);
  }

  setFit(doFit) {
    if (doFit) {
      this.#fit();
    } else {
      this.#autoFit = false;
      this.#updateScollbars();
    }
  }

  setSize(width, height) {
    this.#width = width;
    this.#height = height;

    this.#content.style.width = `${this.#width}px`;
    this.#content.style.height = `${this.#height}px`;

    if (this.#autoFit) {
      this.#fit();
    } else {
      this.#rescale();
    }
  }

  setRatio(ratio) {
    this.#autoFit = false;
    this.#updateScollbars();

    this.#ratio = ratio;
    this.#rescale();
    this.#ratioChangeListener(ratio);
  }

  setFitHeight(fitHeight) {
    this.#fitHeight = fitHeight;
    if (this.#autoFit) {
      this.#fit();
    }
  }

  #fit() {
    this.#autoFit = true;
    this.#updateScollbars();

    this.#ratio = (this.#fitHeight ? this.#parent.offsetWidth : this.#parent.clientWidth) / this.#width;
    if (this.#fitHeight) {
      this.#ratio = Math.min(this.#ratio, this.#parent.clientHeight / this.#height);
    }
    this.#rescale();

    this.#ratioChangeListener(this.#ratio);
  }

  #updateScollbars() {
    if (this.#autoFit) {
      this.#parent.style['overflow-x'] = 'hidden';
      if (this.#fitHeight) {
        this.#parent.style['overflow-y'] = 'hidden';
      } else {
        this.#parent.style['overflow-y'] = 'scroll';
      }
    } else {
      this.#parent.style['overflow-x'] = 'auto';
      this.#parent.style['overflow-y'] = 'auto';
    }
  }

  #rescale() {
    this.#content.style.transform = `scale(${this.#ratio})`;
    this.#content.style['transform-origin'] = 'top left';

    this.#page.style.width = `${this.#width * this.#ratio}px`;
    this.#page.style.height = `${this.#height * this.#ratio}px`;
  }

  #onResize(entry) {
    if (this.#autoFit) {
      window.requestAnimationFrame(() => {
        this.#fit();
      });
    }
  }
}
