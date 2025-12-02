import type { StoryBook } from "../types/story";

/**
 * 구조 (id / parentId):
 *
 * 1  (root)
 *  ├─ 3 (1의 파생 A)
 *  │    └─ 5 (3의 파생 A-1)
 *  ├─ 4 (1의 파생 B)
 *
 * 2  (root, 파생 없음)
 */

const now = Date.now();

export const stories: StoryBook[] = [
  {
    id: 1,
    parentId: null,
    title: "Story #1",
    author: "Creator 1",
    content: [
      "Lorem ipsum dolor sit amet.",
      "Qui labore repellendus et omnis atque et quisquam deserunt ut tempore suscipit?",
      "Sed odit consequuntur sit consectetur totam et quia dolorum id voluptates incidunt ea rerum earum et corporis consequatur.",
    ].join("\n\n"),
    imageUrl: "../public/mocks/image1.png",
    timestamp: now - 2 * 60 * 60 * 1000,
  },
  {
    id: 2,
    parentId: null,
    title: "Story #2",
    author: "Creator 2",
    content: [
      "Rem facilis nostrum et galisum nemo eum soluta doloremque cum modi temporibus eum vitae veritatis id laudantium maiores ex accusantium consequuntur.",
      "Et voluptatem omnis quo commodi voluptas ut dolorum voluptas ad maiores sint est laboriosam pariatur eum sequi praesentium et voluptatum eligendi.",
      "Et labore expedita est accusantium voluptatibus ex deserunt totam in aliquid commodi aut dolores deserunt.",
    ].join("\n\n"),
    imageUrl: "../public/mocks/image2.png",
    timestamp: now - 4 * 60 * 60 * 1000,
  },

  // ───────────── 1의 파생들 ─────────────
  {
    id: 3,
    parentId: 1, // Story #1에서 파생된 A
    title: "Story #1 – Derivative A",
    author: "Remixer A",
    content: [
      "Aut velit mollitia non consequatur vitae et quia quia eos veritatis pariatur aut sint soluta 33 molestiae voluptas ut voluptatibus dolorum.",
      "Id rerum odio est nulla galisum qui quia deleniti nam pariatur exercitationem sit recusandae mollitia?",
    ].join("\n\n"),
    imageUrl: "../public/mocks/image3.png",
    timestamp: now - 5 * 60 * 60 * 1000,
  },
  {
    id: 4,
    parentId: 1, // Story #1에서 파생된 B
    title: "Story #1 – Derivative B",
    author: "Remixer B",
    content: [
      "Ad galisum tempora aut reprehenderit voluptatem in doloribus doloremque vel rerum laborum est fuga ullam.",
      "Sit nihil voluptates et possimus quod sed quod quia sed distinctio nulla ab accusantium voluptatem eos beatae quis.",
      "Et quae dolorem quo corporis repudiandae hic fuga suscipit.",
    ].join("\n\n"),
    imageUrl: "../public/mocks/image4.png",
    timestamp: now - 6 * 60 * 60 * 1000,
  },

  // ───────────── 3의 파생 (A-1) ─────────────
  {
    id: 5,
    parentId: 3, // Derivative A에서 파생된 A-1
    title: "Story #1 – Derivative A-1",
    author: "Remixer A-1",
    content: [
      "Et accusantium itaque et modi galisum eos sunt dolorum. Qui corporis magni hic excepturi eius aut nihil debitis et ullam deleniti non galisum voluptas qui perspiciatis ipsum.",
      "Et illo quae ea repellendus unde et quae eaque aut cumque similique.",
    ].join("\n\n"),
    imageUrl: "../public/mocks/image5.png",
    timestamp: now - 7 * 60 * 60 * 1000,
  },
];

export const mockStories: StoryBook[] = stories.filter(
  (s) => s.parentId === null
);
