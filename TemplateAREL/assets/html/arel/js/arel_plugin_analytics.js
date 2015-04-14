/**
* @copyright  Copyright 2012 metaio GmbH. All rights reserved.
* @link       http://www.metaio.com
* @author     Marion Koelle
* @class      arel.Plugin.Analytics realizes google Analytics tracking
* @version    1.1
*/

//poor lonely global variable, required for google Analytics
var _gaq;

arel.Plugin.Analytics = function (accountID, eventSampling, __prefix) {

    this.creatorPrefix = __prefix;
	//define how often the detection of a single pattern should be tracked; possible values: ONCE, ALTERNATE, ALL
	this.eventSampling = undefined;


	//variable to hold all previously detected pattern
	this.seenPattern = undefined;

	//variable to hold the last pattern detected
	this.lastPattern = undefined;


	/**
	* constructor
	* @param accountID google Analytics Account ID in the format UA-XXXXXXXX-XX.
	*/

	this.initialize = function (accountID, eventSampling, __prefix) {
		//modified tracking snippet for google Analytics
		_gaq = [['_setAccount', accountID], ['_trackPageview']];
		_gaq.push(['_gat._anonymizeIp']); 
		(function (d, t) {
			var g = d.createElement(t),
			s = d.getElementsByTagName(t)[0];
			g.src = window.location.protocol.indexOf('http') == 0 ? '//www.google-analytics.com/ga.js' : 'http://www.google-analytics.com/ga.js';
		 	s.parentNode.insertBefore(g, s);
		} (document, 'script'));

		//check if eventSampling is valid
		if (eventSampling != arel.Plugin.Analytics.EventSampling.ONCE &&
			eventSampling != arel.Plugin.Analytics.EventSampling.ALTERNATE &&
			eventSampling != arel.Plugin.Analytics.EventSampling.ALL) {
			arel.Debug.error("arel.Plugin.Analytics.initialize: invalid eventSampling parameter passed");
			return;
		}
		else {
			this.eventSampling = eventSampling;
		}

		this.creatorPrefix = __prefix;
		this.seenPattern = new Array();
	};

	/**
	* Dispatch a command to google Analytics when he channel was opened
	* The channel ID provided is logged as a page view
	* @param {String} id ID of the Channel that was finished loading
	*/
	this.logSceneReady = function (id) {
		if(accountID)
			this.logPageView(id, "channelopening");
		else
			arel.Debug.log("logSceneReady: Google Analytics not configured.");
	};

	/**
	* Dispatch a command to google Analytics to track a video.
	* The video url is logged as virtual page view.
	* @param {String} videoUrl video (path) to be logged
	*/
	this.logVideo = function (videoUrl) {
		if(accountID)
			this.logPageView(videoUrl, "video");
		else
			arel.Debug.log("logVideo: Google Analytics not configured.");
	};

	/**
	* Dispatch a command to google Analytics to track a youTube video.
	* The youTube video url is logged as virtual page view.
	* @param {String} youTubeVideoUrl youTube video (path) to be logged
	*/
	this.logYouTubeVideo = function (youTubeVideoUrl) {
		if(accountID)
			this.logPageView(youTubeVideoUrl, "youTube");
		else
			arel.Debug.log("logYouTubeVideo: Google Analytics not configured.");
	};

	/**
	* Dispatch a command to google Analytics to track a website. 
	* The site url is logged as virtual page view.
	* @param {String} siteUrl url to be logged
	*/
	this.logWebsite = function (siteUrl) {
		if(accountID)
			this.logPageView(siteUrl, "website");
		else
			arel.Debug.log("logWebsite: Google Analytics not configured.");
	};

	/**
	* Dispatch a command to google Analytics to track a image. 
	* The image url is logged as virtual page view.
	* @param {String} imageUrl url to be logged
	*/
	this.logImage = function (imageUrl) {
		if(accountID)
			this.logPageView(imageUrl, "image");
		else
			arel.Debug.log("logImage: Google Analytics not configured.");
	};

	/**
	* Dispatch a command to google Analytics to track a sound. 
	* The sound url is logged as virtual page view.
	* @param {String} soundUrl url to be logged
	*/
	this.logSound = function (soundUrl) {
		if(accountID)
			this.logPageView(soundUrl, "sound");
		else
			arel.Debug.log("logSound: Google Analytics not configured.");

	};


	/**
	* Log an interaction with the User Interface to google Analytics.
	* The logging has the format ('UIInteraction', action, objectID).
	* @param {String} action constant to be set as action. Values to chose from for the action constant are: 
	* arel.Plugin.Analytics.Action.TOUCHSTARTED, 
	* arel.Plugin.Analytics.Action.TOUCHENDED,
	* arel.Plugin.Analytics.Action.Radio and
	* arel.Plugin.Analytics.Action.Checkbox.
	* @param {String} objectID identifier to be set as label
	*/
	this.logUIInteraction = function (action, objectID) {
		//check if Google Analytics ID is configured
		if(!accountID)
		{
			arel.Debug.log("logUIInteraction: Google Analytics not configured.");
			return;
		}
		else {
			this.logEvent('UIInteraction', action, objectID);
		}

	};

	/**
	* Log an interaction with an object to google Analytics. An object can be e.g. a 3D-model or a POI.
	* The logging has the format ('ObjectInteraction', action, objectID).
	* @param {String} action constant to be set as action. Values to chose from for the action constant are: 
	* arel.Plugin.Analytics.Action.TOUCHSTARTED, 
	* arel.Plugin.Analytics.Action.TOUCHENDED and
	* arel.Plugin.Analytics.Action.ANIMATIONSTARTED
	* arel.Plugin.Analytics.Action.ANIMATIONENDED
	* @param {String} objectID identifier to be set as label
	*/

	this.logObjectInteraction = function (action, objectID) {
		//check if Google Analytics ID is configured
		if(!accountID)
		{
			arel.Debug.log("logObjectInteraction: Google Analytics not configured.");
			return;
		}
		else {
			this.logEvent('ObjectInteraction', action, objectID);
		}
	};

	/**
	* Log a tracking event to google Analytics when a pattern is detected.
	* @param {String} category constant to be set as category, defines the tracking type.
	* @param {String} action constant to be set as action. Can be arel.Plugin.Analytics.Action.STATE_TRACKING or arel. Plugin.Analytics.STATE_NOTTRACKING.
	* @param {String} coordinateSystemID identifier to be set as label.
	* 
	*/
	//using pageviews instead of events here

	this.logTrackingEvent = function (category, action, coordinateSystemID, coordinateSystemName) {
		
		if(accountID)
		{
			//check if the passed category parameter is valid
			if (category != arel.Plugin.Analytics.Category.TYPE_CODE &&
				category != arel.Plugin.Analytics.Category.TYPE_ML3D &&
				category != arel.Plugin.Analytics.Category.TYPE_ML2D &&
				category != arel.Plugin.Analytics.Category.TYPE_MARKER) {
				arel.Debug.error("arel.Plugin.Analytics.logTrackingEvent: invalid category parameter passed");
				return;
			}

			//check if the action parameters are valid
			if (action != arel.Plugin.Analytics.Action.STATE_TRACKING) {
				arel.Debug.error("arel.Plugin.Analytics.logTrackingEvent: invalid action parameter passed");
				return;
			}

			//check if the pattern has been logged before
			var index = this.seenPattern.indexOf(coordinateSystemID);

			//Log the trackingEvent according to defined eventSampling
			if (this.eventSampling === arel.Plugin.Analytics.EventSampling.ONCE && index === -1) {
				this.seenPattern.push((coordinateSystemID));
				this.logPageView(coordinateSystemName, "patternDetected");
			}
			else if (this.eventSampling === arel.Plugin.Analytics.EventSampling.ALTERNATE && this.lastPattern != coordinateSystemID) {
				this.logPageView(coordinateSystemName, "patternDetected");
				this.lastPattern = coordinateSystemID;
			}
			else if (this.eventSampling === arel.Plugin.Analytics.EventSampling.ALL) {
				this.logPageView(coordinateSystemName, "patternDetected");
			}
		}
		else
			arel.Debug.log("logTrackingEvent: Google Analytics not configured.");

	};

	/**
	* Log a virtual Pageview to google Analytics
	* @param {String} url URL to be tracked
	* @param {String} prefix category prefix to be given (optional) 
	*/

	this.logPageView = function (url, prefix) {
		var logString = url;

		if (prefix !== undefined)
			logString = prefix + "/" + encodeURIComponent(url);
		logString = this.creatorPrefix + "/" + logString;
		_gaq.push(['_gat._anonymizeIp']); 
		_gaq.push(['_trackPageview', logString]);
		arel.Debug.log("logPageView(" + logString + ")");
	};


	/**
	* Log an event to google Analytics
	* @param {String} category 
	* @param {String} action 
	* @param {String} label 
	*/

	this.logEvent = function (category, action, label) {
		_gaq.push(['_gat._anonymizeIp']); 
		_gaq.push(['_trackEvent', category, action, label]);
		arel.Debug.log("logEvent(" + category + "," + action + "," + label + ")");

	};
	
	this.trackingTypeToAnalyticsType = function (trackingState) {
		arel.Debug.log("trackingTypeToAnalyticsType");
		var result = 'UNKOWN['+trackingState+']';
		switch (trackingState) {
			case arel.Tracking.MARKERLESS_3D:
				result = arel.Plugin.Analytics.Category.TYPE_ML3D;
				break;
			case arel.Tracking.MARKERLESS_2D:
				result = arel.Plugin.Analytics.Category.TYPE_ML2D;
				break;
			case arel.Tracking.BARCODE_QR:
				result  = arel.Plugin.Analytics.Category.TYPE_CODE;
				break;
			case arel.Tracking.MARKER:
				result = arel.Plugin.Analytics.Category.TYPE_MARKER;
				break;
		}
		return result;
	};

	this.initialize(accountID, eventSampling, __prefix);

};

