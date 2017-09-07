const Particle = require('../particle');

module.exports = class GravityParticle extends Particle {

	initializeStyle() {
		this.immutable = true;
		this.forceFieldSize *= 1.4;
		this.massThreshold = 2;
		this.setColor('#3498db');
	}
	
	figureGravityX(particle) {
		let r = Math.abs(this.x - particle.x);
		return this.figureGravity(particle, r);
	}
	
	figureGravityY(particle) {
		let r = Math.abs(this.y - particle.y);
		return this.figureGravity(particle, r);
	}
	
	figureGravityZ(particle) {
		let r = Math.abs(this.z - particle.z);
		return this.figureGravity(particle, r);
	}
	
	figureGravity(particle, r) {
		return 0.1115 * Math.abs(this.core - particle.core) / Math.abs(this.forceFieldSize - r);
	}
	
	affectParticle(particle) {

		let dx = 0;
		let dy = 0;
		let dz = 0;

		// affect on x-axis
		if (this.x !== particle.x) {
			dx = this.figureGravityX(particle);
			if (this.x > particle.x) {
				particle.speedx += dx;
			} else {
				particle.speedx -= dx;
			}
		}

		// affect on y-axis
		if (this.y !== particle.y) {
			dy = this.figureGravityY(particle);
			if (this.y > particle.y) {
				particle.speedy += dy;
			} else {
				particle.speedy -= dy;
			}
		}

		// affect on z-axis
		if (this.z !== particle.z) {
			dz = this.figureGravityZ(particle);
			if (this.z > particle.z) {
				particle.speedz += dz;
			} else {
				particle.speedz -= dz;
			}
		}
	}
	
	affectSurroundings(particles) {
		
		let affectedParticles = particles
			.filter((particle) => {
			
				// It's me
				if (particle === this)
					return false;
			
				if (particle.constitution <= 0)
					return false;
			
				let dist = this.figureDistance(particle);
				if (dist.d >= this.forceFieldSize)
					return false;

				// Merge the same particles
				if (particle instanceof GravityParticle) {
					if (this.mass < this.massThreshold &&
						particle.mass < this.massThreshold) {

						if (dist.d <= Math.max(this.radius, particle.radius)) {
							this.merge(particle);
							
							return false;
						}

						this.affectParticle(particle);
					}
					
					this.affectParticle(particle);
					
					return true;
				}
				
				this.affectParticle(particle);
				
				return true;
			});
		
		this.setConstitution(this.constitution + this.quaternion.consitutionNumber * affectedParticles.length * 0.1);
		
		return affectedParticles;
	}
}
