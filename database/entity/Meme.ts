import * as orm from '@mikro-orm/core'
import User from './User';
import generateId from '../../helpers/generateId';
import Client from '../../helpers/S3Client';

export const relationColumns = ['poster','upvotes']

export async function generateResponse(entity: Meme, user: User, s3: Client) {
    const { id, title, total_likes, created_at, poster, upvotes, source_path } = entity
    return {
        id,
        title,
        total_likes,
        created_at,
        url: await s3.getUrl(source_path),
        isPoster: poster.id === user?.id,
        isUpvoted: !!(upvotes.getItems().find(u => u.id === user?.id))
      }
}

@orm.Entity({ tableName: "memes" })
export default class Meme {
    @orm.PrimaryKey({type: "uuid"})
    id: string = generateId();

    @orm.Property({ type: 'timestamp with timezone' })
    created_at: Date = new Date();

    @orm.Property({ type: 'varchar', length: 255, index: true })
    title: string;

    @orm.Property({ type: 'varchar', length: 500, index: false })
    source_path: string;

    @orm.Property({ type: 'integer', index: false })
    total_likes: number = 0;

    @orm.ManyToOne({ onDelete: "NO ACTION", onUpdateIntegrity: "NO ACTION" })
    poster!: User;

    @orm.ManyToMany({ pivotTable: 'memes_upvoted_upvotes_pivot', entity: () => User })
    upvotes = new orm.Collection<User>(this);
}