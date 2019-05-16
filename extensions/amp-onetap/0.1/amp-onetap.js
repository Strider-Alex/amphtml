/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Layout} from '../../../src/layout';
import {loadScript} from '../../../3p/3p';

/** @const {string} */
const TAG = 'amp-onetap';

export class AmpOnetap extends AMP.BaseElement {

  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private @const {string} */
    this.url = 'http://kefany.svl.corp.google.com:9879';

    /** @pivate @const {string} */
    this.client_id = this.element.getAttribute('data-client_id');

    /** @pivate @const {string} */
    this.callback = this.element.getAttribute('data-callback');

    if (!this.win[this.callback]){
      this.win[this.callback] = (token)=>{
        console.log(token);
      }
    }
  }

  /** @override */
  buildCallback() {
    // Create DIV tag required for OneTap API
    const document = this.element.ownerDocument;
    const div = document.createElement('div');
    div.id = 'gis_id_onload';
    div.setAttribute('data-client_id', this.client_id);
    div.setAttribute('data-callback', this.callback); 
    this.element.appendChild(div);
    // Options to direct client requests to target server
    this.win['__GIS_ID_OPTIONS__'] = {
      prompt_url: `${this.url}/gis/iframe/select`,
      status_url: `${this.url}/gis/status`,
    };
  }

  /**
   * @param {boolean=} opt_onLayout
   * @override
   */
  preconnectCallback(opt_onLayout) {
    // Hosts the facebook SDK.
    this.preconnect.preload(`${this.url}/gis/client`, 'script');
  }

  /** @override */
  layoutCallback() {
    loadScript(this.win, `${this.url}/gis/client`, ()=>{
      console.log('Client script loaded!')
    });
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.RESPONSIVE;
  }
}

AMP.extension(TAG, '0.1', AMP => {
  AMP.registerElement(TAG, AmpOnetap);
});
