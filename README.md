## NexPlayer™ HTML5 Conviva Analytics Integration

![NexPlayer demo home ](images/Conviva.png)


[NexPlayer™ HTML5](https://nexplayersdk.com/nexplayer-html5/) is a multi-screen streaming player that enables HLS and DASH live streaming across all browsers and platforms with the highest video quality. NexPlayer™ HTML5 supports an advanced feature set that includes DRM, Closed Captioning, Time Shifting and 360 video playback among many others.

This repository contains the sample demo code of NexPlayer™ HTML5 with the integration of [Conviva](https://www.conviva.com/). A fully working demo can be downloaded on our [website](https://nexplayersdk.com/request/).

## Quick Start

- The folder "assets-sample/conviva" includes the scripts that should be included in the HTML file:

```html
<script src="./assets-samples/conviva/conviva-html5native-impl.js"></script>
<script src="./assets-samples/conviva/conviva-html5native-library.min.js"></script>
<script src="./assets-samples/conviva/NexHandshake.js"></script>
<script src="./assets-samples/conviva/configs.js"></script>
```

- Configure your settings in "assets-scripts/conviva/configs.js".

- NexHandshake should be created after the event "loadeddata" is fired. This object preintegrates the Conviva client and will handle the analytic sessions.

```javascript
var NexConviva = null;

...
videoElement.addEventListener('loadeddata', loadModules, false);
...

function loadModules() {
    NexConviva = new NexHandshake(videoElement, url, player.isLive());
}
```

- To destroy and reset the current Conviva session the following code should be used:

```javascript
NexConviva.cleanSession();
```


-------------------

## Request demo
Product page [NexPlayer™ HTML5](https://nexplayersdk.com/html5-player/)

## Contact
[supportmadrid@nexstreaming.com](mailto:supportmadrid@nexstreaming.com)

## License
[NexPlayer™ HTML5 Product License](License.txt)
