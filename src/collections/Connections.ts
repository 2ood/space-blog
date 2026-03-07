import { CollectionConfig } from 'payload'

export const Connections: CollectionConfig = {
  slug: 'connections',

  admin: {
    useAsTitle: 'id',
    description: 'Constellation lines between blog star planets.',
  },

  fields: [
    {
      name: 'from',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
    },
    {
      name: 'to',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
    },
  ],
}
