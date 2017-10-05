
nexplayer.Controls = function(videoElement, player, elementsUI, is360) {
    this.videoElement_ = videoElement;
    this.nexPlayer_ = player;

    this.videoContainer_ = elementsUI.videoContainer;
    this.controls_ = elementsUI.controls;
    this.playPauseButton_ = elementsUI.playPauseButton;
    this.thumbImage_ = elementsUI.thumbImage;
    this.seekBar_ = elementsUI.seekBar;
    this.muteButton_ = elementsUI.muteButton;
    this.volumeBar_ = elementsUI.volumeBar;
    this.fullscreenButton_ = elementsUI.fullscreenButton;
    this.currentTime_ = elementsUI.currentTime;
    this.bufferingSpinner_ = elementsUI.bufferingSpinner;
    this.giantPlayButton_ = elementsUI.giantPlayButton;
    this.quality_ = elementsUI.quality;
    this.trickplay_ = elementsUI.trickplay;
    this.subtitles_ = elementsUI.subtitles;
    this.audio_ = elementsUI.audio;
    this.mode360_ = is360;
    this.canvas360_ = elementsUI.canvas360;
    this.settingsButton_ = elementsUI.settingsButton;
    this.dropDownContent_ = elementsUI.dropDownContent;
    this.giantPreview_ = elementsUI.giantPreview;
    this.seekBarTopControls_ = elementsUI.seekBarTopControls;

    this.isSeeking_ = false;
    this.seekTimeoutId_ = null;
    this.mouseStillTimeoutId_ = null;
    this.lastTouchEventTime_ = null;
    this.videoPlaying_ = false;
    this.clickingContainer_ = false;
    this.isFullscreen360iOSinUse_ = false;
    this.max_height_  = 0;

    this.init_();
};

nexplayer.Controls.prototype.init_ = function()  {
    this.showUIControls();
    this.setGiantPlayButtonVisibility_(false);
    this.displayBuffering();
    window.setInterval(this.updateTimeAndSeekRange_.bind(this), 125);
    this.setListeners_();
};

nexplayer.Controls.prototype.displayBuffering = function()    {
    this.bufferingSpinner_.style.display = 'inherit';
    this.giantPlayButton_.style.display = 'none';
    this.giantPlayButton_.style.pointerEvents = 'none';
};


nexplayer.Controls.prototype.addMultipleEvents_ = function(objectToAddEvents, arrayEvents, methodToCall) {
    var self = this;
    arrayEvents.forEach(function(element) {
        objectToAddEvents.addEventListener(element, methodToCall.bind(self));
    });
};

nexplayer.Controls.prototype.setListenersPlayer_ = function() {
    if (this.videoElement_ !== null) {
        this.addMultipleEvents_(this.videoElement_, ['waiting', 'playing'], this.onBufferingStateChange_);
        this.videoElement_.addEventListener('loadeddata', this.loadComplete.bind(this));
        this.videoElement_.textTracks.addEventListener('addtrack', this.updateTextTracks_.bind(this));
        this.addMultipleEvents_(this.videoElement_, ['play', 'pause'], this.onPlayStateChange_);
        this.videoElement_.addEventListener('volumechange', this.onVolumeStateChange_.bind(this));

        if(this.videoElement_.currentTime !== 0) {
            this.loadComplete();
            this.hideSpinnerAndShowPlayPause();
        }
    }

    this.onVolumeStateChange_();
    this.onCaptionStateChange_();
};

nexplayer.Controls.prototype.setGiantPlayButtonVisibility_ = function(visible) {
    if (visible) {
        this.giantPlayButton_.style.opacity = 0.7;
        this.giantPlayButton_.style.pointerEvents = 'all';
    } else {
        this.giantPlayButton_.style.opacity = 0;
        this.giantPlayButton_.style.pointerEvents = 'none';
    }
};

nexplayer.Controls.prototype.hideSpinnerAndShowPlayPause = function() {
    this.bufferingSpinner_.style.display = 'none';
    this.giantPlayButton_.style.display = 'inherit';
    this.giantPlayButton_.style.pointerEvents = 'all';
    this.setGiantPreviewVisibility(false);
};

nexplayer.Controls.prototype.loadComplete = function() {
    this.hideSpinnerAndShowPlayPause();

    if (this.videoElement_.getBoundingClientRect().width !== 0) {
        this.videoContainer_.style.width = this.videoElement_.getBoundingClientRect().width+'px';
        this.videoContainer_.style.height = this.videoElement_.getBoundingClientRect().height+'px';
    } else {
        this.videoContainer_.style.width = this.canvas360_.getBoundingClientRect().width+'px';
        this.videoContainer_.style.height = this.canvas360_.getBoundingClientRect().height+'px';
    }

    this.videoElement_.poster = '';
    this.videoPlaying_ = true;
    this.clickingContainer_ = false;

    this.onPlayStateChange_();
    this.updateSettingsInfo();
};

nexplayer.Controls.prototype.onMouseMove_ = function(event) {
    if (event.target.id !== 'giantPlayButton') {
        if (event.type === 'touchstart' || event.type === 'touchmove' || event.type === 'touchend'|| event.type === 'mousedown' || event.type === 'mouseup') {
            this.lastTouchEventTime_ = Date.now();
        } else if (this.lastTouchEventTime_ + 1000 < Date.now()) {
            this.lastTouchEventTime_ = null;
        }

        if (this.mode360_) {
            if (event.target.id === 'canvas360' && (event.type === 'touchstart' || event.type === 'mousedown')) {
                this.clickingContainer_ = true;
            } else if (event.target.id === 'canvas360' && (event.type === 'touchend' || event.type === 'mouseup')) {
                this.clickingContainer_ = false;
            }

            if ((event.type === 'mousemove' && this.clickingContainer_) || event.type === 'touchmove') {
                this.hideFullUI();
            } else {
                this.showFullUI();
            }
        } else {
            if (event.type === 'mousemove' || event.type === 'touchmove') {
                this.clickingContainer_ = true;
            } else if (event.type === 'touchend') {
                this.clickingContainer_ = false;
            }
            this.showFullUI();
        }
    } else if (event.type === 'mousemove' && (!this.mode360_ || !this.clickingContainer_)) {
        this.showFullUI();
        this.clickingContainer_ = false;
    }

    this.clearTimeOutToHideUI();

    this.updateTimeAndSeekRange_(event);
    // Only start a timeout on 'touchend' or for 'mousemove' with no touch events.
    if (event.type === 'touchend' || !this.lastTouchEventTime_) {
        this.addTimeOutToHideUI();
    }
};

