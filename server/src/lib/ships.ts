import type { ProjectShipStatus } from "@server/db/schema";

export function bumpStatus(shipState: ProjectShipStatus): ProjectShipStatus {
	switch (shipState) {
		case "pre-initial":
			return "voting"
		case "voting":
			return "pre-fraud"
		case "pre-fraud":
			return "finished"
		default:
			throw new Error("ship status is final and cannot be bumped (finished and failed)")


	}

}
