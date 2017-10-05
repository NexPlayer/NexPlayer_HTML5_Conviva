
function resetElementAndChilds(el) {
	if (el === null) {
        return;
    }

	var childs  = el.childNodes;

	for(var i = 0; i<childs.length; i++) {
		if(childs[i].nodeName !== '#text') {
            resetElementAndChilds(childs[i]);
        }
    }

    if (el.removeAttribute) {
        el.removeAttribute('style');
    }

    if (el.tagName === 'VIDEO') {
        var newVideo = document.createElement('video');
        newVideo.id = el.id;
        newVideo.class = el.class;
        for (var j = 0, atts = el.attributes, n = atts.length, arr = []; j < n; j++){
            newVideo.setAttribute(atts[j].nodeName, atts[j].value);
        }
        el.parentNode.replaceChild(newVideo, el);
    } else {
        var elClone = el.cloneNode(true);
        el.parentNode.replaceChild(elClone, el);        
    }
}

function doesDeviceAutoPlayWithSound() {
    // If the device is a phone with a browser different from Firefox the video can't auto-play with sound
    return (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) ||
        navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}

function isPhoneDevice() {
    return getDeviceType === "mobile";
}

function getDeviceType() {
    var deviceType = "pc";

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) {
        deviceType = "mobile";
    }

    return deviceType;
}

function isFullScreen() {
    return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
}
