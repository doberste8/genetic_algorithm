var initialPopSize = 5; //initial population size
var popSize = 5; //population size
var se = .25; //search space area expansion for mating
var mutChance = .25; //chance of mutation
var s = .3; //max mutation step size as percent of gene domain
var elitism = .07; //top percent of previous gen to keep
var threshold = -Infinity;
var maxGens = 0;
var currentGen = 0;
var record = [];
var k;
var j;
var h;
var iterations = 0;
var d = 1000;

var Gene = function(min, max) {
  this.min = min;
  this.max = max;
  this.value = this.min + Math.random() * (this.max - this.min);
};

var Ind = function() {
  this.fitness = "";
  this.genome = [];
  this.genome.push(new Gene(10, 600)); //k
  this.genome.push(new Gene(0, 1.25)); //j
  this.genome.push(new Gene(0, 1.5)); //h
  this.genome.push(new Gene(0, 20)); //i
};

Ind.prototype.mate = function(ind) {
  var child = new Ind();
  var a, i;
  var length = this.genome.length;
  for (i = 0; i < length; i++) {
    a = -se + Math.random() * (1 + se * 2);
    child.genome[i].value = Math.max(Math.min(a * this.genome[i].value + (1 - a) * ind.genome[i].value, this.genome[i].max), this.genome[i].min);
  }
  return child;
};

Ind.prototype.mutate = function() {
  var length = this.genome.length;
  var r, i;
  for (i = 0; i < length; i++) {
    if (Math.random() < mutChance) {
      r = Math.random();
      this.genome[i].value = Math.max(Math.min(this.genome[i].value + s * (this.genome[i].max - this.genome[i].min) / 2.9444 * Math.log(r / (1 - r)), this.genome[i].max), this.genome[i].min);
    }
  }
};

Ind.prototype.evaluate = function(arr) {
  k = this.genome[0].value;
  j = this.genome[1].value;
  h = this.genome[2].value;
  iterations = this.genome[3].value;
  this.fitness = ratings(arr);
};

var Pop = function(size) {
  this.members = [];
  while (size--) {
    var ind = new Ind();
    this.members.push(ind);
  }
};

Pop.prototype.select = function() {
  var i;
  var sumF = (Math.pow(this.members.length, 2) + this.members.length) / 2;
  var r = Math.random();
  var value = r * sumF;
  for (i = 0; i < this.members.length; i++) {
    value -= i;
    if (value <= 0) {
      return this.members[i];
    }
  }
  return this.members[i - 1];
};

Pop.prototype.sort = function() {
  this.members.sort(function(a, b) {
    return a.fitness < b.fitness ? 1 : -1;
  });
};

