const Particle = require('../particle');

module.exports = class VampireParticle extends Particle {

	initializeStyle() {
		this.decline = this.quaternion.consitutionNumber * 0;
		this.kindly = false;
		this.setColor('#e74c3c');
		this.attackPoints = Math.round(this.quaternion.consitutionNumber * 0.1);
	}
	
	affectSurroundings(particles) {
		
		let connected = [];
		let dists = [];
		let targets = particles.filter((particle) =>{
			
			// It's me
			if (particle === this)
				return false;
			
			if (particle.constitution <= 0)
				return false;
			
			let dist = this.figureDistance(particle);
			if (dist.d >= this.forceFieldSize)
				return false;

			if (particle.immutable) {
				
				connected.push(particle);
				dists.push(dist);
				
				// Healing myself If it connected to immutable particle
				this.setConstitution(this.constitution + this.quaternion.consitutionNumber * 0.2);
				return false;
			}
			
			dists.push(dist);
			
			return true;
		})
		
		// Nothing's connected to this particle so it's dying
		if (targets.length === 0) {
			this.setConstitution(this.constitution - this.decline);
			return connected;
		}
		
		// Attract to others
		let points = targets.reduce((points, particle, index) => {
			
			let dist = dists[index];
			
			// Merge the same particles
			if (particle instanceof VampireParticle) {
				if (this.mass < this.massThreshold &&
					particle.mass < this.massThreshold) {
					
					// In range
					if (dist.d <= Math.max(this.radius, particle.radius)) {
						this.merge(particle);
						return points;
					}

					connected.push(particle);
					
					return points;
				}
			}
			
			connected.push(particle);
			
			// No need to compute more
			if (points >= this.quaternion.consitutionNumber)
				return this.quaternion.consitutionNumber;
			
			let force = (this.forceFieldSize - dist.d) / this.forceFieldSize;
			let blood = Math.round(this.attackPoints * force);
			
			// Suck blood from other particles
			particle.setConstitution(particle.constitution - blood);
			
			return points + blood;
			
		}, this.constitution);
		
		this.setConstitution(points);
		
		return connected;
	}
}
