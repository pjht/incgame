var maxPop=0;
var pop=0;
var working=0;
var resources={};
var maxResources=50;
var numResources=0;
var buildings={};
var unlockedBuildings=[];
var has_shelter=false;
var research_enabled=false;
var researches={};
var unlockedResearch=[];
var research_points=0;
var max_research_points=0;
var workers={
  lumberjack:0,
  miner:0,
  scientist:0
};
var all_buildings={
  hut:{
    ings:{
      wood:15
    },
    build_effects:{
      maxPop:2
    }
  },
  house:{
    ings:{
      wood:30,
      metal:5
    },
    build_effects:{
      maxPop:4
    }
  },
  lab:{
    ings:{
      wood:30,
      metal:15
    },
    build_effects:{
      research_enabled:true,
      max_research_points:150
    }
  },
  storehouse:{
    ings:{
      wood:40
    },
    build_effects: {
      max_resources:50
    }
  }
};
var worker_resource={
  lumberjack:"wood",
  miner:"metal",
  scientist:"research_points"
};
var worker_rate=0.5;
var all_researches={
  "Faster Workers":{
    maxLevel:3,
    cost:100,
    effects:{
      worker_rate:0.5
    }
  }
};
var multiplier=1.17;
function updateShown() {
  var has_resources=Object.keys(resources).length>0;
  $(".shelter_required").toggle(has_shelter);
  $("#link_population").toggle(has_shelter);
  $(".resources_required").toggle(has_resources);
  $("#link_buildings").toggle(has_resources);
  $("#link_research").toggle(research_enabled);
  $(".research_required").toggle(research_enabled);
}
function incResource(name,amount=1) {
  if (name=="research_points") {
    if (research_points>max_research_points) {
      return;
    }
    research_points+=amount;
    if (research_points>max_research_points) {
      research_points-=amount;
      return;
    }
    updateResearchPointInfo();
    updateResearchButtons();
  } else {
    if (numResources>maxResources) {
      return;
    }
    if (resources[name]) {
      resources[name]+=amount;
    } else {
      resources[name]=amount;
    }
    numResources+=amount;
    if (numResources>maxResources) {
      decResource(name,amount);
      return;
    }
    updateResourceInfo();

    updateCraftButtons();
  }
  updateShown();
}
function decResource(name,amount) {
  if (resources[name]<amount) {
    return;
  }
  numResources-=amount;
  resources[name]-=amount;
  updateResourceInfo();

  updateCraftButtons();
}
function incBuilding(name) {
  if (buildings[name]) {
    buildings[name]+=1;
  } else {
    buildings[name]=1;
  }
  var effects=all_buildings[name]["build_effects"];
  for (effect in effects) {
    if (effect=="maxPop") {
      maxPop+=effects[effect];
      has_shelter=true;
      updatePopulationInfo();
      updateWorkerInfo();
    }
    if (effect=="research_enabled") {
      research_enabled=effects[effect];
    }
    if (effect=="max_resources") {
      maxResources+=effects[effect];

    }
    if (effect=="max_research_points") {
      max_research_points+=effects[effect];
    }
  }
  updateShown();
  updateBuildingInfo();
}
function buildingCost(name) {
  var newIngs={};
  var ings=all_buildings[name].ings;
  var building_amount=buildings[name];
  if (building_amount==undefined) {
    building_amount=0;
  }
  for (var ing in ings) {
    var ing_amount=ings[ing];
    ing_amount=Math.floor(ing_amount*(multiplier**building_amount));
    newIngs[ing]=ing_amount;
  }
  return newIngs;
}
function craft(name) {
  var ings=buildingCost(name);
  var enough=true;
  for (var ing in ings) {
    if (!(resources[ing]>=ings[ing])) {
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
    updateCraftButtons();
    incBuilding(name);
  }
}
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase()+str.slice(1);
}
function updateResourceInfo() {
  $("#resources").html("");
  for (var name in resources) {
    var capName=capitalizeFirst(name);
    $("#resources").append("<p>"+capName+": "+resources[name]+"</p>");
  }
    $("#max_resources").text("Resources: ("+numResources+"/"+maxResources+")");
}
function updateBuildingInfo() {
  $("#buildings").html("");
  for (var name in buildings) {
    var capName=capitalizeFirst(name);
    $("#buildings").append("<p>"+capName+": "+buildings[name]+"</p>");
  }
}
function updateCraftButtons() {
  $("#craft_buttons").html("");
  for (var name in all_buildings) {
    var ings=buildingCost(name);
    var show=true;
    var disabled=false;
    if (!unlockedBuildings.includes(name)) {
      for (var ing in ings) {
        if (!(resources[ing]>=(ings[ing]/2))) {
          show=false;
          break;
        }
        if (!(resources[ing]>=ings[ing])) {
          disabled=true;
        }
      }
    } else {
      for (var ing in ings) {
        if (!(resources[ing]>=ings[ing])) {
          disabled=true;
        }
      }
    }
    if (show) {
      if (!unlockedBuildings.includes(name)) {
        unlockedBuildings.push(name);
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
        $("#craft_buttons").append("<button disabled onclick=craft(\""+name+"\")>Craft a "+btext+"</button><br>");
      } else {
        $("#craft_buttons").append("<button onclick=craft(\""+name+"\")>Craft a "+btext+"</button><br>");
      }
    }
  }
}
function updatePopulation() {
  if(pop>0) {
    updateWorkerInfo();
  }
  if (pop<maxPop) {
    pop+=1;
    updateWorkerInfo();
  }
  updatePopulationInfo();
}
function updatePopulationInfo() {
  $("#pop").text("Population: "+pop+"/"+maxPop);
}
function updateWorkerInfo() {
  $("#work_pop").text("Working: "+working+"/"+pop);
  $(".hire").attr("disabled",working==pop);
  for (var worker in workers) {
    $("#fire_"+worker).attr("disabled",workers[worker]==0);
    $("#num_"+worker+"s").text(capitalizeFirst(worker)+"s: "+workers[worker]);
  }
}
function research(name) {
  research_points-=all_researches[name].cost;
  if (researches[name]) {
    researches[name]+=1;
  } else {
    researches[name]=1;
  }
  updateResearchButtons();
  updateResearchInfo();
  applyResearches();
}
function updateResearchPointInfo() {
  $("#research_points").text("Research points: "+research_points+"/"+max_research_points);
}
function updateResearchButtons() {
  $("#research_buttons").html("");
  for (var name in all_researches) {
    var research=all_researches[name];
    var cost=research.cost;
    var maxLevel=research.maxLevel;
    var show=true;
    var disabled=false;
    if (!unlockedResearch.includes(name)) {
        if (research_points<cost/2) {
          show=false;
        } else if (research_points<cost) {
          disabled=true;
        }
    } else {
      if (researches[name]==maxLevel) {
        show=false
      } else if (research_points<cost) {
        disabled=true;
      }
    }
    if (show) {
      if (!unlockedResearch.includes(name)) {
        unlockedResearch.push(name);
      }
      if (disabled) {
        $("#research_buttons").append("<button disabled onclick=\"research('"+name+"')\">"+name+" ("+cost+" points)</button><br>");
      } else {
        $("#research_buttons").append("<button onclick=\"research('"+name+"')\">"+name+" ("+cost+" points)</button><br>");
      }
    }
  }
}
function hire(type) {
  workers[type]+=1;
  working+=1;
  updateWorkerInfo();
}
function fire(type) {
  workers[type]-=1;
  working-=1;
  updateWorkerInfo();
}
function autoInc() {
  for (var worker in workers) {
    worker_amount=workers[worker];
    amount=worker_rate*worker_amount;
    if (amount>0) {
      if (worker=="scientist") {
        var usedMetal=Math.ceil(worker_amount*0.4);
        if (resources["metal"]>=usedMetal) {
          incResource(worker_resource[worker],amount);
          decResource("metal",usedMetal);
        }
      } else {
        incResource(worker_resource[worker],amount);
      }
    }
  }
}
function save() {
  gamestate={
    maxPop:maxPop,
    pop:pop,
    working:working,
    workers:workers,
    resources:resources,
    maxResources:maxResources,
    numResources:numResources,
    buildings:buildings,
    unlockedBuildings:unlockedBuildings,
    has_shelter:has_shelter,
    research_enabled:research_enabled,
    researches:researches,
    unlockedResearch:unlockedResearch,
    research_points:research_points,
    max_research_points:max_research_points
  }
  localStorage.setItem("game",JSON.stringify(gamestate));
}
function load() {
  var gamestate=JSON.parse(localStorage.getItem("game"));
  if (gamestate==null) {
    return false;
  }
  maxPop=gamestate.maxPop;
  pop=gamestate.pop;
  working=gamestate.working;
  workers=gamestate.workers;
  resources=gamestate.resources;
  maxResources=gamestate.maxResources;
  numResources=gamestate.numResources;
  buildings=gamestate.buildings;
  unlockedBuildings=gamestate.unlockedBuildings;
  has_shelter=gamestate.has_shelter;
  research_enabled=gamestate.research_enabled;
  researches=gamestate.researches;
  unlockedResearch=gamestate.unlockedResearch;
  research_points=gamestate.research_points;
  max_research_points=gamestate.max_research_points;
  return true;
}