function averageFit(data) {
  var sum = data.reduce(function(sum, value) {
    return sum + value.fitness;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

function average(data) {
  var sum = data.reduce(function(sum, value) {
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

function out(t) {
  var avgFit = averageFit(t.members);
  var sqrDiffs = t.members.map(function(value) {
    var diff = value.fitness - avgFit;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });
  var stdDev = Math.sqrt(average(sqrDiffs));
  document.body.innerHTML = '';
  document.body.innerHTML += ("<h2>Generation: " + currentGen + "</h2>");
  document.body.innerHTML += ("<div>Average Fitness: " + avgFit.toFixed(8) + "</div>");
  document.body.innerHTML += ("<div>Standard Deviation: " + stdDev.toFixed(8) + "</div>");
  document.body.innerHTML += ("<ul>");
  for (var v = 0; v < t.members.length; v++) {
    var b = t.members.length - v - 1;
    document.body.innerHTML += ("<li>" + t.members[b].genome[0].value.toFixed(0) + ", " + t.members[b].genome[1].value.toFixed(2) + ", " + t.members[b].genome[2].value.toFixed(2) + ", " + t.members[b].genome[3].value.toFixed(0) + " (" + t.members[b].fitness.toFixed(8) + ")</li>");
  }
  document.body.innerHTML += ("</ul>");
}

function Test(arr, callback) {
  var t = new Pop(initialPopSize);
  var i;
  for (i = 0; i < t.members.length; i++) {
    t.members[i].evaluate(arr);
  }
  t.sort();
  record.push(t.members);
  var sim = setInterval(function() {
    if (t.members[t.members.length - 1].fitness > threshold && currentGen < maxGens) {
      var parentArr = [];
      var childArr = [];
      var child, p1, p2, i;
      for (i = 0; i < popSize; i++) {
        p1 = t.select();
        p2 = t.select();
        while (p1 == p2) p2 = t.select();
        child = p1.mate(p2);
        child.mutate();
        child.evaluate(arr);
        childArr.push(child);
      }
      /*for (i = 0; i < arr.length; i++) {
        arr[i].evaluate();
      }*/
      childArr.sort(function(a, b) {
        return a.fitness < b.fitness ? 1 : -1;
      });
      parentArr = t.members.slice();
      parentArr.splice(0, Math.ceil(parentArr.length * (1 - elitism)));
      childArr.splice(0, Math.floor(childArr.length * elitism));
      parentArr = parentArr.concat(childArr);
      t.members = parentArr.slice();
      record.push(parentArr.slice());
      t.sort();
      console.log(currentGen);
      console.log(t);
      callback(t);
      currentGen++;
    }
  }, 1);
}


// ID of the Google Spreadsheet
var spreadsheetID = "1ZrL6VIhgEoIka7DY7Pn-Miz-ME-uDvrvOjpjRFERus4";

// Make sure it is public and set to Anyone with link can view 
var url = "https://spreadsheets.google.com/feeds/list/" + spreadsheetID + "/od6/public/values?alt=json";


function getData(callback) {
  var arr = [];
  $.getJSON(url, function(data) {

    $.each(data.feed.entry, function(index, value) {

      arr.push([value.gsx$time.$t, value.gsx$hometeam.$t, value.gsx$awayteam.$t, parseInt(value.gsx$homescore.$t, 10), parseInt(value.gsx$awayscore.$t, 10)]);
    });
    callback(arr, out);
    // console.log(arr);
  });
}

/**
 * Performs a binary search on the provided sorted list and returns the index of the item if found. If it can't be found it'll return
 * the 2s complement of the proper index to insert the item.
 *
 * @param {*[]} list Items to search through.
 * @param {*} item The item to look for.
 * @return {Number} The index of the item if found, 2's complement of the proper index to insert the item if not.
 */
function binarySearch(list, item) {
  if (list.length == 0) {
    return -1;
  }

  var min = 0;
  var max = list.length - 1;
  var guess;

  while (min <= max) {
    guess = Math.floor((min + max) / 2);

    if (list[guess][0] === item) {
      return guess;
    } else {
      if (list[guess][0] < item) {
        min = guess + 1;
      } else {
        max = guess - 1;
      }
    }
  }

  return ~Math.max(min, max);
}



/**
 * Calculates the number of Elo points awarded for a game based on the ratings of both teams and the points scored.
 *
 * @param {Number} rA - The current rating of Team A.
 * @param {Number} rB - The current rating of Team B.
 * @param {Number} pA - Points scored by Team A.
 * @param {Number} pB - Points scored by Team B.
 * @param {Number} k - constant.
 * @param {Number} d - constant.
 * @param {Number} j - constant. If 0 or undefined calculation omits this piece.
 * @param {Number} h - constant. If undefined, h = 0 (and has no effect on calculation).
 * @return {Number} The number of rating points to award to Team A for the game being rated.
 */
function Elo(rA, rB, pA, pB, k, d, j, h) {
  if (h === undefined) h = 0;
  if (j === 0 || j === undefined) {
    return k * (pA / (pA + pB) - 1 / (1 + Math.pow(10, (rB - rA) / d)));
  } else {
    return (pA / (pA + pB) > .5) ? k * (((j / Math.pow(pA / (pA + pB), h)) * Math.log(pA / (pA + pB) + .5) + .5) - 1 / (1 + Math.pow(10, (rB - rA) / d))) :
      k * ((.5 - (j / Math.pow(1 - pA / (pA + pB), h)) * Math.log(-pA / (pA + pB) + 1.5)) - 1 / (1 + Math.pow(10, (rB - rA) / d)));
  }
}



function ratings(arr) {
  //set constants for calculation
  var leagueAvg = 0;
  /*var k = 200;
  var d = 1000;
  var j = .5;
  var h = 1.5;
  var iterations = 20;*/

  //get game data from sheet into array
  var teamRank = [];
  var teamTempRank = [];
  var gameR = [];
  var teamList = [];
  //  var length = arr.length;
  var i;
  var indexA;
  var indexB;
  var rA;
  var rB;
  var pA;
  var pB;
  var gameRating;

  if (iterations === 0) {
    //iterate through all games calculating game rating and and updating team ratings
    for (i = 0; i < arr.length; i++) {
      //find home team in array teamRank, if not found then add team to array with initial rating = leagueAvg
      indexA = binarySearch(teamRank, arr[i][1]);
      if (indexA < 0) {
        indexA = ~indexA;
        teamRank.splice(indexA, 0, [arr[i][1]]);
        teamRank[indexA].push(leagueAvg);
      }

      //find away team in array teamRank, if not found then add team to array with initial rating = leagueAvg
      indexB = binarySearch(teamRank, arr[i][2]);
      if (indexB < 0) {
        indexB = ~indexB;
        teamRank.splice(indexB, 0, [arr[i][2]]);
        teamRank[indexB].push(leagueAvg);
        if (indexB <= indexA) {
          ++indexA;
        }
      }

      //set values for Elo calculation
      rA = teamRank[indexA][teamRank[indexA].length - 1];
      rB = teamRank[indexB][teamRank[indexB].length - 1];
      pA = arr[i][3];
      pB = arr[i][4];

      if (pA != "") {
        gameRating = Elo(rA, rB, pA, pB, k, d, j, h); //calculate number of rating points awarded to home team for current game
        teamRank[indexA].push(rA + gameRating); //add updated rating to array for home team
        teamRank[indexB].push(rB - gameRating); //add updated rating to array for away team
      }

      //create array to put rating information back to gameData sheet
      gameR.push([rA]);
      gameR[i].push(rB);
    }

    //create teamList with latest rating of each team
    for (i = 0; i < teamRank.length; i++) {
      teamList.push([teamRank[i][0]]);
      teamList[i].push(teamRank[i][teamRank[i].length - 1]);
    }
  } else {
    var tempDate = new Date(arr[0][0]);

    var endDate = new Date(arr[arr.length - 1][0]);

    tempDate.setDate(tempDate.getDate() + (tempDate.getDay() === 0 ? 1 : 8 - tempDate.getDay())); //need to set time to 00:00
    endDate.setDate(endDate.getDate() + (endDate.getDay() === 0 ? 1 : 8 - endDate.getDay())); //need to set time to 00:00

    for (; tempDate <= endDate; tempDate.setDate(tempDate.getDate() + 7)) {

      for (var w = 0; w < teamRank.length; w++) {
        if (teamRank[w][teamRank[w].length - 1] != leagueAvg) teamRank[w].push(leagueAvg);
      }
      for (var q = 0; q < iterations; q++) {

        //iterate through all games calculating game rating and and updating team ratings
        for (i = 0; i < arr.length && new Date(arr[i][0]) < tempDate; i++) {
          //find home team in array teamRank, add team to array if not found with initial rating = leagueAvg
          indexA = binarySearch(teamRank, arr[i][1]);
          if (indexA < 0) {
            indexA = ~indexA;
            teamRank.splice(indexA, 0, [arr[i][1]]);
            teamTempRank.splice(indexA, 0, []);
            teamRank[indexA].push(leagueAvg);
          }

          //find away team in array teamRank, add team to array if not found with initial rating = leagueAvg
          indexB = binarySearch(teamRank, arr[i][2]);
          if (indexB < 0) {
            indexB = ~indexB;
            teamRank.splice(indexB, 0, [arr[i][2]]);
            teamTempRank.splice(indexB, 0, []);
            teamRank[indexB].push(leagueAvg);
            if (indexB <= indexA) {
              ++indexA;
            }
          }

          //set values for Elo calculation
          rA = teamRank[indexA][teamRank[indexA].length - 1];
          rB = teamRank[indexB][teamRank[indexB].length - 1];
          pA = arr[i][3];
          pB = arr[i][4];

          if (pA != "") {
            gameRating = Elo(rA, rB, pA, pB, k, d, j, h); //calculate number of rating points awarded to home team for current game
            teamTempRank[indexA].push(rA + gameRating); //add updated rating to array for home team
            teamTempRank[indexB].push(rB - gameRating); //add updated rating to array for away team
          }

          //create array to put rating information back to gameData sheet
          if (q === 0 && gameR.length <= i) {
            gameR.push(isNaN(teamRank[indexA][teamRank[indexA].length - 2]) ? [teamRank[indexA][teamRank[indexA].length - 1]] : [teamRank[indexA][teamRank[indexA].length - 2]]);
            gameR[i].push(isNaN(teamRank[indexB][teamRank[indexB].length - 2]) ? teamRank[indexB][teamRank[indexB].length - 1] : teamRank[indexB][teamRank[indexB].length - 2]);
          }
        }

        var tempLength = teamTempRank.length;
        for (var v = 0; v < tempLength; v++) {
          var length = teamTempRank[v].length;
          var sumRating = 0;
          for (var x = 0; x < length; x++) {
            sumRating += teamTempRank[v][x];
          }
          teamRank[v][teamRank[v].length - 1] = sumRating / length;
          teamTempRank[v] = [];
          //        Logger.log(teamRank[v]);
          //        Logger.log(gameR);
        }
      }
    }

    //create teamList with latest rating of each team
    for (i = 0; i < teamRank.length; i++) {
      teamList.push([teamRank[i][0]]);
      teamList[i].push(teamRank[i][teamRank[i].length - 1]);
    }
  }

  var err = [];
  for (i = 0; i < arr.length; i++) {
    rA = gameR[i][0];
    rB = gameR[i][1];
    pA = arr[i][3];
    pB = arr[i][4];
    if (rA != leagueAvg && rB != leagueAvg) {
      err.push(pA / (pA + pB) - 1 / (1 + Math.pow(10, (rB - rA) / d)));
    }
  }

  function standardDeviation(values) {
    var avg = average2(values);

    var squareDiffs = values.map(function(value) {
      var diff = value;
      var sqrDiff = diff * diff;
      return sqrDiff;
    });

    var avgSquareDiff = average2(squareDiffs);

    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
  }

  function average2(data) {
    var sum = data.reduce(function(sum, value) {
      return sum + value;
    }, 0);

    var avg = sum / data.length;
    return avg;
  }
  //console.log(standardDeviation(err));
  return standardDeviation(err);
}

getData(Test);