/**
 * Define action types
 * @constant
 */

arel.Plugin.Analytics.Action =
{
	/**
	 * Action type touch_start
	 * @constant
	 */
	
	TOUCHSTARTED: "touch_start",
	
	/**
	 * Action type touch_end
	 * @constant
	 */
	
	TOUCHENDED: "touch_end",
	
	/**
	 * Action type radiobutton selected
	 * @constant
	 */
	
	RADIO: "radio",
	
	/**
	 * Action type checkbox selected
	 * @constant
	 */
	
	CHECKBOX: "checkbox",
	
	/**
	 * Action type animation started
	 * @constant
	 */
	
	ANIMATIONSTARTED: "animation_started",
	
	/**
	 * Action type animation ended
	 * @constant
	 */
	
	ANIMATIONENDED: "animation_ended",
	
	/**
	 * Action type pattern tracked
	 * @constant
	 */
		
	STATE_TRACKING: "pattern_tracked"		
	
};

/**
 * Define category types
 * @constant
 */

arel.Plugin.Analytics.Category =
{

	/**
	 * Tracking type QR-Code
	 * @constant
	*/
		
	TYPE_CODE: "QR-Code", 
		
	/**
	 * Tracking type Markerless 3D Tracking
	 * @constant
	 */
		
	TYPE_ML3D: "3D Markerless",
		
	/**
	 * Tracking type Markerless 2D-Tracking (Imagetracking)
	 * @constant
	 */
		
	TYPE_ML2D: "2D Markerless",
		
	/**
	 * Tracking type ID Marker
	 * @constant
	 */
		
	TYPE_MARKER: "ID Marker" 
};


/**
 * Define conditions for EventSampling. Necessary to prevent google Analytics from reaching the limit of 500 combined GATC requests per user session.
 * @constant
 */

arel.Plugin.Analytics.EventSampling = 
{
	
	/**
	 * Log only the overall first time a pattern is detected.
	 * @constant
	 */
		
	ONCE: "once",
	
	/**
	 * Log only the first time in a row a pattern is detected.
	 * @constant
	 */
	
	ALTERNATE: "alternate", 
	
	/**
	 * Log every time a pattern is detected. This should not be used due to the limit of 500 requests/session
	 * @constant
	 */
	
	ALL: "all" 
		
};
