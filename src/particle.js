
const distanceComputeCache = {
	theta: {},
	vector: {}
};

module.exports = class Particle {

	constructor(generator, core = Math.random(), attrs = {}) {
		this.generator = generator;
		this.quaternion = generator.quaternion;
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.speedx = 0;
		this.speedy = 0;
		this.speedz = 0;
		this.color = {
			a: 255,
			r: 255,
			g: 255,
			b: 255
		};
		this.opacity = 1;
		this.mass = 0;
		this.massThreshold = 1;
		this.radius = Math.round(this.quaternion.consitutionNumber * 0.005);
		this.sizeLimit = Math.round(this.quaternion.consitutionNumber * 0.01);
		this.minSize  = Math.round(this.quaternion.consitutionNumber * 0.003);
		this.constitution = this.quaternion.consitutionNumber;
		this.forceFieldSize = Math.round(this.quaternion.consitutionNumber * 0.1);
		this.speedFactor = ((this.mass + 1) / (this.massThreshold + 1)) * 0.02;
		this.speedThreshold = 0.5;
		this.collisionLost = 0.1;
		this.immutable = false;
		this.kindly = true;
		this.core = core;
		this.attrs = attrs;
		
		// Current status
		this.viewports = {};
		this.relatedParticles = [];
		
		// cache
		this._color = {};
	}
	
	initialize() {
		this.initializeStyle();
	}
	
	setColor(color) {
		
		if (color.charAt(0) === '#' && color.length === 7) {

			this.color = {
				a: 255,
				r: parseInt(color.slice(1,3), 16),
				g: parseInt(color.slice(3,5), 16),
				b: parseInt(color.slice(5,7), 16)
			};
		}
	}
	
	getColor(alpha) {
		let a = (alpha === undefined) ? this.color.a : alpha;
		if (this._color[a] === undefined) {
			let colorStr = [
				this.color.r,
				this.color.g,
				this.color.b,
				a
			].join(',');
			this._color[a] = 'rgba(' + colorStr + ')';
		}
		
		return this._color[a];
	}
	
	setConstitution(value) {
		this.constitution = (value > this.quaternion.consitutionNumber) ? this.quaternion.consitutionNumber : Math.round(value);
	}
	
	collisionX() {
		return this.speedx * -1 * (1 - this.collisionLost);
	}
	
	collisionY() {
		return this.speedy * -1 * (1 - this.collisionLost);
	}
	
	collisionZ() {
		return this.speedz * -1 * (1 - this.collisionLost);
	}
	
	figureDistance(target) {
		let yd = target.y - this.y;
		let xd = target.x - this.x;
		let zd = target.z - this.z;
		let d  = Math.sqrt(xd * xd + yd * yd + zd * zd);
		
		return {
			x: xd,
			y: yd,
			z: zd,
			d: d
		};
	}
	
	transform(vectorX, vectorY, vectorZ, angle) {
		
		// Cache vector calculation
		let hash = [
			vectorX,
			vectorY,
			vectorZ
		].join('-');
		let vCache = distanceComputeCache.vector[hash];
		if (vCache === undefined) {
			distanceComputeCache.vector[hash] = vCache = {};
			
			vCache.xx = vectorX * vectorX;
			vCache.xy = vectorX * vectorY;
			vCache.xz = vectorX * vectorZ;
			vCache.yy = vectorY * vectorY;
			vCache.yz = vectorY * vectorZ;
			vCache.zz = vectorZ * vectorZ;
		}
		
		// Cache parts of calculation of formular
		let thetaCache = distanceComputeCache.theta[angle];
		if (thetaCache === undefined) {
			distanceComputeCache.theta[angle] = thetaCache = {};
			thetaCache.theta = (angle / 180) * Math.PI;
			thetaCache.cos = Math.cos(thetaCache.theta);
			thetaCache.sin = Math.sin(thetaCache.theta);
			thetaCache.invertedCos = 1 - thetaCache.cos;
			thetaCache.xxfomular = vCache.xx * thetaCache.invertedCos + thetaCache.cos;
			thetaCache.xyfomular = vCache.xy * thetaCache.invertedCos - vectorZ * thetaCache.sin;
			thetaCache.xzfomular = vCache.xz * thetaCache.invertedCos + vectorY * thetaCache.sin;
			thetaCache.yxfomular = vCache.xy * thetaCache.invertedCos + vectorZ * thetaCache.sin;
			thetaCache.yyfomular = vCache.yy * thetaCache.invertedCos + thetaCache.cos;
			thetaCache.yzfomular = vCache.yz * thetaCache.invertedCos - vectorX * thetaCache.sin;
			thetaCache.zxfomular = vCache.xz * thetaCache.invertedCos - vectorY * thetaCache.sin;
			thetaCache.zyfomular = vCache.yz * thetaCache.invertedCos + vectorX * thetaCache.sin;
			thetaCache.zzfomular = vCache.zz * thetaCache.invertedCos + thetaCache.cos;
		}

		// Offset for rotating around specific line 
		let offsetX = this.quaternion.space.center.x;
		let offsetY = this.quaternion.space.center.y;
		let offsetZ = this.quaternion.space.center.z;
		let x = this.x - offsetX;
		let y = this.y - offsetY;
		let z = this.z - offsetZ;

		// Apply formular to transform
		let result = {};
		result.x = offsetX
			+ x * thetaCache.xxfomular
			+ y * thetaCache.xyfomular
			+ z * thetaCache.xzfomular;
		result.y = offsetY
			+ x * thetaCache.yxfomular
			+ y * thetaCache.yyfomular
			+ z * thetaCache.yzfomular;
		result.z = offsetZ
			+ x * thetaCache.zxfomular
			+ y * thetaCache.zyfomular
			+ z * thetaCache.zzfomular;

		return result;
	}
	
	computeViewports(angle) {
		
		// Rotate
		let viewport = this.transform(0, 1, 0, angle);

		this.viewports[angle] = viewport;
	}
	
	move(particles) {
		
		// Ignore because particle will be droped
		if (this.constitution <= 0)
			return false;
		
		this.beforeMove();

		// slow down anyway
		if (this.speedx !== 0 || this.speedy !== 0 || this.speedz !== 0) {
			this.speedx -= this.speedx * this.speedFactor;
			this.speedy -= this.speedy * this.speedFactor;
			this.speedz -= this.speedz * this.speedFactor;
		}

		// speed is too small so we ignore it
		if (Math.abs(this.speedx) < this.speedThreshold)
			this.speedx = 0;

		if (Math.abs(this.speedy) < this.speedThreshold)
			this.speedy = 0;

		if (Math.abs(this.speedz) < this.speedThreshold)
			this.speedz = 0;

		// Decrease size to normal size
		if (this.radius > this.minSize) {
			this.radius -= this.radius * 0.01;
		}

		// Particle has speed so we move it and check collision 
		if (this.speedx !== 0 || this.speedy !== 0 || this.speedz !== 0) {
			this.x = this.x + this.speedx;
			this.y = this.y + this.speedy;
			this.z = this.z + this.speedz;

			// Collision
			let diameter = this.radius * 2;
			if (this.x <= this.quaternion.space.padding + diameter) {
				this.speedx = this.collisionX();
				this.x = this.quaternion.space.padding + diameter;
			}

			if (this.x >= this.quaternion.space.width + this.quaternion.space.padding - diameter) {
				this.speedx = this.collisionX();
				this.x = this.quaternion.space.width + this.quaternion.space.padding - diameter;
			}

			if (this.y <= this.quaternion.space.padding + diameter) {
				this.speedy = this.collisionY();
				this.y = this.quaternion.space.padding + diameter;
			}

			if (this.y >= this.quaternion.space.height + this.quaternion.space.padding - diameter) {
				this.speedy = this.collisionY();
				this.y = this.quaternion.space.width + this.quaternion.space.padding - diameter;
			}

			if (this.z <= this.quaternion.space.padding + diameter) {
				this.speedz = this.collisionZ();
				this.z = this.quaternion.space.padding + diameter;
			}

			if (this.z >= this.quaternion.space.depth + this.quaternion.space.padding - diameter) {
				this.speedz = this.collisionZ();
				this.z = this.quaternion.space.width + this.quaternion.space.padding - diameter;
			}
		}
		
		return (this.constitution > 0);
	}

	figureRelatedParticles(particles) {
		this.relatedParticles = this.affectSurroundings(particles);
	}
	
	renderDot(context, x, y, radius, opacity) {
		context.beginPath();
		context.globalCompositeOperation = 'source-over';
		context.fillStyle   = this.getColor();
		context.globalAlpha = opacity;
		context.arc(x, y, radius, 0, Math.PI * 2, false);
		context.fill();
		context.closePath();
	}
	
	paint(context, angle) {
		let viewport = this.viewports[angle];
		let zRatio = viewport.z / (this.quaternion.space.depth * 1.5);
		let zScale = 1 + zRatio;
		let opacity = this.opacity * zRatio * 2;
		if (opacity < 0.1) {
			// It can not even see it, just ignore
			return;
		} else if (opacity > 1) {
			opacity = 1;
		}
		
		let powerScale = this.constitution / (this.quaternion.consitutionNumber * .5);
		let radius = powerScale * this.radius * zScale * .5;
		
		// speed is too small so we ignore it
		if (Math.abs(this.speedx) < this.speedThreshold)
			this.speedx = 0;
		
		if (Math.abs(this.speedy) < this.speedThreshold)
			this.speedy = 0;
		
		if (Math.abs(this.speedz) < this.speedThreshold)
			this.speedz = 0;

		let isDotRendered = false;
		let isConnectionRendering = false;

		// Connections
		let colorBegin = this.getColor();
		let colorEnd = this.getColor(0);
		let massFator = (this.mass + 1) / (this.massThreshold);
		let alpha = opacity * massFator;
		this.relatedParticles.forEach((particle, index) => {

			if ((particle.constitution <= 0))
				return;

//			console.log('related', particle.viewports);
			let particleViewport = particle.viewports[angle];
//console.log(particle.viewport);
			// Rendering Dot
			if (particleViewport.z > viewport.z && !isDotRendered) {
				
				if (isConnectionRendering === true) {
					isConnectionRendering = false;
				}
				
				isDotRendered = true;
				this.renderDot(context,
					viewport.x,
					viewport.y,
					radius,
					opacity);
			}
			
			if (isConnectionRendering === false) {
				isConnectionRendering = true;
				context.globalAlpha = alpha;
			}
			
			// Using distance which is between two particle to figure out force
			let dist = this.figureDistance(particle);
			let forceStrength = ((this.forceFieldSize - dist.d) / this.forceFieldSize);

			context.beginPath();
			context.lineWidth = 4 * zScale * massFator * forceStrength;
			context.moveTo(viewport.x, viewport.y);
			context.lineTo(particleViewport.x, particleViewport.y);

			// Line color
			let lineGradient = context.createLinearGradient(
				viewport.x, viewport.y,
				particleViewport.x, particleViewport.y
			);
			lineGradient.addColorStop(0, colorBegin);
			lineGradient.addColorStop(1, colorEnd);
			
			context.strokeStyle = lineGradient;
			context.stroke();
			context.closePath();
		});

		// dot is on top of all particles
		if (isDotRendered === false) {
			this.renderDot(context,
					viewport.x,
					viewport.y,
					radius,
					opacity);
		}
	}
	
	initializeStyle() {
	}
	
	merge(particle) {
		this.setConstitution(this.constitution + particle.constitution);
		
		// X
		this.x = (this.x + particle.x) * 0.5;
		if (this.x > this.quaternion.space.padding + this.quaternion.space.width) {
			this.x = this.quaternion.space.padding + this.quaternion.space.width;
		} else if (this.x < this.quaternion.space.padding) {
			this.x = this.quaternion.space.padding;
		}
		
		// Y
		this.y = (this.y + particle.y) * 0.5;
		if (this.y > this.quaternion.space.padding + this.quaternion.space.height) {
			this.y = this.quaternion.space.padding + this.quaternion.space.height;
		} else if (this.y < this.quaternion.space.padding) {
			this.y = this.quaternion.space.padding;
		}
		
		// Z
		this.z = (this.z + particle.z) * 0.5;		
		if (this.z > this.quaternion.space.padding + this.quaternion.space.depth) {
			this.z = this.quaternion.space.padding + this.quaternion.space.depth;
		} else if (this.z < this.quaternion.space.padding) {
			this.z = this.quaternion.space.padding;
		}

		this.speedx = (this.speedx + particle.speedx) * 0.5;
		this.speedy = (this.speedy + particle.speedy) * 0.5;
		this.speedz = (this.speedy + particle.speedz) * 0.5;
		this.radius += particle.radius * 0.5;
		this.mass++;

		particle.setConstitution(0);
	}
	
	beforeMove() {
		// Decrease constitution for every single move
		this.setConstitution(this.constitution - (this.speedx + this.speedy + this.speedz));
	}
	
	affectSurroundings() {
	}
};
