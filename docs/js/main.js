window.addEventListener('DOMContentLoaded', async(event) => {
    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
    try {
        window.mpurse.updateEmitter.removeAllListeners()
          .on('stateChanged', isUnlocked => console.log(isUnlocked))
          .on('addressChanged', address => console.log(address));
    } catch(e) { console.debug(e) }
    document.getElementById('get-mastodon-account-info').addEventListener('click', async(event) => {
        const domain = document.getElementById('mastodon-instance').value
        const authorizer = new MastodonAuthorizer(domain, 'read:accounts')
        authorizer.authorize(['accounts'], null)
    });
    document.addEventListener('mastodon_redirect_approved', async(event) => {
        console.debug('===== mastodon-redirect-approved =====')
        console.debug(event.detail)
        // actionを指定したときの入力と出力を表示する
        for (let i=0; i<event.detail.actions.length; i++) {
            console.debug(event.detail.actions[i], (event.detail.params) ? event.detail.params[i] : null, event.detail.results[i])
            console.debug(`----- ${event.detail.actions[i]} -----`)
            console.debug((event.detail.params) ? event.detail.params[i] : null)
            console.debug(event.detail.results[i])
        }
        // 認証リダイレクトで許可されたあとアクセストークンを生成して作成したclientを使ってAPIを発行する
        //const res = event.detail.client.toot(JSON.parse(event.detail.params[0]))
        // 独自処理（）
        for (let i=0; i<event.detail.actions.length; i++) {
            if ('accounts' == event.detail.actions[i]) {
                const gen = new MastodonProfileGenerator(event.detail.domain)
                document.getElementById('export-mastodon').innerHTML = gen.generate(event.detail.results[i])
            }
        }
    });
    document.addEventListener('mastodon_redirect_rejected', async(event) => {
        console.debug('認証エラーです。認証を拒否しました。')
        console.debug(event.detail.error)
        console.debug(event.detail.error_description)
        Toaster.toast('キャンセルしました')
    });
    // リダイレクト認証後
    const reciverMastodon = new MastodonRedirectCallbackReciver() 
    await reciverMastodon.recive() 
    //document.dispatchEvent(new CustomEvent('mastodon_redirect_approved', {detail: null}));
    //console.log('dispatchEvent')
    /*
    document.querySelector(`toot-dialog`).addEventListener('toot', async(event) => {
        console.debug('トゥートしました！ここから先はWebComponent,brid.gyと連携させたいが難しそう。brid.gyのAPIがなさそうなのとタイミング問題もある。なので妥協してマストドンAPIの応答からコメントHTMLを作成して即座に表示する。', event.detail);
        const html = new Comment().mastodonResToComment(event.detail.json)
        const comment = document.querySelector(`mention-section`).shadowRoot.querySelector(`#web-mention-comment`)
        comment.innerHTML = html + comment.innerHTML
    });
    */

    /*
    document.getElementById('get-misskey-account-info').addEventListener('click', async(event) => {
        const domain = document.getElementById('misskey-instance').value
        const isExist = await isExistInstance(domain)
        if (!isExist) { Toaster.toast(`指定したURLやドメイン ${domain} はmastodonのインスタンスでない可能性があります。\napi/v1/instanceリクエストをしても想定した応答が返ってこなかったためです。\n入力したURLやドメイン名がmastodonのインスタンスであるか確認してください。あるいはmastodonの仕様変更が起きたのかもしれません。対応したソースコードを書き換えるしかないでしょう。`, true); return; }
        //sessionStorage.setItem(`domain`, document.getElementById('misskey-instance').value)
        //const client = new MisskeyApiClient(domain, accessToken)
        //const authorizer = new MastodonAuthorizer(domain, 'read:accounts')
        //const domain = url.searchParams.get('domain')
        const authorizer = await getAuthorizer(domain, ['read:account'])
        authorizer.authorize()
    });
    document.getElementById('get-misskey-account-info').addEventListener('click', async(event) => {
        document.getElementById('misskey-instance').value
    });
    async function isExistInstance(domain) {
        const client = new MisskeyApiClient(domain)
        const json = await client.meta().catch(e=>null)
        if (!json) { return false }
        if (!json.hasOwnProperty('version')) { return false; }
        console.debug(json.version)
        console.debug(`----- ${domain} は正常なmisskeyサーバです -----`)
        return true
    }
    async function getAuthorizer(domain, permissions) { // ミスキーv12.39以降とそれ以前では認証方法が違うため必要。本当はversionをAPIで取得して判定させたかったが、versionを取得できなかったため諦めた。
        const client = new MisskeyApiClient(domain) 
        const json = await client.meta()
        console.debug(json)
        console.debug(json.version)
        const v = json.version.split('.')
        const isMiAuth= (12 <= parseInt(v[0]) && 39 <= parseInt(v[1])) 
        console.debug(`${domain}: ${v}`)
        console.debug('認証方法:', (isMiAuth) ? 'MiAuth' : 'OAuth')
        return (isMiAuth) ? new MisskeyAuthorizerMiAuth(domain) : new MisskeyAuthorizerOAuth(domain)
    }
    async function redirectCallback() {
        const url = new URL(location.href)
        if (url.searchParams.has('token') || url.searchParams.has('session')) {
            //const domain = url.searchParams.get('domain')
            const domain = sessionStorage.getItem(`misskey-domain`);
            const authorizer = await getAuthorizer(domain, ['read:account'])
            console.debug(authorizer )
            const i = await authorizer.redirectCallback()
            if (i) {
                console.debug('----- 認証リダイレクト後 -----')
                const client = new MisskeyApiClient(domain, i)
                const json = await client.i()
                const gen = new MisskeyProfileGenerator(domain)
                document.getElementById('export-misskey').innerHTML = gen.generate(json)
                //this.#noteEvent(res)
            }
        }
    }
    await redirectCallback()
    document.getElementById('misskey-instance').focus()
    */
});

