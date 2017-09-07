const crypto = require('crypto');
const Space = require('./space');
const Renderer = require('./renderer');
const Viewport = require('./viewport');
const ParticleGenerator = require('./particle_generator');
const {
	NormalParticle,
	GravityParticle,
	HelperParticle,
	VampireParticle
} = require('./particles');

window.requestAnimFrame = function() {
	return (
		window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     || 
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		}
	);
}();

// Hack for performance imporovement
Math.round = function(num) {
	return ~~ (0.5 + num)
};
/*
document.addEventListener('DOMContentLoaded', function(event) {
});

// Initializing canvas
const screenCanvas = document.getElementById('canvas'); 
const screenContext = screenCanvas.getContext('2d');
const offscreenCanvas = document.createElement('canvas');
const context = offscreenCanvas.getContext('2d');

const frames = {};

var W = window.innerWidth - 50;
var H = window.innerHeight - 50;

screenCanvas.width = offscreenCanvas.width = 400;
screenCanvas.height = offscreenCanvas.height = 400;

var space = {
	padding: Math.round(screenCanvas.width * 0.175),
	width: Math.round(screenCanvas.width * 0.65),
	height: Math.round(screenCanvas.height * 0.65),
	depth: Math.round(screenCanvas.width * 0.65),
};
space.centerX = Math.round(space.width * .5);
space.centerY = Math.round(space.height * .5);
space.centerZ = Math.round(space.depth * .5);

const distanceComputeCache = {
	theta: {},
	vector: {}
};
*/
/*
let angle = 0;

function draw(_angle) {

	// Compute for all particles
	particles = particles
		.filter(particle => particle.move())
		.filter(particle => (particle.constitution > 0))
		.sort((a, b) => {
			return a.viewport.z - b.viewport.z;
		})
		.map(particle => {
		
			// Prepare viewports
			particle.computeViewports(_angle);
			
			// paint on offscreen canvas
			particle.paint();

			return particle;
		});

	// Find unstable particle
	let hasKineticParticle = particles.find(particle => {
		return !(Math.abs(particle.speedx) < particle.speedThreshold &&
				 Math.abs(particle.speedy) < particle.speedThreshold &&
				 Math.abs(particle.speedz) < particle.speedThreshold);
	});

	if (hasKineticParticle !== undefined)
		return;

	// Cache frame after system is stable
	let frame = document.createElement('canvas');
	frame.width = screenCanvas.width;
	frame.height = screenCanvas.height;

	// Cache offscreen
	frame.getContext('2d').drawImage(offscreenCanvas, 0, 0);

	return frame;

}

function animate() {
	
	requestAnimFrame(animate);
	
	// copy image from offscreen
	screenContext.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
	screenContext.drawImage(offscreenCanvas, 0, 0);
	
	// Clear offscreen canvas
	context.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
	
	angle += 3;
	if (angle === 360)
		angle = 0;

	let frame = frames[angle];
	if (frame !== undefined) {
		// fill offscreen canvas for next frame cached
		context.drawImage(frame, 0, 0);
	} else {

		// draw next frame on offscreen canvas
		frame = draw(angle);
		
		// Cache
		if (frame !== undefined)
			frames[angle] = frame;
	}
	
}

animate();
*/
module.exports = class Quaternion {

	constructor() {
		this.seeds = [];
		this.space = {
			width: 0,
			height: 0,
			depth: 0,
			padding: 0,
			center: {
				x: 0,
				y: 0,
				z: 0
			}
		};
		this.particles = [];
		this.consitutionNumber = 1000;
		this.particleGenerator = new ParticleGenerator(this);
		this.particleGenerator.register('Normal', NormalParticle);
		this.particleGenerator.register('Gravity', GravityParticle);
		this.particleGenerator.register('Helper', HelperParticle);
		this.particleGenerator.register('Vampire', VampireParticle);
		this.renderer = new Renderer(this);
	}

	delay(interval) {
		return new Promise(function(resolve) {
			setTimeout(resolve, interval);
		});
	}

	setSeeds(str) {

		// Encrypt words with SHA256
		let signature = crypto.createHmac('sha256', str || '').digest('base64');

		// Getting the range of character code of signature 
		let range = this.findRange(signature);

		this.seeds = [];
		for (var i = 0; i < signature.length; i++) {

			// Generate seed
			let seed = this.genSeed(range, signature.charCodeAt(i));
			this.seeds.push(seed);
		}
	}

	genSeed(range, code) {
		// Figure out the seed which is between 0 to 1
		return (code - range.min) / range.size;
	}

	findRange(str) {
		let min = 255;
		let max = 0;

		for (var i = 0; i < str.length; i++) {
			let code = str.charCodeAt(i);
			max = Math.max(max, code);
			min = Math.min(min, code);
		}

		return {
			min: min,
			max: max,
			size: max - min
		};
	}

	setSpaceSize(width, height, depth, padding) {

		this.space = {
			width: width,
			height: height,
			depth: depth,
			padding: padding,
			center: {
				x: width * 0.5 + padding,
				y: height * 0.5 + padding,
				z: depth * 0.5 + padding
			}
		};
	}

	generateParticles() {
		
		let emiterConstant = this.space.width * 0.4;

		// Generate particles
		this.particles = this.seeds.map((seed, index) => {

			// Create new particle
			let type = this.particleGenerator.getParticleType(index);
			let particle = this.particleGenerator.generate(type, seed);
			
			return particle;
		});

		// Initializing particles
		this.particles.reduce((prev, particle, index) => {

			let theta = (index / 36) * (2 * Math.PI);

			particle.initialize();

			// Initial position
			particle.x = this.space.center.x + emiterConstant * Math.cos(theta) + particle.radius;
			particle.y = this.space.center.y + emiterConstant * Math.sin(theta) + particle.radius;
			particle.z = this.space.center.z + emiterConstant * Math.tan(theta) + particle.radius;
			
			// Initial velocity
			particle.speedx = (particle.x - prev.x) * 0.5;
			particle.speedy = (particle.y - prev.y) * 0.5;
			particle.speedz = (particle.z - prev.z) * 0.5;

			prev.x = particle.x;
			prev.y = particle.y;
			prev.z = particle.z;

			return prev;
		}, {
			x: this.space.center.x,
			y: this.space.center.y,
			z: this.space.center.z
		});
	}

	createViewport(angle) {

	}

	render(canvas, angle) {

		let viewport = new Viewport(angle);

		this.renderer.render(canvas, viewport);
	}
};
