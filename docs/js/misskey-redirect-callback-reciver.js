class MisskeyRedirectCallbackReciver {
    constructor() {
        this.url = new URL(location.href)
        this.domain = sessionStorage.getItem('misskey-domain')
        this.version = sessionStorage.getItem(`misskey-${this.domain}-version`)
        this.scope = sessionStorage.getItem(`misskey-${this.domain}-oauth-scope`)
    }
    async recive() {
        const res = this.#isRedirectType()
        if (res == 'approved') { await this.#ApprovedEvent() }
        if (res == 'rejected') { this.#RejectedEvent() }
        // 上記以外はリダイレクトでないと判断して何もしない
        console.debug(`${res}`)
    }
    // マストドンからの承認リダイレクトコールバックである
    #isMisskey() { (sessionStorage.getItem('misskey-domain')) ? true : false }
    #isRedirectType() {
        if (!this.domain) { return 'not-misskey-domain' }
        if (!this.version) { return 'not-misskey-version' }
        if (!this.scope) { return 'not-scope' }
        if (url.searchParams.has('code')) { return 'approved' }
        if (url.searchParams.has('error')) { return 'rejected' }
        //if (!url.searchParams.has('code') && url.searchParams.has('error')) { return 1 }
        return 'not-redirect'
    }
    async #ApprovedEvent() {
        //const authorizer = new MisskeyAuthorizer(this.domain, this.scope)
        //const accessToken = await authorizer.redirectCallback()
        const accessToken = await this.#makeAccessToken() 
        console.debug('----- 認証リダイレクト後 -----')
        if (accessToken) { 
            const client = new MisskeyApiClient(domain, accessToken)
            const params = {
                domain: this.domain,
                scope: this.scope,
                client: client,
            }
            this.dispatchEvent(new CustomEvent('redirect', {detail: params}));
            //const res = await client.toot(sessionStorage.getItem(`status`))
            //this.#tootEvent(res)
        }
    }
    #RejectedEvent() {
        this.url.searchParams.delete('error');
        this.url.searchParams.delete('error_description');
        history.replaceState('', '', this.url.pathname);
        const params = {
            domain: this.domain,
            scope: this.scope,
            error: this.url.searchParams.has('error'),
            error_description: this.url.searchParams.has('error_description'),
        }
        this.dispatchEvent(new CustomEvent('redirect', {detail: params}));
    }
    async #makeAccessToken() {
        //const accessToken = await authorizer.redirectCallback()
        //const client = new MisskeyRestClient(this.domain)
        const code = url.searchParams.get('code')
        // 認証コード(code)をURLパラメータから削除する
        this.url.searchParams.delete('code');
        history.replaceState('', '', this.url.pathname);
        // トークンを取得して有効であることを確認しトゥートする
        //const status = sessionStorage.getItem(`status`)
        console.debug('----- authorized -----')
        console.debug('domain:', domain, this.domain)
        console.debug('client_id:', sessionStorage.getItem(`misskey-${domain}-oauth-client_id`))
        console.debug('client_secret:', sessionStorage.getItem(`misskey-${domain}-oauth-client_secret`))
        console.debug('認証コード', code)
        // client_id, client_secretはsessionStorageに保存しておく必要がある
        const authorizer = new MisskeyAuthorizer.get(this.domain, this.scope)
        const json = await authorizer.getToken(
            sessionStorage.getItem(`misskey-${domain}-oauth-client_id`), 
            sessionStorage.getItem(`misskey-${domain}-oauth-client_secret`), code)
        //const json = await this.#getToken(
        //    sessionStorage.getItem(`misskey-${domain}-oauth-client_id`), 
        //    sessionStorage.getItem(`misskey-${domain}-oauth-client_secret`), code)
        //client.error(json)
        console.debug('access_token:', json.access_token)
        sessionStorage.setItem(`misskey-${domain}-oauth-access_token`, json.access_token);
        return json.access_token
    }

}
