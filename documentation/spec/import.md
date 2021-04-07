# インポートに関する仕様

### インポートjsonとインポート元データとの対応
book.json
|json|内容|required|default|CHiLO Book シート|CB 列|PPT プロパティ|備考|
|-|-|-|-|-|-|-|-|
|name||true||book-list|book-title|||
|description||||book-list|book-summary|||
|language|||ja|series-information|language|||
|timeRequired|||||||xlsxには該当する項目がないため、任意の値を設定|
|shared|||true||||xlsxには該当する項目がないため、任意の値を設定|
|publishedAt||true||series-information|published|||
|createdAt||true||series-information|published||xlsxには該当する項目がないため、publishedを利用|
|updatedAt||true||series-information|revised|||
|details.series.*||||series-information|version||対応外|
|details.series.*||||series-information|author||対応外|
|details.series.*||||series-information|publisher||対応外|
|details.series.*||||series-information|editor||対応外|
|details.series.*||||series-information|rights||対応外|
|details.series.*||||series-information|series-name||対応外|
|details.series.*||||series-information|series-introduction||対応外|
|details.series.*||||series-information|series-url||対応外|
|details.series.*||||series-information|cover||対応外、画像は特に利用されない|
|details.book.*||||book-list|vol||対応外|
|details.book.*||||book-list|book-cover||対応外、画像は特に利用されない|
|details.book.*||||book-list|identifier||対応外|
|details.book.*||||book-list|community-url||対応外|
|details.book.*||||book-list|version||対応外|
|details.book.*||||book-list|language||対応外|
|details.book.*||||book-list|author||対応外|
|details.book.*||||book-list|publisher||対応外|
|details.book.*||||book-list|editor||対応外|
|details.book.*||||book-list|published||対応外|
|details.book.*||||book-list|revised||対応外|
|details.book.*||||book-list|rights||対応外|
|keywords[]|||||||xlsxには該当する項目がないため、任意の値を設定|
|sections[]||true|||||1個以上のセクションが必要|
|sections[].name||||vol-n|section|||
|sections[].topics[]||true|||||1個以上のトピックが必要|
|sections[].topics[].name||true||vol-n|topic|||
|sections[].topics[].description||||vol-n|text||ファイルの内容を展開する|
|sections[].topics[].language|||ja|book-list|language||空白の場合は、series-informationのものを設定すること|
|sections[].topics[].timeRequired|||||||xlsxには該当する項目がないため、任意の値を設定|
|sections[].topics[].shared|||true||||xlsxには該当する項目がないため、任意の値を設定|
|sections[].topics[].createdAt||true||book-list|published||空白の場合は、series-informationのものを設定すること|
|sections[].topics[].updatedAt||true||book-list|revised||空白の場合は、series-informationのものを設定すること|
|sections[].topics[].licenses[]||true||vol-n|CC||`CC-BY-4.0`などの形式に沿った値|
|sections[].topics[].keywords[]|||||||xlsxには該当する項目がないため、任意の値を設定|
|sections[].topics[].resource.url||true||vol-n|main|||
|sections[].topics[].resource.providerUrl||true|||||動画がローカルファイルの場合は、アップロード先のサイトを設定|
|sections[].topics[].details.*||||vol-n|page-type||対応外|
|sections[].topics[].details.*||||vol-n|community||対応外|
|sections[].topics[].details.*||||vol-n|video-image||対応外、画像は特に利用されない|
|sections[].topics[].details.*||||vol-n|javascript-file||対応外|
|sections[].topics[].details.*||||vol-n|video-id||対応外|

