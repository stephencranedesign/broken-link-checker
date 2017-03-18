var Timer = require('timer.js');

var TimerWrapper = function(crawlFrequency) {
    this.crawlFrequency = crawlFrequency;
    this.timer = new Timer();
    this.callback = function() {};
    this.killed = false;
};

/* allows us to save to db. */
TimerWrapper.prototype.setCallback = function(callbackPromise) {
    console.log('TimerWrapper setCallback');
    this.callback = function() {
        callbackPromise(function(startTimer) {
            if(startTimer) this.timer.start();
        }.bind(this));
    }.bind(this);
};
TimerWrapper.prototype.start = function() {
    console.log('TimerWrapper start');
    this.timer.start(this.crawlFrequency).on('end', function() {
        if(this.killed) return;

        /* timer callback should be a promise. return true if you want to re-start. */
        this.callback();

    }.bind(this));
};
TimerWrapper.prototype.stop = function() {
    this.killed = true;
    this.timer.stop();
};

module.exports = TimerWrapper;