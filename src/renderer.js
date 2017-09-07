const Viewport = require('./viewport');

module.exports = class Renderer {

	constructor(quaternion) {
		this.quaternion = quaternion;
		this.viewports = [];
		this.particles = [];
		this.angle = 0;
		this.animates = [];
		this.frames = {};
		this.cache = false;
		this.animating = false;
	}

	updateRotation(speed) {
		
		this.angle += speed;

		if (this.angle === 360)
			this.angle = 0;
	}

	getFrame(viewport) {

		if (this.cache === false) {
			return this.paint(viewport);
		}

		let frame = this.frames[this.angle + viewport.angleOffset];
		if (frame === undefined) {
			return this.paint(viewport);
		}

		return frame;
	}

	paint(viewport) {

		let angle = this.angle + viewport.angleOffset;

		// Compute for all particles
		this.particles
			.map(particle => {
			
				// Prepare viewports
				particle.computeViewports(angle);

				return particle;
			})
			.sort((a, b) => {
				// sorting for depth
				return a.viewports[angle].z - b.viewports[angle].z;
			})
			.map(particle => {
				
				// paint on offscreen canvas
				particle.paint(viewport.canvas.getContext('2d'), angle);

				return particle;
			});
		
		// Find unstable particle
		let hasKineticParticle = this.particles.find(particle => {
			return !(Math.abs(particle.speedx) < particle.speedThreshold &&
					 Math.abs(particle.speedy) < particle.speedThreshold &&
					 Math.abs(particle.speedz) < particle.speedThreshold);
		});

		// All particles was stable
		if (hasKineticParticle !== undefined)
			return viewport.canvas;

		this.cache = true;

		// Cache frame after system is stable
		let frame = document.createElement('canvas');
		frame.width = viewport.canvas.width;
		frame.height = viewport.canvas.height;

		// Cache offscreen
		frame.getContext('2d').drawImage(viewport.canvas, 0, 0);

		this.frames[angle] = frame;

		return frame;
	}

	animate() {

		// Call browser's animation method
		requestAnimFrame(this.animate.bind(this));

		this.updateRotation(3);

		// Compute for all particles
		this.particles = this.particles
			.filter(particle => particle.move(this.particles))
			.filter(particle => (particle.constitution > 0))
			.map(particle => {
				particle.figureRelatedParticles(this.particles);
				return particle;
			})

		// paint
		this.animates.forEach(animate => animate());
	}

	render(canvas, viewport) {
		this.particles = this.quaternion.particles;

		// Initializing viewport
		viewport.canvas.width = canvas.width;
		viewport.canvas.height = canvas.height;

		let screenContext = canvas.getContext('2d');
		this.animates.push(() => {

			// Clear canvas
			screenContext.clearRect(0, 0, canvas.width, canvas.height);
			viewport.canvas.getContext('2d').clearRect(0, 0, viewport.canvas.width, viewport.canvas.height);

			// Getting frame
			let frame = this.getFrame(viewport);

			// copy image from frame canvas
			screenContext.clearRect(0, 0, canvas.width, canvas.height);
			screenContext.drawImage(frame, 0, 0);
		});
		
		// Call browser's animation method
		if (!this.animating) {
			this.animating = true;
			this.animate();
		}
	}
};
