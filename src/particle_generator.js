
module.exports = class ParticleGenerator {
	
	constructor(quaternion) {
		this.quaternion = quaternion;
		this.types = {};
	}
	
	register(particleName, def) {
		this.types[particleName] = def;
	}
	
	unregister(particleName) {
		delete this.type[particleName];
	}
	
	getParticleType(index) {
		let _index = index % Object.keys(this.types).length;
		return Object.keys(this.types)[_index] || this.types[0];
	}
	
	generate(particleName, seed) {
		let ParticleClass = this.types[particleName];
		if (ParticleClass === undefined)
			return null;

		return new ParticleClass(this, seed);
	}
}
