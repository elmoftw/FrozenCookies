// Global Variables
var FrozenCookies = {};

// Load external libraries
FrozenCookies.loadInterval = setInterval(function() {
  if (Game && Game.ready) {
    clearInterval(FrozenCookies.loadInterval);
    FrozenCookies.loadInterval = 0;
    fcInit();
  }
}, 1000);

function fcInit() {
    var script_list = [
    'http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js',
    'https://raw.github.com/Icehawk78/FrozenCookies/master/cc_upgrade_prerequisites.js',
    'https://raw.github.com/caleb531/jcanvas/master/jcanvas.js',
    'https://raw.github.com/Icehawk78/FrozenCookies/master/fc_button.js'
  ]
  var done = 0;
  var jquery = document.createElement('script');
  jquery.setAttribute('type', 'text/javascript');
  jquery.setAttribute('src', 'http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js');
  jquery.onload = function() {
    script_list.forEach(function(url,id){
      $.getScript(url,function() {
        done++;
        if (done>=script_list.length)
        {
          FCStart();
        }
      });
    });
  };
  document.head.appendChild(jquery);
  FrozenCookies.frequency = 100;
  FrozenCookies.efficiencyWeight = 1.15;
  FrozenCookies.preferenceValues = [
    {'autobuy' : ["Autobuy OFF","Autobuy ON"]},
    {'autogc' : ["Autoclick GC OFF", "Autoclick GC ON"]},
    {'autofrenzy' : ["Autoclick Frenzy OFF","Autoclick Frenzy 1cps","Autoclick Frenzy 10cps","Autoclick Frenzy 25cps","Autoclick Frenzy 50cps","Autoclick Frenzy 100cps","Autoclick Frenzy 250cps"]},
    {'autoclick' : ["Autoclick Cookie OFF","Autoclick Cookie 1cps","Autoclick Cookie 10cps","Autoclick Cookie 25cps","Autoclick Cookie 50cps","Autoclick Cookie 100cps","Autoclick Cookie 250cps"]},
    {'simulategc' : ["GC for Calculations: 0%","GC for Calculations: Actual Ratio","GC for Calculations: 100%"]},
    {'numberdisplay' : ["Raw Numbers","Full Word (million, billion)","Initials (M, B)","SI Units (M, G, T)", "Scientific Notation (x10¹²)"]}
  ];
  FrozenCookies.numberDisplay = preferenceParse('numberdisplay', 1);
  FrozenCookies.autoBuy = preferenceParse('autobuy', 0);
  FrozenCookies.autoGC = preferenceParse('autogc', 0);
  FrozenCookies.simulatedGCPercent = preferenceParse('simulategc', 1);
  FrozenCookies.non_gc_time = Number(localStorage.getItem('nonFrenzyTime'));
  FrozenCookies.gc_time = Number(localStorage.getItem('frenzyTime'));
  FrozenCookies.last_gc_state = (Game.frenzy > 0);
  FrozenCookies.last_gc_time = Date.now();
  FrozenCookies.cookieClickSpeed = Number(localStorage.getItem('autoclick'),0);
  FrozenCookies.clickFrenzySpeed = Number(localStorage.getItem('autofrenzy'),0);
  FrozenCookies.initial_clicks = 0;
  FrozenCookies.lastHCAmount = Number(localStorage.getItem('lastHCAmount'));
  FrozenCookies.lastHCTime = Number(localStorage.getItem('lastHCTime'));
  FrozenCookies.prevLastHCTime = Number(localStorage.getItem('prevLastHCTime'));
  FrozenCookies.maxHCPercent = Number(localStorage.getItem('maxHCPercent'));
  FrozenCookies.lastCPS = Game.cookiesPs;
  FrozenCookies.recalculateCaches = true;
  FrozenCookies.disabledPopups = true;
  FrozenCookies.processing = false;
  
  FrozenCookies.cookieBot = 0;
  FrozenCookies.autoclickBot = 0;
  
  Game.prefs.autobuy = FrozenCookies.autoBuy;
  Game.prefs.autogc = FrozenCookies.autoGC;
  Game.RebuildStore();
  Game.RebuildUpgrades();
  Game.sayTime = function(time,detail) {return timeDisplay(time/Game.fps);}
  Game.oldReset = Game.Reset;
}

