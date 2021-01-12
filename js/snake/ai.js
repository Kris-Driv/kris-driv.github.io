// Not Terrible, Not Good
var SnakeController = {

    pathFindingEnabled: true,
    
    active: true,
    
    debug: false,
  
    target: null,
  
    path: [],
    
    traced: NaN,
  
    ai: function() {
      // Simulate the next movement and perform safe turn
      this.safeRedirect();
      
      if (this.path.length > 0 && this.target && this.pathFindingEnabled) {
  
        // Follow the path
        let next = this.path.shift();
        let dir = getDirectionFromPath(next);
        // unless it will hit the body
        if(snake.isBody({
          x: snake.head.x + dir.x * scl,
          y: snake.head.y + dir.y * scl
        })) {
          this.target = null;
          this.safeRedirect();
        } else {
          moveSequence.push(dir);
          
          // Check if the path we're following is not intersecting
          // the snake's body
          this.validatePath();
        }
      }
    },
    
    // This will try to get out of the tricky situation as best as possible
    safeRedirect: function() {
      let next = snake.head.copy().add([snake.xDir * scl, snake.yDir * scl]);
      let next2 = snake.head.copy().add([snake.xDir * scl * 2, snake.yDir * scl * 2]);
      
      if(snake.isBody(next)) {
        moveSequence = [];
        this.path = [];
        
        let safeDir = snake.safestDirection(200);
        safeDir = safeDir || snake.randomSafeDirection();
        
        if(safeDir) {
          moveSequence = [{x: safeDir[0], y: safeDir[1]}];
          this.path = [];
        }
      } else if (snake.isBody(next2)) {
        // console.log("two ahead wall");
        
        let dirs = snake.safeDirections();
        let safe = false;
        for(let i = 0; i < dirs.length; i ++) {
          if(!snake.isBody(next2.copy().add([
            dirs[i][0] * scl, dirs[i][1] * scl
          ]))) {
            safe = true;
            // console.log("dead end");
            break;
          }
        }
        
        if(!safe) {
          moveSequence = [];
          this.path = [];
  
          let safeDir = snake.safestDirection(200);
          safeDir = safeDir || snake.randomSafeDirection();
  
          if(safeDir) {
            // console.log("moved to safe direction");
            moveSequence = [{x: safeDir[0], y: safeDir[1]}];
            this.target = null;
          }
        }
      }
    },
  
    drawDebug: function() {
      push();
      // Draw the target
      if (this.target) {
        stroke("yellow");
        noFill();
        strokeWeight(2);
        rect(this.target.x - 2, this.target.y - 2, scl + 2, scl + 2);
      }
      if (this.path.length > 0) {
        this.path.forEach((p, i) => {
          noStroke();
          fill(120, 120);
          rect(p.x, p.y, scl, scl);
        });
      }
      if(this.traced) {
        let dir = createVector(snake.xDir * scl, snake.yDir * scl);
        let point = snake.head.copy();
        fill(230, 20, 45, 150);
        for(let i = 1; i < this.traced; i++) {
          point.add(dir);
  
          ellipse(point.x + scl / 2, point.y + scl / 2, scl, scl);
        }
      }
      // Draw head and direction
      fill("#f1c40f");
      noStroke();
      rect(snake.head.x, snake.head.y, scl, scl);
      
      fill(0);
      rect(0, height - 20, width, 20);
      fill(255);
      noStroke();
      textAlign(RIGHT);
      textSize(16);
      text(`Moving: (${directionString([snake.xDir, snake.yDir])})`, width - 5, height - 5);
      textAlign(LEFT);
      let dirs = snake.safeDirections();
      let moves = "";
      for(let i = 0; i < dirs.length; i++) {
        moves += directionString(dirs[i]) + ' ';
      }
      text(`Moves: ${moves}`, 5, height - 5);
  
      let middleText = "Redirected: " + directionString(lastRedirect);
      
      if(turnProbabilities && lastTurns) {
        lastTurns.forEach((d, i) => {
          let lived = turnProbabilities[i];
          
          middleText += `(${directionString(d)}: ${lived})`;
        })
      }
      
      textAlign(CENTER);
      text(middleText, width / 2, height - 5);
      
      
      pop();
    },
  
    setTarget: function(t) {
      this.target = t;
  
      this.calculatePath();
    },
  
    // Path finding algorithm, bad one currently
    calculatePath: function() {
      // Discard previous path
      this.path = [];
  
      let current = snake.head.copy();
      let target = this.target;
      let modX, modY;
      let loops = 0;
      // Also dangerous
      while (current.dist(target) > scl - 1 && loops <= width / scl) {
        modX = modY = 0;
        
        // Get general direction
        let d = target.copy().sub(current).normalize();
        
        // X
        modX = round(d.x + 0.49);
        modY = round(d.y + 0.49);
        
        if(loops <= 0 && isOppositeDirection({x: modX, y: modY}, {x: snake.xDir, y: snake.yDir})) {
          break;
          
          let redirect = snake.randomSafeDirection();
          if(redirect) {
            // To avoid moving back into self.
            this.path.push(current.add([redirect.x * scl, redirect.y * scl]).copy());
            
            // Recalculate direction
            d = target.copy().sub(current).normalize();
        
            // X
            modX = round(d.x + 0.49);
            modY = round(d.y + 0.49);
          }
        }
        
        if(modX !== 0 && (modX - snake.xDir) !== 0) {
          // Check body
          
          this.path.push(current.add([modX * scl]).copy());
          
          let last = this.path.pop();
          if(!snake.isBody({x: last.x, y: last.y})) this.path.push(last);
        }
        if(modY !== 0 && (modY - snake.yDir) !== 0) {
          // Check body
          
          this.path.push(current.add([0, modY * scl]).copy());
          
          let last = this.path.pop();
          if(!snake.isBody({x: last.x, y: last.y})) this.path.push(last);
        }
  
        loops++;
      }
      // First path element is the position of head.
      //this.path.shift();
      
      this.validatePath();
    },
    
    validatePath: function(path) {
      path = path || this.path;
      
      let safe = true;
      for(var i = 0; i < path.length; i++) {
        if(snake.isBody(path[i])) {
          safe = false;
        }
      }
      if(!safe) {
        this.path = [];
        console.log("Path not safe, dropped"); 
      }
      
  //     // let's see what is the closest distance til impact
  //     let dir = createVector(snake.xDir * scl, snake.yDir * scl);
  //     let point = snake.head.copy();
  //     let view = ((width * height) / 2) / scl + 5;
  //     let dist = NaN;
  //     for(let i = 1; i < view; i++) {
  //       point.add(dir);
        
  //       if(snake.isBody(point)) {
  //         dist = i;
  //         break;
  //       }
  //     }
      
  //     this.traced = dist;
    },
  
    findTarget: function() {
      let closestDist = width * height;
      let dist = null;
      let chosen = null;
      for (let i = 0; i < food.length; i++) {
        let f = food[i];
  
        dist = f.dist(snake.head);
        if (dist <= closestDist) {
          closestDist = dist;
          chosen = f;
        }
      }
  
      this.setTarget(chosen);
    }
  
  }