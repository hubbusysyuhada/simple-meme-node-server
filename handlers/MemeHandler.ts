import * as qs from "qs"
import { FastifyReply, FastifyRequest } from "fastify";
import Meme, { generateResponse } from "../database/entity/Meme";
import Client from "../helpers/S3Client";
import User from "../database/entity/User";
import _ from "lodash";

export default class {
  static async findAll(req: FastifyRequest<{ Querystring: { limit: number; offset: number } }>, rep: FastifyReply) {
    // const {  } = qs.parse(req.query as string) as QueryProps
    const { limit, offset } = req.query
    const entityManager = await req.orm.getEm()
    const response = await entityManager.find(Meme, {}, { orderBy: { created_at: "DESC" }, populate: ['upvotes'], limit, offset })
    const data = await Promise.all(response.map(async v => generateResponse(v, req.user as User, new Client())))
    rep.code(200).send({ data })
  }

  static async findById(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply) {
    // const {  } = qs.parse(req.query as string) as QueryProps
    const entityManager = await req.orm.getEm()
    const id = req.params.id
    const response = await entityManager.findOne(Meme, { id }, { populate: ['upvotes'] })
    const data = await generateResponse(response, req.user as User, new Client())
    rep.code(200).send({ data })
  }

  static async create(req: FastifyRequest<{ Body: Record<string, any> }>, rep: FastifyReply) {
    // const {  } = qs.parse(req.query as string) as QueryProps  
    const entityManager = await req.orm.getEm()
    const data = new Meme()
    for (const key in req.body) {
      data[key] = req.body[key]
    }
    data.poster = req.user as User
    await entityManager.persistAndFlush(data)
    rep.code(201).send({ message: "Meme created" })
  }

  static async upload(req: FastifyRequest, rep: FastifyReply) {
    const s3 = new Client()
    const data = await s3.upload(await req.file(), 'memes')
    rep.code(201).send(data)
  }

  static async delete(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply) {
    // const {  } = qs.parse(req.query as string) as QueryProps
    const entityManager = await req.orm.getEm()
    const id = req.params.id
    const data = await entityManager.findOneOrFail(Meme, { id })
    await entityManager.remove(data).flush()
    rep.code(201).send({ message: `Meme (id: ${id}) deleted` })
  }

  static async vote(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply) {
    // const {  } = qs.parse(req.query as string) as QueryProps
    const entityManager = await req.orm.getEm()
    const user_id = req.user.id
    const meme_id = req.params.id
    const data = await entityManager.findOne(Meme, { id: meme_id }, { populate: ['upvotes'] })

    const qb = entityManager.createQueryBuilder('memes_upvoted_upvotes_pivot')
      .select('*').where({ user_id, meme_id }).limit(1);
    const vote = await entityManager.getConnection().execute(qb.getKnexQuery())
    const user = await entityManager.findOneOrFail(User, { id: req.user.id })
    
    if (!vote[0]) {
      data.total_likes += 1
      data.upvotes.add(user)
    }
    else {
      data.total_likes -= 1
      data.upvotes.remove(user)
    }
    await entityManager.persistAndFlush(data)
    rep.code(200).send({ message: `Meme ${vote[0] ? 'Down' : 'Up'}voted.` })
  }
}