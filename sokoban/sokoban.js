let sokoban;
let sprites = {};

const levels = [
    // Level 0 - Baby level (单箱子)
    '############|#          #|#          #|#    $     #|#          #|#     @    #|#          #|#    .     #|#          #|#          #|############|',
    
    // Level 1 - Twin boxes (双箱子)
    '############|#          #|#          #|#          #|#    $$    #|#     @    #|#    ..    #|#          #|#          #|#          #|############|',
    '############|#          #|#     $    #|#  $   #.  #|#      #   #|#   @  #   #|#      #   #|#      #.  #|#          #|#          #|############|',
    '############|#     #     #|#     #     #|#  $  #  .  #|#     #     #|#   @       #|#     #     #|#     #  .  #|#  $  #     #|#     #     #|############|',
    
];

function preload() {
  // Load all sprite images
  sprites.box = loadImage('images/box.png');
  sprites.boxDocked = loadImage('images/box_docked.png');
  sprites.dock = loadImage('images/dock.png');
  sprites.floor = loadImage('images/floor.png');
  sprites.wall = loadImage('images/wall.png');
  sprites.worker = loadImage('images/worker.png');
  sprites.workerDock = loadImage('images/worker_dock.png');
}

function setup() { 
  createCanvas(500, 500);
  sokoban = new Sokoban();
  sokoban.initLevel();
}

function draw() {
  setBackground();
  sokoban.update();
  sokoban.display();
}

function keyPressed() {
  sokoban.processKey(keyCode);
}

function setBackground() {
  push();
  colorMode(HSB);
  background(sokoban.currentLevel / levels.length * 360, 50, 100);
  colorMode(RGB);
  fill(0, 32);
  noStroke();
  rect(0, 0, width, height);
  pop();
}

function DisplayableList() {}
DisplayableList.prototype = new Array;
DisplayableList.prototype.update = function() {
  for (var i = 0; i < this.length; i++) {
    this[i].update();
  }
};
DisplayableList.prototype.display = function(self) {
  var l = this.length;
  for (var i = 0; i < l; i++) {
    this[i].display();
  }
};
DisplayableList.prototype.getItem = function(position) {
  for (var i = 0; i < this.length; i++) {
    var w = this[i];
    if (w.position.equals(position)) {
      return w;
    }
  }
  return null;
}

function Sokoban() {
  this.currentLevel = 0;
  this.moves = 0;
  this.pushes = 0;
  this.tileSize = (width - 1) / 10;
  this.floors = new DisplayableList();
  this.walls = new Walls();
  this.goals = new DisplayableList();
  this.boxes = new DisplayableList();
  this.player = new Player();
  this.levelOffset = createVector(0, 0);
  this.scale = 1;
  this.UP = createVector(0, -1);
  this.LEFT = createVector(-1, 0);
  this.DOWN = createVector(0, 1);
  this.RIGHT = createVector(1, 0);
  this.undo = [];
}

Sokoban.prototype.loadTileMap = {
  '#': function(x, y) {
    sokoban.walls.push(new Wall(x, y));
  },
  '@': function(x, y) {
    sokoban.player.position.x = x;
    sokoban.player.position.y = y;
  },
  '+': function(x, y) {
    sokoban.player.position.x = x;
    sokoban.player.position.y = y;
    sokoban.goals.push(new Goal(x, y));
  },
  '$': function(x, y) {
    sokoban.boxes.push(new Box(x, y));
  },
  '*': function(x, y) {
    sokoban.boxes.push(new Box(x, y));
    sokoban.goals.push(new Goal(x, y));
  },
  '.': function(x, y) {
    sokoban.goals.push(new Goal(x, y));
  },
  '-': function(x, y) {},
  ' ': function(x, y) {}
}

Sokoban.prototype.loadTile = function(tile, x, y) {
  this.loadTileMap[tile](x, y);
}

Sokoban.prototype.fillFloors = function(position) {
  var directions = [this.RIGHT, this.DOWN, this.LEFT, this.UP];
  var floor = this.floors.getItem(position);
  var wall = this.walls.getItem(position);

  if (floor || wall) {
    return;
  } else {
    // Create floor
    this.floors.push(new Floor(position.x, position.y));

    for (var i = 0; i < directions.length; i++) {
      var d = directions[i];
      var p = position.copy().add(d);
      this.fillFloors(p);
    }
  }
}

Sokoban.prototype.loadLevelFromRLE = function() {
  var rle = levels[this.currentLevel];
  var x = 0;
  var y = 0;
  var i = 0;
  
  while (i < rle.length) {
    var c = rle[i++];
    if (c === '|') {
      x = 0;
      y++;
    } else {
      this.loadTile(c, x, y);
      x += 1;
    }
  }
}

Sokoban.prototype.initLevel = function() {
  this.floors = new DisplayableList();
  this.walls = new Walls();
  this.goals = new DisplayableList();
  this.boxes = new DisplayableList();
  this.player = new Player();
  this.undo = [];
  this.moves = 0;
  this.pushes = 0;
  this.loadLevelFromRLE();
  this.fillFloors(this.player.position);
  this.updateViewport();
}

Sokoban.prototype.updateViewport = function() {
  var borderSize = 1;
  var b = this.walls.getBoundaries();
  var m = max(b[1].x, b[1].y);
  this.levelOffset.set(borderSize / 2 + (m - b[1].x) / 2, borderSize / 2 + (m - b[1].y) / 2);
  this.scale = (width - 1) / (m + 1 + borderSize);
}

Sokoban.prototype.update = function() {
  this.floors.update();
  this.walls.update();
  this.goals.update();
  this.boxes.update();
  this.player.update();
}

