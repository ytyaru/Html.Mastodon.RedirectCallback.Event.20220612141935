class MastodonRedirectCallbackReciver {
    constructor() {
        this.url = new URL(location.href)
        this.domain = sessionStorage.getItem('mastodon-domain')
        this.scope = sessionStorage.getItem(`mastodon-${this.domain}-oauth-scope`)
    }
    async recive() {
        const res = this.#isRedirectType()
        console.debug(`----- recive -----: ${res}`)
        if (res == 'approved') { await this.#ApprovedEvent() }
        if (res == 'rejected') { this.#RejectedEvent() }
        // 上記以外はリダイレクトでないと判断して何もしない
        console.debug(`${res}`)
        /*
        switch (this.#isRedirectType())) {
            case 'approved': this.#makeAccessToken()
        }
        if ((url.searchParams.has('code') && url.searchParams.has('domain')) || (url.searchParams.has('error') && url.searchParams.get('domain'))) {
            const domain = url.searchParams.get('domain')
            const authorizer = new MastodonAuthorizer(domain, 'write:statuses')
            const accessToken = await authorizer.redirectCallback()
            console.debug('----- 認証リダイレクト後 -----')
            if (accessToken) {
                const client = new MastodonApiClient(domain, accessToken)
                const res = await client.toot(sessionStorage.getItem(`status`))
                this.#tootEvent(res)
            }
        }
        */
    }
    // マストドンからの承認リダイレクトコールバックである
    #isMastodon() { (sessionStorage.getItem('mastodon-domain')) ? true : false }
    #isRedirectType() {
        if (!this.domain) { return 'not-mastodon-domain' }
        //if (!this.scope) { return 'not-scope' }
        if (!this.#hasScopeKey()) { return 'not-scope' }
        if (this.url.searchParams.has('code')) { return 'approved' }
        if (this.url.searchParams.has('error')) { return 'rejected' }
        //if (!url.searchParams.has('code') && url.searchParams.has('error')) { return 1 }
        return 'not-redirect'
    }
    #hasScopeKey() {
        for (let i=0; i<sessionStorage.length; i++) {
            if (`mastodon-${this.domain}-oauth-scope` ==  sessionStorage.key(i)) { return true }
        }
        return false
    }
    async #ApprovedEvent() {
        //const authorizer = new MastodonAuthorizer(this.domain, this.scope)
        //const accessToken = await authorizer.redirectCallback()
        const accessToken = await this.#makeAccessToken() 
        console.debug('----- 認証リダイレクト後 -----')
        if (accessToken) { 
            const client = new MastodonApiClient(this.domain, accessToken)
            const params = {
                domain: this.domain,
                scope: this.scope,
                client: client,
            }
            const action = sessionStorage.getItem(`mastodon-${this.domain}-callback-action`)
            if (action) {
                let callbackParams = null
                if (sessionStorage.getItem(`mastodon-${this.domain}-callback-action-params`)) {
                    callbackParams = sessionStorage.getItem(`mastodon-${this.domain}-callback-action-params`).split('\n')
                }
                //const params = sessionStorage.getItem(`mastodon-${this.domain}-callback-action-params`).split('\n')
                const actions = action.split('\n')
                //await client['toot'](JSON.parse(params[0]))
                //params.results = actions.map((a, i)=>await client[actions[i]](JSON.parse(params[i])))
                //params.results = actions.map(async(a, i)=>await client[a](JSON.parse(params[i]));)
                params.actions = sessionStorage.getItem(`mastodon-${this.domain}-callback-action`).split('\n')
                params.params = callbackParams
                //params.params = (params) ? sessionStorage.getItem(`mastodon-${this.domain}-callback-action-params`).split('\n') : null
                const results = []
                for (let i=0; i<actions.length; i++) {
                    results.push(await client[actions[i]]((callbackParams) ? params[i] : null))
                }
                params.results = results
            }
            console.debug('イベント発行：mastodon-redirect-approved')
            console.debug(params)
            document.dispatchEvent(new CustomEvent('mastodon_redirect_approved', {detail: params}));
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
        document.dispatchEvent(new CustomEvent('mastodon_redirect_rejected', {detail: params}));
    }
    async #makeAccessToken() {
        //const accessToken = await authorizer.redirectCallback()
        //const client = new MastodonRestClient(this.domain)
        const code = this.url.searchParams.get('code')
        sessionStorage.setItem(`mastodon-${this.domain}-oauth-code`, code);
        // 認証コード(code)をURLパラメータから削除する
        this.url.searchParams.delete('code');
        history.replaceState('', '', this.url.pathname);
        // トークンを取得して有効であることを確認しトゥートする
        //const status = sessionStorage.getItem(`status`)
        const client_id = sessionStorage.getItem(`mastodon-${this.domain}-oauth-client_id`)
        const client_secret = sessionStorage.getItem(`mastodon-${this.domain}-oauth-client_secret`)
        console.debug('----- authorized getToken -----')
        console.debug('domain:', this.domain)
        console.debug('scope:', this.scope)
        console.debug('client_id:', client_id)
        console.debug('client_secret:', client_secret)
        console.debug('認証コード', code)
        // client_id, client_secretはsessionStorageに保存しておく必要がある
        const authorizer = new MastodonAuthorizer(this.domain, this.scope)
        const json = await authorizer.getToken(
            client_id, 
            client_secret, code)
        //const json = await this.#getToken(
        //    sessionStorage.getItem(`mastodon-${domain}-oauth-client_id`), 
        //    sessionStorage.getItem(`mastodon-${domain}-oauth-client_secret`), code)
        //client.error(json)
        console.debug('access_token:', json.access_token)
        sessionStorage.setItem(`mastodon-${this.domain}-oauth-access_token`, json.access_token);
        return json.access_token
    }
}