nexplayer.Controls.prototype.clearTimeOutToHideUI = function() {
    if (this.mouseStillTimeoutId_) {
        window.clearTimeout(this.mouseStillTimeoutId_);
    }
};

nexplayer.Controls.prototype.addTimeOutToHideUI = function() {
    this.mouseStillTimeoutId_ = window.setTimeout(
        this.onMouseStill_.bind(this), 3000);
};

nexplayer.Controls.prototype.onMouseOut_ = function() {
    this.clearTimeOutToHideUI();
    this.onMouseStill_();
};

nexplayer.Controls.prototype.onMouseStill_ = function() {
    // The mouse has stopped moving.
    this.mouseStillTimeoutId_ = null;

    if (this.dropDownContent_.style.display !== 'block'){
        this.hideFullUI();

    } else {
        this.showFullUI();
    }
};

nexplayer.Controls.prototype.onContainerTouch_ = function(event) {
    if (this.videoElement_ === null || this.videoElement_ === undefined || !this.videoElement_.duration) {
        return;
    }

    if (this.controls_.style.opacity == 1) {
        this.lastTouchEventTime_ = Date.now();
        this.onMouseMove_(event);
    } else {
        this.onMouseMove_(event);
        event.preventDefault();
    }
};

nexplayer.Controls.prototype.onPlayPauseClick_ = function(event) {
    if (this.videoElement_ === null || !this.videoElement_.duration) {
        // Can't play yet.  Ignore.
        return;
    }

    if (this.videoElement_.paused) {
        this.videoElement_.play();
    } else {
        this.videoElement_.pause();
    }

    this.lastTouchEventTime_ = Date.now();
    this.clearTimeOutToHideUI();
    this.addTimeOutToHideUI();
};

nexplayer.Controls.prototype.onPlayStateChange_ = function() {
    // Video is paused during seek, so don't show the play arrow while seeking
    var typeOfIcon = (this.videoElement_.paused && !this.isSeeking_) ? 'play_arrow' : 'pause';

    this.playPauseButton_.textContent = typeOfIcon;
    this.giantPlayButton_.textContent = typeOfIcon;
};

nexplayer.Controls.prototype.getOnHoverTime = function(event, isSeeking) {
    var hoverTime = this.getHoverPos_(event) / this.seekBar_.clientWidth * this.seekBar_.max;
    if (isSeeking || isNaN(hoverTime)) {
        hoverTime = this.seekBar_.value;
    }
    if (hoverTime < 0) {
        hoverTime = 0;
    }
    if (hoverTime > this.videoElement_.duration) {
        hoverTime = this.videoElement_.duration;
    }
    return hoverTime;
};

nexplayer.Controls.prototype.onSeekStart_ = function(event) {
    if (this.videoElement_ !== null) {
        this.seekBar_.value = this.getOnHoverTime(event, false);
        this.onSeekInput_(event);

        this.setGiantPreviewVisibility(true);
        this.isSeeking_ = true;
        this.videoElement_.pause();
        this.onStartThumbParse_(event);
    }
};

nexplayer.Controls.prototype.onStartThumbParse_ = function(event) {
    if(this.thumbnails !== undefined && this.thumbnails !== null) {
        this.setThumbnail_(this.getOnHoverTime(event, this.isSeeking_));
        this.onMoveThumb_(event);
        if (this.isSeeking_) {
            this.setGiantPreview();
        }
    } else if (this.thumbnails === null) {
        this.setGiantPreviewVisibility(false);
    }
};

nexplayer.Controls.prototype.getHoverPos_ = function(event) {
    var m_posx = 0, e_posx = 0, obj = this.videoContainer_;
    if (!event){event = event || window.event;}
    if (event.pageX) {
        m_posx = event.pageX;
    } else if (event.clientX) {
        m_posx = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    } else if (event.touches !== undefined) {
        m_posx = event.touches[0].clientX;
    }
    //get parent element position in document
    if (obj.offsetParent){
        do {
            e_posx += obj.offsetLeft;
            obj = obj.offsetParent;
        } while (obj !== null);
    }

    return m_posx - e_posx - this.seekBar_.getBoundingClientRect().left + this.videoElement_.getBoundingClientRect().left;
};

nexplayer.Controls.prototype.setThumbnail_ = function(time) {

    if (time <= 0) {
        this.currentThumbnail_ = 0;
    }else if(this.thumbnails[this.thumbnails.length-1].getfinishTime() < time) {
        this.currentThumbnail_ = this.thumbnails.length -1;
    } else {
        for (var i = 0; i<this.thumbnails.length; i++) {
            if (this.thumbnails[i].getfinishTime() > time && this.thumbnails[i].getstartTime() <= time) {
                this.currentThumbnail_ = i;
                break;
            }
        }
    }

    var currentThumb = this.thumbnails[this.currentThumbnail_];
    this.thumbImage_.getContext('2d').drawImage(currentThumb.getframe(), 0, 0);

    var hoverMins = Math.floor(time / 60);
    var hoverSecs = Math.floor(time - hoverMins * 60);

    var parent_ = this.thumbImage_.parentElement;
    var thumbtext_ = this.thumbImage_.nextElementSibling;
    if (hoverSecs < 10) {
        thumbtext_.innerHTML = hoverMins + ':0' + hoverSecs;
    } else {
        thumbtext_.innerHTML = hoverMins + ':' + hoverSecs;
    }

    if (parent_.getBoundingClientRect().height > 100) {
        thumbtext_.style.fontSize = 20 +'px';
    } else {
        thumbtext_.style.fontSize = (parent_.getBoundingClientRect().height*0.2) +'px';
    }
};

