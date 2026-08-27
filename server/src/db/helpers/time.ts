import db from "@server/db"
import { projectShips, timeEntries } from "../schema"
import { and, desc, eq, gt, lt, sum } from "drizzle-orm"
import type { HelperCfg } from "@server/lib"



type Error = {
	message: string
	code: number
}

export const CODE_NOT_FOUND = 404

type HelperReturn<T> = { ok: true, data: T } | { ok: false, error: Error }



export async function getCurrentShipTime(projectId: string, cfg?: HelperCfg): Promise<HelperReturn<number>> {
	const ships = await db
		.select()
		.from(projectShips)
		.where(eq(projectShips.projectId, projectId))
		.orderBy(desc(projectShips.createdAt))
		.limit(2) // current and last

	if (ships.length === 0) {
		cfg?.logger?.error({ projectId, ships }, "Could not get past ships")
		return { ok: false, error: { message: "Ship not found", code: CODE_NOT_FOUND } }
	}

	const startDate = ships[1]?.createdAt || new Date(process.env.START_DATE!)


	const [entry] = await db
		.select({ timeSpent: sum(timeEntries.duration).mapWith(Number) })
		.from(timeEntries)
		.where(and(
			eq(timeEntries.projectId, projectId),
			gt(timeEntries.createdAt, startDate),
			lt(timeEntries.createdAt, ships[0]!.createdAt)
		))
	if (!entry) {
		cfg?.logger?.error({ projectId: projectId, ships, startDate }, "Could not get time spent for ship")
		return { ok: false, error: { message: "Could not get time spent on ship", code: CODE_NOT_FOUND } }
	}

	return { ok: true, data: entry.timeSpent }
}


export async function getShipTime(shipId: string, cfg?: HelperCfg): Promise<HelperReturn<number>> {
	const [ship] = await db
		.select()
		.from(projectShips)
		.where(eq(projectShips.id, shipId))
	if (!ship) {
		return { ok: false, error: { message: "Ship not found", code: CODE_NOT_FOUND } }
	}
	const [prevShip] = await db
		.select()
		.from(projectShips)
		.where(and(
			eq(projectShips.projectId, ship.projectId),
			lt(projectShips.createdAt, ship.createdAt)
		))

	const startDate = prevShip?.createdAt || new Date(process.env.START_DATE!)

	const [entry] = await db
		.select({ timeSpent: sum(timeEntries.duration).mapWith(Number) })
		.from(timeEntries)
		.where(and(
			eq(timeEntries.projectId, ship.projectId),
			gt(timeEntries.createdAt, startDate),
			lt(timeEntries.createdAt, ship.createdAt)
		))
	if (!entry) {
		cfg?.logger?.error({ ship, prevShip, startDate }, "Could not get time spent for ship")
		return { ok: false, error: { message: "Could not get time spent on ship", code: CODE_NOT_FOUND } }
	}

	return { ok: true, data: entry.timeSpent }
}
