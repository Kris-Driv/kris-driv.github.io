let testingDir;

class Snake {
  constructor(gridX = 1, gridY = 1, speed, color) {
    this.grow = 2;
    this.body = [createVector(gridX * scl, gridY * scl)];
    this.speed = speed;
    this.direction(1, 0);
    this.color = color || "#0984e3";

    this.crashed = false;
    this.simulating = false;
  }

  update() {
    if (frameCount % this.speed === 1 && !this.crashed) {
      snakeMoves();

      // We apply movements
      let d = moveSequence.shift();
      if (d) this.direction(d.x, d.y);

      let head = this.head.copy();
      head.add(this.xDir * scl, this.yDir * scl);

      // wrap around
      head.x = head.x % width;
      head.y = head.y % height;
      if (head.x < 0) head.x = width - scl;
      if (head.y < 0) head.y = height - scl;

      this.body.push(head);

      // We moved, lets check for collision with itself
      let b;
      for (var i = this.body.length - 2; i > 0; i--) {
        b = this.body[i];
      }

      if (this.grow <= 0) this.body.shift();
      else this.grow--;

      let collided = this.findCollidedEntity(this.head);

      if (collided) {
        // If this vector we collided is food
        let i = food.indexOf(collided);
        if (i >= 0) {
          foodEaten(collided);

          this.grow += 1;
          food.splice(i, 1);
        } else {
          // If not, probably we hit ourselves or wall
          this.crash();
        }
      }

      snakeMoved();
    }
  }

  crash() {
    this.crashed = true;

    snakeCrashed(this);
  }

  findCollidedEntity(point) {
    // Check body collision
    for (let i = this.body.length - 2; i >= 0; i--) {
      if (this.body[i].x === point.x && this.body[i].y === point.y) {
        return this.body[i];
      }
    }
    // Check food collision
    for (let i = 0; i < food.length; i++) {
      if (food[i].x === point.x && food[i].y === point.y) {
        return food[i];
      }
    }
  }

  isBody(point) {
    point.x = point.x % width;
    point.y = point.y % height;
    if (point.x < 0) point.x = width - scl;
    if (point.y < 0) point.y = height - scl;

    for (var i = 0; i < this.body.length; i++) {
      if (this.body[i].x === point.x && this.body[i].y === point.y) {
        return true;
      }
    }
    return false;
  }

  get score() {
    return this.body.length - 3;
  }

  get head() {
    return this.body[this.body.length - 1];
  }

  get bodyCopy() {
    return copyVectorList(this.body);
  }

  direction(x, y) {
    // Going in opposite direction
    if (this.xDir + x === 0 && this.yDir + y === 0) return;
    this.xDir = x;
    this.yDir = y;
  }

  safeDirections() {
    let safe = [];
    DIRECTIONS.forEach(d => {
      if (!this.isBody(this.head.copy().add([d[0] * scl, d[1] * scl]))) {
        if (snake.xDir + d[0] !== 0 && snake.yDir + d[1] !== 0) {
          safe.push(d);
        }
      }
    });
    return safe;
  }

  randomSafeDirection() {
    let dirs = this.safeDirections();
    if (dirs.length >= 0) {
      return dirs[Math.floor(Math.random() * dirs.length)];
    }
    return null;
  }

  safestDirection(depth) {
    let dirs = snake.safeDirections();
    if (dirs.length < 1) return null;

    if (snake.simulating) {
      //console.log("Prevented recursion");
      return null;
    } // already in action

    let save = snake;
    let body = save.bodyCopy;
    let foodSave = copyVectorList(food);
    snake = Object.assign(Object.create(Object.getPrototypeOf(save)), save);

    snake.simulating = true;
    snake.color = "#02f0a9";

    let safest = [];
    for (let i = 0; i < dirs.length; i++) {
      // Debug
      testingDir = dirs[i];
      
      moveSequence = [{
        x: dirs[i][0],
        y: dirs[i][1] * -1
      }];

      let z = 0;
      do {
        snake.update();
        snake.render();

        z++;
      } while (!snake.crashed && z < depth);
      snake.crashed = false;

      if(SnakeController.debug) {
        push();
        fill(color(random(255), random(255), random(255)));
        rect(snake.head.x, snake.head.y, scl, scl);
        fill(255);
        text(directionString(dirs[i]), snake.head.x + 5, snake.head.y + 5);
        //paused = true;
        pop();
      }
      
      safest[i] = z;
    }

    let d = dirs[safest.indexOf(Math.max(...safest))];

    // Restore
    snake = save;
    snake.body = body;
    food = foodSave;
    lastRedirect = d;
    lastTurns = dirs;
    turnProbabilities = safest;

    // Return safest direction
    return d;
  }

  render() {
    noStroke();
    fill(this.color);
    this.body.forEach(b => {
      rect(b.x, b.y, scl, scl);
    })

    fill(this.color);
    rect(this.head.x, this.head.y, scl, scl);
  }

  get target() {
    let pick = this.head.copy();
    let direction = createVector(this.xDir, this.yDir);
    let collided = null;
    // Oooohhh... dangerous :)
    while (true) {
      pick.add(direction);

      collided = this.findCollidedEntityAt(pick);
    }
  }

}