nexplayer.Controls.prototype.onMoveThumb_ = function(e) {
    //Set Thumbnail in the correct position
    if (e === undefined) {
        return;
    }

    var eventPosition;

    if (e.type === 'mousemove' || e.type === 'mousedown') {
        eventPosition = e.pageX; //mouse event
    } else if (e.type === 'touchmove' || e.type === 'touchstart') {
        eventPosition = e.touches[0].clientX; //touch event
    }
    if (eventPosition === undefined) {
        return;
    }

    var marginLeftSeekbar = this.seekBar_.getBoundingClientRect().left;
    var marginRightSeekbar = this.seekBar_.getBoundingClientRect().right;
    if (eventPosition >= marginLeftSeekbar && eventPosition <= marginRightSeekbar) {
        this.onShowThumb_();
        var parent_ = this.thumbImage_.parentElement;
        var m_posx = 0, e_posx = 0, obj = this.videoContainer_;
        //get mouse position on document crossbrowser
        if (!e){e = window.event;}
        if (e.pageX) {
            m_posx = e.pageX;
        } else if (e.clientX) {
            m_posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        } else if (e.touches !== undefined) {
            m_posx = e.touches[0].clientX;
        }
        //get parent element position in document

        if (obj.offsetParent) {
            do {
                e_posx += obj.offsetLeft;
                obj = obj.offsetParent
            } while (obj !== null);
        }

        var left = m_posx - e_posx - parent_.getBoundingClientRect().width/2;
        var right = m_posx + e_posx - this.seekBar_.getBoundingClientRect().width;
       
        if (left > 5  && right < -10) {
            parent_.style.left = left + 'px';
        } else {
            if (right > -10) {
                parent_.style.right = 0 + 'px';
            }
            else {
                parent_.style.left = 0 + 'px';
            }
        }

        parent_.style.top = (this.videoContainer_.getBoundingClientRect().height -
            parent_.getBoundingClientRect().height - this.controls_.getBoundingClientRect().height-3) +'px';
    }
};

nexplayer.Controls.prototype.setGiantPreview = function() {
    var currentThumb = this.thumbnails[this.currentThumbnail_];
    this.giantPreview_.getContext('2d').drawImage(currentThumb.getframe(), 0, 0);

    if (this.videoElement_.getBoundingClientRect().width !== 0) {
        this.giantPreview_.style.width = this.videoElement_.getBoundingClientRect().width+'px';
        this.giantPreview_.style.height = this.videoElement_.getBoundingClientRect().height+'px';
        this.giantPreview_.parentElement.style.width = this.videoElement_.getBoundingClientRect().width+'px';
        this.giantPreview_.parentElement.style.height = this.videoElement_.getBoundingClientRect().height+'px';
    } else {
        this.giantPreview_.style.width = this.canvas360_.getBoundingClientRect().width+'px';
        this.giantPreview_.style.height = this.canvas360_.getBoundingClientRect().height+'px';
        this.giantPreview_.parentElement.style.width = this.canvas360_.getBoundingClientRect().width+'px';
        this.giantPreview_.parentElement.style.height = this.canvas360_.getBoundingClientRect().height+'px';
    }

};

nexplayer.Controls.prototype.setGiantPreviewVisibility = function(option) {
    if (this.isSeeking_) {
        return;
    }
    if (this.thumbnails !== undefined && this.thumbnails !== null) {
        if (option) { //Enable visibility of the giantPreviewThumbnail
            this.giantPreview_.parentNode.style.opacity = 1;
            var child = this.giantPreview_.parentNode.firstChild;
            while(child !== undefined && child !== null){
                if (child.nodeName !== '#text') {
                    child.style.opacity = 1;
                }
                child = child.nextSibling;
            }
        } else {
            var child = this.giantPreview_.parentNode.firstChild;
            while(child !== undefined && child !== null){
                if (child.nodeName !== '#text') {
                    child.style.opacity = 0;
                }
                child = child.nextSibling;
            }
            this.giantPreview_.parentNode.style.opacity = 1;
        }
    }
};

nexplayer.Controls.prototype.onHideThumb_ = function(event) {
    if (event) {
        this.setDefaultHeightBar_(event);
    }
    this.thumbImage_.parentElement.style.display = 'none';
    this.thumbImage_.nextElementSibling.display = 'inherit';
    this.thumbImage_.nextElementSibling.style.display = 'inherit';
};

nexplayer.Controls.prototype.onShowThumb_ = function() {
    this.thumbImage_.parentElement.style.display = 'table';
    this.thumbImage_.style.display = 'table-row';
    this.thumbImage_.nextElementSibling.style.display = 'table-row';
};

nexplayer.Controls.prototype.onSeekInput_ = function(event) {
    if (this.videoElement_ === null || !this.videoElement_.duration) {
        // Can't seek yet.  Ignore.
        return;
    }

    // Update the UI right away.
    this.updateTimeAndSeekRange_(event);

    // Collect input events and seek when things have been stable for 125ms.
    if (this.seekTimeoutId_ != null) {
        window.clearTimeout(this.seekTimeoutId_);
    }

    this.seekTimeoutId_ = window.setTimeout(
        this.onSeekInputTimeout_.bind(this), 125);
};


nexplayer.Controls.prototype.onSeekInputTimeout_ = function() {
    this.seekTimeoutId_ = null;
    var toSeek = parseFloat(this.seekBar_.value);
    if (this.nexPlayer_.isUTC()) {
        this.nexPlayer_.seek(toSeek);
    } else {
        this.videoElement_.currentTime = toSeek;
    }
};


nexplayer.Controls.prototype.onSeekEnd_ = function() {

    if (this.videoElement_ !== null){
        if (this.seekTimeoutId_ != null) {
            // They just let go of the seek bar, so end the timer early.
            window.clearTimeout(this.seekTimeoutId_);
            this.onSeekInputTimeout_();
        }
        this.onHideThumb_();
        this.videoElement_.play();
    }

};

