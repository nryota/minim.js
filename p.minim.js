// p.minim.js (c)2016 NISHIDA Ryota - http://dev.eyln.com (zlib License)

// class Minim
function Minim() {
  if (typeof Minim.context === 'undefined') {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;  

    function iOS_InitRate() {
      var source = Minim.context.createBufferSource();
      source.buffer = Minim.context.createBuffer(1, 1, 48000);
      source.connect(Minim.context.destination);
      if(source.start) { source.start(0); }
      else { source.noteOn(0); }
    }
 
    if(AudioContext) {
      Minim.context = new AudioContext();

      if(navigator.userAgent.match(/(iPhone|iPod|iPad)/i)) {
        iOS_InitRate();
        if(Minim.context.sampleRate === 48000) {
          Minim.context = new AudioContext();
          iOS_InitRate();
        }
      }

      var local = this;
      document.addEventListener('visibilitychange', function() {
          if(document.visibilityState === 'hidden') { local.pause(); }
          else if(document.visibilityState === 'visible') { local.resume(); }
        }, false);
    }
  }

  this.loadFile = function(filename) {
    return new AudioPlayer(filename);
  }

  this.loadSample = function(filename) {
    return new AudioSample(filename);
  }

  this.pause = function() {
    Minim.context.suspend();
  }

  this.resume = function() {
    Minim.context.resume();
  }

  this.stop = function() {
    Minim.context.close();
  }
}

// class AudioPlayer
function AudioPlayer(filename) {
  var _loaded = false;
  var _looping = false;
  var _playing = false;
  var _startTime = 0;
  var _pauseTime = -1;
  var _headPosition = -1;
  var _source;
  var _gain;
  var _buffer;

  this.load = function(url, fn) {  
    if(!Minim.context) return;
    var req = new XMLHttpRequest();
    req.responseType = 'arraybuffer';
    req.onreadystatechange = function() {
      if(req.readyState === 4 && (req.status === 0 || req.status === 200)) {
        Minim.context.decodeAudioData(req.response, function(buffer) {
          _buffer = buffer;
          if(navigator.userAgent.match(/(iPhone|iPod|iPad)/i)){
            document.body.addEventListener("touchstart",function() {  
              _source = Minim.context.createBufferSource();
              _source.buffer = _buffer;
              _source.connect(Minim.context.destination);
              _source.start(0);
              _source.disconnect();
              _source = null;
              _loaded = true;
              document.body.removeEventListener('touchstart', arguments.callee, false);
              if(fn) { fn(); }
            });
          } else {
            _loaded = true;
            if(fn) { fn(); }
          }
        });
      }
    };
    req.open('GET', url, true);
    req.send('');
  };


  this.isPlaying = function () {
    return _playing;
  }

  this._trigger = function (position) {
    if (!_loaded) {
      if(!Minim.context) return;
      var local = this;
      setTimeout(function() { local.play(); }, 50);
      return;
    }
    _source = Minim.context.createBufferSource();
    _source.buffer = _buffer;
    //_source.connect(Minim.context.destination);
    this._connectGain();
    var pos = 0;
    if(position) {
      pos = position;
    }
    if(pos < 0) pos = 0;
    _source.start(0, pos / 1000);
    _startTime = Minim.context.currentTime;
    _headPosition = -1;
    _pauseTime = -1;
    _playing = true;
  };

  this._connectGain = function() {
    if(_source) {
      _gain = Minim.context.createGain();
      _source.connect(_gain);
      _gain.connect(Minim.context.destination);
    }
  }

  this.play = function (position) {
    if(!_loaded) {
      if(!Minim.context) return;
      var local = this;
      setTimeout(function() { local.play(); }, 50);
      return;
    }
    if(_pauseTime >= 0 && _headPosition < 0) {
     if(!_source) {
        _source = Minim.context.createBufferSource();
        _source.buffer = _buffer;
        this._connectGain();
      }
      this.resume();
    } else {
      var pos = _headPosition;
      if(position) {
        pos = position;
      }
      if(pos < 0) pos = 0;
      this._trigger(pos);
    }
  };

  this.loop = function () {
    if(!_loaded) {
      if(!Minim.context) return;
      var local = this;
      setTimeout(function() { local.loop(); }, 50);
      return;
    }
    _looping = true;
    this.play();
    if(_source) {
      _source.loop = true;
    }
  };

  this.pause = function () {
    if(!_loaded) { return; }
    if(_source) {
      _source.disconnect();
    }
    //_headPosition = this.position();
    _pauseTime = Minim.context.currentTime;
    _playing = false;
  };

  this.rewind = function () {
    if(!_loaded) { return; }
    _headPosition = 0;
    _pauseTime = -1;
  };

  this.resume = function () {
    if(!_loaded) { return; }
    if(_source && _pauseTime >= 0) {
      if(_gain) {
        _source.connect(_gain);
        _gain.connect(Minim.context.destination);
      } else {
        _source.connect(Minim.context.destination);
      }
      _startTime += Minim.context.currentTime - _pauseTime;
      _pauseTime = -1;
      _headPosition = -1;
      _playing = true;
    }
  }

  this.position = function() {
    if(!_loaded) { return -1; }
    var pos;
    if(_headPosition >= 0) {
      pos = _headPosition;
    } else if(_pauseTime >= 0) {
      pos = Math.floor((_pauseTime - _startTime) * 1000);
    } else {
      pos = Math.floor((Minim.context.currentTime - _startTime ) * 1000);
    }
    if(pos > this.len()) {
      pos = pos % this.len();
    }
    return pos;
  };

  this.len = function() {
    if(!_loaded || !_buffer) { return -1; }
    return Math.floor(_buffer.length / Minim.context.sampleRate * 1000);
  }
 
  this.cue = function(position) {
    if(!_loaded) { return; }
    if(_source) {
      if(_playing) play(position);
      else _headPosition = position;
    }
  };

  this.mute = function() {
    if(!_loaded) { return; }
    if(_gain) {
      _gain.gain.value = 0.0;
    }
  };

  this.unmute = function() {
    if(!_loaded) { return; }
    if(_gain) {
      _gain.gain.value = 1.0;
    }
  };

  this.setVolume = function(vol) {
    if(!_loaded) { return; }
    if(_gain) {
      _gain.gain.value = vol;
    }
  };

  this.getVolume = function(vol) {
    if(!_loaded) { return 0; }
    if(_gain) {
      return _gain.gain.value;
    } else return 0;
  };

  this.close = function() {
    if(_source) {
      _source.stop();
      _playing = false;
      _headPosition = -1;
      _pauseTime = -1;
    }
  };

  if(filename) {
    this.load(filename, function(){});
  }
}

// class AudioSample
function AudioSample(filename) {
  var player;

  this.load = function(url, fn) {
    player = new AudioPlayer(url, fn);
  };

  this.trigger = function() {
    if(!player) return;
    player._trigger();
  };
  
  this.stop = function() {
    if(!player) return;
    player.stop();
  };

  this.setVolume = function(vol) {
    if(!player) return;
    player.setVolume(vol);
  };

  this.getVolume = function(vol) {
    if(!player) return 0;
    return player.getVolume();
  };

  if(filename) {
    this.load(filename, function(){});
  }
}