例: chilo001_vol-1.json
```
{
    "name": "インターネットの歴史とビットの復習",
    "description": "",
    "language": "ja",
    "timeRequired": 60,
    "shared": true,
    "publishedAt": "2013-09-13T00:00:00",
    "createdAt": "2013-09-13T00:00:00",
    "updatedAt": "2018-07-10T00:00:00",
    "keywords": [],
    "sections": [
        {
            "name": "インターネットの歴史",
            "topics": [
                {
                    "name": "戦争が作ったインターネット",
                    "description": "はじめにインターネットの歴史を紹介します。\nインターネットは戦争がきっかけで作られたことを知っていますか。\nかつてアメリカとソ連という2つの大国が、一触即発の状態で対峙していた時代がありました。実際に戦争に発展することはありませんでしたが、いつ戦争が勃発してもおかしくないような均衡状態を保っていたことから冷たい戦争、冷戦時代とよばれています。",
                    "language": "ja",
                    "timeRequired": 1,
                    "shared": true,
                    "createdAt": "2013-09-13T00:00:00",
                    "updatedAt": "2018-07-10T00:00:00",
                    "licenses": [
                        "CC-BY-4.0"
                    ],
                    "keywords": [],
                    "resource": {
                        "url": "001m_0101.mp4",
                        "providerUrl": "https://www.youtube.com/",
                        "tracks": [],
                        "details": {}
                    },
                    "details": {
                        "page-type": "document",
                        "community": true,
                        "video-image": "001m_0101.png",
                        "javascript-file": "",
                        "video-id": ""
                    }
                },
                {
                    "name": "スプートニックショック",
                    "description": "冷戦時代は互いに相手の国力を把握できない状況下で対峙していました。そのような中、1957年にソ連が世界初の人工衛星「スプートニック」の打ち上げに成功しました。\n当時、アメリカはまだ人工衛星打ち上げの技術がなく、世界一の技術を自負していたアメリカはこの事実に衝撃を受けたそうです。これを衛星の名前を取ってスプートニックショックとよびます。\nソ連の衛星打ち上げ成功は、地球の外からアメリカを攻撃する技術を持っていることを意味しています。冷戦という均衡状態の下、いつ先制攻撃を仕掛けられるかわからないためアメリカでは大変な危機感が募りました。",
                    "language": "ja",
                    "timeRequired": 1,
                    "shared": true,
                    "createdAt": "2013-09-13T00:00:00",
                    "updatedAt": "2018-07-10T00:00:00",
                    "licenses": [
                        "CC-BY-4.0"
                    ],
                    "keywords": [],
                    "resource": {
                        "url": "001m_0102.mp4",
                        "providerUrl": "https://www.youtube.com/",
                        "tracks": [],
                        "details": {}
                    },
                    "details": {
                        "page-type": "document",
                        "community": true,
                        "video-image": "001m_0102.png",
                        "javascript-file": "",
                        "video-id": ""
                    }
                }
            ]
        },
        {
            "name": "ビットの復習",
            "topics": [
                {
                    "name": "ビット",
                    "description": "これまでインターネットとコンピュータの歴史について簡単に説明しました。次に今後この本著を進めるに当たり、必要なビットの計算について説明します。\n3本の指を使って数を数えてくださいと言うと、普通は1、2、3と三種類の本数を数えます。しかしある人は、8種類の数、例えば1から8までを数えることができます。その理由を考えてみてください。その理由がわかれば、あなたはビットについてわかっているということになります。それを今から見ていくことにしましょう。",
                    "language": "ja",
                    "timeRequired": 1,
                    "shared": true,
                    "createdAt": "2013-09-13T00:00:00",
                    "updatedAt": "2018-07-10T00:00:00",
                    "licenses": [
                        "CC-BY-4.0"
                    ],
                    "keywords": [],
                    "resource": {
                        "url": "001m_0109.mp4",
                        "providerUrl": "https://www.youtube.com/",
                        "tracks": [],
                        "details": {}
                    },
                    "details": {
                        "page-type": "document",
                        "community": true,
                        "video-image": "001m_0109.png",
                        "javascript-file": "",
                        "video-id": ""
                    }
                },
                {
                    "name": "3桁2進数",
                    "description": "3本の指で数えることのできる数は8種類です。1から8まで、0から7まではどちらも8種類のため、ここでは0から7までを例に説明します。\n3本の指の状態を上向き矢印と下向き矢印で表します。上向きは指が立っている状態、下向きは閉じた状態とします。3本の指は画像のように8通りの状態を考えることができます。下向き矢印を0、上向き矢印を1とすることにより、0と1で以下のように表現することができます。",
                    "language": "ja",
                    "timeRequired": 1,
                    "shared": true,
                    "createdAt": "2013-09-13T00:00:00",
                    "updatedAt": "2018-07-10T00:00:00",
                    "licenses": [
                        "CC-BY-4.0"
                    ],
                    "keywords": [],
                    "resource": {
                        "url": "001m_0110.mp4",
                        "providerUrl": "https://www.youtube.com/",
                        "tracks": [],
                        "details": {}
                    },
                    "details": {
                        "page-type": "document",
                        "community": true,
                        "video-image": "001m_0110.png",
                        "javascript-file": "",
                        "video-id": ""
                    }
                }
            ]
        }
    ],
    "details": {
        "series": {
            "version": "2.4",
            "author": "日置慎治",
            "publisher": "NPO CCC-TIES",
            "editor": "NPO CCC-TIES",
            "rights": "2013 NPO CCC-TIES",
            "series-name": "はじめての情報ネットワークⅠ",
            "series-introduction": "本書の主題と目標は、インターネットを主体としたネットワークについて深く理解をすることです。\n今やインターネットは地球規模のネットワークに成長しています。例えば、パソコンなど小さなコンピュータから、サーバと言われる大規模で強力なコンピュータまでネットワークにつながっています。また最近では、携帯電話や一般の電話もネットワークにつながっている時代です。さらに最近では、家電製品までもがインターネットにつながるようになりつつあります。\nまずは、ネットワークを理解して、セキュリティについても学習しましょう。",
            "series-url": "http://proxy.chilos.jp/p001",
            "cover": "001_inside_cover.png"
        },
        "book": {
            "vol": "vol-1",
            "book-cover": "001_cover_image_1.png",
            "identifier": "41fe5bb9-686f-47dd-8197-61fc9f817bcd",
            "community-url": "http://chilos.jp/en/c/?c=1",
            "version": "",
            "language": "",
            "author": "",
            "publisher": "",
            "editor": "",
            "published": "",
            "revised": "",
            "rights": ""
        }
    }
}
```
