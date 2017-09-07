
module.exports = class Viewport {

	constructor(angleOffset = 0) {
		this.canvas = document.createElement('canvas');
		this.angleOffset = angleOffset;
	}
};
