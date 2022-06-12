// https://misskey.m544.net/docs/ja-JP/api
// 12.39.1以降の認証はOAuthでなくMiAuthという独自手法を使うらしい。互換性皆無。
class MisskeyAuthorizer { // https://forum.misskey.io/d/6-miauth
    static get(domain='misskey.io', permissions=null) {
        console.debug(`----- MisskeyAuthorizer.get() -----: ${this.domain}`)
        if (!domain) { return null }
        const client = new MisskeyApiClient(domain) 
        const json = await client.meta()
        console.debug(json)
        console.debug(json.version)
        const v = json.version.split('.')
        sessionStorage.setItem(`misskey-${domain}-version`, json.version);
        const isMiAuth= (12 <= parseInt(v[0]) && 39 <= parseInt(v[1])) 
        console.debug(`${domain}: ${v}`)
        console.debug('認証方法:', (isMiAuth) ? 'MiAuth' : 'OAuth')
        sessionStorage.setItem(`misskey-${domain}-auth-method`, (isMiAuth) ? 'MiAuth' : 'OAuth');
        return (isMiAuth) ? new MisskeyAuthorizerMiAuth(domain) : new MisskeyAuthorizerOAuth(domain)
    }
}

