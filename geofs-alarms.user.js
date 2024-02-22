// ==UserScript==
// @name         GeoFS-Alarms
// @icon         https://www.geo-fs.com/favicon.ico
// @namespace    https://github.com/Daviduss01/geofs-alarms
// @version      0.1.5
// @description  Adds cockpit alarm sounds to GeoFS online flight simulator
// @author       PEK-97, Supreme1707, Winston_Sung, Daviduss01
// @match        https://*.geo-fs.com/geofs.php*
// @grant        GM.getResourceUrl
// @resource     stall https://github.com/Daviduss01/geofs-alarms/raw/master/stall.ogg
// @resource     bankangle https://github.com/Daviduss01/geofs-alarms/raw/master/bankangle.ogg
// @resource     overspeed https://github.com/Daviduss01/geofs-alarms/raw/master/overspeed.ogg
// @resource     terain_pull_up https://github.com/Daviduss01/geofs-alarms/raw/master/terain_pull_up.mp3
// @resource     sinkrate_pull_up https://github.com/Daviduss01/geofs-alarms/raw/master/sinkrate_pull_up.mp3
// ==/UserScript==

(function () {
    'use strict';

    // Load the audio clips
    let stickShake;
    GM.getResourceUrl("stall").then(
        (data) => {
            stickShake = new Audio(data);
            stickShake.loop = true;
        }
    );
    let bankangleClacker;
    GM.getResourceUrl("bankangle").then(
        (data) => {
            bankangleClacker = new Audio(data);
            bankangleClacker.loop = true;
        }
    );
    let overspeedClacker;
    GM.getResourceUrl("overspeed").then(
        (data) => {
            overspeedClacker = new Audio(data);
            overspeedClacker.loop = true;
        }
    );
    let terainPullUpClacker;
    GM.getResourceUrl("terain_pull_up").then(
        (data) => {
            terainPullUpClacker = new Audio(data);
            terainPullUpClacker.loop = true;
        }
    );
    let sinkratePullUpClacker;
    GM.getResourceUrl("sinkrate_pull_up").then(
        (data) => {
            sinkratePullUpClacker = new Audio(data);
            sinkratePullUpClacker.loop = true;
        }
    );

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
        // Monkey-patch the setVisibility method
        // - Stalling
        let prevStalled = false;
        unsafeWindow.ui.hud.stall.setVisOld = unsafeWindow.ui.hud.stall.setVisibility;
        unsafeWindow.ui.hud.stall.setVisibility = function (a) {
            if (a && unsafeWindow.geofs.isPaused() !== true && unsafeWindow.audio.on && !prevStalled) {
                stickShake.volume = unsafeWindow.geofs.preferences.volume;
                stickShake.play();
            } else {
                stickShake.pause();
                stickShake.currentTime = 0;
            }
            prevStalled = a;
            this.setVisOld(a);
        }

        // Monkey-patch the setAnimationValue method
        // - Altitude too low
        // - Overbanked angle
        // - Overspeed
        // - Sinkrate
        // - Stalling
        let prevAudioOn = false;
        let prevAltTooLow = false;
        let prevOverbankedAng = false;
        let prevOversped = false;
        let prevSinkRate = false;
        unsafeWindow.flight.setAniValOld = unsafeWindow.flight.setAnimationValues;
        unsafeWindow.flight.setAnimationValues = function(a, b) {
            this.setAniValOld(a, b);

            let hasAudioOn = (unsafeWindow.geofs.isPaused() !== true && unsafeWindow.audio.on);
            let hasAltTooLow = (
                unsafeWindow.geofs.animation.values.climbrate < -3000 &&
                unsafeWindow.geofs.animation.values.climbrate > -5000 &&
                unsafeWindow.geofs.animation.values.kias > 1800 &&
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

            if (hasAudioOn) {
                if (hasAltTooLow && (!prevAltTooLow || !prevAudioOn)){
                    terainPullUpClacker.volume = unsafeWindow.geofs.preferences.volume;
                    terainPullUpClacker.play();
                } else if (!hasAltTooLow && prevAltTooLow){
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
                if (hasOversped && (!prevOversped || !prevAudioOn)){
                    overspeedClacker.volume = unsafeWindow.geofs.preferences.volume;
                    overspeedClacker.play();
                } else if (!hasOversped && prevOversped) {
                    overspeedClacker.pause();
                    overspeedClacker.currentTime = 0;
                }
                if (hasSinkRate && (!prevSinkRate || !prevAudioOn)){
                    sinkratePullUpClacker.volume = unsafeWindow.geofs.preferences.volume;
                    sinkratePullUpClacker.play();
                } else if (!hasSinkRate && prevSinkRate){
                    sinkratePullUpClacker.pause();
                    sinkratePullUpClacker.currentTime = 0;
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
        }
    }
})();
