const Particle = require('../particle');

module.exports = class HelperParticle extends Particle {

	initializeStyle() {
		this.HealingUnit = this.quaternion.consitutionNumber;
		this.setColor('#f1c40f');
	}
	
	affectSurroundings(particles) {

		// healing other particles
		return particles.filter((particle) => {
			
			// It's me
			if (particle === this)
				return false;
			
			if (particle.constitution <= 0)
				return false;
			
			if (!particle.kindly)
				return false;
			
			let dist = this.figureDistance(particle);
			if (dist.d >= this.forceFieldSize)
				return false;
			
			// Healing myself If it connected to immutable particle 
			if (particle.immutable) {
				this.setConstitution(this.constitution + this.quaternion.consitutionNumber * 0.5);
				return false;
			}

			// Merge the same particles
			if (particle instanceof HelperParticle) {
				if (this.mass < this.massThreshold &&
					particle.mass < this.massThreshold) {
					
					// In range
					if (dist.d <= Math.max(this.radius, particle.radius)) {
						this.merge(particle);
						return false;
					}
				}
			}

			particle.setConstitution(particle.constitution + this.HealingUnit);
			
			return true;
		});
	}
}
