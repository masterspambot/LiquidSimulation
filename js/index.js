$(function(){

/* Init storage */

	if(localStorage.getItem('GROUPS') === null){
		localStorage.setItem('GROUPS',150);
		$('#groups').val(150);
	}else{
		$('#groups').val(localStorage.getItem('GROUPS'));
	}
	if(localStorage.getItem('FRICTION') === null){
		localStorage.setItem('FRICTION',0.05);
		$('#friction').val(0.05);
	}else{
		$('#friction').val(localStorage.getItem('FRICTION'));
	}

	if(localStorage.getItem('GRAVITY_X') === null){
		localStorage.setItem('GRAVITY_X',0);
		$('#gravityX').val(0);
	}else{
		$('#gravityX').val(localStorage.getItem('GRAVITY_X'));
	}

	if(localStorage.getItem('GRAVITY_Y') === null){
		localStorage.setItem('GRAVITY_Y',0);
		$('#gravityY').val(0);
	}
	else{
		$('#gravityY').val(localStorage.getItem('GRAVITY_Y'));
	}

	if(localStorage.getItem('MOUSE_FORCE') === null){
		localStorage.setItem('MOUSE_FORCE', 10);
		$('#mouseForce').val(10);
	}else{
		$('#mouseForce').val(localStorage.getItem('MOUSE_FORCE'));
	}
	if(localStorage.getItem('MOUSE_REPEL') === null){
		localStorage.setItem('MOUSE_REPEL', false);
		$('#repel').attr('checked',false);
	}else{
		$('#repel').attr('checked',localStorage.getItem('MOUSE_REPEL') == 'true' ? true : false);
	}
	if(localStorage.getItem('FAKE_VISCOSITY') === null){
		localStorage.setItem('FAKE_VISCOSITY',2);
		$('#viscosity').val('2');
	}else{
		$('#viscosity').val(localStorage.getItem('FAKE_VISCOSITY'));
	}

/* Settings */

var MOUSE_FORCE = parseInt(localStorage.getItem('MOUSE_FORCE')),
		FRICTION = parseFloat(localStorage.getItem('FRICTION')),
		GRAVITY_X = parseFloat(localStorage.getItem('GRAVITY_X')),
		GRAVITY_Y = parseFloat(localStorage.getItem('GRAVITY_Y')),
		MOUSE_REPEL = localStorage.getItem('MOUSE_REPEL') === 'true' ? true : false,
		group_size = localStorage.getItem('GROUPS')/ 3,
		GROUPS = [group_size,group_size,group_size],
		FAKE_VISCOSITY = parseFloat(localStorage.getItem('FAKE_VISCOSITY')),
		GROUP_COLOURS = ['rgba(97,160,232'],
		PLAY = false;

/* Events */

	$('#gravityX').on('change keyup', function(){
		GRAVITY_X = parseFloat($(this).val());
		window.localStorage.setItem('GRAVITY_X', parseFloat($(this).val()));
		return false;
	});

	$('#gravityY').on('change keyup', function(){
		GRAVITY_Y = parseFloat($(this).val());
		window.localStorage.setItem('GRAVITY_Y', parseFloat($(this).val()));
		return false;
	});

	$('#viscosity').on('change keyup', function(){
		FAKE_VISCOSITY = parseFloat($(this).val());
		window.localStorage.setItem('FAKE_VISCOSITY', parseFloat($(this).val()));
		return false;
	});

	$('#friction').on('change keyup', function(){
		FRICTION = parseFloat($(this).val());
		window.localStorage.setItem('FRICTION', parseFloat($(this).val()));
		return false;
	});

	$('#mouseForce').on('change keyup', function(){
		MOUSE_FORCE = parseFloat($(this).val());
		window.localStorage.setItem('MOUSE_FORCE', parseFloat($(this).val()));
		return false;
	});

	$('#groups').on('change', function(){
		GROUPS = parseFloat($(this).val());
		window.localStorage.setItem('GROUPS', parseFloat($(this).val()));
		return false;
	});

	$('#repel').on('change', function(){
		MOUSE_REPEL = $(this).is(":checked");
		window.localStorage.setItem('MOUSE_REPEL', $(this).is(":checked"));
		return false;
	});

	$('#reload').on('click', function(){
		location.reload();
		return false
	});

	$('#default').on('click', function(){
		localStorage.clear();
		location.reload();
		return false
	});

	$('#start').on('click', function(){
		if(PLAY === false){
			fluid.start();
			$('#start').addClass('disabled');
			$('#pause').removeClass('disabled');
		}
		return false;
	});

	$('#pause').on('click', function(){
		if(PLAY === true){
			fluid.stop();
			$('#start').removeClass('disabled');
			$('#pause').addClass('disabled');
		}
		return false;
	});

	/* Core */

	window.requestAnimFrame =
	window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function (callback) {
		window.setTimeout(callback, 1000 / 60);
	};

	var fluid = function () {

		var ctx,
			width,
			height,
			num_x,
			num_y,
			particles,
			grid,
			meta_ctx,
			threshold = 120,
			spacing = 45,
			radius = 30,
			limit = radius * 0.66,
			textures,
			num_particles,
			particle_history = [];

		var mouse = {
			down: false,
			x:    0,
			y:    0
		};

		var process_image = function () {
			var imageData = meta_ctx.getImageData(0, 0, width, height),
				pix = imageData.data;

			for (
				var i = 0, n = pix.length; i < n; i += 4
				) {
				(pix[i + 3] < threshold) && (pix[i + 3] /= 6);
			}

			ctx.putImageData(imageData, 0, 0);
		};

		var run = function () {

			//var time = new Date().getTime();
			meta_ctx.clearRect(0, 0, width, height);

			for (
				var i = 0, l = num_x * num_y; i < l; i++
				) grid[i].length = 0;

			var i = num_particles;
			while (i--) particles[i].first_process();
			i = num_particles;
			while (i--) particles[i].second_process();
			particle_history.push(particles);
			process_image();

			// Draw force field
			if (mouse.down) {

				ctx.canvas.style.cursor = 'none';

				ctx.fillStyle = 'rgba(97, 160, 232, 0.05)';
				ctx.beginPath();
				ctx.arc(
					mouse.x,
					mouse.y,
					radius * MOUSE_FORCE/2,
					0,
					Math.PI * 2
				);
				ctx.closePath();
				ctx.fill();

				ctx.fillStyle = 'rgba(97, 160, 232, 0.05)';
				ctx.beginPath();
				ctx.arc(
					mouse.x,
					mouse.y,
					(radius * MOUSE_FORCE)/6,
					0,
					Math.PI * 2
				);
				ctx.closePath();
				ctx.fill();
			} else ctx.canvas.style.cursor = 'default';

			//console.log(new Date().getTime() - time);
			if (PLAY)
				requestAnimFrame(run);
		};

		var Particle = function (type, x, y) {
			this.type = type;
			this.x = x;
			this.y = y;
			this.px = x;
			this.py = y;
			this.vx = 0;
			this.vy = 0;
		};

		Particle.prototype.first_process = function () {

			// Draw joing of the closest shapes (grid)
			var g = grid[Math.round(this.y / spacing) * num_x + Math.round(this.x / spacing)];
			if (g) g.close[g.length++] = this;

			// Speed of the particle
			this.vx = this.x - this.px;
			this.vy = this.y - this.py;
			if( this.vx > 0){
				this.vx = this.vx - FRICTION;
			} else {
				this.vx = this.vx + FRICTION;
			}

			if( this.vy > 0){
				this.vy = this.vy - FRICTION;
			} else {
				this.vy = this.vy + FRICTION;
			}

			// Force action
			if (mouse.down) {
				var dist_x = this.x - mouse.x;
				var dist_y = this.y - mouse.y;
				var dist = Math.sqrt(dist_x * dist_x + dist_y * dist_y);
				if (dist < radius * MOUSE_FORCE) {
					var cos = dist_x / dist;
					var sin = dist_y / dist;
					this.vx += (MOUSE_REPEL) ? cos : -cos;
					this.vy += (MOUSE_REPEL) ? sin : -sin;
				}
			}

			// Add gravity force
			this.vx += GRAVITY_X;
			this.vy += GRAVITY_Y;

			// Update acceleration
			this.px = this.x;
			this.py = this.y;

			// Move particle
			this.x += this.vx;
			this.y += this.vy;
		};

		Particle.prototype.second_process = function () {

			var force = 0,
				force_b = 0,
				cell_x = Math.round(this.x / spacing),
				cell_y = Math.round(this.y / spacing),
				close = [];

			for (
				var x_off = -1; x_off < 8; x_off++
				) {
				for (
					var y_off = -1; y_off < 8; y_off++
					) {
					var cell = grid[(cell_y + y_off) * num_x + (cell_x + x_off)];
					if (cell && cell.length) {
						for (
							var a = 0, l = cell.length; a < l; a++
							) {
							var particle = cell.close[a];
							if (particle != this) {
								var dfx = particle.x - this.x;
								var dfy = particle.y - this.y;
								var distance = Math.sqrt(dfx * dfx + dfy * dfy);
								if (distance < spacing) {
									var m = 1 - (distance / spacing);
									force += Math.pow(m, 2);
									force_b += Math.pow(m, 3) / 2;
									particle.m = m;
									particle.dfx = (dfx / distance) * m;
									particle.dfy = (dfy / distance) * m;
									close.push(particle);
								}
							}
						}
					}
				}
			}

			force = (force - 3) * 0.5;

			for (
				var i = 0, l = close.length; i < l; i++
				) {

				var neighbor = close[i];

				var press = (force + force_b * neighbor.m) * FAKE_VISCOSITY;
				if (this.type != neighbor.type) press *= 0.35;

				var dx = neighbor.dfx * press;
				var dy = neighbor.dfy * press;

				neighbor.x += dx;
				neighbor.y += dy;
				this.x -= dx;
				this.y -= dy;
			}

			// Limit canvas drawing
			if (this.x < limit) this.x = limit;
			else if (this.x > width - limit) this.x = width - limit;

			if (this.y < limit) this.y = limit;
			else if (this.y > height - limit) this.y = height - limit;

			this.draw();
		};

		Particle.prototype.draw = function () {

			var size = radius * 2;

			meta_ctx.drawImage(
				textures[this.type],
				this.x - radius,
				this.y - radius,
				size,
				size);
		};

		return {

			init: function (canvas, w, h) {

				particles = [];
				grid = [];
				textures = [];

				var canvas = document.getElementById(canvas);
				ctx = canvas.getContext('2d');
				canvas.height = h || window.innerHeight;
				canvas.width = w || window.innerWidth;
				width = canvas.width;
				height = canvas.height;

				var meta_canvas = document.createElement("canvas");
				meta_canvas.width = width;
				meta_canvas.height = height;
				meta_ctx = meta_canvas.getContext("2d");

				for (
					var i = 0; i < GROUPS.length; i++
					) {

					var colour;

					if (GROUP_COLOURS[i]) {
						colour = GROUP_COLOURS[i];
					} else {

						colour =
						'hsla(' + Math.round(Math.random() * 360) + ', 80%, 60%';
					}

					textures[i] = document.createElement("canvas");
					textures[i].width = radius * 2;
					textures[i].height = radius * 2;
					var nctx = textures[i].getContext("2d");

					var grad = nctx.createRadialGradient(
						radius,
						radius,
						1,
						radius,
						radius,
						radius
					);

					grad.addColorStop(0, colour + ',1)');
					grad.addColorStop(1, colour + ',0)');
					nctx.fillStyle = grad;
					nctx.beginPath();
					nctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
					nctx.closePath();
					nctx.fill();
				}

				canvas.onmousedown = function (e) {
					mouse.down = true;
					return false;
				};

				canvas.onmouseup = function (e) {
					mouse.down = false;
					return false;
				};

				canvas.onmousemove = function (e) {
					var rect = canvas.getBoundingClientRect();
					mouse.x = e.clientX - rect.left;
					mouse.y = e.clientY - rect.top;
					return false;
				};

				num_x = Math.round(width / spacing)*2 + 1;
				num_y = Math.round(height / spacing)*2 + 1;

				for (
					var i = 0; i < num_x * num_y; i++
					) {
					grid[i] = {
						length: 0,
						close:  []
					}
				}

				for (
					var i = 0; i < GROUPS.length; i++
					) {
					for (
						var k = 0; k < GROUPS[i]; k++
						) {
						particles.push(
							new Particle(
								i,
								radius + Math.random() * (width - radius * 2),
								radius + Math.random() * (height - radius * 2)
							)
						);
					}
				}

				num_particles = particles.length

				run();
			},

			stop: function () {
				PLAY = false;
				run();
			},

			start: function(){
				PLAY = true;
				run();
			}

		};

	}();



	fluid.init('fluid-env', window.innerWidth, 500);

});