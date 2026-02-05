import z, { uuid } from "zod";

export const NewShipSchema = z.object({
	projectId: uuid(),
})
