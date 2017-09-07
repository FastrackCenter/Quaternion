const Particle = require('../particle');

module.exports = class NormalParticle extends Particle {

	initializeStyle() {
		this.setColor('#2ecc71');
	}
	
	affectSurroundings(particles) {

		return particles.filter((particle) => {

			// It's me
			if (particle === this)
				return false;

			if (particle.constitution <= 0)
				return false;

			let dist = this.figureDistance(particle);
			if (dist.d >= this.forceFieldSize)
				return false;
			
			// Healing myself If it connected to immutable particle 
			if (particle.immutable) {
				this.setConstitution(this.constitution + this.quaternion.consitutionNumber * 0.2);
				return true;
			}
			
			// Merge the same particles
			if (particle instanceof NormalParticle) {
				if (this.mass >= this.massThreshold ||
				    particle.mass >= particle.massThreshold)
					return true;

				if (dist.d <= Math.max(this.radius, particle.radius)) {
					this.merge(particle);
					
					return false;
				}
			}
			
			return true;
		});
	}
};
