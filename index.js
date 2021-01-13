const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 50;
const cellsVertical = 40;

const width = window.innerWidth - 100
const height = window.innerHeight - 150;
const cells = 6; // 3 x 3 grid

// const unitLength = width / cells; // size of each cell
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

// Boilerplate
const engine = Engine.create();
engine.world.gravity.y = 0; // disables gravity
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: false,
		width: width,
		height: height
	}
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Rectangle
// const shape = Bodies.rectangle(200, 200, 50, 50, {
// 	isStatic: true
// });

// Walls
const walls = [
	Bodies.rectangle(0, 0, width * 2, 2, {
		isStatic: true
	}),
	Bodies.rectangle(0, 0, 2, width * 2, {
		isStatic: true
	}),
	Bodies.rectangle(0, height, width * 2, 2, {
		isStatic: true
	}),
	Bodies.rectangle(width, 0, 2, height * 2, {
		isStatic: true
	})
];

// World.add(world, shape);
World.add(world, walls);

// Maze generation

const shuffle = arr => {
	let counter = arr.length;

	while (counter > 0) {
		const index = Math.floor(Math.random() * counter); // random index in the array

		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}
	return arr;
};

// create grid of cells
const grid = Array(cellsVertical)
	.fill(null)
	.map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
	.fill(null)
	.map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
	.fill(null)
	.map(() => Array(cellsHorizontal).fill(false));

// picking random starting cell
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

console.log(startRow, startColumn);

// Maze algorithm
const stepThroughCell = (row, column) => {
	// check if cell has been visited before
	if (grid[row][column]) {
		return;
	}

	// mark cell as being visited
	grid[row][column] = true;

	// assemble randomly-oriented list of neighbors
	const neighbors = shuffle([
		[row - 1, column, "up"],
		[row + 1, column, "down"],
		[row, column - 1, "left"],
		[row, column + 1, "right"]
	]);

	for (let neighbor of neighbors) {
		const [nextRow, nextColumn, direction] = neighbor;

		// if neighbor is out of bounds
		if (
			nextRow < 0 ||
			nextRow >= cellsVertical ||
			nextColumn < 0 ||
			nextColumn >= cellsHorizontal
		) {
			continue;
		}

		// if we visited that neighbor, continue
		if (grid[nextRow][nextColumn]) {
			continue;
		}

		// remove horizontal or vertical walls

		if (direction === "left") {
			verticals[row][column - 1] = true;
		} else if (direction === "right") {
			verticals[row][column] = true;
		} else if (direction === "up") {
			horizontals[row - 1][column] = true;
		} else if (direction === "down") {
			horizontals[row][column] = true;
		}

		// visit next cell
		stepThroughCell(nextRow, nextColumn);
	}
};

stepThroughCell(startRow, startColumn);
// console.log(grid);

// drawing the maze
horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}
		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			5,
			{
				isStatic: true,
				label: "wall",
				render: {
					fillStyle: "red"
				}
			}
		);

		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			5,
			unitLengthY,
			{
				isStatic: true,
				label: "wall",
				render: {
					fillStyle: "red"
				}
			}
		);

		World.add(world, wall);
	});
});

// goal
const goal = Bodies.rectangle(
	width - unitLengthX / 2,
	height - unitLengthY / 2,
	unitLengthX * 0.7,
	unitLengthY * 0.7,
	{
		isStatic: true,
		label: "goal",
		render: {
			fillStyle: "green"
		}
	}
);
World.add(world, goal);

// ball

const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
	label: "ball",
	render: {
		fillStyle: "blue"
	}
});
World.add(world, ball);

document.addEventListener("keydown", event => {
	const { x, y } = ball.velocity;
	// console.log(x, y);

	if (event.key == "w" || event.key == "ArrowUp") {
		// console.log("Going up!");
		Body.setVelocity(ball, { x, y: y - 3 });
	}

	if (event.key == "d" || event.key == "ArrowRight") {
		// console.log("Going right!");
		Body.setVelocity(ball, { x: x + 3, y });
	}

	if (event.key == "a" || event.key == "ArrowLeft") {
		// console.log("Going right!");
		Body.setVelocity(ball, { x: x - 3, y });
	}

	if (event.key == "s" || event.key == "ArrowDown") {
		// console.log("Going right!");
		Body.setVelocity(ball, { x, y: y + 3 });
	}
});

// win condition
Events.on(engine, "collisionStart", event => {
	event.pairs.forEach(collision => {
		const labels = ["ball", "goal"];

		if (
			labels.includes(collision.bodyA.label) &&
			labels.includes(collision.bodyB.label)
		) {
			console.log("User won!");
			document.querySelector(".winner").classList.remove("hidden");
			engine.world.gravity.y = 1; // turning gravity back on 
			world.bodies.forEach(body => {
				if (body.label === "wall") {
					Body.setStatic(body, false);
				}
			});
		}
	});
});