Sokoban.prototype.display = function() {
  push();
  scale(this.scale);
  translate(this.levelOffset.x, this.levelOffset.y);
  this.floors.display();
  this.goals.display();
  this.boxes.display();
  this.player.display();
  this.walls.display();
  pop();
  this.displayStatusBar();
}

Sokoban.prototype.displayStatusBar = function() {
  push();
  fill(0, 128);
  noStroke();
  rect(0, 0, width, 20);
  textSize(12);
  textFont('Futura, Avenir, Helvetica, Arial, Sans-Serif');
  textAlign(LEFT, CENTER);
  fill(255);
  text("Level " + this.currentLevel, 20, 10);
  text("Moves " + this.moves, 120, 10);
  text("Pushes " + this.pushes, 240, 10);
  pop();
}

Sokoban.prototype.movePlayer = function(direction) {
  var v1 = direction.copy().add(this.player.position);
  var didMove = false;
  var move = {};
  if (!this.walls.getItem(v1)) {
    var box = this.boxes.getItem(v1);
    if (!box) {
      didMove = true;
    } else {
      var v2 = v1.copy().add(direction);
      if (!this.walls.getItem(v2) && !this.boxes.getItem(v2)) {
        didMove = true;
        box.position.add(direction);
        move.box = box;
        this.pushes++;
      }
    }
  }

  if (didMove) {
    move.direction = direction.copy();
    this.undo.push(move);
    this.player.position = v1;
    this.moves++;
    if (this.didWin()) {
      this.nextLevel();
    }
  }
}

Sokoban.prototype.processKey = function(k) {
  var s = String.fromCharCode(k).toLowerCase();
  // Handle player moves
  if (s === "w" || k === UP_ARROW) {
    this.movePlayer(this.UP);
  } else if (s === "a" || k === LEFT_ARROW) {
    this.movePlayer(this.LEFT);
  } else if (s === "s" || k === DOWN_ARROW) {
    this.movePlayer(this.DOWN);
  } else if (s === "d" || k === RIGHT_ARROW) {
    this.movePlayer(this.RIGHT);
  }
  // Handle undo
  else if (s === "u") {
    this.undoMove();
  }
  // Handle changing levels
  else if (s === "n") {
    this.nextLevel();
  } else if (s === "p") {
    this.previousLevel();
  } else if (s === "r") {
    this.resetLevel();
  }
}

Sokoban.prototype.undoMove = function() {
  if (this.undo.length) {
    var move = this.undo.pop();
    move.direction.mult(-1);
    this.player.position.add(move.direction);
    if (move.box) {
      move.box.position.add(move.direction);
      this.pushes--;
    }
    this.moves--;
  }
}

Sokoban.prototype.nextLevel = function() {
  this.currentLevel += this.currentLevel < levels.length - 1 ? 1 : 0;
  this.initLevel();
}

Sokoban.prototype.previousLevel = function() {
  this.currentLevel -= this.currentLevel > 0 ? 1 : 0;
  this.initLevel();
}

Sokoban.prototype.resetLevel = function() {
  this.initLevel();
}

Sokoban.prototype.didWin = function() {
  for (var i = 0; i < this.goals.length; i++) {
    var goal = this.goals[i];
    if (!this.boxes.getItem(goal.position)) {
      return false;
    }
  }
  return true;
}

function Walls() {}
Walls.prototype = new DisplayableList;
Walls.prototype.getBoundaries = function() {
  var left = this[0].position.x,
    top = this[0].position.y,
    right = this[0].position.x,
    bottom = this[0].position.y;

  for (var i = 1; i < this.length; i++) {
    var w = this[i];
    if (w.position.x < left) {
      left = w.position.x;
    }
    if (w.position.x > right) {
      right = w.position.x;
    }
    if (w.position.y < top) {
      top = w.position.y;
    }
    if (w.position.y > bottom) {
      bottom = w.position.y;
    }
  }
  return [createVector(left, top), createVector(right, bottom)];
}

function Wall(x, y) {
  this.position = createVector(x, y);
}
Wall.prototype.update = function() {}
Wall.prototype.display = function() {
  push();
  translate(this.position.x, this.position.y);
  image(sprites.wall, 0, 0, 1, 1);
  pop();
}

function Goal(x, y) {
  this.position = createVector(x, y);
}
Goal.prototype.update = function() {}
Goal.prototype.display = function() {
  push();
  translate(this.position.x, this.position.y);
  image(sprites.dock, 0, 0, 1, 1);
  pop();
}

function Box(x, y) {
  this.position = createVector(x, y);
}
Box.prototype.update = function() {}
Box.prototype.display = function() {
  push();
  translate(this.position.x, this.position.y);
  // Check if box is on a goal
  let isOnGoal = false;
  for (let i = 0; i < sokoban.goals.length; i++) {
    if (sokoban.goals[i].position.equals(this.position)) {
      isOnGoal = true;
      break;
    }
  }
  image(isOnGoal ? sprites.boxDocked : sprites.box, 0, 0, 1, 1);
  pop();
}

function Player(x, y) {
  this.position = createVector(x, y);
}
Player.prototype.update = function() {}
Player.prototype.display = function() {
  push();
  translate(this.position.x, this.position.y);
  // Check if player is on a goal
  let isOnGoal = false;
  for (let i = 0; i < sokoban.goals.length; i++) {
    if (sokoban.goals[i].position.equals(this.position)) {
      isOnGoal = true;
      break;
    }
  }
  image(isOnGoal ? sprites.workerDock : sprites.worker, 0, 0, 1, 1);
  pop();
}

function Floor(x, y) {
  this.position = createVector(x, y);
}
Floor.prototype.update = function() {}
Floor.prototype.display = function() {
  push();
  translate(this.position.x, this.position.y);
  image(sprites.floor, 0, 0, 1, 1);
  pop();
}