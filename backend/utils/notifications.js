// ======================================================
// NOTIFICATIONS - pure logic (no database access here)
//
// The site has no separate "notifications" table. Instead, a
// notification is simply "something new was added for students
// recently": a mock test, a current affair, a blog post or
// study notes. The route (routes/notifications.js) loads the
// recent rows and this file turns them into one sorted list.
// ======================================================

const WINDOW_DAYS = 30; // how far back the bell looks
const MAX_ITEMS = 15; // how many items the bell shows

function toTime(value) {
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function buildNotifications({
  tests = [],
  affairs = [],
  blogs = [],
  notes = [],
  seenAt = null,
  limit = MAX_ITEMS,
}) {
  const items = [];

  for (const test of tests) {
    items.push({
      id: `test:${test.testId}`,
      type: "test",
      title: "New mock test added",
      body: test.title,
      link: `/mock-test/${test.testId}`,
      createdAt: test.createdAt,
    });
  }

  for (const article of affairs) {
    items.push({
      id: `current-affair:${article._id}`,
      type: "current-affair",
      title: "New current affair",
      body: article.title,
      link: `/current-affairs/${article._id}`,
      createdAt: article.createdAt,
    });
  }

  for (const blog of blogs) {
    items.push({
      id: `blog:${blog._id}`,
      type: "blog",
      title: "New blog post",
      body: blog.title,
      link: `/blog/${blog._id}`,
      createdAt: blog.createdAt,
    });
  }

  // Notes are often added in bulk, so they are grouped per category
  // ("4 new notes in HP General Knowledge") instead of flooding the bell.
  const noteGroups = new Map();

  for (const note of notes) {
    if (!note.categorySlug) continue;

    const group = noteGroups.get(note.categorySlug) || {
      slug: note.categorySlug,
      categoryTitle: note.categoryTitle || note.categorySlug,
      titles: [],
      newest: note.createdAt,
    };

    group.titles.push(note.title);

    if (toTime(note.createdAt) > toTime(group.newest)) {
      group.newest = note.createdAt;
    }

    noteGroups.set(note.categorySlug, group);
  }

  for (const group of noteGroups.values()) {
    const count = group.titles.length;

    items.push({
      id: `notes:${group.slug}`,
      type: "notes",
      title: "New study notes added",
      body:
        count === 1
          ? group.titles[0]
          : `${plural(count, "new note")} in ${group.categoryTitle}`,
      link: `/notes/${group.slug}`,
      createdAt: group.newest,
    });
  }

  const seenTime = seenAt ? toTime(seenAt) : 0;

  const sorted = items
    .filter((item) => toTime(item.createdAt) > 0)
    .sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))
    .slice(0, limit)
    .map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt).toISOString(),
      isNew: toTime(item.createdAt) > seenTime,
    }));

  return {
    items: sorted,
    unreadCount: sorted.filter((item) => item.isNew).length,
  };
}

module.exports = {
  WINDOW_DAYS,
  MAX_ITEMS,
  buildNotifications,
};