function preferenceParse(setting, defaultVal) {
  var value = localStorage.getItem(setting);
  if (typeof(value) == 'undefined' || value == null || isNaN(Number(value))) {
    value = defaultVal;
    localStorage.setItem(setting, value);
  }
  return Number(value);
}

// var full_history = [];  // This may be a super leaky thing

function Beautify (value) {
  var notationValue = '';
  var negative = false;
  if (value < 0) {
    negative = true;
    value *= -1;
  }
  if (FrozenCookies.numberDisplay) {
    var notationList = [['', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion', ' sextillion', ' septillion'],
                        ['', ' M', ' B', ' T', ' Qa', ' Qi', ' Sx', ' Sp'],
                        ['', ' M', ' G', ' T', ' P', ' E', ' Z', ' Y'],
                        ['', '*10⁶', '*10⁹', '*10¹²', '*10¹⁵', '*10¹⁸', '*10²¹', '*10²⁴']
                        ];
    var notation = notationList[FrozenCookies.numberDisplay-1];
    var base = 0;
    if (value >= 1000000 && Number.isFinite(value)) {
      value /= 1000;
      while(value >= 1000){
        value /= 1000;
        base++;
      }
      if (base > notation.length) {
        value = Math.POSITIVE_INFINITY;
      } else {
        notationValue = notation[base];
      }
    }
    value = Math.round(value * 1000) / 1000.0;
  }
  if (!Number.isFinite(value)) {
    return 'Infinity';
  } else {
    var output = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + notationValue;
    return negative ? '-' + output : output;
  }
}

function timeDisplay(seconds) {
  if (seconds === '---' || seconds === 0) { return 'Done!'; }
  seconds = Math.floor(seconds);
  var days, hours, minutes;
  days = Math.floor(seconds / (24 * 60 * 60));
  days = (days > 0) ? Beautify(days) + 'd ' : '';
  seconds %= (24 * 60 * 60);
  hours = Math.floor(seconds / (60 * 60));
  hours = (hours > 0) ? Beautify(hours) + 'h ' : '';
  seconds %= (60 * 60);
  minutes = Math.floor(seconds / 60);
  minutes = (minutes > 0) ? minutes + 'm ' : '';
  seconds %= 60;
  seconds = (seconds > 0) ? seconds + 's' : '';
  return (days + hours + minutes + seconds).trim();
}

function fcReset(bypass) {
  Game.oldReset();
  FrozenCookies.nonFrenzyTime = 0;
  FrozenCookies.frenzyTime = 0;
  FrozenCookies.last_gc_state = (Game.frenzy > 0);
  FrozenCookies.last_gc_time = Date.now();
  FrozenCookies.lastHCAmount = Game.prestige['Heavenly chips'];
  FrozenCookies.lastHCTime = Date.now();
  FrozenCookies.maxHCPercent = 0;
  FrozenCookies.prevLastHCTime = Date.now();
  FrozenCookies.lastCps = 0;
  FrozenCookies.recalculateCaches = true;
  updateLocalStorage();
}

function updateLocalStorage() {
  localStorage.numberdisplay = FrozenCookies.numberDisplay;
  localStorage.autobuy = FrozenCookies.autoBuy;
  localStorage.autogc = FrozenCookies.autoGc;
  localStorage.simulategc = FrozenCookies.simulatedGCPercent;
  localStorage.nonFrenzyTime = FrozenCookies.non_gc_time;
  localStorage.frenzyTime = FrozenCookies.gc_time;
  localStorage.lastHCAmount = FrozenCookies.lastHCAmount;
  localStorage.maxHCPercent = FrozenCookies.maxHCPercent;
  localStorage.lastHCTime = FrozenCookies.lastHCTime;
  localStorage.prevLastHCTime = FrozenCookies.prevLastHCTime;
}

function divCps(value, cps) {
  var result = 0;
  if (value) {
    if (cps) {
      result = value / cps;
    } else {
      result = Number.POSITIVE_INFINITY;
    }
  }
  return result;
}

function nextHC(tg) {
  var futureHC = Math.ceil(Math.sqrt((Game.cookiesEarned + Game.cookiesReset)/0.5e12+0.25)-0.5);
  var nextHC = futureHC*(futureHC+1)*0.5e12;
  var toGo = nextHC - (Game.cookiesEarned + Game.cookiesReset);
  return tg ? toGo : timeDisplay(divCps(toGo, Game.cookiesPs));
}

function copyToClipboard (text) {
  window.prompt ("Copy to clipboard: Ctrl+C, Enter", text);
}
 
function getBuildingSpread () {
  return Game.ObjectsById.map(function(a){return a.amount;}).join('/')
}

// Press 'b' to pop up a copyable window with building spread. 
document.addEventListener('keydown', function(event) {
  if(event.keyCode == 66) {
    copyToClipboard(getBuildingSpread());
  }
});

// Press 'a' to toggle autobuy.
document.addEventListener('keydown', function(event) {
  if(event.keyCode == 65) {
    Game.Toggle('autobuy','autobuyButton','Autobuy OFF','Autobuy ON');
    toggleFrozen('autobuy');
  }
});

// Press 'c' to toggle auto-GC
document.addEventListener('keydown', function(event) {
  if(event.keyCode == 67) {
    Game.Toggle('autogc','autogcButton','Autoclick GC OFF','Autoclick GC ON');
    toggleFrozen('autogc');
  }
});

function writeFCButton(setting) {
  var current = FrozenCookies[setting];
}

function toggleFrozen(setting) {
  if (!Number(localStorage.getItem(setting))) {
    localStorage.setItem(setting,1);
    FrozenCookies[setting] = 1;
//    Game.prefs[setting] = 1;
  } else {
    localStorage.setItem(setting,0);
    FrozenCookies[setting] = 0;
//    Game.prefs[setting] = 0;
  }
  FCStart();
}

function baseCps() {
  var frenzy_mod = (Game.frenzy > 0) ? Game.frenzyPower : 1;
  return Game.cookiesPs / frenzy_mod;
}

function weightedCookieValue(useCurrent) {
  var cps = baseCps();
  var lucky_mod = Game.Has('Get lucky');
  var base_wrath = lucky_mod ? 401.835 * cps : 396.51 * cps;
//  base_wrath += 192125500000;
  var base_golden = lucky_mod ? 2804.76 * cps : 814.38 * cps;
  if (Game.cookiesEarned >= 100000) {
    var remainingProbability = 1;
    var startingValue = '6666';
    var rollingEstimate = 0;
    for (var i = 5; i < Math.min(Math.floor(Game.cookies).toString().length,12); i++) {
      startingValue += '6';
      rollingEstimate += 0.1 * remainingProbability * startingValue;
      remainingProbability -= remainingProbability * 0.1;
    }
    rollingEstimate += remainingProbability * startingValue;
//    base_golden += 10655700000;
    base_golden += rollingEstimate * 0.0033;
    base_wrath += rollingEstimate * 0.0595;
  }
  if (useCurrent && Game.cookies < maxLuckyValue() * 10) {
    if (lucky_mod) {
      base_golden -= ((1200 * cps) - Math.min(1200 * cps, Game.cookies * 0.1)) * 0.49 * 0.5 + (maxLuckyValue() - (Game.cookies * 0.1)) * 0.49 * 0.5;
    } else {
      base_golden -= (maxLuckyValue() - (Game.cookies * 0.1)) * 0.49;
      base_wrath  -= (maxLuckyValue() - (Game.cookies * 0.1)) * 0.29;
    }
  }
  return Game.elderWrath / 3.0 * base_wrath + (3 - Game.elderWrath) / 3.0 * base_golden;
}

function maxLuckyValue() {
  var gcMod = Game.Has('Get lucky') ? 8400 : 1200;
  return baseCps() * gcMod;
}

function maxCookieTime() {
  var baseCookieTime = Game.fps * 60 * 15;
  if (Game.Has('Lucky day')) baseCookieTime/=2;
  if (Game.Has('Serendipity')) baseCookieTime/=2;
  if (Game.Has('Gold hoard')) baseCookieTime=0.01;
  return baseCookieTime;
}

function gcPs(gcValue) {
  var averageGCTime = maxCookieTime() * 19 / 900
  gcValue /= averageGCTime;
  gcValue *= FrozenCookies.simulatedGCPercent;
  return gcValue;
}

function gcEfficiency() {
  if (gcPs(weightedCookieValue()) <= 0) {
    return Number.MAX_VALUE;
  }
  var cost = Math.max(0,(maxLuckyValue() * 10 - Game.cookies));
  var deltaCps = gcPs(weightedCookieValue() - weightedCookieValue(true));
  return divCps(cost, deltaCps);
}

function delayAmount() {
  if (nextChainedPurchase().efficiency > gcEfficiency() || Game.goldenCookie.delay < Game.frenzy) {
    return maxLuckyValue() * 10;
  } else if (weightedCookieValue() > weightedCookieValue(true)) {
    return Math.min(maxLuckyValue() * 10, Math.max(0,(nextChainedPurchase().efficiency - (gcEfficiency() * baseCps())) / gcEfficiency()));
  } else {
   return 0;
  }
}

function recommendationList() {
  return upgradeStats().concat(buildingStats()).sort(function(a,b){return (a.efficiency - b.efficiency)});
}

//var cachedNextPurchase = null;
function nextPurchase() {
//  if (recalculateCaches) {
    var recList = recommendationList();
    var purchase = recList[0];
    if (purchase.type == 'upgrade' && unfinishedUpgradePrereqs(Game.UpgradesById[purchase.id])) {
      var prereqList = unfinishedUpgradePrereqs(Game.UpgradesById[purchase.id]);
      purchase = recList.filter(function(a){return prereqList.some(function(b){return b.id == a.id && b.type == a.type})})[0];
    }
//    cachedNextPurchase = purchase;
//  }
//  return cachedNextPurchase;
  return purchase;
}

function nextChainedPurchase() {
  return recommendationList()[0];
}

//var cachedBuildings = null;
function buildingStats() {
//  if (recalculateCaches) {
//    cachedBuildings = Game.ObjectsById.map(function (current, index) {
  return Game.ObjectsById.map(function (current, index) {
    var baseCpsOrig = baseCps();
    var cpsOrig = baseCpsOrig + gcPs(weightedCookieValue(true));
    var existing_achievements = Game.AchievementsById.map(function(item,i){return item.won});
    buildingToggle(current);
    var baseCpsNew = baseCps();
    var cpsNew = baseCpsNew + gcPs(weightedCookieValue(true));
    buildingToggle(current, existing_achievements);
    var deltaCps = cpsNew - cpsOrig;
    var baseDeltaCps = baseCpsNew - baseCpsOrig;
    var efficiency = efficiencyWeight * divCps(current.price, cpsOrig) + divCps(current.price, deltaCps);
    return {'id' : current.id, 'efficiency' : efficiency, 'base_delta_cps' : baseDeltaCps, 'delta_cps' : deltaCps, 'cost' : current.price, 'type' : 'building'};
  });
//  }
//  return cachedBuildings;
}

//var cachedUpgrades = null;
function upgradeStats() {
//  if (recalculateCaches) {
//    cachedUpgrades = Game.UpgradesById.map(function (current) {
  return Game.UpgradesById.map(function (current) {
    if (!current.bought) {
      var needed = unfinishedUpgradePrereqs(current);
      if (!current.unlocked && !needed) {
        return null;
      }
      var baseCpsOrig = baseCps();
      var cpsOrig = baseCpsOrig + gcPs(weightedCookieValue(true));
      var existing_achievements = Game.AchievementsById.map(function(item,i){return item.won});
      var existing_wrath = Game.elderWrath;
      var reverseFunctions = upgradeToggle(current);
      var baseCpsNew = baseCps();
      var cpsNew = baseCpsNew + gcPs(weightedCookieValue(true));
      upgradeToggle(current, existing_achievements, reverseFunctions);
      Game.elderWrath = existing_wrath;
      var deltaCps = cpsNew - cpsOrig;
      var baseDeltaCps = baseCpsNew - baseCpsOrig;
      var cost = upgradePrereqCost(current);
      var efficiency = efficiencyWeight * divCps(cost, cpsOrig) + divCps(cost, deltaCps);
      if (deltaCps < 0) {
        efficiency = Number.POSITIVE_INFINITY;
      }
      return {'id' : current.id, 'efficiency' : efficiency, 'base_delta_cps' : baseDeltaCps, 'delta_cps' : deltaCps, 'cost' : cost, 'type' : 'upgrade'};
    }
  }).filter(function(a){return a;});
//  }
//  return cachedUpgrades;
}

function upgradePrereqCost(upgrade) {
  var cost = upgrade.basePrice;
  if (upgrade.unlocked) {
    return cost;
  }
  var prereqs = upgradeJson.filter(function(a){return a.id == upgrade.id;});
  if (prereqs.length) {
    prereqs = prereqs[0];
    cost += prereqs.buildings.reduce(function(sum,item,index) {
      var building = Game.ObjectsById[index];
      if (item && building.amount < item) {
        for (var i = building.amount; i < item; i++) {
          sum += building.basePrice * Math.pow(Game.priceIncrease, i);
        }
      }
      return sum;
    },0);
    cost += prereqs.upgrades.reduce(function(sum,item) {
      var reqUpgrade = Game.UpgradesById[item];
      if (!upgrade.bought) {
        sum += upgradePrereqCost(reqUpgrade);
      }
      return sum;
    }, 0);
  }
  return cost;
}

function unfinishedUpgradePrereqs(upgrade) {
  if (upgrade.unlocked) {
    return null;
  }
  var needed = [];
  var prereqs = upgradeJson.filter(function(a){return a.id == upgrade.id;});
  if (prereqs.length) {
    prereqs = prereqs[0];
    prereqs.buildings.forEach(function(a, b) {
      if (a && Game.ObjectsById[b].amount < a) {
        needed.push({'type' : 'building', 'id' : b});
      }
    });
    prereqs.upgrades.forEach(function(a) {
      if (!Game.UpgradesById[a].bought) {
        var recursiveUpgrade = Game.UpgradesById[a];
        var recursivePrereqs = unfinishedUpgradePrereqs(recursiveUpgrade);
        if (recursiveUpgrade.unlocked) {
          needed.push({'type' : 'upgrade', 'id' : a});
        } else if (!recursivePrereqs) {
          // Research is being done.
        } else {
          recursivePrereqs.forEach(function(a) {
            if (!needed.some(function(b){return b.id == a.id && b.type == a.type;})) {
              needed.push(a);
            }
          });
        }
      }
    });
  }
  return needed.length ? needed : null;
}

function upgradeToggle(upgrade, achievements, reverseFunctions) {
  if (!achievements) {
    upgrade.bought = 1;
    Game.UpgradesOwned += 1;
    reverseFunctions = buyFunctionToggle(upgrade);
  } else {
    upgrade.bought = 0;
    Game.UpgradesOwned -= 1;
    buyFunctionToggle(reverseFunctions);
    Game.AchievementsOwned = 0;
    achievements.forEach(function(won, index){
      var achievement = Game.AchievementsById[index];
      achievement.won = won;
      if (won && achievement.hide < 3) {
        Game.AchievementsOwned += 1;
      }
    });
  }
  Game.recalculateGains = 1;
  Game.CalculateGains();
  return reverseFunctions;
}

function buildingToggle(building, achievements) {
  if (!achievements) {
    building.amount += 1;
    building.bought += 1;
    Game.BuildingsOwned += 1;
  } else {
    building.amount -= 1;
    building.bought -= 1;
    Game.BuildingsOwned -= 1;
    Game.AchievementsOwned = 0;
    achievements.forEach(function(won, index){
      var achievement = Game.AchievementsById[index];
      achievement.won = won;
      if (won && achievement.hide < 3) {
        Game.AchievementsOwned += 1;
      }
    });
  }
  Game.recalculateGains = 1;
  Game.CalculateGains();
}

function buyFunctionToggle(upgrade) {
  if (upgrade && !upgrade.length) {
    if (!upgrade.buyFunction) {
      return null;
    }
    var ignoreFunctions = [
      /Game\.Lock\('.*'\)/,
      /Game\.Unlock\('.*'\)/,
      /Game\.Objects\['.*'\]\.drawFunction\(\)/,
      /Game\.SetResearch\('.*'\)/,
      /Game\.Upgrades\['.*'\]\.basePrice=.*/
    ];
    var buyFunctions = upgrade.buyFunction.toString()
      .replace(/\n/g, '')
      .replace(/function\s*\(\)\s*{(.+)\s*}/, "$1")
      .split(';')
      .map(function(a){return a.trim().replace(/\+\+/,'+=1').replace(/\-\-/,'-=1');})
      .filter(function(a){
        ignoreFunctions.forEach(function(b){a = a.replace(b,'')});
        return a != '';
      });
    
    if (buyFunctions.length == 0) {
      return null;
    }
    
    var reversedFunctions = buyFunctions.map(function(a){
      var reversed = '';
      var achievementMatch = /Game\.Win\('(.*)'\)/.exec(a);
      if (a.split('+=').length > 1) {
        reversed = a.split('+=').join('-=');
      } else if (a.split('-=').length > 1) {
        reversed = a.split('-=').join('+=');
      } else if (achievementMatch && Game.Achievements[achievementMatch[1]].won == 0) {
        reversed = 'Game.Achievements[\'' + achievementMatch[1] + '\'].won=0';
      } else if (a.split('=').length > 1) {
        reversed = a.split('=')[0] + '=' + eval(a.split('=')[0]);
      }
      return reversed;
    });
    buyFunctions.forEach(function(f) {eval(f);});
    return reversedFunctions;
  } else if (upgrade && upgrade.length) {
    upgrade.forEach(function(f) {eval(f);});
  }
  return null;
}

Game.Win = function (what) {
  if (typeof what==='string') {
    if (Game.Achievements[what]) {
      if (Game.Achievements[what].won==0) {
        Game.Achievements[what].won=1;
        if (!disabledPopups) {
          Game.Popup('Achievement unlocked :<br>'+Game.Achievements[what].name+'<br> ');
        }
        if (Game.Achievements[what].hide!=3) {
          Game.AchievementsOwned++;
        }
        Game.recalculateGains=1;
      }
    }
  } else {
    for (var i in what) {Game.Win(what[i]);}
  }
}

function shouldClickGC() {
//  return Game.goldenCookie.life > 0 && gc_click_percent > 0 && Game.missedGoldenClicks + Game.goldenClicks >= 0 && ((Game.goldenClicks / (Game.missedGoldenClicks + Game.goldenClicks) <= gc_click_percent) || (Game.missedGoldenClicks + Game.goldenClicks == 0));
  return Game.goldenCookie.life > 0 && FrozenCookies.autoGC;
}

function autoclickFrenzy() {
  if (Game.clickFrenzy > 0 && !autoclickBot) {
    FrozenCookies.autoclickBot = setInterval(function(){Game.ClickCookie();},FrozenCookies.clickFrenzySpeed);
  } else if (Game.clickFrenzy == 0 && FrozenCookies.autoclickBot) {
    clearInterval(FrozenCookies.autoclickBot);
    FrozenCookies.autoclickBot = 0;
  }
}

function autoCookie() {
  if (!FrozenCookies.processing) {
    FrozenCookies.processing = true;
    if (Game.cookieClicks < FrozenCookies.initial_clicks) {
      for (var i=0; i<FrozenCookies.initial_clicks; i++) {
        Game.ClickCookie();
      }
    }
//     Handle possible lag issues? Only recalculate when CPS changes.
//    if (lastCPS != Game.cookiesPs) {
//      recalculateCaches = true;
//    }
    if (FrozenCookies.lastHCAmount < Game.HowMuchPrestige(Game.cookiesEarned + Game.cookiesReset)) {
      FrozenCookies.lastHCAmount = Game.HowMuchPrestige(Game.cookiesEarned + Game.cookiesReset);
      FrozenCookies.prevLastHCTime = FrozenCookies.lastHCTime;
      FrozenCookies.lastHCTime = Date.now();
      updateLocalStorage();
    }
    var recommendation = nextPurchase();
    var store = (recommendation.type == 'building') ? Game.ObjectsById : Game.UpgradesById;
    var purchase = store[recommendation.id];
    if (FrozenCookies.autoBuy && Game.cookies >= delayAmount() + recommendation.cost) {
      recommendation.time = Date.now() - Game.startDate;
//      full_history.push(recommendation);  // Probably leaky, maybe laggy?
      purchase.clickFunction = null;
      disabledPopups = false;
//      console.log(purchase.name + ': ' + Beautify(recommendation.efficiency) + ',' + Beautify(recommendation.delta_cps));
      purchase.buy();
      disabledPopups = true;
      autoCookie();
    }
    if (shouldClickGC()) {
      Game.goldenCookie.click();
      Game.goldenCookie.life = 0;
//      full_history.push({'type' : 'golden_cookie', 'time' : Date.now() - initial_load_time});  // Probably leaky, maybe laggy?
    }
    if ((Game.frenzy > 0) != FrozenCookies.last_gc_state) {
      if (FrozenCookies.last_gc_state) {
        FrozenCookies.gc_time += Date.now() - FrozenCookies.last_gc_time;
      } else {
        FrozenCookies.non_gc_time += Date.now() - FrozenCookies.last_gc_time;
      }
      updateLocalStorage();
      FrozenCookies.last_gc_state = (Game.frenzy > 0);
      FrozenCookies.last_gc_time = Date.now();
    }
    FrozenCookies.processing = false;
  }
}

function FCStart() {
  //  To allow polling frequency to change, clear intervals before setting new ones.
  
  if (FrozenCookies.cookieBot) {
    clearInterval(FrozenCookies.cookieBot);
    FrozenCookies.cookieBot = 0;
  }
  if (FrozenCookies.autoclickBot) {
    clearInterval(FrozenCookies.autoclickBot);
    FrozenCookies.autoclickBot = 0;
  }
  
  // Now create new intervals with their specified frequencies.
  
  if (FrozenCookies.frequency) {
    FrozenCookies.cookieBot = setInterval(function() {autoCookie();}, FrozenCookies.frequency);
  }
  
  if (FrozenCookies.cookieClickSpeed) {
    FrozenCookies.autoclickBot = setInterval(function() {Game.ClickCookie();}, FrozenCookies.cookieClickSpeed);
  } else if (FrozenCookies.clickFrenzySpeed > 0) {
    FrozenCookies.autoclickBot = setInterval(function() {autoclickFrenzy();}, FrozenCookies.frequency);
  }
  
  FCMenu();
}
