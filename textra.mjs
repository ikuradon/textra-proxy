import axios from "axios";
import oauth from "axios-oauth-client";
const axiosClient = axios.default;

export class TexTra {
  #BASE_URL = 'https://mt-auto-minhon-mlt.ucri.jgn-x.jp';

  #key = '';
  #secret = '';
  #name = '';
  #token = '';
  #expire = 0;

  constructor(key, secret, name) {
    this.#key = key;
    this.#secret = secret;
    this.#name = name;
  }

  // 英→日翻訳
  async translateEn2Ja(text) {
    if (this.#isNeedNewToken()) {
      await this.#getAuthorizationCode();
    }

    return (await this.#executeTranslate('mt/generalNT_en_ja/', text)).resultset.result.text;
  };

  // 日→英翻訳
  async translateJa2En(text) {
    if (this.#isNeedNewToken()) {
      await this.#getAuthorizationCode();
    }

    return (await this.#executeTranslate('mt/generalNT_ja_en/', text)).resultset.result.text;
  };

  async translate(translator, text) {
    if (this.#isNeedNewToken()) {
      await this.#getAuthorizationCode();
    }

    return (await this.#executeTranslate(`mt/${translator}/`, text)).resultset.result.text;
  }

  async detectLanguage(text) {
    if (this.#isNeedNewToken()) {
      await this.#getAuthorizationCode();
    }

    const res = await this.#executeDetectLanguage(text);
    const languages = res.resultset.result.langdetect;

    return Object.keys(languages).map(key => languages[key]);
  }

  async queryTranslator(source, target) {
    if (this.#isNeedNewToken()) {
      await this.#getAuthorizationCode();
    }

    return (await this.#executeQueryTranslator(source, target)).resultset.result.list;
  }

  #isNeedNewToken() {
    return this.#token === '' || this.#expire < Date.now();
  }

  async #getAuthorizationCode() {
    const oauthFunc = oauth.clientCredentials(
      axios.create(),
      `${this.#BASE_URL}/oauth2/token.php`,
      this.#key,
      this.#secret,
    );

    const auth = await oauthFunc();
    this.#token = String(auth.access_token) || '';
    this.#expire = Number(auth.expires_in) + Date.now();
    return;
  }

  async #executeTranslate(path, text) {
    const pathElements = path.split('/');
    const params = {
      api_name: pathElements[0],
      api_param: pathElements[1],
      text,
    };

    return await this.#executeRequest(params);
  }

  async #executeDetectLanguage(text) {
    const params = {
      api_name: "langdetect",
      text,
    }

    return await this.#executeRequest(params);
  }

  async #executeQueryTranslator(lang_s, lang_t) {
    const params = {
      api_name: "mt_standard",
      api_param: "get",
      lang_s,
      lang_t,
    }

    return await this.#executeRequest(params);
  }


  async #executeRequest(_params) {
    const params = {
      ..._params,
      access_token: this.#token,
      key: this.#key,
      name: this.#name,
      type: 'json',
    };

    var searchParams = new URLSearchParams();
    for (let key in params) {
      searchParams.append(key, params[key]);
    }

    return (await axiosClient.post(`${this.#BASE_URL}/api/`, searchParams)).data;
  }
};