nexplayer.Controls.prototype.onMuteClick_ = function() {
    if (this.videoElement_ !== null) {
        this.videoElement_.muted = !this.videoElement_.muted;
    }
    this.lastTouchEventTime_ = Date.now();
    this.clearTimeOutToHideUI();
    this.addTimeOutToHideUI();
};

nexplayer.Controls.prototype.onVolumeStateChange_ = function() {
    if (this.videoElement_.muted) {
        this.muteButton_.textContent = 'volume_off';
        this.volumeBar_.value = 0;
    } else {
        this.muteButton_.textContent = 'volume_up';
        this.volumeBar_.value = this.videoElement_.volume;
    }

    var gradient = ['to right'];
    gradient.push('#ff5500 ' + (this.volumeBar_.value * 100) + '%');
    gradient.push('#000 ' + (this.volumeBar_.value * 100) + '%');
    gradient.push('#000 100%');
    this.volumeBar_.style.background =
        'linear-gradient(' + gradient.join(',') + ')';

    var element = document.getElementById('circleBaseAudio');
    element.style.marginLeft = ((this.volumeBar_.value * 100)-2) + '%';
};

nexplayer.Controls.prototype.onVolumeInput_ = function() {
    if (this.nexPlayer_ !== null){
        this.videoElement_.volume = parseFloat(this.volumeBar_.value);
        this.videoElement_.muted = false;
    }
};

nexplayer.Controls.prototype.onCaptionClick_ = function(option) {
    if (this.nexPlayer_ !== null) {
        if (option !== undefined && typeof(option) === "boolean") {
            this.isTextTrackVisible = !option;
        }

        var tracks = this.videoElement_.textTracks;
        this.cclang_ = this.getCurrentTexTrackIndex();

        if (this.isTextTrackVisible){
            if (this.cclang_ !== -1) {
                tracks[this.cclang_].mode = 'hidden';
            }
            this.isTextTrackVisible = false;
            if (this.subtitles_list !== undefined) {
                this.subtitles_list.value = -1;
            }
         }else {
            if (this.cclang_ !== -1) {
                tracks[this.cclang_].mode = 'showing';
                this.isTextTrackVisible = true;
            }
            if (this.subtitles_list !== undefined) {
                this.subtitles_list.value = this.cclang_;
            }
        }
        this.onCaptionStateChange_();
        this.lastTouchEventTime_ = Date.now();
        this.clearTimeOutToHideUI();
        this.addTimeOutToHideUI();
    }
};


nexplayer.Controls.prototype.onCaptionStateChange_ = function() {
    if (this.isTextTrackVisible === undefined ){
        this.isTextTrackVisible = true;
    }
};

nexplayer.Controls.prototype.onFullscreenClick_ = function() {
    if (!this.videoPlaying_) {
        return;
    }

    if (document.fullscreenElement || document.webkitFullscreenElement ||
        document.mozFullScreenElement || document.msFullscreenElement || this.isFullscreen360iOSinUse_) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if(this.isFullscreen360iOSinUse_) {
            this.toggleisFullscreen360iOWithoutUse_360();
        } else if(this.videoElement_.webkitExitFullscreen) {
            this.videoElement_.webkitExitFullscreen();
        }

    } else {
        if (this.max_height_ === 0 && this.canvas360_!== null){

            this.max_height_ = this.canvas360_.getBoundingClientRect().height;
            this.initialWidth = this.videoContainer_.getBoundingClientRect().width;
            this.initialHeight = this.videoContainer_.getBoundingClientRect().height;
        }
        var i = this.videoContainer_;
        if (i.requestFullscreen) {
            i.requestFullscreen();
        } else if (i.webkitRequestFullscreen) {
            i.webkitRequestFullscreen();
        } else if (i.mozRequestFullScreen) {
            i.mozRequestFullScreen();
        } else if (i.msRequestFullscreen) {
            i.msRequestFullscreen();
        } else if (this.videoElement_.webkitEnterFullscreen){
            if (this.mode360_ && !this.isFullscreen360iOSinUse_){
                this.toggleisFullscreen360iOWithoutUse_360();
            }else
                this.videoElement_.webkitEnterFullscreen();
        }
    }
    if (this.canvas360_!== null && this.canvas360_.style.display !== 'none') {
        this.canvas360_.style.width = '100%';
    } else {
        this.videoElement_.style.width= "100%";
    }

    this.lastTouchEventTime_ = Date.now();
    this.clearTimeOutToHideUI();
    this.addTimeOutToHideUI();
};


nexplayer.Controls.prototype.fullscreenchange = function() {
    if (!(document.fullscreenElement ||  document.webkitFullscreenElement ||
            document.mozFullScreenElement ||  document.msFullscreenElement)) {
        this.setNormalScreenSettings();
    } else {
        this.setFullScreenSettings();
    }

};

nexplayer.Controls.prototype.setFullScreenSettings = function(){
    this.videoElement_.style.position = 'absolute';
    this.videoElement_.style.top = '50%';
    this.videoElement_.style.transform = 'translateY(-50%)';
    this.videoContainer_.style.maxHeight = "";
    this.videoContainer_.style.width = "100%";
    this.videoContainer_.style.height = "100%";
    this.videoContainer_.style.top = '0px';
    this.videoContainer_.style.left = '0px';
};

nexplayer.Controls.prototype.setNormalScreenSettings = function(){
    this.videoElement_.style.position = 'inherit';
    this.videoElement_.style.top = '';
    this.videoElement_.style.transform = 'translateY(0%)';
    this.videoContainer_.style.position = 'relative';
    this.videoContainer_.style.width = this.initialWidth+'px';
    this.videoContainer_.style.height = this.initialHeight+'px';
    this.videoContainer_.style.top = '';
    this.videoContainer_.style.left = '';
    if (this.max_height_!== 0  && this.max_height_ !== undefined && this.canvas360_!== null){
        this.videoContainer_.style.maxHeight = this.max_height_+'px';
        this.canvas360_.style.height = this.max_height_+'px';
    }
};

