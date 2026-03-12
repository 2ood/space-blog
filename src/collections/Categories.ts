import { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',

  admin: {
    useAsTitle: 'name',
    description: 'Research categories — each post belongs to exactly one. Determines planet colour and cluster placement.',
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'color',
      type: 'text',
      required: true,
      admin: {
        description: 'CSS colour string, e.g. "#a855f7" or "hsl(270,70%,65%)"',
      },
    },
  ],
}
