var Proto = function() {
  this.PREFACE_TIMEOUT = 2000;
};

Proto.prototype._onSubscribe = function(node) {
  var action = ($(node).text() == "Unsubscribe from") ? false : true, tweetId, packet, tweets, tweet, text;
  text = (!action) ? "Subscribe to" : "Unsubscribe from";
  $(node).find("b").text(text);
  tweetId = $(node).attr("data-tweet-id");
  if (action) {
		tweet = {
		  tweetId: tweetId,
		  screenName: $(node).attr("data-screen-name"),
		  lastFetch: null,
		  replies: []	
		};
		tweetIds = this._getTweetIds();
		if ($.inArray(tweetId, tweetIds) >= 0) {
		  console.info("Already subscribed to this tweet. So, ignoring this time..");	
		}
		else if(tweetIds.length > 0) {
		  tweets = JSON.parse(localStorage.getItem('proto_tweets_following'));
		  if (tweets) {
		    tweets.push(tweet);	
		  }
		  localStorage.setItem('proto_tweets_following', JSON.stringify(tweets));
		}
		else if(tweetIds.length == 0) {
			tweets = [ tweet ];
		  localStorage.setItem('proto_tweets_following', JSON.stringify(tweets));	
		}
  }
  else {
		tweetIds = this._getTweetIds();
		if ($.inArray(tweetId, tweetIds) >= 0) {
		  tweets = JSON.parse(localStorage.getItem('proto_tweets_following'));
		  tweets = tweets.filter(function(tweet) {
			  return ('tweetId' in tweet) && (tweet['tweetId'] != tweetId);
		  });
		  localStorage.setItem('proto_tweets_following', JSON.stringify(tweets));	
		}
  }
  chrome.extension.sendRequest({ action: "saveLocal", key: "proto_tweets_following", value: JSON.stringify(tweets) });
};

Proto.prototype._getTweetId = function(value, index, array) {
  return value && ('tweetId' in value) ? value.tweetId : '';	
};

Proto.prototype._getTweetIds = function() {
  var callback = this._getTweetId;
  var tweets = localStorage.getItem('proto_tweets_following');	
  return (tweets && typeof(tweets) !== undefined && tweets.length > 0) ? JSON.parse(tweets).map(callback) : [];
}

Proto.prototype.boot = function() {
	var that = this;
	var getTweetIds = this._getTweetIds;
	var onSubscribe = this._onSubscribe;
  window.setTimeout(function() { 
	  var tweetIds = getTweetIds.apply(that);
	  var subscribeLink, tweetId, action, text;	
	  $('.stream-item-content').each(function(index, value) {
			tweetId = $(this).attr('data-tweet-id');
			screenName = $(this).attr('data-screen-name');
			text = ($.inArray(tweetId, tweetIds) >= 0) ? "Unsubscribe from" : "Subscribe to";
			subscribeLink = '<a href="#" title="' + text + ' this tweet" data-screen-name="' + screenName + '" data-tweet-id="' + tweetId + '" class="subscribe-action"><span><i></i><b>' + text + '</b></span></a>';
			$(this).find("span.tweet-actions").append(subscribeLink);
	  });	
	  $('a.subscribe-action').unbind().bind('click', function(evt) { evt.preventDefault(); onSubscribe.apply(that, [ $(this) ]); });
  }, this.PREFACE_TIMEOUT);
};

new Proto().boot();