nexplayer.Controls.prototype.toggleisFullscreen360iOWithoutUse_360 = function(){
    if (this.isFullscreen360iOSinUse_){
        this.setNormalScreenSettings();
        this.isFullscreen360iOSinUse_ = false;
    } else {
        this.setFullScreenSettings();
        this.videoContainer_.style.position = 'fixed';
        this.videoContainer_.style.left = '0';
        this.videoContainer_.style.top = '0';
        this.videoContainer_.style.right = '0';
        this.videoContainer_.style.width = "100%";
        this.videoContainer_.style.height = "100%";
        this.videoContainer_.style.maxHeight = "";
        this.canvas360_.style.height = '100%';
        this.isFullscreen360iOSinUse_ = true;
    }
};

nexplayer.Controls.prototype.onCurrentTimeClick_ = function() {
    // Jump to LIVE if the user clicks on the current time.
    if (this.nexPlayer_ !== null && this.nexPlayer_.isLive()) {
        this.videoElement_.currentTime = this.seekBar_.max;
    }
    this.lastTouchEventTime_ = Date.now();
    this.clearTimeOutToHideUI();
    this.addTimeOutToHideUI();
};

nexplayer.Controls.prototype.onBufferingStateChange_ = function(event) {
    if(event.type === 'waiting' && !this.videoElement_.ended && this.playPauseButton_.textContent !== 'play_arrow') {
        this.displayBuffering();
    }
    if(event.type === 'playing') {
        this.hideSpinnerAndShowPlayPause();
        this.isSeeking_ = false;
        this.setGiantPreviewVisibility(false);
        
    }
    if(this.isAdPlaying) {
        this.bufferingSpinner_.style.display = 'none';
        this.giantPlayButton_.style.display = 'none';
        this.giantPlayButton_.style.pointerEvents = 'none';
    }
};

nexplayer.Controls.prototype.updateTimeAndSeekRange_ = function(event) {
    if (this.videoElement_ === null) {
        return;
    }

    var displayTime = this.isSeeking_ ? this.seekBar_.value : this.videoElement_.currentTime;
    var duration = this.videoElement_.duration;
    var bufferedLength = this.videoElement_.buffered.length;
    var bufferedStart = bufferedLength ? this.videoElement_.buffered.start(0) : 0;
    var bufferedEnd = bufferedLength ? this.videoElement_.buffered.end(bufferedLength - 1) : 0;
    var seekRange = this.videoElement_.seekable;

    if (this.nexPlayer_.isUTC()){
        duration = this.nexPlayer_.getDuration();
        displayTime = this.nexPlayer_.getCurrentTime();
    }

    if (seekRange !== null && seekRange.length !== 0 && !this.nexPlayer_.isUTC()) {
        this.seekBar_.min = seekRange.start(0);
        this.seekBar_.max = seekRange.end(0);
    } else {
        this.seekBar_.min = 0;
        this.seekBar_.max = duration;
    }

    //Avoid the strange numbers on the live contents
    if (duration >= 20000) {
        return;
    }

    if (this.nexPlayer_ !== null && this.nexPlayer_.isLive()) {
        // The amount of time we are behind the live edge.
        var behindLive = Math.floor(duration - displayTime);
        displayTime = Math.max(0, behindLive);
        var showHour = (seekRange.end(0) - seekRange.start(0)) >= 3600;

        // Consider "LIVE" when less than 1 second behind the live-edge.  Always
        // show the full time string when seeking, including the leading '-';
        // otherwise, the time string "flickers" near the live-edge.
        if ((displayTime >= 1) || this.isSeeking_) {
            this.currentTime_.textContent =
                '- ' + this.buildTimeString_(displayTime, showHour);
            this.currentTime_.style.cursor = 'pointer';
        }

        if (!this.isSeeking_) {
            // To-do change if utc
            var maximum = !this.nexPlayer_.isUTC() ? seekRange.end(0) : duration;
            this.seekBar_.value = maximum - displayTime;
        } else {
            this.currentTime_.textContent = 'LIVE';
            this.currentTime_.style.cursor = '';
        }
    } else {
        var showHour = duration >= 3600;
        this.currentTime_.textContent = this.buildTimeString_(displayTime, showHour);
        if (!this.isSeeking_) {
            this.seekBar_.value = displayTime;
        }
        this.currentTime_.style.cursor = '';
    }

    if (this.nexPlayer_ === null || !this.nexPlayer_.isLive()) {
        var showHour = duration >= 3600;

        this.currentTime_.textContent = this.currentTime_.textContent + '/' +
            this.buildTimeString_(this.videoElement_.duration, showHour);

    } else {
        this.currentTime_.textContent = 'LIVE';
        this.currentTime_.style.cursor = '';
    }

    var gradient = ['to right'];
    if (bufferedLength == 0) {
        gradient.push('#000 0%');
    } else {
        // NOTE: the fallback to zero eliminates NaN.
        var bufferStartFraction = (bufferedStart / duration) || 0;
        var bufferEndFraction = (bufferedEnd / duration) || 0;
        var playheadFraction = (displayTime / duration) || 0;

        if (this.nexPlayer_ !== null && this.nexPlayer_.isLive()) {
            var bufferStart = Math.max(bufferedStart, seekRange.start(0));
            var bufferEnd = Math.min(bufferedEnd, seekRange.end(0));
            var seekRangeSize = seekRange.end(0) - seekRange.start(0);
            var bufferStartDistance = bufferStart - seekRange.start(0);
            var bufferEndDistance = bufferEnd - seekRange.start(0);
            var playheadDistance = displayTime - seekRange.start(0);
            bufferStartFraction = (bufferStartDistance / seekRangeSize) || 0;
            bufferEndFraction = (bufferEndDistance / seekRangeSize) || 0;
            playheadFraction = (playheadDistance / seekRangeSize) || 0;
        }

        gradient.push('#ff5500 ' + (bufferStartFraction * 100) + '%');
        gradient.push('#ff5500 ' + (bufferStartFraction * 100) + '%');
        gradient.push('#ff5500 ' + (playheadFraction * 100) + '%');
        gradient.push('#fff ' + (playheadFraction * 100) + '%');
        gradient.push('#fff ' + (bufferEndFraction * 100) + '%');
        gradient.push('#000 ' + (bufferEndFraction * 100) + '%');
    }
    this.seekBar_.style.background =
        'linear-gradient(' + gradient.join(',') + ')';

    this.moveCircleSeekbar();

    if (this.isSeeking_ && event) {
        this.onStartThumbParse_(event);
    }
};

