// ==UserScript==
// @name         GeoFS-Alarms
// @namespace    https://github.com/fengshuo2004/geofs-alarms
// @version      0.1.3-rc.2
// @description  Adds cockpit alarm sounds to GeoFS online flight simulator
// @author       PEK-97, Supreme1707, Winston_Sung
// @match        https://www.geo-fs.com/geofs.php*
// @grant        GM.getResourceUrl
// @resource     stall https://github.com/fengshuo2004/geofs-alarms/raw/master/stall.ogg
// @resource     bankangle https://github.com/fengshuo2004/geofs-alarms/raw/master/bankangle.ogg
// @resource     overspeed https://github.com/fengshuo2004/geofs-alarms/raw/master/overspeed.ogg
// @resource     terain_pull_up https://github.com/Supreme1707/geofs-alarms/raw/master/terain_pull_up.mp3
// ==/UserScript==

(function () {
    'use strict';
    // load the audio clips
    let stickShake;
    GM.getResourceUrl("stall").then(
        (data)=>{
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
    // wait until flight sim is fully loaded
    let itv = setInterval(
        function(){
            if(unsafeWindow.ui && unsafeWindow.flight){
                main();
                clearInterval(itv);
            }
        }
    ,500);
    function main(){
        if (unsafeWindow.geofs.isPaused() || !unsafeWindow.audio.on) {
            stickShake.pause();
            bankangleClacker.pause();
            overspeedClacker.pause();
            terainPullUpClacker.pause();
        } else {
            // monkey-patch the stall.setVisibility method
            let prevStalled = false;
            unsafeWindow.ui.hud.stall.setVisOld = unsafeWindow.ui.hud.stall.setVisibility;
            unsafeWindow.ui.hud.stall.setVisibility = function (a) {
                if (a) {
                    stickShake.play();
                } else if (prevStalled) {
                    stickShake.pause();
                }
                prevStalled = a;
                this.setVisOld(a);
            }
            // monkey-patch the setAnimationValue method
            let prevOverBankedAng = false;
            let prevOversped = false;
            let prevAltTooLow = false;
            unsafeWindow.flight.setAniValOld = unsafeWindow.flight.setAnimationValues;
            unsafeWindow.flight.setAnimationValues = function(a) {
                this.setAniValOld(a);
                // over-banked angle
                let hasOverBankedAng = (unsafeWindow.geofs.animation.values.aroll > 35 || unsafeWindow.geofs.animation.values.aroll < -35);
                if (hasOverBankedAng && !prevOverBankedAng){
                    bankangleClacker.play();
                } else if (!hasOverBankedAng && prevOverBankedAng){
                    bankangleClacker.pause();
                }
                prevOverBankedAng = hasOverBankedAng;
                // overspeed
                let hasOversped = unsafeWindow.geofs.animation.values.kias >= 350;
                if (hasOversped && !prevOversped){
                    overspeedClacker.play();
                } else if (!hasOversped && prevOversped){
                    overspeedClacker.pause();
                }
                prevOversped = hasOversped;
                // altitude too low
                let hasAltTooLow = (
                    unsafeWindow.geofs.animation.values.kias > 120 &&
                    unsafeWindow.geofs.relativeAltitude < 750 &&
                    (
                        unsafeWindow.geofs.relativeAltitude <= 150 ||
                        ((unsafeWindow.geofs.animation.values.kias - 120) * 5) < (unsafeWindow.geofs.relativeAltitude - 150)
                    )
                );
                if (hasAltTooLow && !prevAltTooLow){
                    terainPullUpClacker.play();
                } else if (!hasAltTooLow && prevAltTooLow){
                    terainPullUpClacker.pause();
                }
                prevAltTooLow = hasAltTooLow;
            }
        }
    }
})();