function reset() {
  localStorage.removeItem("game");
  if (load()!=false) {
    alert("Unable to reset game");
  }
  init();
}
function init() {
  if (!load()) {
    maxPop=0;
    maxResources=50;
    pop=0;
    working=0;
    resources={};
    buildings={};
    unlockedBuildings=[];
    has_shelter=false;
    research_enabled=false;
    researches={};
    unlockedResearch=[];
    research_points=0;
    workers={
      lumberjack:0,
      miner:0,
      scientist:0
    };
  }
  set_tab("main");
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
}
function set_tab(tab) {
  if ($("#link_"+tab).is(":visible")) {
    $("[id^='tab_']").hide();
    $("[id^='link_']").removeClass("active");
    $("#tab_"+tab).show();
    $("#link_"+tab).addClass("active");
  }
}
function applyResearches() {
  for (var research in researches) {
    var effects=all_researches[research].effects;
    var level=researches[research];
    for (var effect in effects) {
      if (effect=="worker_rate") {
        worker_rate=0.5;
        worker_rate+=effects[effect]*level;
      }
    }
  }
}
function updateResearchInfo() {
  $("#researches").html("");
  for (var name in researches) {
    $("#researches").append("<p>"+name+": Level "+researches[name]+"</p>");
  }
}
$(document).ready(function() {
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
