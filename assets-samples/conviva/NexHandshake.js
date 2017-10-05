/**
	 * Prepare nexHandShake.
	 *
	 * @param {!HTMLMediaElement} video The DOM video element where the player should be placed.
     * @param {String} URL of video which will be played.
     * @param {boolean} Sets if video is live or VOD
	 */
var NexHandshake = function(videoElement, URL, live){
	this.isLive = live;
	this.video = videoElement;
    this.url = URL;
	this.systemSettings = new Conviva.SystemSettings();
	this.systemInterface = new Html5SystemInterfaceFactory().build();
	this.systemFactory = new Conviva.SystemFactory(this.systemInterface, this.systemSettings);
	this.prepareCustomer_();
	this.setContentMetadata_();
 	this.setConvivaMonitoringSession_();
    this.getSessionKey_();
}

NexHandshake.prototype.prepareCustomer_ = function(){
	this.clientSettings = new Conviva.ClientSettings(configs.CUSTOMER_KEY);
	if (configs.gatewayUrl != undefined) {
		this.clientSettings.gatewayUrl = configs.gatewayUrl;
	}
	this.client = new Conviva.Client( this.clientSettings,  this.systemFactory);
	this.playerStateManager =  this.client.getPlayerStateManager();
}

/**
*   Creates metadata
*/
NexHandshake.prototype.setContentMetadata_ = function(){
        console.log("[Conviva] Setting data: \n\tURL:"+this.url+"\n\tIs live: "+this.isLive);
		this.contentMetadata = new Conviva.ContentMetadata();
		this.contentMetadata.assetName = configs.assetName;
		this.contentMetadata.streamUrl = this.url;
		this.contentMetadata.streamType = configs.live ? Conviva.ContentMetadata.StreamType.LIVE : Conviva.ContentMetadata.StreamType.VOD;
		this.contentMetadata.defaultBitrateKbps = Math.floor(configs.bitrateBps / 1000); // in Kbps
		this.contentMetadata.applicationName = configs.applicationName;
		this.contentMetadata.viewerId = configs.viewerId;
}

/**
*  Creates a Conviva monitoring session.
*/
NexHandshake.prototype.setConvivaMonitoringSession_ = function(){
	 this.sessionKey = this.client.createSession( this.contentMetadata);
	 this.html5PlayerInterface = new Html5PlayerInterface( this.playerStateManager,  this.video);
}

/**
*   sessionKey was obtained as shown above with this method
*/
NexHandshake.prototype.getSessionKey_ = function (){
	this.client.attachPlayer( this.sessionKey,  this.playerStateManager);
	this.video.addEventListener('error',
		this.cleanSession.bind(this),
		false
	);
	this.video.addEventListener('ended',
		this.cleanSession.bind(this),
		false
	);
}

NexHandshake.prototype.cleanSession = function(){
	console.log("Cleanning Conviva session");
	this.client.cleanupSession(this.sessionKey);
}