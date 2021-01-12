var DIRECTIONS = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0]
  ];
  
  var lastRedirect = [0, 0];
  var lastTurns = [];
  var turnProbabilities = [0, 0];
  
  var snake;
  var scl = 10;
  
  var food = [];
  var foodLimit = 25;
  
  var running = true;
  
  var moveSequence = [];
  
  var paused = false;

  var snakeColor;
  var bgColor;
  
  var keyMap = {
    38: {
      x: 0,
      y: -1
    },
    40: {
      x: 0,
      y: 1
    },
    39: {
      x: 1,
      y: 0
    },
    37: {
      x: -1,
      y: 0
    }
  }
  
  
  
  function setup() {
    var canvas = createCanvas(1200, 800);

    // frameRate(1);
    bgColor = color("#303952");
    bgColor.setAlpha(50);
    snakeColor = color("#26de81");

    snake = new Snake(1, 1, 2, snakeColor);
  
    addFood();
  }
  
  function snakeCrashed(s) {
    if (!s.simulating) {
      gameOver();
    }
  }
  
  // Before movement
  function snakeMoves() {
    if (SnakeController.active) {
      SnakeController.ai();
    }
  }
  
  // After movement
  function snakeMoved() {
    if (SnakeController.path.length <= 0 || !SnakeController.target) {
      SnakeController.findTarget();
    }
  }
  
  function foodEaten(f) {
    if (SnakeController.target === f) {
      SnakeController.target = null;
    }
  
    do {
      addFood();
    } while (food.length < foodLimit);
  }
  
  function draw() {
    if(!paused) background(bgColor);

    noStroke();
    fill("#34495e");
    ellipse(width / 2, 0, width * 1.1, height / 1.8);
  
    snake.render();
    if (running && !paused) {
  
      snake.update();
  
      // render score
    //   textAlign(CENTER);
    //   textSize(16);
    //   text("Score: " + snake.score, width / 2, 20);
  
      fill(snakeColor);
      food.forEach(f => {
        rect(f.x, f.y, scl, scl);
      });
    } else if(!running) {
        restart();
    //   noStroke();
    //   fill(255);
    //   textSize(32);
    //   textAlign(CENTER);
    //   text("Game Over!", width / 2, height / 2);
    //   textSize(26);
    //   text("Score: " + snake.score, width / 2, height / 2 + 60);
    //   textSize(16);
    //   textAlign(LEFT);
    //   text("Press spacebar to try again", 5, height - 5);
    }
  
    if (SnakeController.debug) {
      SnakeController.drawDebug();
    }
  }
  
  function gameOver() {
    running = false;
  }
  
  function addFood() {
    let f = new p5.Vector(
      floor(random(floor(width / scl))),
      floor(random(floor(width / scl)))
    );
    food.push(f.mult(scl));
  }
  
  function isOppositeDirection(dirA, dirB) {
    if (dirA.x + dirB.x === 0 && dirA.y + dirB.y === 0) {
      return true;
    }
    return false;
  }
  
  function getDirectionFromKeyPress(code) {
    return keyMap[code];
  }
  
  function getDirectionFromPath(path) {
    let d = {
      x: (path.x - snake.head.x) / scl,
      y: (path.y - snake.head.y) / scl
    };
    if (d.x > 1) d.x = 1;
    if (d.x < -1) d.x = -1;
    if (d.y > 1) d.y = 1;
    if (d.y < -1) d.y = -1;
    if (d.x && d.y || !d.x && !d.y) {
      return {
        x: snake.xDir,
        y: snake.yDir
      }
    }
    return d;
  }

  function restart() {
    food = [];
    setup();
    running = true;
    paused = false;
  }
  
  function keyPressed() {
    if (key === " ") {
      if(!running) {
          restart();
      } else {
        paused = !paused;
      }
    }
    // For Controller
    if (key === "d") {
      SnakeController.debug = !SnakeController.debug;
    }
    if (key === "s") {
      SnakeController.active = !SnakeController.active;
    }
  
    let dir = getDirectionFromKeyPress(keyCode);
    if (dir) {
      if (moveSequence.length > 0) {
        var last = moveSequence[moveSequence.length - 1];
        if (last.x === dir.x && last.y === dir.y) return;
      }
      moveSequence.push(dir);
    }

    return false;
  }
  
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  function directionString(dir) {
    let x = dir.x || dir[0];
    let y = dir.y || dir[1];
    if (x > 0) return "right";
    if (x < 0) return "left";
    if (y > 0) return "down";
    if (y < 0) return "up";
  }
  
  function copyVectorList(list) {
    let ret = [];
    list.forEach((b, i) => {
      ret[i] = b.copy();
    })
    return ret;
  }