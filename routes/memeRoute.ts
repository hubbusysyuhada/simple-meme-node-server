import { FastifyPluginCallback } from "fastify";
import Handler from "../handlers/MemeHandler";
import AuthHandler from "../middleware/AuthHandler";
import AllowPublicAndAuth from "../middleware/AllowPublicAndAuth";


const memeRoute: FastifyPluginCallback = (server, opts, next) => {

  server.get('/', { preHandler: [AllowPublicAndAuth] }, Handler.findAll)
  server.post('/', { preHandler: [AuthHandler] }, Handler.create)
  server.post('/upload', { preHandler: [AuthHandler] }, Handler.upload)
  server.get('/:id', { preHandler: [] }, Handler.findById)
  server.delete('/:id', { preHandler: [AuthHandler] }, Handler.delete)
  server.post('/:id/vote', {preHandler: [AuthHandler]}, Handler.vote)

  next()
}


export default memeRoute
