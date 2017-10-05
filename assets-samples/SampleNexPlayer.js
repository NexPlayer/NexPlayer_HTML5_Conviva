
document.addEventListener('DOMContentLoaded', init);

// Basic
var videoElement = null;
var player = null;
var player360 = null;
var controls = null;
var drmInformation = null;
var url = 'https://d7wce5shv28x4.cloudfront.net/dash_test/dash.mpd';

// 3rd Parties
var NexConviva = null;

// UI
var elementsUI = null;

function init() {
    document.getElementById('addDRMBox').addEventListener('click', addDRMBox);
    document.getElementById('load').addEventListener('click', onLoadClicked);
}

function reset() {
    if (controls !== null) {
        controls.resetControls();
        controls = null;
    }

    if (elementsUI !== null) {
        resetElementAndChilds(elementsUI.videoContainer);
        elementsUI = null;
    }

    controls = null;
    player = null;
}

function getElements() {
    // Obtained each time because they are reinitialized with the method resetElementAndChilds
    videoElement = document.getElementById("player");

    elementsUI = {
      videoContainer: document.getElementById('videoContainer'),
      canvas360: document.getElementById('canvas360'),
      controls: document.getElementById('controls'),
      playPauseButton: document.getElementById('playPauseButton'),
      thumbImage: document.getElementById('thumbImage'),
      seekBar: document.getElementById('seekBar'),
      muteButton: document.getElementById('muteButton'),
      volumeBar: document.getElementById('volumeBar'),
      fullscreenButton: document.getElementById('fullscreenButton'),
      currentTime: document.getElementById('currentTime'),
      bufferingSpinner: document.getElementById('bufferingSpinner'),
      giantPlayButton: document.getElementById('giantPlayButton'),
      quality: document.getElementById('QV-div'),
      trickplay: document.getElementById('TP-div'),
      audio: document.getElementById('Audio-div'),
      subtitles: document.getElementById('Sub-div'),
      settingsButton: document.getElementById('settingsButton'),
      dropDownContent: document.getElementById('dropdown-general'),
      giantPreview: document.getElementById('giantPreview'),
      seekBarTopControls: document.getElementById('controls-top')
    };
}

function preparePlayer(option) {
  reset();
  getElements();

  player = new nexplayer.Player();

  controls = new nexplayer.Controls( videoElement, player, elementsUI, option );
  controls.prepareThumbnails('dynamic');
  controls.onBufferingStateChange_( { type: 'waiting' } );

  var promise = player.Init(videoElement, url, drmInformation, option);
  player.attachSubtitleRendererDiv(document.getElementById("video-caption"));

  // Extra Conviva module
  videoElement.addEventListener('loadeddata', loadModules, false);

  promise.then(function () {
    if (option) {
      clear360();
      player360 = player.create360View(elementsUI.canvas360);
      videoElement.style.display = 'none';
    } else {
      if (this.player360 !== undefined) {
        clear360();
        elementsUI.canvas360.style.display = 'none';
      }
    }
  });
}

function clear360() {
  if (player360 !== null) {
    player360.destroy();
    player360 = null;
  }

  elementsUI.canvas360.style.display = 'inline';
  videoElement.style.display = 'inline';
}

function loadModules() {
  // Conviva
  if (NexConviva !== null) {
    NexConviva.cleanSession();
  }
  NexConviva = new NexHandshake(videoElement, url, player.isLive());
}

// FairPlay Utility
function base64EncodeUint8Array(input) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    while (i < input.length) {
        chr1 = input[i++];
        chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
        chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
            keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}

/*
    To use FairPlay is Safari on Mac, initilize the player setting the use of the native element to true.
    Then after loading the URI, pass the certificate in the method setDRMLicenseFairPlay, and a pointer 
    to a function that request the license (this is an example). After loading the request, 
    NexPlayer needs to know about this in the method nexLicenseRequestLoaded
    This function assumes the Key Server Module understands the following POST format --
    spc=<base64 encoded data>&assetId=<data>
    ADAPT: Partners must tailor to their own protocol.
*/
function licenseRequestReady (event) {
  var session = event.target;
  var message = event.message;
  var request = new XMLHttpRequest();
  var sessionId = event.sessionId;
  request.responseType = 'text';
  request.session = session;
  request.addEventListener('load', player.FairPlayNexLicenseRequestLoaded.bind(player), false);
  request.addEventListener('error', player.FairPlayNexLicenseRequestFailed.bind(player), false);
  var params = 'spc='+base64EncodeUint8Array(message)+'&assetId='+encodeURIComponent(session.contentId);
  request.open('POST', 'https://staging-solo.shift72.com/services/license/fairplay/cenc/fallback', true); // serverProcessSPCPath
  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  request.send(params);
}

function addDRMBox() {
  var div = document.getElementById('loadDiv');
  var ndrmcontainer = document.createElement('div');
  ndrmcontainer.className = 'div-drm';
  var input = document.createElement('input');
  input.id = 'drmKey';
  input.placeholder = 'Your custom key';
  var select = document.createElement('select');
  select.id = 'drmOption';
  var drmARR = getAvailableDRMs();

  for (var i = 0; i<drmARR[0].length; i++){
    var opt = document.createElement('option');
    opt.value = drmARR[0][i];
    opt.innerHTML = drmARR[1][i];
    select.appendChild(opt);
  }

  ndrmcontainer.appendChild(input);
  ndrmcontainer.appendChild(select);
  div.appendChild(ndrmcontainer);
}

function getAvailableDRMs() {
  var drmARR = ['com.widevine.alpha','com.microsoft.playready', 'com.apple.fps.1_0'];
  var strDRM = ['Widevine','PlayReady','FairPlay'];
  return [drmARR,strDRM];
}

function onLoadClicked() {
  var enable360 = false;
  var link = document.getElementById("newURL").value;

  if (link === '') {
    var e = document.getElementById("videoOption");
    var value = e.options[e.selectedIndex].value;

    if (value === '2'){
      enable360 = true;
    }
  } else {
    url = link.trim();
    var e = document.getElementById("videoOption");
    var value = e.options[e.selectedIndex].value;

    if (value === '2'){
      enable360 = true;
    }
  }

  getDRMs();
  preparePlayer(enable360);
}

function getDRMs() {
  var containers = [document.getElementById('loadDiv')];
  drmInformation = null;
  drmInformation = [];

  for (var i = 0 ; i<containers.length; i++) {
    var container = containers[i];

    if (container.querySelector("#drmKey") !== null) {
      var drmKey = container.querySelector("#drmKey").value; 
      var drmType = container.querySelector("#drmOption").options[container.querySelector("#drmOption").selectedIndex].value;
      var drm = { NexDRMType: drmType, NexDRMKey: drmKey, NexHeaders: undefined, NexCallback: null };

      if (drmKey !== '') {
        drmInformation.push(drm);
      }
    }
  }

  if (drmInformation.length === 0) {
    drmInformation = undefined;
  }
}
