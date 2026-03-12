import { notFound } from 'next/navigation'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import styles from './post.module.css'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })

  const post = result.docs[0]
  if (!post) notFound()

  const tags = ((post.tags ?? []) as { id?: string; name?: string }[])
    .map(t => ({ id: String(t.id ?? ''), name: String(t.name ?? '') }))
    .filter(t => t.name)
  const date = post.date
    ? new Date(post.date as string).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <div className={styles.page}>
      {/* Background star-field texture */}
      <div className={styles.bg} />

      <article className={styles.article}>

        {/* Back link */}
        <Link href="/" className={styles.back}>
          ← RETURN TO COSMOS
        </Link>

        {/* Tags */}
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map(tag => (
              <span key={tag.id} className={styles.tag}>{tag.name}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className={styles.title}>{post.title as string}</h1>

        {/* Date */}
        {date && <p className={styles.date}>{date}</p>}

        {/* Excerpt */}
        {post.excerpt && (
          <p className={styles.excerpt}>{post.excerpt as string}</p>
        )}

        <div className={styles.divider} />

        {/* Rich text body */}
        {post.content && (
          <div className={styles.body}>
            <RichText data={post.content as SerializedEditorState} />
          </div>
        )}

      </article>
    </div>
  )
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const result  = await payload.find({ collection: 'posts', limit: 1000 })
  return result.docs.map((post) => ({ slug: post.slug as string }))
}
