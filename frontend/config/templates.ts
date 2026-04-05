import type { WorkspaceTemplate } from '~/types'

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Track job applications from wishlist to offer',
    icon: 'i-heroicons-briefcase',
    stages: [
      { key: 'wishlist', label: 'Wishlist', color: 'gray', order: 1 },
      { key: 'applied', label: 'Applied', color: 'blue', order: 2 },
      { key: 'interview', label: 'Interview', color: 'yellow', order: 3 },
      { key: 'rejected', label: 'Rejected', color: 'red', order: 4 },
    ],
    settings: { itemLabel: 'Application', primaryFieldLabel: 'Company', secondaryFieldLabel: 'Role', showSecondaryOnCard: true },
  },
  {
    id: 'lead-sales',
    name: 'Lead / Sales',
    description: 'Manage leads through your sales pipeline',
    icon: 'i-heroicons-currency-dollar',
    stages: [
      { key: 'new', label: 'New', color: 'gray', order: 1 },
      { key: 'contacted', label: 'Contacted', color: 'blue', order: 2 },
      { key: 'qualified', label: 'Qualified', color: 'yellow', order: 3 },
      { key: 'won', label: 'Won', color: 'green', order: 4 },
      { key: 'lost', label: 'Lost', color: 'red', order: 5 },
    ],
    settings: { itemLabel: 'Lead', primaryFieldLabel: 'Company', secondaryFieldLabel: 'Contact', showSecondaryOnCard: true },
  },
  {
    id: 'property',
    name: 'Property',
    description: 'Track properties from saved to accepted',
    icon: 'i-heroicons-home',
    stages: [
      { key: 'saved', label: 'Saved', color: 'gray', order: 1 },
      { key: 'viewing', label: 'Viewing', color: 'blue', order: 2 },
      { key: 'offer', label: 'Offer', color: 'yellow', order: 3 },
      { key: 'accepted', label: 'Accepted', color: 'green', order: 4 },
      { key: 'rejected', label: 'Rejected', color: 'red', order: 5 },
    ],
    settings: { itemLabel: 'Property', primaryFieldLabel: 'Name', secondaryFieldLabel: 'Price', showSecondaryOnCard: true, enableImages: true },
  },
  {
    id: 'project',
    name: 'Project',
    description: 'Track projects through a simple workflow',
    icon: 'i-heroicons-rectangle-stack',
    stages: [
      { key: 'backlog', label: 'Backlog', color: 'gray', order: 1 },
      { key: 'in-progress', label: 'In Progress', color: 'blue', order: 2 },
      { key: 'review', label: 'Review', color: 'yellow', order: 3 },
      { key: 'done', label: 'Done', color: 'green', order: 4 },
    ],
    settings: { itemLabel: 'Project', primaryFieldLabel: 'Title', secondaryFieldLabel: 'Owner', showSecondaryOnCard: false },
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Start with a blank board and define your own stages',
    icon: 'i-heroicons-cog-6-tooth',
    stages: [],
    settings: { itemLabel: 'Item', primaryFieldLabel: 'Name', secondaryFieldLabel: 'Details', showSecondaryOnCard: false },
  },
]
