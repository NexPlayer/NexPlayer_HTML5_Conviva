
var NexHandshake = function(videoElement, URL, isLive, debug) {

	this.videoElement = videoElement;
	this.URL = URL;
	this.isLive = isLive;
	this.debug = debug;

	this.systemSettings = null;
	this.systemInterface = null;
	this.clientSettings = null;
	this.systemFactory = null;
	this.client = null;

	this.contentMetadata = null;
	this.contentSessionKey = null;

	this.contentSessionKey = null;
	this.playerStateManager = null;
	this.html5PlayerInterface = null;

	// Change the configs values for the corresponding stream properties values
	configs.content.live = this.isLive;
	configs.content.url = this.URL;
	configs.content.contentLength = this.videoElement.duration;
	// Change for the desired name
	configs.content.applicationName = "NexPlayer HTML5";


	// Initializes the Conviva Client
	this.initConvivaClient = function() {

		// Encapsulates all Conviva system settings.
		this.systemSettings = new Conviva.SystemSettings();

		if(this.debug) {
			// Show all logs
			this.systemSettings.LogLevel = Conviva.SystemSettings.LogLevel.DEBUG;
		}
		else {
			// Show no logs
			this.systemSettings.LogLevel = Conviva.SystemSettings.LogLevel.NONE;
		}

		// Switch to false during production environment
		this.systemSettings.allowUncaughtExceptions = true;

		// Used by the Conviva library to access system information and utilities.
		this.systemInterface = new Conviva.SystemInterface(
	        new Conviva.Impl.Html5Time(),
	        new Conviva.Impl.Html5Timer(),
	        new Conviva.Impl.Html5Http(),
	        new Conviva.Impl.Html5Storage(),
	        new Conviva.Impl.Html5Metadata(),
	        new Conviva.Impl.Html5Logging()
	     );


		this.clientSettings = new Conviva.ClientSettings(configs.content.CUSTOMER_KEY);

		if (configs.content.gatewayUrl != undefined) {
	        this.clientSettings.gatewayUrl = configs.content.gatewayUrl;
	    }

		// Provides access to system information and utilities according to chosen settings.
	    this.systemFactory = new Conviva.SystemFactory(this.systemInterface, this.systemSettings);

	    /*
		Main Conviva class.
		Most applications will only need one Client, created during application initialization and released during application shutdown.
	    */
		this.client = new Conviva.Client(this.clientSettings, this.systemFactory);

	}


	// Create a Conviva monitoring session.
 	this.createContentSession = function() {

		this.buildConvivaContentMetadata();

    	this.contentSessionKey = this.client.createSession(this.contentMetadata);
    	if (this.contentSessionKey === Conviva.Client.NO_SESSION_KEY) {
    		//console.log("Error session key couldn't be created");
    	}


    	this.playerStateManager = this.client.getPlayerStateManager();
    	this.html5PlayerInterface = new Conviva.Impl.Html5PlayerInterface(this.playerStateManager, this.videoElement, this.systemFactory);


	    this.attachPlayer(this.contentSessionKey, this.playerStateManager);


	    var self = this;

	    this.videoElement.addEventListener('ended', function() {
		   // Cleanup Content Session if postroll is not enabled
		   self.cleanupContentSession();

		});
	}

	this.attachPlayer = function(sessionKey, stateManager) {
	    if (this.client != null && sessionKey != Conviva.Client.NO_SESSION_KEY) {
	        this.client.attachPlayer(sessionKey, stateManager);
    	}
	}

	this.detachPlayer = function(sessionKey) {
	    if (this.client != null && sessionKey != Conviva.Client.NO_SESSION_KEY) {
	        this.client.detachPlayer(sessionKey);
	    }
	}

	this.cleanupContentSession = function() {

	    if (this.contentSessionKey != Conviva.Client.NO_SESSION_KEY) {
	        this.html5PlayerInterface.cleanup();
	        this.html5PlayerInterface = null;

	        this.client.releasePlayerStateManager(this.playerStateManager);
	        this.playerStateManager = null;

	        this.client.cleanupSession(this.contentSessionKey);
	        this.contentSessionKey = Conviva.Client.NO_SESSION_KEY;
	    }
	    // Release Conviva Client if required during cleanupSession or only during exiting of application
	    this.releaseConvivaClient();
	}

	this.releaseConvivaClient = function() {
    if (this.client != null) {
        this.client.release();
        this.client = null;
    }

    if (this.systemFactory != null) {
        // If Client was the only consumer of systemFactory, release systemFactory as well.
        this.systemFactory.release();
        this.systemFactory = null;
    }
}


// Create a new custom tag, if the tag already exits in the config object depending on the "update" parameter the tag value will be updated or not
this.createCustomTag = function(tag, value, update) {

	if(configs.content.tags[tag] == null && configs.content.tags[tag] == undefined) {
		configs.content.tags[tag] = value;
		//console.log("add tag", configs.content.tags);
	}
	else {
		//console.log("Tag is already created");
		if(update) {
			configs.content.tags[tag] = value;
			//console.log(tag + " value is updated");
		}
	}

	this.buildConvivaContentMetadata();
}



// Create the metadata
this.buildContentMetadata = function(credentials) {

	//console.log("metadata", configs.content);
	if(this.contentMetadata == null){

	}
	else {

		if (credentials.assetName != null) {
			this.contentMetadata.assetName = credentials.assetName;
		}
		if (credentials.url != null) {
			this.contentMetadata.streamUrl = credentials.url;
		}
		if (credentials.live != null) {
			this.contentMetadata.streamType = credentials.live ? Conviva.ContentMetadata.StreamType.LIVE : Conviva.ContentMetadata.StreamType.VOD;
		}
		if (credentials.bitrateKbps != null) {
			this.contentMetadata.defaultBitrateKbps = credentials.bitrateKbps; // in Kbps
		}
		if (credentials.applicationName != null) {
			this.contentMetadata.applicationName = credentials.applicationName;
		}
		if (credentials.viewerId != null) {
			this.contentMetadata.viewerId = credentials.viewerId;
		}
		if(credentials.tags != undefined) {
			Object.assign(this.contentMetadata.custom, credentials.tags);
		}
		if(credentials.contentLength != undefined) {
			this.contentMetadata.duration = credentials.contentLength;
		}
		if(credentials.encodedFps != undefined) {
			this.contentMetadata.encodedFrameRate = credentials.encodedFps;
		}
		if(credentials.defaultResource != undefined) {
			this.contentMetadata.defaultResource = credentials.defaultResource;
		}

	}
}

this.buildConvivaContentMetadata = function() {

	this.contentMetadata = new Conviva.ContentMetadata();
	var credentials = configs.content;
	if (credentials != null) {
		//Create metadata
		this.buildContentMetadata(credentials);

	}

}

this.updateContentMetadata = function() {

	this.buildConvivaContentMetadata();

	if(this.contentSessionKey != null && this.client != null) {
		this.client.updateContentMetadata(this.contentSessionKey, this.contentMetadata);
	}
}

this.updateBitrateData = function(bitrateKbps) {

	if(this.playerStateManager != null) {
		this.playerStateManager.setBitrateKbps(bitrateKbps);
	}
}
}
