// ==UserScript==
// @name         GeoFS-Alarms
// @namespace    https://github.com/Daviduss01/geofs-alarms
// @version      0.1.4.1
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
    // load the audio clips
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
    // wait until flight sim is fully loaded
    let itv = setInterval(
        function() {
            if(unsafeWindow.ui && unsafeWindow.flight) {
                main();
                clearInterval(itv);
            }
        }
        ,500);
    function main() {
        // monkey-patch the stall.setVisibility method
        let prevStalled = false;
        unsafeWindow.ui.hud.stall.setVisOld = unsafeWindow.ui.hud.stall.setVisibility;
        unsafeWindow.ui.hud.stall.setVisibility = function (a) {
            if (a && (!prevStalled || unsafeWindow.geofs.isPaused() === true || !unsafeWindow.audio.on)) {
                stickShake.play();
            } else {
                stickShake.pause();
            }
            prevStalled = a;
            this.setVisOld(a);
        }
        // monkey-patch the setAnimationValue method
        let prevAudioOn = false;
        let prevOverBankedAng = false;
        let prevOversped = false;
        let prevAltTooLow = false;
        let prevSinkRate = false;
        unsafeWindow.flight.setAniValOld = unsafeWindow.flight.setAnimationValues;
        unsafeWindow.flight.setAnimationValues = function(a) {
            this.setAniValOld(a);
            // - over-banked angle
            // - overspeed
            // - altitude too low
            let hasAudioOn = (unsafeWindow.geofs.isPaused() == true || unsafeWindow.audio.on);
            let hasOverBankedAng = (unsafeWindow.geofs.animation.values.aroll > 35 || unsafeWindow.geofs.animation.values.aroll < -35);
            let hasOversped = unsafeWindow.geofs.animation.values.kias >= 350;
            let hasAltTooLow = (
                unsafeWindow.geofs.animation.values.climbrate < -3000 &&
                unsafeWindow.geofs.animation.values.climbrate > -5000 &&
                unsafeWindow.geofs.animation.values.kias > 1800 &&
                unsafeWindow.geofs.relativeAltitude < 2000
                );
            let hasSinkRate = (unsafeWindow.geofs.animation.values.climbrate < -8000 &&
                               unsafeWindow.geofs.animation.values.kias > 225);
            if (hasAudioOn) {
                if (hasOverBankedAng && (!prevOverBankedAng || !prevAudioOn)) {
                    bankangleClacker.play();
                } else if (!hasOverBankedAng && prevOverBankedAng) {
                    bankangleClacker.pause();
                }
                if (hasOversped && (!prevOversped || !prevAudioOn)){
                    overspeedClacker.play();
                } else if (!hasOversped && prevOversped) {
                    overspeedClacker.pause();
                }
                if (hasAltTooLow && (!prevAltTooLow || !prevAudioOn)){
                    terainPullUpClacker.play();
                } else if (!hasAltTooLow && prevAltTooLow){
                    terainPullUpClacker.pause();
                }
                if (hasSinkRate && (!prevSinkRate || !prevAudioOn)){
                    sinkratePullUpClacker.play();
                } else if (!hasSinkRate && prevSinkRate){
                    sinkratePullUpClacker.pause();
                }
            } else if (!hasAudioOn && prevAudioOn) {
                stickShake.pause();
                bankangleClacker.pause();
                overspeedClacker.pause();
                terainPullUpClacker.pause();
                sinkratePullUpClacker.pause();
            }
            prevAudioOn = hasAudioOn;
            prevOverBankedAng = hasOverBankedAng;
            prevOversped = hasOversped;
            prevAltTooLow = hasAltTooLow;
            prevSinkRate = hasSinkRate;
        }
    }
})();
