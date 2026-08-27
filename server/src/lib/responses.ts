import { resolver, type ResolverReturnType } from "hono-openapi"
import { z } from "zod"

type ErrorResponse = {
	description: string;
	content: {
		"application/json": {
			schema: ResolverReturnType;
		};
	};
};


export const baseResponse = (description: string, schema: z.ZodType): ErrorResponse =>
({
	description,
	content: {
		"application/json": {
			schema: resolver(schema)
		}
	}
})

export const singleMessageSchema = (message: string) =>
	z.object({
		message: z.literal(message)
	})

export const messagesSchema = (messages: string[]) =>
	z.object({
		message: z.enum(messages)
	})


export const messageResponse = (description: string, messages?: string[]): ErrorResponse =>
	baseResponse(
		description,
		messages ? messagesSchema(messages) : singleMessageSchema(description)
	)

export const successResponse = (schema: z.ZodObject): ErrorResponse =>
	baseResponse("Success", schema)

export const unauthorizedError = messageResponse("Unauthorized")
export const internalServerError = messageResponse("Internal Server Error", ["Something went wrong"])
export const notFoundError = messageResponse("Ressource not found")
export const missingPermissionsError = messageResponse("Missing permissions", ["Forbidden"])
