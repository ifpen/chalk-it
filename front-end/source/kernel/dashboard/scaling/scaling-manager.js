// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ scalingManager                                                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
// Scaling Manager is a geometric computation class.
// Given as input :
// - Original dashboard dimensions
// - Original widget dimensions
// - New dashboard dimensions
// - A scaling method
// Then :
// - it computes the new widget dimensions into the new dashboard according to the scaling method
// needs to be instantiated with input elements
// operates in viewport dimensions right now (needs generalization)
import _ from 'lodash';
import { rmUnit } from 'kernel/datanodes/plugins/thirdparty/utils';

export const scalingManager = function (srcDashArg, tgDashArg, methodArg) {
  var self = this;
  self.srcDash = srcDashArg;
  self.tgDash = tgDashArg;
  self.method = methodArg;

  /*--------scale to target width, keep source widgets proportion, vertical overlow first--------*/
  /* stretchWidth = true & keepProportion = true & projection = false */
  this.scaleTwSp = function (srcWg) {
    // security
    if (_.isUndefined(self.srcDash)) return srcWg;

    // inits
    var tgWg = {};
    var tgDash = self.tgDash;
    var srcDash = self.srcDash;

    // scale to target width
    tgWg.widthVw = (srcWg.widthVw / srcDash.widthVw) * tgDash.widthVw;
    tgWg.leftVw = (srcWg.leftVw / srcDash.widthVw) * tgDash.widthVw;
    // set height to keep widget original proportions
    tgWg.heightVh =
      srcWg.heightVh *
      (srcDash.heightPx / srcDash.widthPx) *
      (tgDash.widthPx / tgDash.heightPx) *
      (tgDash.heightVh / srcDash.heightVh);
    tgWg.topVh =
      srcWg.topVh *
      (srcDash.heightPx / srcDash.widthPx) *
      (tgDash.widthPx / tgDash.heightPx) *
      (tgDash.heightVh / srcDash.heightVh);

    return tgWg;
  };

  /*--------scale to target width, keep source widgets proportion, vertical overlow first + project width scroll--------*/
  /* stretchWidth = true & keepProportion = true & projection = true*/
  this.scaleTwSpWS = function (srcWg) {
    // security
    if (_.isUndefined(self.srcDash)) return srcWg;

    // inits
    var tgWg = {};
    var tgDash = self.tgDash;
    var srcDash = self.srcDash;

    // scale to target width
    tgWg.widthVw = (srcWg.widthVw / srcDash.scrollWidthVw) * tgDash.widthVw;
    tgWg.leftVw = (srcWg.leftVw / srcDash.scrollWidthVw) * tgDash.widthVw;
    // set height to keep widget original proportions
    tgWg.heightVh =
      srcWg.heightVh *
      (srcDash.heightPx / srcDash.scrollWidthPx) *
      (tgDash.widthPx / tgDash.heightPx) *
      (tgDash.heightVh / srcDash.heightVh);
    tgWg.topVh =
      srcWg.topVh *
      (srcDash.heightPx / srcDash.scrollWidthPx) *
      (tgDash.widthPx / tgDash.heightPx) *
      (tgDash.heightVh / srcDash.heightVh);

    return tgWg;
  };

  /*--------scale to target width, keep source height dimensions, vertical overlow first--------*/
  this.scaleTwSd = function (srcWg) {
    // security
    if (_.isUndefined(self.srcDash)) return srcWg;

    // inits
    var tgWg = {};
    var tgDash = self.tgDash;
    var srcDash = self.srcDash;

    // scale to target width
    tgWg.widthVw = (srcWg.widthVw / srcDash.widthVw) * tgDash.widthVw;
    tgWg.leftVw = (srcWg.leftVw / srcDash.widthVw) * tgDash.widthVw;
    // needed computations
    srcWg.widthPx = (srcWg.widthVw / srcDash.widthVw) * srcDash.widthPx;
    srcWg.heightPx = (srcWg.heightVh / srcDash.heightVh) * srcDash.heightPx;
    srcWg.topPx = (srcWg.topVh / srcDash.heightVh) * srcDash.heightPx;
    // same px between source and target height dimensions
    tgWg.heightPx = srcWg.heightPx;
    tgWg.topPx = srcWg.topPx;

    return tgWg;
  };

  /*--------scale to target width and height--------*/
  /* stretchWidth = true & keepProportion = false & projection = false */
  this.scaleTwh = function (srcWg) {
    // security
    if (_.isUndefined(self.srcDash)) return srcWg;

    // inits
    var tgWg = {};
    var tgDash = self.tgDash;
    var srcDash = self.srcDash;

    // scale to target width
    tgWg.widthVw = (srcWg.widthVw / srcDash.widthVw) * tgDash.widthVw;
    tgWg.leftVw = (srcWg.leftVw / srcDash.widthVw) * tgDash.widthVw;

    // scale to target height
    tgWg.heightVh = (srcWg.heightVh / srcDash.heightVh) * tgDash.heightVh;
    tgWg.topVh = (srcWg.topVh / srcDash.heightVh) * tgDash.heightVh;

    return tgWg;
  };

  /*--------scale to target width and height--------*/
  // project original dashboard with scroll into target with no scroll
  // stretchWidth = true & keepProportion = false & projection = true
  this.scaleTwhS = function (srcWg) {
    // security
    if (_.isUndefined(self.srcDash)) return srcWg;

    // inits
    var tgWg = {};
    var tgDash = self.tgDash;
    var srcDash = self.srcDash;

    // scale to target width
    tgWg.widthVw = (srcWg.widthVw / srcDash.scrollWidthVw) * tgDash.widthVw;
    tgWg.leftVw = (srcWg.leftVw / srcDash.scrollWidthVw) * tgDash.widthVw;

    // scale to target height
    tgWg.heightVh = (srcWg.heightVh / srcDash.scrollHeightVh) * tgDash.heightVh;
    tgWg.topVh = (srcWg.topVh / srcDash.scrollHeightVh) * tgDash.heightVh;

    return tgWg;
  };

  /*--------keep widget viewport dimensions--------*/
  // keep widget viewport dimensions independantly of source and destination dashboards
  /* stretchWidth = false & keepProportion = false & projection = false */
  this.scaleIdent = function (srcWg) {
    // security
    if (_.isUndefined(self.srcDash)) return srcWg;

    // inits
    var tgWg = {};
    var tgDash = self.tgDash;
    var srcDash = self.srcDash;

    // scale to target width
    tgWg.widthVw = srcWg.widthVw;
    tgWg.leftVw = srcWg.leftVw;

    // scale to target height
    tgWg.heightVh = srcWg.heightVh;
    tgWg.topVh = srcWg.topVh;

    return tgWg;
  };

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                        main public functions                       | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  /*--------set scaling method-------*/
  function setMethod(methodArg) {
    self.method = methodArg;
  }

  function scale(srcWg) {
    switch (self.method) {
      case 'scaleTwSp':
        return self.scaleTwSp(srcWg);
      case 'scaleTwSpWS':
        return self.scaleTwSpWS(srcWg);
      case 'scaleTwSd':
        return self.scaleTwSd(srcWg);
      case 'scaleTwh':
        return self.scaleTwh(srcWg);
      case 'scaleTwhS':
        return self.scaleTwhS(srcWg);
      case 'scaleIdent':
        return self.scaleIdent(srcWg);
      default:
        return self.scaleIdent(srcWg);
    }
  }

  /*--------apply rescaling to wc element-------*/
  function applyRescale(wc) {
    var wcChild;
    var width, height, top, left;
    var widthVw, leftVw, heightVh, topVh;
    var srcWg, tgWg;
    if (wc.nodeType == Node.ELEMENT_NODE) {
      // eliminate text nodes
      width = wc.style.width;
      widthVw = rmUnit(width);
      left = wc.style.left;
      leftVw = rmUnit(left);
      height = wc.style.height;
      heightVh = rmUnit(height);
      top = wc.style.top;
      topVh = rmUnit(top);
      srcWg = {
        widthVw: widthVw,
        leftVw: leftVw,
        heightVh: heightVh,
        topVh: topVh,
      };

      tgWg = scale(srcWg);

      // apply rescaling to top widget container
      wc.style.width = tgWg.widthVw + 'vw';
      wc.style.left = tgWg.leftVw + 'vw';
      wc.style.height = tgWg.heightVh + 'vh';
      wc.style.top = tgWg.topVh + 'vh';

      // apply rescaling to WidgetContainer
      const wcChildren = wc.getElementsByTagName('div');
      for (let k = 0; k < wcChildren.length; k++) {
        if (wcChildren[k].id.search('WidgetContainer') != -1) {
          wcChildren[k].style.width = tgWg.widthVw - 2 * (100 / document.documentElement.clientWidth) + 'vw';
          wcChildren[k].style.height = tgWg.heightVh - 2 * (100 / document.documentElement.clientHeight) + 'vh';
        }
      }
    }
  }

  return {
    setMethod: setMethod,
    scale: scale,
    applyRescale: applyRescale,
  };
};
