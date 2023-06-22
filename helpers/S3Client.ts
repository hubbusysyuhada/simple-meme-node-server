import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MultipartFile } from "@fastify/multipart";
import env from './env';
import generateId from './generateId';

export default class Client {
  private client: S3Client;
  private accessKeyId = env.AWS_ACCESS_KEY_ID;
  private secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
  private region = env.S3_REGION;
  private Bucket = env.S3_BUCKET;

  constructor() {
    const { accessKeyId, secretAccessKey, region } = this
    this.client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    })
  }

  public async upload(multipart: MultipartFile, type: 'memes' | 'profile-pictures') {
    try {
      const { filename } = multipart
      const fileExtension = filename.split('.').slice(-1)[0]
      const newFileName = `${generateId()}.${fileExtension}`
      const Key = `${type}/${newFileName}`
      const command = new PutObjectCommand({
        Bucket: this.Bucket,
        Key,
        Body: await multipart.toBuffer()
      })
      await this.client.send(command);
      const url = await this.getUrl(Key)
      return { url, path: Key }
    } catch (error) {
      throw new Error(error)
    }
  }

  public async getUrl(path: string) {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: path
    })
    return await getSignedUrl(this.client, command)
  }

}