nexplayer.Controls.prototype.buildTimeString_ = function(displayTime,
                                                         showHour) {
    var h = Math.floor(displayTime / 3600);
    var m = Math.floor((displayTime / 60) % 60);
    var s = Math.floor(displayTime % 60);
    if (isNaN(h) || isNaN(m) || isNaN(s)) {
        return '--:--';
    }
    if (s < 10) {
        s = '0' + s;
    }

    var text = m + ':' + s;
    if (showHour) {
        if (m < 10) {
            text = '0' + text;
        }
        text = h + ':' + text;
    }

    return text;
};

nexplayer.Controls.prototype.setListeners_ = function() {
    var sliderInputEvent = 'input';
    // This matches IE11, but not Edge.  Edge does not have this problem.
    if (navigator.userAgent.indexOf('Trident/') >= 0) {
        sliderInputEvent = 'change';
    }

    this.isAdPlaying = false;
    if (this.playPauseButton_ !== undefined) {
        this.playPauseButton_.addEventListener('click', this.onPlayPauseClick_.bind(this));
    }
    if (this.giantPlayButton_ !== undefined) {
        this.giantPlayButton_.addEventListener('click', this.onPlayPauseClick_.bind(this));
    }
    if (this.seekBar_ !== null) {
        this.seekBar_.addEventListener('mouseout', this.onHideThumb_.bind(this));
        this.addMultipleEvents_(this.seekBar_, ['mousemove', 'touchmove'], this.onStartThumbParse_);
        this.addMultipleEvents_(this.seekBar_, ['mousedown', 'touchstart'], this.onSeekStart_);
        this.seekBar_.addEventListener(sliderInputEvent, this.onSeekInput_.bind(this));
        this.addMultipleEvents_(this.seekBar_, ['mouseup', 'touchend'], this.onSeekEnd_);
        this.seekBar_.addEventListener('mouseover', this.onResizeBar_.bind(this));

        if (this.seekBarTopControls_ !== null) {
            this.addMultipleEvents_(this.seekBarTopControls_, ['touchstart', 'touchmove'], this.onSeekStart_);
            this.seekBarTopControls_.addEventListener('touchend', this.onSeekEnd_.bind(this));
        }
    }
    if (this.muteButton_ !== null) {
        this.muteButton_.addEventListener('click', this.onMuteClick_.bind(this));
    }
    if (this.volumeBar_ !== null) {
        this.volumeBar_.addEventListener(sliderInputEvent, this.onVolumeInput_.bind(this));
        this.volumeBar_.addEventListener('mouseover', this.onResizeBar_.bind(this));
        this.volumeBar_.addEventListener('mouseout', this.setDefaultHeightBar_.bind(this));
    }
    if (this.fullscreenButton_ !== null) {
        this.fullscreenButton_.addEventListener('click', this.onFullscreenClick_.bind(this));
    }
    if (this.currentTime_ !== null) {
        this.currentTime_.addEventListener('click', this.onCurrentTimeClick_.bind(this));
    }

    if (this.videoContainer_ !== null) {
        this.videoContainer_.addEventListener('touchstart', this.onContainerTouch_.bind(this));
        this.videoContainer_.addEventListener('click', this.onScreenClick_.bind(this));
        this.addMultipleEvents_(this.videoContainer_, ['mousemove', 'touchmove', 'touchend', 'mouseup'], this.onMouseMove_);
        this.videoContainer_.addEventListener('mouseout', this.onMouseOut_.bind(this));
        this.videoContainer_.addEventListener('mousedown', this.onContainerTouch_.bind(this));
        this.videoContainer_.addEventListener("dblclick", function(e){
                e.stopPropagation();
                return false;
            }
        );
    }
    if (this.controls_ !== null) {
        this.controls_.addEventListener('click', function(event) { event.stopPropagation(); });
    }
    if (this.quality_ !== null) {
        this.quality_.addEventListener('change', this.onTrackSelected_.bind(this));
    }
    if (this.trickplay_ !== null) {
        this.trickplay_.addEventListener('change', this.onTrickPlaySelected_.bind(this));
    }
    if (this.audio_ !== null) {
        this.audio_.addEventListener('change', this.onAudioLanguageSelected_.bind(this));
    }
    if (this.subtitles_ !== null && this.subtitles_ !== undefined) {
        this.subtitles_.addEventListener('change', this.onTrackSelected_.bind(this));
    }
    if (this.settingsButton_ !== undefined && this.settingsButton_ !== null) {
        this.settingsButton_.addEventListener('click', this.toogleDropDown_.bind(this));
    }

    this.addMultipleEvents_(document, ['webkitfullscreenchange', 'mozfullscreenchange', 'fullscreenchange', 'MSFullscreenChange'], this.fullscreenchange);
    window.addEventListener("resize",this.resize_.bind(this),false);

    this.setListenersPlayer_();
};

