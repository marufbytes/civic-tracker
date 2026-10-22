import { pgTable, serial, text, timestamp, real, integer, boolean, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  email: text('email').notNull(),
  // Mobile number
  phone: text('phone').notNull(),
  // 'user' | 'admin'
  role: text('role').default('user').notNull(),
  // Optional profile fields
  fullName: text('full_name'),
  address: text('address'),
  occupation: text('occupation'),
  gender: text('gender'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const issues = pgTable('issues', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  imageUrl: text('image_url'),
  status: text('status').default('Pending').notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: text('author_name').default('Anonymous').notNull(),
  // 'Low' | 'Medium' | 'Critical'
  severity: text('severity').default('Medium').notNull(),
  afterImageUrl: text('after_image_url'),
  spamCount: integer('spam_count').default(0).notNull(),
  isApproved: boolean('is_approved').default(true).notNull(),
});

// One row per user per issue, so nobody can flag the same report twice
export const spamFlags = pgTable(
  'spam_flags',
  {
    id: serial('id').primaryKey(),
    issueId: integer('issue_id')
      .notNull()
      .references(() => issues.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.issueId, table.userId)]
);

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  issueId: integer('issue_id')
    .notNull()
    .references(() => issues.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: text('author_name').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


