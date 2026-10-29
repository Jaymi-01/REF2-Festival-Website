/**
 * The six festival activities. `blurb` copy is taken verbatim from page 3 of
 * REF 2.0 V3.pdf, where it's specified as on-hover reveal text.
 */
export type Activity = {
  id: string;
  title: string;
  blurb: string;
  photo: string;
  tilt: number;
  emoji: string;
};

// Activity cards consume this single list, so copy, imagery, and presentation
// settings can be updated without changing the card component.
export const ACTIVITIES: Activity[] = [
  {
    id: "games",
    title: "Games",
    blurb:
      "Enjoy exciting games, fun challenges, and friendly competitions with amazing moments to share with friends.",
    photo: "/photos/DSC00115.webp",
    tilt: -2.4,
    emoji: "🎯",
  },
  {
    id: "cooking",
    title: "Cooking Competition",
    blurb:
      "Show off your culinary skills in an exciting cooking showdown for a chance to win the grand prize of ₦1 million. Join the online challenge for a chance to qualify for the competition.",
    photo: "/photos/DSC00254.webp",
    tilt: 1.8,
    emoji: "🍳",
  },
  {
    id: "artiste",
    title: "Artiste Performance",
    blurb:
      "Experience electrifying live performances from talented artistes bringing music, energy, and unforgettable vibes to the festival.",
    photo: "/photos/DSC00175.webp",
    tilt: -1.6,
    emoji: "🎤",
  },
  {
    id: "dj",
    title: "DJ Performance",
    blurb:
      "Keep the excitement going with banging beats, crowd favourites, and non-stop music from our amazing DJs.",
    // Generated locally because the supplied event library had no DJ photo.
    photo: "/photos/dj-performance-generated.png",
    tilt: 2.2,
    emoji: "🎧",
  },
  {
    id: "tasting",
    title: "Tasty Sedaap Supreme Noodles",
    blurb:
      "Treat your taste buds to delicious flavours and discover exciting ways to enjoy Supreme Noodles.",
    photo: "/photos/DSC00286.webp",
    tilt: -2,
    emoji: "🍜",
  },
  {
    id: "goodies",
    title: "Goodie Bags",
    blurb:
      "Stand a chance to take home exciting goodie bags, exclusive gifts, and amazing products throughout the festival.",
    photo: "/photos/DSC00216.webp",
    tilt: 1.4,
    emoji: "🎁",
  },
];
