# ppt-addin-vue

ノートや本文で選択した文字列を、ブラウザの音声合成機能や AWS Polly を使って再生することができる、PowerPoint用 Officeアドインのサンプルです。

## アドインの挿入

アドインは、システム管理者があらかじめ Vercel などにデプロイします。PowerPointのユーザーは、PowerPointファイルにアドインを挿入して使います。

PowerPointファイルへのアドインの挿入方法は、アドインのデプロイ方法や PowerPointアプリの種類によって異なります。ここでは以下の方法でデプロイされたアドインを使う場合について説明します。

- Vercelにデプロイした場合
- localhost で動作する開発用サーバを使う場合

システム管理者は、アドインの manifestファイルを PowerPoint ユーザーに配布します。

### Windows版 PowerPoint アプリ

Windows版 PowerPoint アプリでは、次の方法でアドインを挿入します。

1. manifest ファイルが存在するディレクトリを Windows で共有する
2. PowerPointアプリを起動し、[ファイル]-[オプション]-[セキュリティセンター]で[セキュリティセンターの設定]を開く
3. [信頼できるアドインカタログ]で、共有ディレクトリの URLをカタログに追加する
4. PowerPointアプリを再起動して、[挿入]-[個人用アドイン]-[共有フォルダー]から[Chilo TTS Add-in]を選択して[追加]する

[ホーム]-[Show Taskpane]をクリックすると、アドインが表示されます。

Macをお使いの場合は、次のページを参照してください。

[ネットワーク共有Officeテスト用にアドインをサイドロードする](https://docs.microsoft.com/ja-jp/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins)

### Web版 PowerPoint

Office 365, Microsof 365 などで使える Web版 PowerPoint の場合は、次の方法で PowerPoint アプリにアドインを挿入します。

1. office.com で PowerPoint for the web を起動する
2. [挿入]-[アドイン]で Office アドイン ダイアログが表示される
3. ダイアログで [マイアドインのアップロード]をクリック、[参照...]で manifest ファイルを選んで [アップロードする]

[ホーム]-[Show Taskpane]をクリックすると、アドインが表示されます。

## アドインの操作

アドインが表示されているとき、本文やノートの文字列を選択して[音声合成]をクリックすると、AWS Polly で合成した音声を再生します。音声名とサンプルレートを指定することができます。

アドインは選択された文字列を常に Speech Markdown で処理します。SSML記法で記述されたタグはそのまま AWS Polly に渡るので、以下の記法が混在する文字列を指定できます。

- タグや特殊文字などを含まない文章
- Speech Markdown のマークダウン記法
- SSML記法

[このマシンで音声合成する。]をチェックするとPCで音声合成します。このとき、SSML記法やSSMLで実現されるマークダウン記法は使えません。

Speech Markdown がサポートしているオリジナルのマークダウン記法に加えて、以下の形式のマークダウン記法をサポートしています。

- (日本橋)[ruby:"にっぽんばし"] ⇒ `<phoneme type="ruby" ph="にっぽんばし">日本橋</phoneme>`
- (彼氏)[kana:"カレシ"] ⇒ `<phoneme alphabet="x-amazon-pron-kana" ph="カレシ">彼氏</phoneme>`

Speech Markdown については、以下のページを参照してください。

[Speech Markdown ホームページ](https://www.speechmarkdown.org/)

[Speech Markdown ドキュメント](https://www.speechmarkdown.org/basics/what/)

AWS Polly で使える SSML記法については、以下のページを参照してください。

[Amazon Polly Developer Guide](https://docs.aws.amazon.com/polly/latest/dg/polly-dg.pdf)

[Amazon Polly を使用した日本語テキスト読み上げの最適化](https://aws.amazon.com/jp/blogs/news/amazon-polly-japanese-text-optimization/)

## Deploy on Vercel

Vercel にデプロイして使う場合、この ppt-addin-vue と server の 2 つのデプロイをペアで利用することに注意して、次の手順でデプロイしてください。

- `app-addin-vue/src/main.js` の `const server = 'https://polly-server-one.vercel.app'` で設定している URL を `server` をデプロイした先のサイトとする
  - 変更するときはローカルだけで無く github に push が必要です。vercel の環境変数で上書きできるようにすると便利だろうが今のところそれは未対応
- Vercel デプロイのセットアップ
  - `New Project` でこのリポジトリを `Import` する
  - `Import Project` で `ppt-addin-vue` ディレクトリを選択する
  - `PROJECT NAME` は `polly-addon-test` など自由に設定
  - `FRAMEWORK PRESET` = Vue.js (自動認識される)
  - `ROOT DIRECTORY` = ppt-addin-vue (先ほど選んだもの)
  - `Environment Variables` に次を設定
    - `POLLY_SERVER` に server をデプロイしたサイト (`https://polly-server-test.vercel.app` など) を設定
- デプロイされたら `Settings` - `Domains` で `polly-addon-test.vercel.app` となっていることを確認。別のものに変更したければ変更する
- 先ほどデプロイした先のドメインをアドオンフレームに読み込むようにするため `manifest.xml` の中の `http://localhost:3000/` を全て `http://polly-addon-test/` のように一括置き換えして `manifest-vercel.xml` のように別ファイルで保存する
- 新しく作った manifest をオフィスに読み込む (手順はローカル開発時と同じ)

## Local Development

開発用サーバを使う場合は、keys ディレクトリに localhost証明書が必要です。localhost証明書は、以下のページの「アプリをセキュリティ保護する」の方法で入手します。

Vue を使用して Excel 作業ウィンドウ アドインを作成する
https://docs.microsoft.com/ja-jp/office/dev/add-ins/quickstarts/excel-quickstart-vue

以下の 3つのファイルが必要です。

- keys/localhost.key
- keys/localhost.crt
- keys/ca.crt

## Project setup
```
npm install
```

## Compiles and hot-reloads for development

開発用サーバは、次の方法で起動します。

```
npm run serve
```

## Compiles and minifies for production

以下のコマンドで dist ディレクトリに production コードが生成されます。

```
npm run build
```

## Lints and fixes files
```
npm run lint
```

## Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
