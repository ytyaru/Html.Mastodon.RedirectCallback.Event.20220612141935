# トゥートボタンに内蔵されたリダイレクト処理を分離したい

　さもなくば認証した直後にトゥートしてしまう。トゥートでなくプロフィール情報取得APIを叩きたいだけのときなどにおいて不都合。なのでトゥートボタンに内蔵されたリダイレクト処理を分離したい。イベント発行だけして、承認後の処理をどうするかはまかせる。または条件分岐する。
　

## sessionStorage

　認証するとき各SNSサイトでログインや承認をしてもらうことになる。そのとき最初のサイトで入力したトゥート内容や対象ドメインなどの情報を一時的に保存しておく必要がある。さもなくばリダイレクト先から戻ってきたとき、それらの情報は消えてしまい、もう一度入力する羽目になる。しかもドメイン名は間違えればトゥートなどのAPIを実行できない。そのため保存しておく必要がある。

```
mastodon
  domain
    version
    oauth
      client_id
      client_secret
      scope
      access_token
    redirected
      action
      params
    user
misskey
  domain
    version
    oauth
      client_id
      client_secret
      scope
      access_token
    miauth
      session
      token
    redirected
      action
      params
    user
```

　mastodonとmisskeyはAPIに互換性がないため区別する必要がある。対象domainも区別する必要がある。同じドメインに対して認証とAPI実行せねばならない。また、ドメインによりユーザIDが違ったりもする。

```
mastodon = {
    "mstdn.jp": [{
        version: "",
        oauth: {
            client_id: "",
            client_secret: "",
            scope: "",
            access_token: "",
        },
        redirected: {
            action: "",
            params: "",
        },
        user: {
            id: "",
            username: "",
            ...
        },
    }]    
}
```

　けれど一部だけ修正するアルゴリズムを作り込むのが面倒。なのでキーバリューにする。

```
mastodon-domain
mastodon-${domain}-version
mastodon-${domain}-oauth-client_id
mastodon-${domain}-oauth-client_secret
mastodon-${domain}-oauth-scope
mastodon-${domain}-oauth-access_token
mastodon-${domain}-callback-action
mastodon-${domain}-callback-params
mastodon-${domain}-user
```

```
misskey-domain
misskey-${domain}-version
misskey-${domain}-auth-method
misskey-${domain}-oauth-client_id
misskey-${domain}-oauth-client_secret
misskey-${domain}-oauth-scope
misskey-${domain}-oauth-access_token
misskey-${domain}-miauth-session
misskey-${domain}-miauth-token
misskey-${domain}-callback-action
misskey-${domain}-callback-params
misskey-${domain}-user
```

　どうでもいいが、アクセストークンの権限範囲をしめす語に統一性がない。`scope`,`grant`,`permission`の３種がある。統一してほしい。

## event名にハイフンを入れると実行できない。アンダーバーならOK

* https://discuss.newrelic.com/t/custom-event-metric-naming-syntax-hyphens/102400/2

　今回、次のような独自イベントを発行した。

イベント名|概要
----------|----
`mastodon_redirect_approved`|マストドンの承認リダイレクトで承認されたときに発火する
`mastodon_redirect_rejected`|マストドンの承認リダイレクトで拒否されたときに発火する

　このとき、イベント名の区切り文字にハイフンを使うと受信されなかった。アンダーバーだと受信された。そういう仕様らしい。

発火
```javascript
document.dispatchEvent(new CustomEvent('mastodon_redirect_approved', {detail: params}));
document.dispatchEvent(new CustomEvent('mastodon_redirect_rejected', {detail: params}));
```

受信
```javascript
document.addEventListener('mastodon_redirect_approved', async(event) => {
    // 承認されたときに実行する内容
});
document.addEventListener('mastodon_redirect_rejected', async(event) => {
    // 拒否されたときに実行する内容
});
```

