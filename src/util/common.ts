// 
type CanvasSize = { width: number; height: number };
type Position = { x: number; y: number };

// Define a function to calculate the safety score of a target position within the canvas.
export function calculateSafetyScore(targetPosition: Position, canvasSize: CanvasSize, drones: any[]): number {
    // You should implement your own logic here to evaluate the safety of the target position.
    // Consider factors like proximity to drones, obstacles, distance from the ground, etc.
    // The safety score should be higher for safer positions.

    // For example, you can calculate the distance between the target and drones and penalize
    // positions close to drones. Additionally, consider canvas boundaries as safety factors.

    const minSafeDistance = 50; // Define a minimum safe distance from drones.

    for (const drone of drones) {
        const distance = Math.sqrt((targetPosition.x - drone.position.x) ** 2 + (targetPosition.y - drone.position.y) ** 2);
        if (distance < minSafeDistance) {
            return -Infinity; // The target position is too close to a drone.
        }
    }

    // You can also consider canvas boundaries as a safety factor.
    if (
        targetPosition.x < 0 ||
        targetPosition.x > canvasSize.width ||
        targetPosition.y < 0 ||
        targetPosition.y > canvasSize.height
    ) {
        return -Infinity; // The target position is outside the canvas boundaries.
    }

    // Return a score based on your safety evaluation logic.
    // Higher scores represent safer positions.
    // You can adjust this based on your specific requirements.
    return 1;
}

// Define a function to find the best safe zone target position based on drones and canvas size.
export function findBestSafeZonePosition(canvasSize: CanvasSize, drones: any[]): Position {
    const numCandidates = 10; // Number of candidate positions to evaluate.

    let bestPosition: Position | null = null;
    let bestScore = -Infinity;

    for (let i = 0; i < numCandidates; i++) {
        const candidateX = Math.random() * canvasSize.width;
        const candidateY = Math.random() * canvasSize.height;
        const candidatePosition = { x: candidateX, y: candidateY };

        const safetyScore = calculateSafetyScore(candidatePosition, canvasSize, drones);

        if (safetyScore > bestScore) {
            bestPosition = candidatePosition;
            bestScore = safetyScore;
        }
    }

    if (bestPosition) {
        return bestPosition;
    }

    // If no safe positions are found, return the center of the canvas as a fallback.
    return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
}

export function calculateFitnessImprovement(avgFitness: number[], targetDistanceLogs: number[]) {
    let fitnessImprovement = [];

    for (let generation = 1; generation < avgFitness.length; generation++) {
        let avgFitnessChange = avgFitness[generation] - avgFitness[generation - 1];
        let targetDistanceChange = targetDistanceLogs[generation] - targetDistanceLogs[generation - 1];

        if (targetDistanceChange === 0) {
            // Avoid division by zero, you can handle this case according to your needs.
            fitnessImprovement.push(0);
        } else {
            let improvement = avgFitnessChange / targetDistanceChange;
            fitnessImprovement.push(improvement);
        }
    }

    return fitnessImprovement;
}
