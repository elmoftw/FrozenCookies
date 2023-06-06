// ==UserScript==
// @name           Frozen Cookies
// @version        github-latest
// @description    Userscript to load Frozen Cookies
// @author         Icehawk78
// @homepage       https://github.com/elmoftw/FrozenCookies
// @include        http://orteil.dashnet.org/cookieclicker/
// @include        https://orteil.dashnet.org/cookieclicker/
// @updateURL      https://elmoftw.github.io/FrozenCookies/fc_userscript_loader.user.js
// @downloadURL    https://elmoftw.github.io/FrozenCookies/fc_userscript_loader.user.js
// ==/UserScript==

// Source:    https://github.com/Icehawk78/FrozenCookies/main/
// Github.io: http://icehawk78.github.io/FrozenCookies/

var loadInterval = setInterval(function () {
  const Game = unsafeWindow.Game;
  if (Game && Game.ready) {
    clearInterval(loadInterval);
    Game.LoadMod("https://elmoftw.github.io/FrozenCookies/frozen_cookies.js");
  }
}, 1000);
