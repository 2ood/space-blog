import { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {

  slug: 'posts',

  admin: {
    useAsTitle: 'title'
  },

  fields: [

    {
      name: 'title',
      type: 'text',
      required: true
    },

    {
      name: 'date',
      type: 'date'
    },

    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true
    },

    {
      name: 'excerpt',
      type: 'textarea'
    },

    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
      admin: {
        description: 'Primary category — determines planet colour and cluster placement.',
      },
    },

    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Keyword tags for search and filtering (optional, pick any number).',
      },
    },

    {
      name: 'size',
      type: 'number'
    },

    {
      name: 'trajectoryOrder',
      type: 'number'
    },

    {
      name: 'position',
      type: 'group',
      fields: [

        { name: 'x', type: 'number' },
        { name: 'y', type: 'number' },
        { name: 'z', type: 'number' }

      ]
    },

    {
      name: 'content',
      type: 'richText'
    },

    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: {
        description: 'Outgoing constellation connections from this post to others (directional: A → B).',
      },
    },

  ]
}