# manifest.xml

manifest.xmlは，ノートや本文で選択した文字列を、ブラウザの音声合成機能や AWS Polly を使って再生することができる，マイクロソフト社製パワーポイント用アドインの設定ファイルです．ダウンロードして，パワーポイントにアドインをインストールして下さい．

* ファイルのダウンロード方法は，[CHiLO-Speechマニュアル「STEP2：[参考] GitHubのファイル操作」](https://docs.cccties.org/chilospeech/video/github#fairunodaunrdo)をご確認下さい．
* アドインのインストール方法は，[CHiLO-Speechマニュアル「パワーポイントの準備(1)」](https://docs.cccties.org/ppt-width-audio/-MjY6ujcFWF_354padAe/pawpointo/1adoinnoinsutru)　をご覧下さい．


# アーキテクチャ（システム管理者向け資料）
## 1. アドインのインストール

アドインは、システム管理者があらかじめ Vercel などにデプロイします。PowerPointのユーザーは、PowerPointファイルにアドインをインストールして使います。

PowerPointファイルへのアドインの挿入方法は、アドインのデプロイ方法や PowerPointアプリの種類によって異なります。ここでは以下の方法でデプロイされたアドインを使う場合について説明します。

- Vercelにデプロイした場合
- localhost で動作する開発用サーバを使う場合

システム管理者は、アドインの manifestファイルを PowerPoint ユーザーに配布します。

### (1) Windows版 PowerPoint アプリ

Windows版 PowerPoint アプリでは、次の方法でアドインを挿入します。

1. manifest ファイルが存在するディレクトリを Windows で共有する
2. PowerPointアプリを起動し、[ファイル]-[オプション]-[セキュリティセンター]で[セキュリティセンターの設定]を開く
3. [信頼できるアドインカタログ]で、共有ディレクトリの URLをカタログに追加する
4. PowerPointアプリを再起動して、[挿入]-[個人用アドイン]-[共有フォルダー]から[Chilo TTS Add-in]を選択して[追加]する

[ホーム]-[Show Taskpane]をクリックすると、アドインが表示されます。

### (2) macOS版 PowerPoint アプリ

Macをお使いの場合は、次のページを参照してください。

[ネットワーク共有Officeテスト用にアドインをサイドロードする](https://docs.microsoft.com/ja-jp/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins)

### (3) Web版 PowerPoint

Office 365, Microsof 365 などで使える Web版 PowerPoint の場合は、次の方法で PowerPoint アプリにアドインを挿入します。

1. office.com で PowerPoint for the web を起動する
2. [挿入]-[アドイン]で Office アドイン ダイアログが表示される
3. ダイアログで [マイアドインのアップロード]をクリック、[参照...]で manifest ファイルを選んで [アップロードする]

[ホーム]-[Show Taskpane]をクリックすると、アドインが表示されます。

## 2. アドインの操作

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

