![NexPlayer demo home ](images/Conviva1.png)
# NexPlayer™ HTML5 Conviva Analytics Integration

[NexPlayer™ HTML5](https://nexplayersdk.com/nexplayer-html5/) is a multi-screen streaming player that enables HLS and DASH live streaming across all browsers and platforms with the highest video quality. NexPlayer™ HTML5 supports an advanced feature set that includes DRM, Closed Captioning, Time Shifting and 360 video playback among many others.

This repository contains the sample demo code of NexPlayer™ HTML5 with the integration of [Conviva](https://www.conviva.com/). A fully working demo can be downloaded on our [website](https://nexplayersdk.com/request/).

## Quick Start

- The folders "app" and "conviva" include the scripts that should be included in the HTML file:

```html
<script type="text/javascript" src="conviva/conviva-core-sdk.min.js"></script>
<script type="text/javascript" src="conviva/conviva-html5native-impl.js"></script>
<script type="text/javascript" src="app/configs.js"></script>
<script type="text/javascript" src="app/NexHandshake.js"></script>
```

- Configure your settings in "app/configs.js".

- NexHandshake should be created after the event "loadeddata" is fired. This object preintegrates the Conviva client and will handle the analytic sessions.

```javascript
var NexConviva = null;

...
videoElement.addEventListener('loadeddata', loadModules, false);
...

function loadModules() {
  NexConviva = new NexHandshake(videoElem, url, player.isLive(), true);
  NexConviva.initConvivaClient();
  NexConviva.createContentSession();
  NexConviva.updateBitrateData(player.getCurrentTrack().bitrate / 1000);
  // Use this in order to update the bitrate data every time a track changes
  player.on(nexplayer.Player.NexEvent.Track_Change, function() {
    NexConviva.updateBitrateData(player.getCurrentTrack().bitrate / 1000);
  });
  // Example of creating a custom tag
  NexConviva.createCustomTag("a", "20", false);
  // It is necessary to call this method to update the metadata on Conviva side
  NexConviva.updateContentMetadata();
}
```

- To destroy and reset the current Conviva session the following code should be used:

```javascript
NexConviva.cleanupContentSession();
```
This is already called in NexHandshake.js file, but it can be modified and be called whenever
it is wanted to clean up the session.


-------------------

## Request demo
Product page [NexPlayer™ HTML5](https://nexplayersdk.com/html5-player/)

## Contact
[supportmadrid@nexplayer.com](mailto:supportmadrid@nexplayer.com)

## License
[NexPlayer™ HTML5 Product License](License.txt)