nexplayer.Controls.prototype.resize_ = function() {
    if (isFullScreen()) {
        var i = this.videoContainer_;
        i.style.position = 'absolute';
        i.style.maxHeight = "";
        i.style.width = window.innerWidth+"px";
        i.style.top = '0px';
        i.style.left = '0px';
        if(this.canvas360_!== null) {
            this.canvas360_.style.height = '';
        }
    } else {
        var whratio = this.videoElement_.videoHeight/this.videoElement_.videoWidth;
        if (this.videoElement_.getBoundingClientRect().width !== 0) {
            this.videoContainer_.style.width = '100%';
            this.videoContainer_.style.height = this.videoContainer_.getBoundingClientRect().width*whratio+"px";
        } else {
            this.videoContainer_.style.width = '100%';
            this.videoContainer_.style.height = this.videoContainer_.getBoundingClientRect().width*whratio+'px';
            this.videoContainer_.style.maxHeight = "";
        }
    }
};

nexplayer.Controls.prototype.toogleDropDown_ = function() {
    if (this.dropDownContent_.style.display != 'block') {
        this.dropDownContent_.style.display = 'block';
        this.dropDownContentTimer = window.setTimeout(function(){
            this.dropDownContent_.style.display = 'none';
        }.bind(this),8000);
    } else {
        this.dropDownContent_.style.display = 'none';
        if (this.dropDownContentTimer !== undefined){
            window.clearTimeout(this.dropDownContentTimer);
            this.dropDownContentTimer = null;
        }
    }
};

nexplayer.Controls.prototype.onScreenClick_ = function(event) {
    if (!this.isAdPlaying) {
        // Can't play yet.  Ignore.
        // Hide the dropdown UI in case it is showing
        if (this.dropDownContent_.style.display !== 'none') {
            this.dropDownContent_.style.display = 'none';
            this.lastTouchEventTime_ = Date.now();
            this.clearTimeOutToHideUI();
            this.addTimeOutToHideUI();
        } else {
            if (event.target.id !== 'giantPlayButton') {
                if (this.giantPlayButton_.style.opacity === 0){
                    this.showUIControls();
                    this.videoContainer_.style.cursor = '';
                    this.setGiantPlayButtonVisibility_(true);
                } else {
                    this.hideUIControls();
                    this.setGiantPlayButtonVisibility_(false);
                }
            }
        }
    }

};

nexplayer.Controls.prototype.updateSettingsInfo = function() {
    // Update language options first and then populate new tracks with
    // respect to the chosen languages.

    this.updateAudioLanguages_();
    this.updateVariantTracks_();
    this.updateTextTracks_();
};

nexplayer.Controls.prototype.updateVariantTracks_ = function() {
    var trackList = this.quality_;
    var tracks = this.nexPlayer_.getTracks();
    this.updateTrackOptions_(trackList, tracks);
};

nexplayer.Controls.prototype.updateTextTracks_ = function() {
    var trackList = this.subtitles_;
    var tracks = this.videoElement_.textTracks;
    this.updateTextTrackOptions_(trackList, tracks);
};

nexplayer.Controls.prototype.getCurrentTexTrackIndex = function() {
    var index = -1;
    var i = 0;

    while (index === -1 && i<this.videoElement_.textTracks.length) {
        if (this.videoElement_.textTracks[i].mode === 'showing') {
            index = i;
        }
        i++;
    }

    return index;
};

nexplayer.Controls.prototype.updateAudioLanguages_ = function() {
    var list = this.audio_;
    var languages = this.nexPlayer_.getAudioStreams();
    //Using native GETAudioTracks will only work on edge/ie11
    if (this.nexPlayer_.getCurrentAudioStream() !== undefined) {
        this.updateLanguageOptions_(list, languages, this.nexPlayer_.getCurrentAudioStream().id);
    } else {
        this.updateLanguageOptions_(list, languages, -1);
    }
};

nexplayer.Controls.prototype.updateTrackOptions_ = function(list, tracks) {
    //remove all tracks
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }
    if (tracks !== undefined && tracks.length > 0) {
        var option = document.createElement('option');
        option.textContent = 'Auto';
        option.value = -1;
        list.appendChild(option);
    }
    tracks.forEach(function(track) {
        var print = false;
        var option = document.createElement('option');
        if (track.width !== undefined && track.height !== undefined && track.width !== '' && track.height !== ''){
            option.textContent = track.width+'x'+track.height;
            print = true;
        }else if (track.bitrate !== undefined){
            option.textContent = parseInt(track.bitrate/1024)+' kbps';
            print = true;
        }
        option.value = track.id;
        if (print) {
            list.appendChild(option);
        }
    });
    if (list.length <= 2){
        list.parentElement.style.display = 'none';
    }
};

nexplayer.Controls.prototype.onTrackSelected_ = function(event) {
    var list = event.target;
    var option = list.options[list.selectedIndex];
    if (list.id === this.quality_.id) {
        // Disable abr manager before changing tracks
        this.nexPlayer_.setCurrentTrack(option.value);
    } else {
        this.subtitles_list = list;
        var selected = Number(option.value);
        var tracks = this.videoElement_.textTracks;
        this.cclang_ = this.getCurrentTexTrackIndex();
        if (this.cclang_ !== -1) {
            tracks[this.cclang_].mode = 'hidden';
        }
        if (selected !== -1) {
            tracks[selected].mode = 'showing';
        }
        this.cclang_ = option.value;
    }
};

nexplayer.Controls.prototype.onTrickPlaySelected_ = function(event) {
    if (this.videoElement_ !== null){
        this.videoElement_.playbackRate =
            this.trickplay_.options[this.trickplay_.selectedIndex].value;
    }
};

nexplayer.Controls.prototype.updateLanguageOptions_ = function(list, languages, track) {
    // Remove old options
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }
    // Populate list with new options.
    languages.forEach(function(lang) {
        var option = document.createElement('option');
        option.textContent = lang.name;
        option.value = lang.id;
        if (lang.name !== undefined && lang.name !== '')
            list.appendChild(option);
        if (lang.id === track)
            list.value = track;
    });
    if (list.length <= 1) {
        list.parentElement.style.display = 'none';
    }
};

nexplayer.Controls.prototype.onAudioLanguageSelected_ = function(event) {
    var list = event.target;
    var language = list.options[list.selectedIndex].value;
    this.nexPlayer_.setAudioStream(language);
};

