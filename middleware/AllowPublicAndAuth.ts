import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify"

export default async (req: FastifyRequest,rep: FastifyReply, throwErr: HookHandlerDoneFunction) => {
  if (req.headers.authorization) await req.jwtVerify()
}