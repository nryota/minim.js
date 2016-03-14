# p.minim.js

## 概要

JavaScriptからMinimのplay()やtrigger()程度の単純な音声再生を行うためのライブラリです。主にprocessing.jsと一緒に使うことを想定（必須ではないです）。

HTML5のWebAudioに対応したブラウザで再生できます。iOSでは画面タッチ後に音を再生できるようになるので、タッチするまでは無音です。また、再生できる音声ファイルの周波数は各ブラウザに依存します。


### 使い方

読み込みと音声再生のコードの例です。

	// Setup
	Minim minim = new Minim(this);

	// BGM
	AudioPlayer bgm;
	bgm = minim.loadFile("ファイルのパス");
	bgm.play();    // 普通にBGM再生
	// bgm.loop(); // ループでBGM再生

	// SE
	AudioSample se;
	se = minim.loadSample("ファイルのパス");
	se.trigger();  // SE再生

index.htmlをサーバーにアップロードして開いて、読み込みが終わるとBGMが再生され、クリックするとSEが再生されます。
BGMはマウスカーソル左にあると小さく、右にあると大きな音で鳴ります。

こちらの[Sample Page][Sample]で実際に動いているサンプルをお試しできます。

[Sample]: http://dev.eyln.com/GitHub/p.minim.js/

![fastTemplate](https://raw.github.com/wiki/nryota/p.minim.js/images/sample.png)


## License

#### p.minim.js

Copyright &copy; 2016 NISHIDA Ryota [http://dev.eyln.com][EYLN]
Distributed under the [ZLIB License][ZLIB].

[EYLN]: http://dev.eyln.com/
[ZLIB]: http://opensource.org/licenses/zlib