nexplayer.Controls.prototype.updateTextTrackOptions_ = function(list, tracks) {
    if (list === null || list === undefined || list.parentElement === null) {
        return;
    }

    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    var aditional = document.createElement('option');
    aditional.textContent = 'None';
    aditional.value = -1;
    aditional.selected = true;
    list.appendChild(aditional);
    for (var i = 0; i < tracks.length; i++) {
        var option = document.createElement('option');
        option.textContent = tracks[i].label;
        option.track = tracks[i];
        option.value = i;
        option.selected = (tracks[i].mode === 'showing');
        if (tracks[i].kind !== 'metadata' && tracks[i].mode !== 'disabled' &&
            (tracks[i].forcedDisabled === undefined || !tracks[i].forcedDisabled)) {
            list.appendChild(option);
        }
    }
    if (list.length <= 1) {
        list.parentElement.style.display = 'none';
    } else {
        list.parentElement.style.display = '';
    }

    if (this.cclang_ === undefined) {
        this.cclang_ = -1;
        for (var i = 0; i < tracks.length; i++) {
            if (tracks[i].mode === 'showing') {
                this.cclang_ = i;
            }
        }
        if (this.cclang_ === -1) {
            this.onCaptionClick_(false);
        }
    }
};

nexplayer.Controls.prototype.setAdPlaying_ = function(option){
    this.isAdPlaying = option;
};


nexplayer.Controls.prototype.resetControls = function() {
    document.removeEventListener('webkitfullscreenchange', this.fullscreenchange.bind(this), false);
    document.removeEventListener('mozfullscreenchange', this.fullscreenchange.bind(this), false);
    document.removeEventListener('fullscreenchange', this.fullscreenchange.bind(this), false);
    document.removeEventListener('MSFullscreenChange', this.fullscreenchange.bind(this), false);
    window.removeEventListener("resize", this.resize_.bind(this), false);
};

nexplayer.Controls.prototype.prepareThumbnails = function(type, vtt, img) {
    type = type.toLowerCase();
    if (type === 'inline')
        nexplayer.NexFactory.setThumbnailCallback(this.onThumbnailsLoaded.bind(this));
    else if (type === 'dynamic') {
        this.nexPlayer_.enablePreviewThumbnails(true);
        this.nexPlayer_.setThumbnailResources(this.onThumbnailsLoaded.bind(this));
    } else if (type === 'static' && vtt !== undefined && vtt !== '' && img !== undefined && img !== '') {
        this.nexPlayer_.enablePreviewThumbnails(true);
        this.nexPlayer_.setThumbnailResources(this.onThumbnailsLoaded.bind(this), vtt, img);
    }
};

nexplayer.Controls.prototype.onThumbnailsLoaded = function(thumbs) {
    this.thumbnails = thumbs;
    if (this.currentThumbnail_ === undefined) {
        this.currentThumbnail_ = 0;
    }
};

nexplayer.Controls.prototype.moveCircleSeekbar = function(time) {
    var xPos = (this.seekBar_.value * this.seekBar_.clientWidth) / this.videoElement_.duration;
    var circleSeekbar = this.seekBar_.previousSibling;
    if (circleSeekbar !== undefined && circleSeekbar !== null) {
        xPos = xPos - (circleSeekbar.clientWidth / 2);
        circleSeekbar.style.marginLeft = xPos + 'px';
    }
};

nexplayer.Controls.prototype.onResizeBar_ = function(event) {
    if (isPhoneDevice()) {
        return;
    }

    var targetElement = event.target || event.srcElement;
    targetElement.style.height = '5px';
    targetElement.previousSibling.style.height = '13px';
    targetElement.previousSibling.style.width = '13px';

    //adMarkers
    if (targetElement.previousSibling.previousSibling && targetElement.previousSibling.previousSibling.children) {
        for (var i = 0; i < targetElement.previousSibling.previousSibling.children.length; i++) {
            targetElement.previousSibling.previousSibling.children[i].style.height = '5px';
            targetElement.previousSibling.previousSibling.children[i].style.width = '7px';
        }
    }
};

nexplayer.Controls.prototype.setDefaultHeightBar_ = function(event) {
    var targetElement = event.target || event.srcElement;
    targetElement.style.height = '2px';
    targetElement.previousSibling.style.height = '10px';
    targetElement.previousSibling.style.width = '10px';

    //adMarkers
    if (targetElement.previousSibling.previousSibling && targetElement.previousSibling.previousSibling.children) {
        for (var i = 0; i < targetElement.previousSibling.previousSibling.children.length; i++) {
            targetElement.previousSibling.previousSibling.children[i].style.height = '2px';
            targetElement.previousSibling.previousSibling.children[i].style.width = '4px';
        }
    }
};

nexplayer.Controls.prototype.showUIControls = function() {
    this.controls_.style.opacity = 1;
    this.controls_.children[0].style.opacity = 1;
    this.controls_.children[1].style.opacity = 1;
};

nexplayer.Controls.prototype.showFullUI = function() {
    this.showUIControls();
    this.setGiantPlayButtonVisibility_(true);
};

nexplayer.Controls.prototype.hideFullUI = function() {
    this.hideUIControls();
    this.setGiantPlayButtonVisibility_(false);
};

nexplayer.Controls.prototype.hideUIControls = function() {
    this.controls_.style.opacity = 0;
    this.controls_.children[0].style.opacity = 0;
    this.controls_.children[1].style.opacity = 0;
};

nexplayer.Controls.prototype.showAdMarkers = function(offsetList) {
    if (offsetList !== undefined) {
        offsetList.forEach(function(item) {
            var div = document.createElement('div');
            div.className = 'adMarker';
            var sec;
            if (item === 0) {
                sec = 0;
            } else if (item === -1) {
                sec = 99;
            } else {
                sec = ( 99 * item ) / this.videoElement_.duration;
            }

            div.style.marginLeft = sec+'%';
            document.getElementById('adMarkerContainer').appendChild(div);
        }.bind(this));
    }
};
