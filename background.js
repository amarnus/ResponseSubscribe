var Poller = function() {
  this.POLL_FREQUENCY = 1000 * 60; // Look for new tweets every minute
  this.POLL_URI = "http://search.twitter.com/search.json";
};

Poller.prototype.poll = function() {
  var pollUri = this.POLL_URI;
  window.setInterval(function() {
    var tweets = localStorage.getItem("proto_tweets_following"), screenName, tweetId, max;
    if (tweets) {
      tweets = JSON.parse(tweets);
      for(var i = 0; i < tweets.length; i++) {
        (function(i) {
          tweetId = (("lastFetch" in tweets[i]) && tweets[i].lastFetch) ? tweets[i].lastFetch : tweets[i].tweetId;
          $.get(pollUri, { q: "@" + tweets[i].screenName, since_id: tweetId, rpp: 100 }, function(response, screenName) {
            max = response.results.length;
            for(var j = 0; j < max; j++) {
              (function(j) {
                webkitNotifications.createNotification(
                  response.results[j].profile_image_url, 
                  "@" + response.results[j].from_user + " to @" + tweets[i].screenName, 
                  response.results[j].text
                ).show();
              })(j);
            }
            if (response.results.length > 0) {
              tweets = JSON.parse(localStorage.getItem("proto_tweets_following"));
              tweets[i].lastFetch = response.results[0].id_str;
              localStorage.setItem("proto_tweets_following", JSON.stringify(tweets));
            }
          }, 'json');
        })(i);
      }
    }
  }, this.POLL_FREQUENCY);
};

// Register event handler to listen for messages coming from a content script
// somewhere
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.action == "saveLocal") {
    // We need to sync twitter.com's localStorage with that of the extension
    // because local storage in the browser is scoped by the domain of access
    // So, extension cannot access the local storage of a website on its own
    localStorage.setItem(request.key, request.value);
  }
});

new Poller().poll();