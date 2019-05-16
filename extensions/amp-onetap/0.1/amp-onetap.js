/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS-IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Embeds Google OneTap
 * 
 * Example:
 * <code>
 * <amp-onetap
 *   layout="nodisplay"
 *   data-iframe_url="https://www.example.com/onetap-login"
 *   data-redirect_url="https://www.example.com/index">
 * </amp-onetap>
 * </code>
 */

import { isExperimentOn } from '../../../src/experiments';
import { userAssert } from '../../../src/log';
import { Layout } from '../../../src/layout';
import { CSS } from '../../../build/amp-onetap-0.1.css';
import { Services } from '../../../src/services';

/** @const {string} */
const TAG = 'amp-onetap';

/** @const {string} */
const IFRAME_ID = 'amp-onetap-iframe-container';

/** @const {Object} */
const ACTIONS = {
  RESIZE: 'resize',
  REDIRECT: 'redirect',
  UI_MODE: 'ui_mode',
  CLOSE: 'close',
  CLICK_CANCEL: 'click_cancel',
}

/** @const {Object} */
const UI_MODES = {
  BOTTOM_SHEET: 'bottom_sheet',
  CARD: 'card',
}

/** @const {Object} */
const cardStyle = {
  border: 'none',
  height: '330px',
  position: 'fixed',
  right: '20px',
  top: '20px',
  width: '375px',
  'z-index': 9999,
  display: 'flex',
};

/** @const {Object} */
const bottomSheetStyle = {
  height: '260px',
  width: '100%',
  'z-index': 9999,
  border: 'none',
  position: 'fixed',
  left: '0px',
  bottom: '0px',
  display: 'flex',
}

export class AmpOnetap extends AMP.BaseElement {

  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    this.checkExperimentEnabled_()

    /** @pivate @const {string} */
    this.iframeURL_ = this.element.getAttribute('data-iframe_url');

    /** @private @const {string} */
    this.redirectURL_ = this.element.getAttribute('data-redirect_url');

    /** @private @const {string} */
    this.iframeOrigin_ = (new URL(this.iframeURL_)).origin;

    /** @private {boolean} */
    this.hidden_ = true;

    /** @private {!Element} */
    this.doc_ = this.element.ownerDocument;

    /** @private {!Element=} */
    this.iframe_;

    /** @private */
    this.onClick_ = () => {
      this.doc_.removeEventListener('click', this.onClick_);
      this.hideIframe_();
    };
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.NODISPLAY;
  }

  /** @override */
  buildCallback() {
    const doc = this.doc_;
    this.win.addEventListener('message', (event) => {
      // Make sure the postMessage comes from the iframe origin
      this.checkSafeOrigin_(event.origin);
      this.handlePostMessage_(event.data);
    });
    Services.accessServiceForDocOrNull(this.element).then(accessService => {
      console.log(accessService);
      if (!accessService) {
        this.createIframe_();
        this.hidden_ = false;
        this.showIframe_();
        return;
      }
      accessService.onApplyAuthorizations(
        () => this.onAccessApplyAuthorizations_());
    })
  }

  /** @private  */
  checkSafeOrigin_(origin) {
    if (origin !== this.iframeOrigin_) {
      throw new Error(`Origin check failed: expect ${origin}, get ${this.iframeOrigin_}`);
    }
  }

  /** @private */
  handlePostMessage_(data) {
    switch (data.action) {
      case ACTIONS.REDIRECT:
        if (this.redirectURL_ === null) {
          location.reload();
        }
        else {
          location.href = this.redirectURL_;
        }
        break;
      case ACTIONS.RESIZE:
        this.iframe_.style.height = data.detail.newHeight + 'px';
        break;
      case ACTIONS.UI_MODE:
        if (data.detail.uiMode === UI_MODES.BOTTOM_SHEET) {
          Object.assign(this.iframe_.style, bottomSheetStyle);
        }
        else if (data.detail.uiMode === UI_MODES.CARD) {
          Object.assign(this.iframe_.style, cardStyle);
        }
        else {
          throw new Error(`Unknown UI mode: ${data.detail.uiMode}`);
        }
        break;
      case ACTIONS.DISPLAY:
        this.clickListener_ = this.doc_.addEventListener('click', this.onClick_, false)
        break;
      case ACTIONS.CLOSE:
        this.doc_.removeEventListener('click', this.onClick_);
        break;
      default:
        throw new Error(`Unknown action type: ${data.action}`);
    }
  }

  /** @private */
  onAccessApplyAuthorizations_() {
    const oldHidden = this.hidden_;
    this.hidden_ = this.element.hasAttribute('amp-access')
      && this.element.hasAttribute('amp-access-hide');
    if (oldHidden && !this.hidden_) {
      this.createIframe_();
      this.showIframe_();
    }
    else if (!oldHidden && this.hidden_) {
      this.hideIframe_();
    }
    else {
      // Do nothing
    }
  }

  /** @private */
  showIframe_() {
    this.doc_.body.appendChild(this.iframe_);
    console.log('shown');
  }

  /** @private */
  hideIframe_() {
    if (this.iframe_){
      this.doc_.body.removeChild(this.iframe_);
    }
  }

  /** @private */
  createIframe_() {
    if (!this.iframe_){
      this.iframe_ = this.doc_.createElement('iframe');
      this.iframe_.src = this.iframeURL_;
      this.iframe_.id = IFRAME_ID;
    }
  }

  /** @private */
  checkExperimentEnabled_() {
    userAssert(isExperimentOn(this.win, TAG),
      `Experiment ${TAG} is not turned on.`);
  }
}

AMP.extension(TAG, '0.1', AMP => {
  AMP.registerElement(TAG, AmpOnetap, CSS);
});
