import fastify from 'fastify'
import "reflect-metadata"
import bcrypt from 'fastify-bcrypt'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import routes from './routes'
import MikroOrmInstance from './database'
// import fastifyStatic from '@fastify/static'
// const path = require('path')

(async () => {
  const server = fastify()

  const orm = await MikroOrmInstance.init()
  
  server.register(bcrypt, { saltWorkFactor: 5 })
  server.register(fastifyMultipart, {limits: { fileSize: 10485760 }}) // size limit 10mb
  server.register(routes, { prefix: 'v1' })
  server.register(jwt, { secret: "secret" })
  server.decorateRequest('orm', orm)
  server.decorateRequest('foo', 'bar')
  // server.register(fastifyStatic, {
  //   root: path.join(__dirname, 'out'),
  // })
  server.register(cors, {
    origin: (origin, cb) => {
      if (!origin || new URL(origin).hostname === 'localhost') cb(null, true)
    }
  })

  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
})()