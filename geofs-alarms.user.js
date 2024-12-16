// ==UserScript==
// @name         GeoFS-Alarms
// @icon         https://www.geo-fs.com/favicon.ico
// @namespace    https://github.com/Daviduss01/geofs-alarms
// @version      0.1.9
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
            let kias = unsafeWindow.geofs.animation.values.kias;
            let climbrate = unsafeWindow.geofs.animation.values.climbrate;
            let relativeAltitude = unsafeWindow.geofs.relativeAltitude;
            let hasAltTooLow = false;
            let hasOverbankedAng = (
                unsafeWindow.geofs.animation.values.aroll > 35 ||
                unsafeWindow.geofs.animation.values.aroll < -35
            );
            let hasOversped = unsafeWindow.geofs.animation.values.kias >= 350;
            let hasSinkRate = false;
            let hasStalled = unsafeWindow.geofs.aircraft.instance.stalling;

            // https://commons.wikimedia.org/wiki/File:FAA_excessive_sink_rate_graph.svg
            if (climbrate < -1200 && kias > 180) {
                if (
                    climbrate >= -1550 &&
                    relativeAltitude >= 200 &&
                    relativeAltitude < 200 + (-climbrate - 1200) * ((450 - 200) / (1550 - 1200))
                ) {
                    if (kias >= 225) {
                        hasSinkRate = true;
                    }
                } else if (
                    climbrate >= -1650 &&
                    relativeAltitude >= 75 &&
                    relativeAltitude < 450 + (-climbrate - 1550) * ((500 - 450) / (1650 - 1550))
                ) {
                    if (
                        kias >= 225 &&
                        relativeAltitude >= 200 + (-climbrate - 1550) * ((350 - 200) / (1650 - 1550))
                    ) {
                        hasSinkRate = true;
                    } else {
                        hasAltTooLow = true;
                    }
                } else if (
                    climbrate >= -2000 &&
                    relativeAltitude >= 75 &&
                    relativeAltitude < 500 + (-climbrate - 1650) * ((700 - 500) / (2000 - 1650))
                ) {
                    if (
                        kias >= 225 &&
                        relativeAltitude >= 350 + (-climbrate - 1650) * ((525 - 350) / (2000 - 1650))
                    ) {
                        hasSinkRate = true;
                    } else {
                        hasAltTooLow = true;
                    }
                } else if (
                    climbrate >= -6000 &&
                    relativeAltitude >= 75 - (-climbrate - 2000) * ((75 - 50) / (6000 - 2000)) &&
                    relativeAltitude < 700 + (-climbrate - 2000) * ((3200 - 700) / (6000 - 2000))
                ) {
                    if (
                        kias >= 225 &&
                        relativeAltitude >= 525 + (-climbrate - 2000) * ((2500 - 525) / (6000 - 2000))
                    ) {
                        hasSinkRate = true;
                    } else {
                        hasAltTooLow = true;
                    }
                } else if (
                    climbrate >= -10000 &&
                    relativeAltitude >= 50 - (-climbrate - 6000) * (50 / (10000 - 6000)) &&
                    relativeAltitude < 3200 + (-climbrate - 6000) * ((4850 - 3200) / (10000 - 6000))
                ) {
                    if (
                        kias >= 225 &&
                        relativeAltitude >= 2500 + (-climbrate - 6000) * ((3850 - 2500) / (10000 - 6000))
                    ) {
                        hasSinkRate = true;
                    } else {
                        hasAltTooLow = true;
                    }
                } else if (
                    relativeAltitude < 4850 + (-climbrate - 10000) * ((5100 - 4850) / (10550 - 10000))
                ) {
                    if (
                        kias >= 225 &&
                        relativeAltitude >= 3850 + (-climbrate - 10000) * ((4050 - 3850) / (10550 - 10000))
                    ) {
                        hasSinkRate = true;
                    } else {
                        hasAltTooLow = true;
                    }
                }
            }

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
