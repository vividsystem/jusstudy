import { shipStatusValues } from "@server/db/schema";
import z, { uuid } from "zod";

export const projectShipSchema = z.object({
	id: z.uuid(),
	createdAt: z.date(),
	state: z.enum(shipStatusValues),
	payout: z.number().nullable(),
	projectId: z.uuid()
})


export const NewShipSchema = z.object({
	projectId: uuid(),
})

export const ShipByIdResponseSchema = z.object({
	ship: projectShipSchema.extend({
		timeShipped: z.number().nonnegative()
	})
})

export const NewShipResponseSchema = z.object({
	ship: projectShipSchema
})

export const ProjectShipsResponseSchema = z.object({
	ships: z.array(projectShipSchema.extend({
		timeShipped: z.number().nonnegative()
	}))
})
