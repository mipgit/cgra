/**
 * MyWagonController
 * Manages wagon movement, physics, and state.
 */
export class MyWagonController {
    constructor() {
        // Position and orientation state
        this.position = [0, 0, 0];      // world XYZ position
        this.heading = 0;               // radians, yaw rotation around Y axis
        this.pitch = 0;                 // tilt along forward axis (from terrain slope)

        // Steering state
        this.steeringAngle = 0;         // front wheel steering angle (for visual rotation)
        this.steeringTarget = 0;        // where steering is lerping toward

        // Movement state
        this.speed = 0;                 // forward velocity (positive = forward)

        // Game state
        this.hp = 100;
        this.maxHp = 100;
        this.bales = [];                // currently carried bales (max 2)

        // Physics parameters
        this.wheelbase = 3.0;           // distance from front to back axles
        this.maxSpeed = 8.0;            // max forward speed
        this.accelRate = 4.0;           // acceleration
        this.brakeRate = 8.0;           // braking deceleration
        this.coastDecel = 5.0;          // coasting deceleration
        this.maxSteeringAngle = Math.PI / 6;  // max steering angle (30 degrees)
        this.steeringLerpSpeed = 6.0;   // how fast steering angle changes

        // Dimensions
        this.bodySize = { x: 5.0, y: 0.9, z: 2.5 };  // approximate wagon size
        this.frontAxleX = 1.5;  // front axle position relative to center
        this.rearAxleX = -1.5;  // rear axle position relative to center
    }

    // ---- Control Interface ----

    /**
     * Set the target steering angle
     * Positive = turn right, Negative = turn left
     */
    setSteeringTarget(angle) {
        const m = this.maxSteeringAngle;
        this.steeringTarget = Math.max(-m, Math.min(m, angle));
    }

    accelerate(dt) {
        this.speed = Math.min(this.maxSpeed, this.speed + this.accelRate * dt);
    }

    brake(dt) {
        // Only brake to stop, no reverse
        this.speed = Math.max(0, this.speed - this.brakeRate * dt);
    }

    coast(dt) {
        const dec = this.coastDecel * dt;
        if (this.speed > 0) {
            this.speed = Math.max(0, this.speed - dec);
        }
    }

    // ---- Physics Update ----

    /**
     * Update wagon physics each frame
     * @param {number} dt - delta time in seconds
     * @param {function} sampleGroundY - function(x, z) that returns ground Y height
     */
    update(dt, sampleGroundY) {
        // Smooth steering wheel toward target
        const k = 1 - Math.exp(-this.steeringLerpSpeed * dt);
        this.steeringAngle += (this.steeringTarget - this.steeringAngle) * k;

        // Stop if moving very slowly
        if (Math.abs(this.speed) < 0.02) {
            this.speed = 0;
        }

        // Bicycle model for steering
        // Only front wheels steer, rear wheels don't
        if (Math.abs(this.speed) > 1e-4) {
            // Using bicycle model: heading change = tan(steer_angle) * speed / wheelbase
            const headingChange = Math.tan(this.steeringAngle) * this.speed / this.wheelbase * dt;
            this.heading += headingChange;
        }

        // Move forward in the direction the wagon is facing
        // Wagon faces +X initially, so:
        // heading 0 = facing +X
        // heading PI/2 = facing -Z (counter-clockwise rotation around Y)
        const forwardX = Math.cos(this.heading);
        const forwardZ = -Math.sin(this.heading);
        
        this.position[0] += forwardX * this.speed * dt;
        this.position[2] += forwardZ * this.speed * dt;

        // Terrain interaction: sample height at front and back
        if (sampleGroundY) {
            // Calculate front and rear positions in world space
            // Front axle is ahead in the direction we're facing
            const frontOffsetX = forwardX * this.frontAxleX;
            const frontOffsetZ = forwardZ * this.frontAxleX;
            
            const rearOffsetX = forwardX * this.rearAxleX;
            const rearOffsetZ = forwardZ * this.rearAxleX;
            
            const frontX = this.position[0] + frontOffsetX;
            const frontZ = this.position[2] + frontOffsetZ;
            const rearX = this.position[0] + rearOffsetX;
            const rearZ = this.position[2] + rearOffsetZ;
            
            const frontY = sampleGroundY(frontX, frontZ);
            const rearY = sampleGroundY(rearX, rearZ);
            
            // Set wagon height to average of front and rear
            this.position[1] = (frontY + rearY) * 0.5;
            
            // Calculate pitch (tilt along the direction of movement)
            const wheelbaseDistance = this.frontAxleX - this.rearAxleX;
            this.pitch = Math.atan2(frontY - rearY, wheelbaseDistance);
        } else {
            this.position[1] = 0;
            this.pitch = 0;
        }
    }

    // ---- State Getters ----

    getPosition() {
        return [...this.position];
    }

    getHeading() {
        return this.heading;
    }

    getPitch() {
        return this.pitch;
    }

    getSteeringAngle() {
        return this.steeringAngle;
    }

    getSpeed() {
        return this.speed;
    }
}
