class Gamestate {
  constructor() {
    this.pop=0,
    this.resources={},
    this.numResources=0,
    this.buildings={},
    this.unlockedBuildings=[],
    this.researches={},
    this.unlockedResearch=[],
    this.researchPoints=0,
    this.workers={
      lumberjack:0,
      miner:0,
      scientist:0
    }
  }
}
var gamestate=new Gamestate();
var allBuildings={
  hut:{
    ings:{
      wood:15
    },
    attributes:{
      maxPop:2
    }
  },
  house:{
    ings:{
      wood:30,
      metal:5
    },
    attributes:{
      maxPop:4
    }
  },
  lab:{
    ings:{
      wood:30,
      metal:15
    },
    attributes:{
      maxResearchPoints:100
    }
  },
  storehouse:{
    ings:{
      wood:60
    },
    attributes: {
      maxResources:100
    }
  },
  "trading post":{
    ings:{
      wood:100,
      metal:50
    }
  },
  farm:{
    ings:{
      wood:30,
      metal:15
    },
    attributes:{
      maxFarmers:2
    }
  }
};
var allWorkers={
  lumberjack:"wood",
  miner:"metal",
  scientist:"researchPoints",
  farmer:"food"
};
var workerRate=0.1;
var allResearches={
  "Faster workers":{
    maxLevel:6,
    cost:100,
    effects:{
      workerRate:0.2
    }
  },
  "Better Yield": {
    maxLevel:5,
    cost:120,
    effects:{
      yield:3
    }
  }
};
var multiplier=1.17;
var tradingRates={
  wood:1,
  food:5,
  metal:10
};
var shelters=[];
var startingStorage=100;
var startingYield=3;
function initializeShelterArray() {
  for (var name in allBuildings) {
    var building=allBuildings[name];
    var attrbs=building.attributes;
    if (attrbs) {
      var maxpop=attrbs.maxPop;
      if (maxpop) {
        shelters.push(name);
      }
    }
  }
}
function buildingAttribute(name,attrname) {
  var attr=allBuildings[name].attributes[attrname];
  if (attr==undefined) {
    attr=0;
  }
  return attr;
}
function numOfBuilding(name) {
  var count=gamestate.buildings[name]
  if (count==undefined) {
    count=0;
  }
  return count;
}
function researchLevel(name) {
  var level=gamestate.researches[name]
  if (level==undefined) {
    level=0;
  }
  return level;
}
function researchEffect(name,attrname) {
  var effect=allResearches[name].effects[attrname];
  if (effect==undefined) {
    effect=0;
  }
  return effect;
}
function tenthRound(number) {
  return Math.round(number*10)/10;
}
function maxResources() {
  var numStorehouses=numOfBuilding("storehouse");
  var storehouseResources=buildingAttribute("storehouse","maxResources");
  var extraStorage=numStorehouses*storehouseResources;
  return startingStorage+extraStorage;
}
function maxResearchPoints() {
  var numLabs=numOfBuilding("lab");
  var labRpoints=buildingAttribute("lab","maxResearchPoints");
  return numLabs*labRpoints;
}
function maxPop() {
  var maxpop=0;
  for (var i in shelters) {
    var shelter=shelters[i];
    if (numOfBuilding(shelter)>0) {
      maxpop+=numOfBuilding(shelter)*buildingAttribute(shelter,"maxPop");
    }
  }
  return maxpop;
}
function maxFarmers() {
  return numOfBuilding("farm")*buildingAttribute("farm","maxFarmers");
}
function farmYield() {
  var extraYield=researchLevel("Better Yield")*researchEffect("Better Yield","yield");
  return extraYield+startingYield;
}
function updateShown() {
  var hasResources=Object.keys(gamestate.resources).length>0;
  var hasLab=Object.keys(gamestate.buildings).includes("lab");
  var hasTpost=Object.keys(gamestate.buildings).includes("trading post");
  var hasShelter=false;
  var hasFarm=numOfBuilding("farm")>0;
  for (var i in shelters) {
    var shelter=shelters[i];
    if (Object.keys(gamestate.buildings).includes(shelter)) {
      hasShelter=true;
      break;
    }
  }
  $(".shelterRequired").toggle(hasShelter);
  $("#linkPopulation").toggle(hasShelter);
  $(".resourcesRequired").toggle(hasResources);
  $("#linkBuildings").toggle(hasResources);
  $("#linkResearch").toggle(hasLab);
  $(".researchRequired").toggle(hasLab);
  $("#linkTrading").toggle(hasTpost);
  $(".farmRequired").toggle(hasFarm);
}
function incResource(name,amount=1) {
  if (name=="researchPoints") {
    if (gamestate.researchPoints>maxResearchPoints()) {
      return;
    }
    gamestate.researchPoints+=amount;
    if (gamestate.researchPoints>maxResearchPoints()) {
      gamestate.researchPoints-=amount;
      return;
    }
    gamestate.researchPoints=tenthRound(gamestate.researchPoints);
    updateResearchPointInfo();
    updateResearchButtons();
  } else {
    if (gamestate.numResources>=maxResources()) {
      return;
    }
    if (gamestate.resources[name]) {
      gamestate.resources[name]+=amount;
    } else {
      gamestate.resources[name]=amount;
    }
    gamestate.numResources+=amount;
    if (gamestate.numResources>maxResources()) {
      decResource(name,amount);
      return;
    }
    gamestate.resources[name]=tenthRound(gamestate.resources[name]);
    gamestate.numResources=tenthRound(gamestate.numResources);
    updateResourceInfo();
    updateCraftButtons();
    updateTradingButtons();
  }
  updateShown();
}
function decResource(name,amount=1) {
  if (gamestate.resources[name]<amount) {
    return;
  }
  gamestate.numResources-=amount;
  gamestate.resources[name]-=amount;
  gamestate.resources[name]=tenthRound(gamestate.resources[name]);
  gamestate.numResources=tenthRound(gamestate.numResources);
  updateResourceInfo();
  updateCraftButtons();
  updateTradingButtons();
}
function incBuilding(name) {
  if (gamestate.buildings[name]) {
    gamestate.buildings[name]+=1;
  } else {
    gamestate.buildings[name]=1;
  }
  if (shelters.includes(name)) {
    updatePopulationInfo();
    updateWorkerInfo();
  }
  updateShown();
  updateBuildingInfo();
}
function buildingCost(name) {
  var newIngs={};
  var ings=allBuildings[name].ings;
  var buildingAmount=gamestate.buildings[name];
  if (buildingAmount==undefined) {
    buildingAmount=0;
  }
  for (var ing in ings) {
    var ingAmount=ings[ing];
    ingAmount=Math.floor(ingAmount*(multiplier**buildingAmount));
    newIngs[ing]=ingAmount;
  }
  return newIngs;
}
function craft(name) {
  var ings=buildingCost(name);
  var enough=true;
  for (var ing in ings) {
    if (!(gamestate.resources[ing]>=ings[ing])) {
      enough=false;
      break;
    }
  }
  if (enough) {
    for (var ing in ings) {
      var amount=ings[ing];
      decResource(ing,amount);
    }
    updateResourceInfo();
    incBuilding(name);
    updateCraftButtons();
  }
}
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase()+str.slice(1);
}
function updateResourceInfo() {
  $("#resources").html("");
  for (var name in gamestate.resources) {
    var capName=capitalizeFirst(name);
    $("#resources").append("<p>"+capName+": "+gamestate.resources[name]+"</p>");
  }
    $("#maxResources").text("Resources: ("+gamestate.numResources+"/"+maxResources()+")");
}
function updateBuildingInfo() {
  $("#buildings").html("");
  for (var name in gamestate.buildings) {
    var capName=capitalizeFirst(name);
    $("#buildings").append("<p>"+capName+": "+gamestate.buildings[name]+"</p>");
  }
}
function updateCraftButtons() {
  $("#craftButtons").html("");
  for (var name in allBuildings) {
    if (name=="trading post" && gamestate.buildings["trading post"]>0) {
      continue;
    }
    var ings=buildingCost(name);
    var show=true;
    var disabled=false;
    if (!gamestate.unlockedBuildings.includes(name)) {
      for (var ing in ings) {
        if (!(gamestate.resources[ing]>=(ings[ing]/2))) {
          show=false;
          break;
        }
        if (!(gamestate.resources[ing]>=ings[ing])) {
          disabled=true;
        }
      }
    } else {
      for (var ing in ings) {
        if (!(gamestate.resources[ing]>=ings[ing])) {
          disabled=true;
        }
      }
    }
    if (show) {
      if (!gamestate.unlockedBuildings.includes(name)) {
        gamestate.unlockedBuildings.push(name);
      }
      var btext=name+" (";
      var i=0;
      var ingsize=Object.keys(ings).length;
      for (var ing in ings) {
        if (i==(ingsize-1)) {
          btext+=ings[ing]+" "+ing+")";
        } else {
          btext+=ings[ing]+" "+ing+", "
        }
        i++;
      }
      if (disabled) {
        $("#craftButtons").append("<button disabled onclick=\"craft('"+name+"')\">Craft a "+btext+"</button><br>");
      } else {
        $("#craftButtons").append("<button onclick=\"craft('"+name+"')\">Craft a "+btext+"</button><br>");
      }
    }
  }
}
function updatePopulation() {
  if(gamestate.pop>0) {
    updateWorkerInfo();
  }
  if (gamestate.pop<maxPop()) {
    gamestate.pop+=1;
    updateWorkerInfo();
  }
  updatePopulationInfo();
}
function updatePopulationInfo() {
  $("#pop").text("Population: "+gamestate.pop+"/"+maxPop());
}
function updateWorkerInfo() {
  var working=0;
  var disableFarmer=false;
  for (var worker in allWorkers) {
    var workerAmount=gamestate.workers[worker];
    if (!workerAmount) {
      workerAmount=0;
    }
    working+=workerAmount;
    if (worker=="farmer") {
      disableFarmer=workerAmount==maxFarmers();
    }
    worker=capitalizeFirst(worker);
    $("#fire"+worker).attr("disabled",workerAmount==0);
    $("#num"+worker+"s").text(worker+"s: "+workerAmount);
  }
  $("#workPop").text("Working: "+working+"/"+gamestate.pop);
  $(".hire").attr("disabled",working==gamestate.pop);
  $("#hireFarmer").attr("disabled",disableFarmer);
}
function updateTradingButtons() {
  $("#tabTrading").html("");
  for (var name in tradingRates) {
    var rate=tradingRates[name];
    $("#tabTrading").append("<p>"+capitalizeFirst(name)+": "+rate+" gold"+"</p>");
    $("#tabTrading").append("<button id=sell1 onclick=\"sell('"+name+"')\">Sell 1</button>&nbsp");
    $("#tabTrading").append("<button id=buy1 onclick=\"buy('"+name+"')\">Buy 1</button><br>");
    $("#tabTrading").append("<button id=sell10 onclick=\"sell('"+name+"',10)\">Sell 10</button>&nbsp");
    $("#tabTrading").append("<button id=buy10 onclick=\"buy('"+name+"',10)\">Buy 10</button>");
    $("#tabTrading #sell1").prop("disabled",!canSell(name)).removeAttr("id");
    $("#tabTrading #buy1").prop("disabled",gamestate.resources["gold"]<tradingRates[name]).removeAttr("id");
    $("#tabTrading #sell10").prop("disabled",!canSell(name,10)).removeAttr("id");
    $("#tabTrading #buy10").prop("disabled",gamestate.resources["gold"]<tradingRates[name]*10).removeAttr("id");
  }
}
function updateResearchPointInfo() {
  $("#researchPoints").text("Research points: "+gamestate.researchPoints+"/"+maxResearchPoints());
}
function updateResearchButtons() {
  $("#researchButtons").html("");
  for (var name in allResearches) {
    var research=allResearches[name];
    var cost=research.cost;
    var maxLevel=research.maxLevel;
    var show=true;
    var disabled=false;
    if (!gamestate.unlockedResearch.includes(name)) {
        if (gamestate.researchPoints<cost/2) {
          show=false;
        } else if (gamestate.researchPoints<cost) {
          disabled=true;
        }
    } else {
      if (gamestate.researches[name]==maxLevel) {
        show=false
      } else if (gamestate.researchPoints<cost) {
        disabled=true;
      }
    }
    if (show) {
      if (!gamestate.unlockedResearch.includes(name)) {
        gamestate.unlockedResearch.push(name);
      }
      if (disabled) {
        $("#researchButtons").append("<button disabled onclick=\"research('"+name+"')\">"+name+" ("+cost+" points)</button><br>");
      } else {
        $("#researchButtons").append("<button onclick=\"research('"+name+"')\">"+name+" ("+cost+" points)</button><br>");
      }
    }
  }
}
function updateResearchInfo() {
  $("#researches").html("");
  for (var name in gamestate.researches) {
    $("#researches").append("<p>"+name+": Level "+gamestate.researches[name]+"</p>");
  }
}
function applyResearches() {
  for (var research in gamestate.researches) {
    var effects=allResearches[research].effects;
    var level=gamestate.researches[research];
    for (var effect in effects) {
      if (effect=="workerRate") {
        workerRate=0.5;
        workerRate+=effects[effect]*level;
      }
    }
  }
}
function research(name) {
  gamestate.researchPoints-=allResearches[name].cost;
  if (gamestate.researches[name]) {
    gamestate.researches[name]+=1;
  } else {
    gamestate.researches[name]=1;
  }
  updateResearchButtons();
  updateResearchInfo();
  applyResearches();
}
function hire(type) {
  if (gamestate.workers[type]) {
      gamestate.workers[type]+=1;
  } else {
    gamestate.workers[type]=1;
  }
  updateWorkerInfo();
}
function fire(type) {
  if (gamestate.workers[type]) {
      gamestate.workers[type]-=1;
  } else {
    throw new Error("Cannot fire a never hired employee");
  }
  updateWorkerInfo();
}
function autoInc() {
  for (var worker in allWorkers) {
    workerAmount=gamestate.workers[worker];
    var amount=workerRate*workerAmount;
    var amountFood=gamestate.resources.food
    if (amountFood>amount*0.75 && amount>0) {
      if (worker=="scientist") {
        var usedMetal=Math.ceil(workerAmount*0.4);
        if (gamestate.resources["metal"]>=usedMetal) {
          incResource(allWorkers[worker],amount);
          decResource("metal",usedMetal);
        }
      } else if (worker=="farmer") {
        incResource(allWorkers[worker],amount*farmYield());
      } else {
        incResource(allWorkers[worker],amount);
      }
      decResource("food",amount*0.75);
    }
  }
}
function save() {
  localStorage.setItem("game",JSON.stringify(gamestate));
}
function load() {
  gamestate=JSON.parse(localStorage.getItem("game"));
  if (gamestate==null) {
    return false;
  }
  return true;
}
function reset() {
  localStorage.removeItem("game");
  if (load()!=false) {
    alert("Unable to reset game");
    return;
  }
  oldstate=gamestate;
  gamestate=new Gamestate();
  save();
  if (!load()) {
    alert("Unable to reset game");
    gamestate=oldstate;
    save();
  }
  init();
}
function init() {
  if (!load()) {
    var gamestate=new Gamestate();
  }
  setTab("main");
  updateShown();
  updateResourceInfo();
  updateBuildingInfo();
  updatePopulationInfo();
  updateWorkerInfo();
  updateCraftButtons();
  updateResearchPointInfo();
  updateResearchButtons();
  updateResearchInfo();
  applyResearches();
  updateTradingButtons();
}
function setTab(tab) {
  tab=capitalizeFirst(tab);
  if ($("#link"+tab).is(":visible")) {
    $("[id^='tab']").hide();
    $("[id^='link']").removeClass("active");
    $("#tab"+tab).show();
    $("#link"+tab).addClass("active");
  }
}
function canSell(name,amount=1) {
  var goldGotten=tradingRates[name]*amount;
  var spacesNeeded=goldGotten-amount;
  return maxResources()-gamestate.numResources>=spacesNeeded;
}
function buy(name,amount=1) {
  decResource("gold",tradingRates[name]*amount);
  incResource(name,amount);
}
function sell(name,amount=1) {
  decResource(name,amount);
  incResource("gold",tradingRates[name]*amount);
}
$(document).ready(function() {
  initializeShelterArray();
  init();
  $(window).on("unload",function(e){
    save();
  });
  window.setInterval(function() {
    updatePopulation();
  }, 10000);
  window.setInterval(function() {
    autoInc();
  }, 2000);
});
