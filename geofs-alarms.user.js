// ==UserScript==
// @name         GeoFS-Alarms
// @icon         https://www.geo-fs.com/favicon.ico
// @namespace    https://github.com/Daviduss01/geofs-alarms
// @version      0.1.8
// @description  Adds cockpit alarm sounds to GeoFS online flight simulator
// @author       Daviduss01, PEK-97, python-coding-404, Supreme1707, Winston_Sung
// @match        https://*.geo-fs.com/geofs.php*
// ==/UserScript==

(function () {
    'use strict';

    // Load the audio clips

    let terainPullUpClacker = new Audio("https://github.com/Daviduss01/geofs-alarms/raw/master/terain_pull_up.mp3");
    terainPullUpClacker.type = "audio/mpeg";
    terainPullUpClacker.loop = true;

    let bankangleClacker = new Audio("https://github.com/Daviduss01/geofs-alarms/raw/master/bankangle.ogg");
    bankangleClacker.type = "audio/ogg";
    bankangleClacker.loop = true;

    let overspeedClacker = new Audio("https://github.com/Daviduss01/geofs-alarms/raw/master/overspeed.ogg");
    overspeedClacker.type = "audio/ogg";
    overspeedClacker.loop = true;

    let sinkratePullUpClacker = new Audio("https://github.com/Daviduss01/geofs-alarms/raw/master/sinkrate_pull_up.mp3");
    sinkratePullUpClacker.type = "audio/mpeg";
    sinkratePullUpClacker.loop = true;

    let stickShake = new Audio("https://github.com/Daviduss01/geofs-alarms/raw/master/stall.ogg");
    stickShake.type = "audio/ogg";
    stickShake.loop = true;

    // Wait until flight sim is fully loaded
    let itv = setInterval(
        function() {
            if (unsafeWindow.ui && unsafeWindow.flight) {
                main();
                clearInterval(itv);
            }
        },
        500
    );

    function main() {
        let prevAudioOn = false;

        // Monkey-patch the togglePause method
        // This is required as setAnimationValue won't be called during togglePause,
        // making the audio unexpectedly playing continuously.
        unsafeWindow.geofs.togglePause = function () {
            let cached_togglePause = unsafeWindow.geofs.togglePause;

            return function () {
                let result = cached_togglePause.apply(this, arguments);

                if (unsafeWindow.geofs.pause) {
                    prevAudioOn = false;

                    terainPullUpClacker.pause();
                    terainPullUpClacker.currentTime = 0;
                    bankangleClacker.pause();
                    bankangleClacker.currentTime = 0;
                    overspeedClacker.pause();
                    overspeedClacker.currentTime = 0;
                    sinkratePullUpClacker.pause();
                    sinkratePullUpClacker.currentTime = 0;
                    stickShake.pause();
                    stickShake.currentTime = 0;
                }

                return result;
            };
        } ();

        // Monkey-patch the setAnimationValue method
        // - Altitude too low
        // - Overbanked angle
        // - Overspeed
        // - Sinkrate
        // - Stalling
        let prevAltTooLow = false;
        let prevOverbankedAng = false;
        let prevOversped = false;
        let prevSinkRate = false;
        let prevStalled = false;
        unsafeWindow.flight.setAniValOld = unsafeWindow.flight.setAnimationValues;
        unsafeWindow.flight.setAnimationValues = function(a, b) {
            this.setAniValOld(a, b);

            let hasAudioOn = (unsafeWindow.geofs.isPaused() !== true && unsafeWindow.audio.on);
            let hasAltTooLow = (
                unsafeWindow.geofs.animation.values.climbrate < -3000 &&
                unsafeWindow.geofs.animation.values.climbrate > -5000 &&
                unsafeWindow.geofs.animation.values.kias > 180 &&
                unsafeWindow.geofs.relativeAltitude < 2000
            );
            let hasOverbankedAng = (
                unsafeWindow.geofs.animation.values.aroll > 35 ||
                unsafeWindow.geofs.animation.values.aroll < -35
            );
            let hasOversped = unsafeWindow.geofs.animation.values.kias >= 350;
            let hasSinkRate = (
                unsafeWindow.geofs.animation.values.climbrate < -8000 &&
                unsafeWindow.geofs.animation.values.kias > 225
            );
            let hasStalled = unsafeWindow.geofs.aircraft.instance.stalling;

            if (hasAudioOn) {
                if (hasAltTooLow && (!prevAltTooLow || !prevAudioOn)) {
                    terainPullUpClacker.volume = unsafeWindow.geofs.preferences.volume;
                    terainPullUpClacker.play();
                } else if (!hasAltTooLow && prevAltTooLow) {
                    terainPullUpClacker.pause();
                    terainPullUpClacker.currentTime = 0;
                }

                if (hasOverbankedAng && (!prevOverbankedAng || !prevAudioOn)) {
                    bankangleClacker.volume = unsafeWindow.geofs.preferences.volume;
                    bankangleClacker.play();
                } else if (!hasOverbankedAng && prevOverbankedAng) {
                    bankangleClacker.pause();
                    bankangleClacker.currentTime = 0;
                }

                if (hasOversped && (!prevOversped || !prevAudioOn)) {
                    overspeedClacker.volume = unsafeWindow.geofs.preferences.volume;
                    overspeedClacker.play();
                } else if (!hasOversped && prevOversped) {
                    overspeedClacker.pause();
                    overspeedClacker.currentTime = 0;
                }

                if (hasSinkRate && (!prevSinkRate || !prevAudioOn)) {
                    sinkratePullUpClacker.volume = unsafeWindow.geofs.preferences.volume;
                    sinkratePullUpClacker.play();
                } else if (!hasSinkRate && prevSinkRate) {
                    sinkratePullUpClacker.pause();
                    sinkratePullUpClacker.currentTime = 0;
                }

                if (hasStalled && (!prevStalled || !prevAudioOn)) {
                    stickShake.volume = unsafeWindow.geofs.preferences.volume;
                    stickShake.play();
                } else if (!hasStalled && prevStalled) {
                    stickShake.pause();
                    stickShake.currentTime = 0;
                }
            } else if (!hasAudioOn && prevAudioOn) {
                terainPullUpClacker.pause();
                terainPullUpClacker.currentTime = 0;
                bankangleClacker.pause();
                bankangleClacker.currentTime = 0;
                overspeedClacker.pause();
                overspeedClacker.currentTime = 0;
                sinkratePullUpClacker.pause();
                sinkratePullUpClacker.currentTime = 0;
                stickShake.pause();
                stickShake.currentTime = 0;
            }

            prevAudioOn = hasAudioOn;
            prevAltTooLow = hasAltTooLow;
            prevOverbankedAng = hasOverbankedAng;
            prevOversped = hasOversped;
            prevSinkRate = hasSinkRate;
            prevStalled = hasStalled;
        }
    }
})();
