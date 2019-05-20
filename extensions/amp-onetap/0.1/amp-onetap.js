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

import { Layout } from '../../../src/layout';
import { loadScript } from '../../../3p/3p';

/** @const {string} */
const TAG = 'amp-onetap';
/** @const {string} */
const CREDENTIAL_PARMETER_NAME = 'credential';

export class AmpOnetap extends AMP.BaseElement {

  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private @const {string} */
    this.baseUrl = 'http://kefany.svl.corp.google.com:9879';

    /** @pivate @const {string} */
    this.client_id = this.element.getAttribute('data-client_id');

    /** @pivate @const {string} */
    this.login_uri = this.element.getAttribute('data-login_uri');

    /** @pivate {boolean} */
    this.hidden = false;

    /** @pivate {boolean} */
    this.scriptLoaded = false;
  }

  /**
   * @param {boolean=} opt_onLayout
   * @override
   */
  preconnectCallback(opt_onLayout) {
    console.log('preconnectCallback');
    // Hosts the iframe script.
    this.preconnect.preload(`${this.baseUrl}/gis/client`, 'script');
  }

  /** @override */
  layoutCallback() {
    console.log('layoutCallback');
    loadScript(this.win, `${this.baseUrl}/gis/client`, () => {
      this.scriptLoaded = true;
      if (!this.hidden) {
        const options = {
          client_id: this.client_id,
          prompt_url: `${this.baseUrl}/gis/iframe/select`,
          status_url: `${this.baseUrl}/gis/status`,
          auto_select: true,
          auto_prompt: true,
          callback: (credentialResponse) => {
            let postBody = {};
            postBody[CREDENTIAL_PARMETER_NAME] = credentialResponse['credential'];
            this._formSubmit(this.login_uri, postBody);
          },
        };
        console.log(options);
        gis.id.initialize(options);
        gis.id.prompt();
      }
    });
  }

  /** @override */
  unlayoutCallback() {
    console.log('unlayoutCallback');
    this.hidden = true;
    if (this.scriptLoaded){
      gis.id.cancel();
    }
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.RESPONSIVE;
  }

  /** @private */
  _formSubmit(url, data) {
    const document = this.element.ownerDocument;
    const form = document.createElement('form');
    document.body.appendChild(form);
    form.method = 'post';
    form.action = url;
    if (data) {
      Object.keys(data).map((name) => {
        let input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = data[name];
        form.appendChild(input);
      });
    }
    form.submit();
  }
}

AMP.extension(TAG, '0.1', AMP => {
  AMP.registerElement(TAG, AmpOnetap);
});
